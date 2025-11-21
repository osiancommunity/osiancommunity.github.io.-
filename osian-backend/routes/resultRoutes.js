const express = require('express');
const router = express.Router();
const {
  submitQuiz,
  getUserResults,
  getResultById,
  getQuizResults,
  getLeaderboard,
  getAdminResults
} = require('../controllers/resultController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Protected routes
router.post('/submit', authenticateToken, submitQuiz);
router.get('/user/:userId', authenticateToken, getUserResults);
router.get('/user', authenticateToken, getUserResults);
router.get('/:id', authenticateToken, getResultById);
router.get('/quiz/:quizId', authenticateToken, getQuizResults);
router.get('/leaderboard/:quizId', authenticateToken, getLeaderboard);

// Admin routes
router.get('/admin', authenticateToken, requireRole('admin', 'superadmin'), getAdminResults);

module.exports = router;
