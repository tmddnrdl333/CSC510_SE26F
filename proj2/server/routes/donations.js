const express = require('express');
const { db } = require('../config/firebase');
const { requireAuth } = require('../middleware/auth');
const { challengeDefinitions } = require('../../src/challenges/challengeDefinitions');

const router = express.Router();

// Get donation statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total orders count
    const ordersSnapshot = await db.collection('orders')
      .where('status', '==', 'delivered')
      .get();
    
    const totalDeliveredOrders = ordersSnapshot.size;
    const mealsDonated = Math.floor(totalDeliveredOrders / 10); // 1 meal for every 10 orders
    
    // Get donation counter from settings (or create if doesn't exist)
    const settingsDoc = await db.collection('settings').doc('donations').get();
    let donationCounter = 0;
    
    if (settingsDoc.exists) {
      donationCounter = settingsDoc.data().counter || 0;
    } else {
      // Initialize donation counter
      await db.collection('settings').doc('donations').set({
        counter: 0,
        lastUpdated: new Date()
      });
    }

    // Challenge-donated meals (#64): derived from the challengeProgress
    // ledger, which is written ONLY by the exactly-once payout transaction —
    // deliberately NOT from the stored settings counter, which POST /update
    // still lets any caller inflate until #36's deletion lands (the UC20 star
    // finding). Deriving from the tamper-proof ledger keeps the public number
    // honest either way.
    const rewardedSnap = await db.collection('challengeProgress')
      .where('status', '==', 'rewarded')
      .get();
    let challengeBonusMeals = 0;
    rewardedSnap.forEach((doc) => {
      const definition = challengeDefinitions.find((d) => d.id === doc.data().definitionId);
      if (definition && definition.reward && definition.reward.type === 'donatedMeals') {
        challengeBonusMeals += Number(definition.reward.amount) || 0;
      }
    });

    res.json({
      totalOrders: totalDeliveredOrders,
      mealsDonated: mealsDonated + challengeBonusMeals,
      derivedMeals: mealsDonated,
      challengeBonusMeals,
      nextDonationIn: 10 - (totalDeliveredOrders % 10)
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update donation counter (called when orders reach multiples of 10).
// Requires login: anonymous callers could inflate it without bound (UC20).
router.post('/update', requireAuth, async (req, res) => {
  try {
    const { mealsToAdd } = req.body;
    
    if (!Number.isInteger(mealsToAdd) || mealsToAdd <= 0) {
      return res.status(400).json({ error: 'Invalid meals amount' });
    }

    const settingsRef = db.collection('settings').doc('donations');
    const settingsDoc = await settingsRef.get();
    
    let currentCounter = 0;
    if (settingsDoc.exists) {
      currentCounter = settingsDoc.data().counter || 0;
    }
    
    const newCounter = currentCounter + mealsToAdd;
    
    await settingsRef.set({
      counter: newCounter,
      lastUpdated: new Date()
    }, { merge: true });

    res.json({
      message: 'Donation counter updated successfully',
      mealsDonated: newCounter
    });
  } catch (error) {
    console.error('Update donation counter error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get donation history
router.get('/history', async (req, res) => {
  try {
    const historySnapshot = await db.collection('donationHistory')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const history = historySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ history });
  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record a donation (requires login, same reason as /update)
router.post('/record', requireAuth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid donation amount' });
    }

    const donationRef = db.collection('donationHistory').doc();
    await donationRef.set({
      id: donationRef.id,
      amount,
      description: description || 'Meal donation',
      recordedBy: req.user.id,
      createdAt: new Date()
    });

    res.json({
      message: 'Donation recorded successfully',
      donation: {
        id: donationRef.id,
        amount,
        description,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Record donation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
