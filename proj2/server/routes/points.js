const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { requireAuth, requireRole, rejectIfBodyIdMismatch } = require('../middleware/auth');
const { HttpError, sendHttpError } = require('../utils/httpError');
const { computeOrderPoints } = require('../../src/points/computePoints');

const router = express.Router();

// Get user points
router.get('/', async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }

    // Get or create points document for customer
    const pointsRef = db.collection('points').doc(customerId);
    const pointsDoc = await pointsRef.get();
    
    let pointsData;
    if (pointsDoc.exists) {
      pointsData = pointsDoc.data();
    } else {
      // Create new points document
      pointsData = {
        totalPoints: 0,
        availablePoints: 0,
        usedPoints: 0,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await pointsRef.set(pointsData);
    }

    res.json({ points: pointsData });
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get points transactions
router.get('/transactions', async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }

    const pointsRef = db.collection('points').doc(customerId);
    const pointsDoc = await pointsRef.get();
    
    if (!pointsDoc.exists) {
      return res.json({ transactions: [] });
    }

    const pointsData = pointsDoc.data();
    res.json({ transactions: pointsData.transactions || [] });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use points for discount (logged-in customer only; spends their own balance)
router.post('/use', requireAuth, requireRole(['customer']), [
  body('points').isInt({ min: 1 }),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (rejectIfBodyIdMismatch(req, res, 'customerId')) return;

    const points = Number(req.body.points);
    const { description } = req.body;
    const pointsRef = db.collection('points').doc(req.user.id);

    // Read, check and write in one transaction so two concurrent redemptions
    // can't both pass the balance check against the same stale read (UC10).
    const result = await db.runTransaction(async (txn) => {
      const pointsDoc = await txn.get(pointsRef);
      if (!pointsDoc.exists) {
        throw new HttpError(404, 'Points account not found');
      }

      const pointsData = pointsDoc.data();
      if (pointsData.availablePoints < points) {
        throw new HttpError(400, 'Insufficient points available', {
          availablePoints: pointsData.availablePoints,
          requestedPoints: points
        });
      }

      // Calculate discount (1 point = $0.01)
      const discountAmount = points * 0.01;
      const newAvailablePoints = pointsData.availablePoints - points;
      const newUsedPoints = (pointsData.usedPoints || 0) + points;

      const transaction = {
        id: Date.now().toString(),
        type: 'used',
        amount: -points,
        description: description || `Points redeemed - $${discountAmount.toFixed(2)} discount`,
        date: new Date()
      };
      // Keep only last 50 transactions
      const updatedTransactions = [transaction, ...(pointsData.transactions || [])].slice(0, 50);

      txn.update(pointsRef, {
        availablePoints: newAvailablePoints,
        usedPoints: newUsedPoints,
        transactions: updatedTransactions,
        updatedAt: new Date()
      });

      return { discountAmount, newAvailablePoints };
    });

    res.json({
      message: 'Points used successfully',
      pointsUsed: points,
      discountAmount: result.discountAmount,
      remainingPoints: result.newAvailablePoints
    });
  } catch (error) {
    if (sendHttpError(res, error)) return;
    console.error('Use points error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Calculate discount
router.post('/calculate-discount', [
  body('points').isInt({ min: 1 }),
  body('customerId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { points, customerId } = req.body;
    
    // Get customer points
    const pointsRef = db.collection('points').doc(customerId);
    const pointsDoc = await pointsRef.get();
    
    if (!pointsDoc.exists) {
      return res.status(404).json({ error: 'Points account not found' });
    }
    
    const pointsData = pointsDoc.data();
    
    // Check if customer has enough points
    if (pointsData.availablePoints < points) {
      return res.status(400).json({ 
        error: 'Insufficient points available',
        availablePoints: pointsData.availablePoints,
        requestedPoints: points
      });
    }
    
    // Calculate discount (1 point = $0.01)
    const discountAmount = points * 0.01;
    
    res.json({
      discountAmount: discountAmount,
      maxDiscount: pointsData.availablePoints * 0.01,
      availablePoints: pointsData.availablePoints
    });
  } catch (error) {
    console.error('Calculate discount error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Award points for completed order: 10% of the bill, 15% at a Local Legend
// (src/points/computePoints.js). Runs in a transaction so two deliveries for
// the same customer finishing at once can't overwrite each other's points.
async function awardPointsForOrder(customerId, orderAmount, { isLocalLegend = false, orderId = null } = {}) {
  try {
    const pointsRef = db.collection('points').doc(customerId);
    const pointsEarned = computeOrderPoints(orderAmount, { isLocalLegend });

    await db.runTransaction(async (txn) => {
      const pointsDoc = await txn.get(pointsRef);
      const pointsData = pointsDoc.exists
        ? pointsDoc.data()
        : {
          totalPoints: 0,
          availablePoints: 0,
          usedPoints: 0,
          transactions: [],
          createdAt: new Date()
        };

      const transaction = {
        id: Date.now().toString(),
        type: 'earned',
        amount: pointsEarned,
        description: `Order completed - $${Number(orderAmount).toFixed(2)}${isLocalLegend ? ' (Local Legend 15%)' : ''}`,
        ...(orderId ? { orderId } : {}),
        date: new Date()
      };

      txn.set(pointsRef, {
        ...pointsData,
        totalPoints: (pointsData.totalPoints || 0) + pointsEarned,
        availablePoints: (pointsData.availablePoints || 0) + pointsEarned,
        // Keep only last 50 transactions
        transactions: [transaction, ...(pointsData.transactions || [])].slice(0, 50),
        updatedAt: new Date()
      });
    });

    console.log(`Awarded ${pointsEarned} points to customer ${customerId}`);
    return pointsEarned;
  } catch (error) {
    console.error('Error awarding points:', error);
    return 0;
  }
}

module.exports = { router, awardPointsForOrder };