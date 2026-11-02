const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  enrolledAt: { type: Date, default: Date.now },
  completedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  progressPercent: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

