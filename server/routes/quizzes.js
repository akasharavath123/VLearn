const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

// GET /api/quizzes/course/:courseId
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/quizzes/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Check if current user already submitted
    const priorSubmission = await Submission.findOne({
      student: req.user._id,
      refId: quiz._id,
      type: 'quiz'
    });

    const isInstructor = req.user.role === 'instructor';

    if (isInstructor || priorSubmission) {
      // return full quiz with explanations & answers
      return res.json({ quiz, priorSubmission });
    }

    // Otherwise mask correct answers so student can't cheat before submitting
    const quizObj = quiz.toObject();
    quizObj.questions = quizObj.questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options
    }));

    res.json({ quiz: quizObj, priorSubmission: null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/quizzes - Create quiz (Instructor)
router.post('/', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    const { title, courseId, questions, timeLimit, passingScore } = req.body;
    if (!title || !courseId || !questions || !questions.length) {
      return res.status(400).json({ message: 'Title, courseId and at least one question required.' });
    }

    const course = await Course.findOne({ _id: courseId, instructor: req.user._id });
    if (!course) return res.status(403).json({ message: 'Unauthorized course.' });

    const quiz = new Quiz({
      title,
      course: courseId,
      instructor: req.user._id,
      questions,
      timeLimit: Number(timeLimit) || 0,
      passingScore: Number(passingScore) || 60
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/quizzes/:id/submit - Student submits answers
router.post('/:id/submit', authMiddleware, requireRole('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });

    const { answers } = req.body; // e.g. [0, 2, 1, ...]
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required.' });
    }

    let correctCount = 0;
    const review = quiz.questions.map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        options: q.options,
        selected,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= (quiz.passingScore || 60);

    const submission = new Submission({
      student: req.user._id,
      course: quiz.course,
      type: 'quiz',
      refId: quiz._id,
      answers,
      score
    });

    await submission.save();

    res.json({
      success: true,
      score,
      correctCount,
      totalQuestions: quiz.questions.length,
      passed,
      review,
      submission
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/quizzes/:id
router.delete('/:id', authMiddleware, requireRole('instructor'), async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ refId: req.params.id });
    res.json({ message: 'Quiz deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

