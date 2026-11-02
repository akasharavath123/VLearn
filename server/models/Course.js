const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instructorName: { type: String, default: 'Instructor' },
  category: { type: String, default: 'Development' },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  thumbnail: { type: String, default: '' },
  price: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  tags: [{ type: String }],
  totalStudents: { type: Number, default: 0 },
  rating: { type: Number, default: 4.8 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);

