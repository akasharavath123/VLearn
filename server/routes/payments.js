const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// POST /api/payments/rupay-checkout - Direct RuPay Card / RuPay UPI payment
router.post('/rupay-checkout', authMiddleware, requireRole('student'), async (req, res) => {
  try {
    const { courseId, cardNumber, cardHolder, expiry, cvv, upiId, paymentType } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ student: req.user._id, course: course._id });
    if (existing) {
      return res.status(400).json({ message: 'You are already enrolled in this course.' });
    }

    let cardLast4 = '';
    let method = 'rupay';

    if (paymentType === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        return res.status(400).json({ message: 'Please enter a valid RuPay UPI ID (e.g. name@okhdfcbank).' });
      }
      method = 'upi';
    } else {
      // Validate RuPay card
      const cleanCard = (cardNumber || '').replace(/\s+/g, '');
      if (cleanCard.length < 15 || cleanCard.length > 19) {
        return res.status(400).json({ message: 'Please enter a valid 16-digit RuPay card number.' });
      }
      if (!cardHolder || !cardHolder.trim()) {
        return res.status(400).json({ message: 'Cardholder name is required.' });
      }
      if (!expiry || !expiry.includes('/')) {
        return res.status(400).json({ message: 'Valid expiry date (MM/YY) required.' });
      }
      if (!cvv || cvv.length < 3) {
        return res.status(400).json({ message: 'Valid 3-digit CVV required.' });
      }
      cardLast4 = cleanCard.slice(-4);
    }

    const txId = 'RUPAY_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Create payment entry
    const payment = new Payment({
      student: req.user._id,
      course: course._id,
      amount: course.price || 499,
      currency: 'INR',
      status: 'completed',
      method: method,
      cardLast4: cardLast4,
      transactionId: txId
    });
    await payment.save();

    // Create enrollment record
    const enrollment = new Enrollment({
      student: req.user._id,
      course: course._id,
      payment: payment._id,
      enrolledAt: new Date(),
      progressPercent: 0
    });
    await enrollment.save();

    // Increment course total students
    course.totalStudents = (course.totalStudents || 0) + 1;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'RuPay payment processed successfully!',
      transactionId: txId,
      amount: course.price || 499,
      currency: 'INR',
      method: method,
      courseTitle: course.title,
      enrollment
    });
  } catch (err) {
    console.error('RuPay payment error:', err);
    res.status(500).json({ message: err.message || 'Payment processing failed.' });
  }
});

// GET /api/payments/history - Student's payment history
router.get('/history', authMiddleware, requireRole('student'), async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .populate('course', 'title price thumbnail category')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

