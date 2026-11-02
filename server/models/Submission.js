const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  type: { type: String, enum: ['quiz', 'assignment'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Quiz or Assignment ID
  answers: [{ type: Number }], // for quiz
  score: { type: Number, default: 0 },
  content: { type: String, default: '' }, // for assignment
  grade: { type: Number },
  instructorFeedback: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);

