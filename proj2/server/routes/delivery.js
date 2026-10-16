const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const User = require('../models/User');
const { awardPointsForOrder } = require('./points');
const { updateCustomerBadges } = require('../services/badgeService');
const { requireAuth, requireRole, rejectIfBodyIdMismatch, verifyPassword } = require('../middleware/auth');
const { HttpError, sendHttpError } = require('../utils/httpError');

const router = express.Router();

// Get delivery profile by email and password
router.post('/profile', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!(await verifyPassword(user, password)) || user.role !== 'delivery') {
      return res.status(401).json({ error: 'Invalid credentials or not a delivery rider' });
    }

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get delivery profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get assigned orders for delivery rider
router.get('/orders', async (req, res) => {
  try {
    const { riderId } = req.query;

    if (!riderId) {
      return res.status(400).json({ error: 'Rider ID required' });
    }

    // Get orders assigned to this rider
    const ordersSnapshot = await db.collection('orders')
      .where('deliveryPartnerId', '==', riderId)
      .get();

    const orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      const updatedAt = data.updatedAt?.toDate?.() || new Date(data.updatedAt);
      const assignedAt = data.assignedAt?.toDate?.() || (data.assignedAt ? new Date(data.assignedAt) : null);
      const pickedUpAt = data.pickedUpAt?.toDate?.() || (data.pickedUpAt ? new Date(data.pickedUpAt) : null);
      const deliveredAt = data.deliveredAt?.toDate?.() || (data.deliveredAt ? new Date(data.deliveredAt) : null);
      const confirmedAt = data.confirmedAt?.toDate?.() || (data.confirmedAt ? new Date(data.confirmedAt) : null);
      const readyAt = data.readyAt?.toDate?.() || (data.readyAt ? new Date(data.readyAt) : null);
      const deliveryFee = Number(data.deliveryFee) || 0;
      const tipAmount = Number(data.tipAmount) || 0;
      const earning = deliveryFee + tipAmount;

      return {
        id: doc.id,
        ...data,
        deliveryFee,
        tipAmount,
        earning,
        createdAt,
        updatedAt,
        assignedAt,
        pickedUpAt,
        deliveredAt,
        confirmedAt,
        readyAt,
      };
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get delivery orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Every state-changing delivery route acts as the logged-in delivery partner.
// The rider id comes from the token; a riderId in the body must match it.
const asDeliveryPartner = [
  requireAuth,
  requireRole(['delivery']),
  (req, res, next) => (rejectIfBodyIdMismatch(req, res, 'riderId') ? undefined : next())
];

const ACTIVE_STATUSES = ['ready', 'out_for_delivery'];

async function hasOtherActiveOrder(riderId, exceptOrderId = null) {
  const snapshot = await db.collection('orders')
    .where('deliveryPartnerId', '==', riderId)
    .where('status', 'in', ACTIVE_STATUSES)
    .get();
  return snapshot.docs.some((doc) => doc.id !== exceptOrderId);
}

// Throws unless the logged-in rider is the partner assigned to this order.
function assertAssignedPartner(orderData, riderId) {
  if (orderData.deliveryPartnerId !== riderId) {
    throw new HttpError(403, 'Only the assigned delivery partner can do this');
  }
}

// Accept delivery assignment (first-come-first-serve)
router.post('/accept/:orderId', asDeliveryPartner, async (req, res) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    const rider = await User.findById(riderId);
    if (!rider) {
      return res.status(400).json({ error: 'Rider not found' });
    }

    // One active order at a time (UC15 extension 2d).
    if (await hasOtherActiveOrder(riderId)) {
      return res.status(400).json({ error: 'You already have an active order. Complete it before accepting another.' });
    }

    // Check-and-claim atomically so two riders can't both win the same order (UC15 race).
    const orderRef = db.collection('orders').doc(orderId);
    await db.runTransaction(async (txn) => {
      const orderDoc = await txn.get(orderRef);
      if (!orderDoc.exists) {
        throw new HttpError(404, 'Order not found');
      }
      const orderData = orderDoc.data();
      if (orderData.deliveryPartnerId) {
        throw new HttpError(409, 'Order has already been assigned to another rider');
      }
      if (orderData.status !== 'ready') {
        throw new HttpError(400, 'Order is not ready for delivery');
      }
      txn.update(orderRef, {
        status: 'out_for_delivery',
        deliveryPartnerId: riderId,
        assignedAt: new Date(),
        updatedAt: new Date()
      });
    });

    res.json({
      message: 'Order accepted successfully',
      orderId: orderId,
      status: 'out_for_delivery'
    });
  } catch (error) {
    if (sendHttpError(res, error)) return;
    console.error('Accept delivery error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject delivery assignment (remove assignment, make available again)
router.post('/reject/:orderId', asDeliveryPartner, async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderRef = db.collection('orders').doc(orderId);

    await db.runTransaction(async (txn) => {
      const orderDoc = await txn.get(orderRef);
      if (!orderDoc.exists) {
        throw new HttpError(404, 'Order not found');
      }
      const orderData = orderDoc.data();
      assertAssignedPartner(orderData, req.user.id);
      if (orderData.status !== 'out_for_delivery') {
        throw new HttpError(409, `Order is ${orderData.status} and can no longer be released`);
      }
      txn.update(orderRef, {
        deliveryPartnerId: null,
        assignedAt: null,
        status: 'ready', // Reset to ready status
        updatedAt: new Date()
      });
    });

    res.json({
      message: 'Order rejected, now available for other riders',
      orderId: orderId
    });
  } catch (error) {
    if (sendHttpError(res, error)) return;
    console.error('Reject delivery error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark order as picked up
router.post('/pickup/:orderId', asDeliveryPartner, async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderRef = db.collection('orders').doc(orderId);

    await db.runTransaction(async (txn) => {
      const orderDoc = await txn.get(orderRef);
      if (!orderDoc.exists) {
        throw new HttpError(404, 'Order not found');
      }
      const orderData = orderDoc.data();
      assertAssignedPartner(orderData, req.user.id);
      if (orderData.status !== 'out_for_delivery') {
        throw new HttpError(409, `Order is ${orderData.status}, not awaiting pickup`);
      }
      txn.update(orderRef, {
        pickedUpAt: new Date(),
        updatedAt: new Date()
      });
    });

    res.json({
      message: 'Order picked up successfully',
      orderId: orderId,
      status: 'out_for_delivery'
    });
  } catch (error) {
    if (sendHttpError(res, error)) return;
    console.error('Pickup order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark order as delivered
router.post('/deliver/:orderId', asDeliveryPartner, async (req, res) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;
    const orderRef = db.collection('orders').doc(orderId);
    const riderRef = db.collection('users').doc(riderId);

    // Flip the status and credit the rider in one transaction: only the
    // assigned partner can complete the order, and only once, so earnings and
    // points can't be claimed by someone else or claimed twice (UC16).
    const { orderData, earning, deliveryFee, tipAmount } = await db.runTransaction(async (txn) => {
      const orderDoc = await txn.get(orderRef);
      if (!orderDoc.exists) {
        throw new HttpError(404, 'Order not found');
      }
      const riderDoc = await txn.get(riderRef);

      const data = orderDoc.data();
      assertAssignedPartner(data, riderId);
      if (data.status !== 'out_for_delivery') {
        throw new HttpError(409, `Order is ${data.status}, not out for delivery`);
      }

      const fee = Number(data.deliveryFee) || 0;
      const tip = Number(data.tipAmount) || 0;
      // Delivery partner earning is delivery fee + full tip
      const total = fee + tip;

      txn.update(orderRef, {
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date()
      });
      if (riderDoc.exists) {
        txn.update(riderRef, {
          totalEarnings: (riderDoc.data().totalEarnings || 0) + total,
          updatedAt: new Date()
        });
      } else {
        console.warn(`Rider ${riderId} not found during delivery payout.`);
      }

      return { orderData: data, earning: total, deliveryFee: fee, tipAmount: tip };
    });

    // Award points to customer (10%, or 15% at a Local Legend restaurant)
    const restaurant = orderData.restaurantId ? await User.findById(orderData.restaurantId) : null;
    await awardPointsForOrder(orderData.customerId, orderData.totalAmount || 0, {
      isLocalLegend: Boolean(restaurant?.profile?.isLocalLegend),
      orderId
    });

    // Refresh customer badges based on updated order history
    try {
      await updateCustomerBadges(orderData.customerId);
    } catch (badgeError) {
      console.error('Failed to update customer badges:', badgeError);
    }

    // Only set the rider back to free if they have no other active orders
    try {
      const rider = await User.findById(riderId);
      if (rider && !(await hasOtherActiveOrder(riderId, orderId))) {
        await rider.updateDeliveryStatus('free');
      }
    } catch (statusError) {
      console.error('Failed to update rider status:', statusError);
    }

    res.json({
      message: 'Order delivered successfully',
      orderId: orderId,
      status: 'delivered',
      earning,
      deliveryFee,
      tipAmount
    });
  } catch (error) {
    if (sendHttpError(res, error)) return;
    console.error('Deliver order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available orders for assignment
router.get('/available', async (req, res) => {
  try {
    console.log('Fetching available orders...');

    // Get orders that are ready but not yet assigned
    // We need to get all ready orders and filter out those with deliveryPartnerId
    const ordersSnapshot = await db.collection('orders')
      .where('status', '==', 'ready')
      .get();

    console.log(`Found ${ordersSnapshot.docs.length} orders with status 'ready'`);

    // Filter orders that don't have a deliveryPartnerId or have it as null
    const orders = ordersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        console.log(`Order ${doc.id}: deliveryPartnerId = ${data.deliveryPartnerId}`);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      })
      .filter(order => !order.deliveryPartnerId);

    console.log(`Returning ${orders.length} available orders`);
    res.json({ orders });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;