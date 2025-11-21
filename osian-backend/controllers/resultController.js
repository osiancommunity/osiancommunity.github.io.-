const Result = require('../models/Result');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const mongoose = require('mongoose');

const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    const userId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user has already submitted this quiz.
    // This prevents duplicate submissions for the same attempt.
    const existingResult = await Result.findOne({
      userId,
      quizId,
      // A check for 'completed' status might be too restrictive if you allow re-attempts.
      // For now, we prevent any duplicate submissions.
    });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already completed'
      });
    }

    // For paid quizzes, check if the user is registered in the quiz's `participants` array.
    if (quiz.quizType === 'paid') {
      // Use mongoose.Types.ObjectId for safe comparison
      const isRegistered = quiz.participants.some(p => p.userId.equals(userId));
      if (!isRegistered) {
        return res.status(403).json({
          success: false,
          message: 'You must be registered for this paid quiz to submit answers'
        });
      }
    }

    let correctAnswers = 0;
    const detailedAnswers = answers.map((answer, index) => {
      // Correctly use the questionIndex from the answer object
      const question = quiz.questions[answer.questionIndex]; 
      if (!question) {
        // This case should ideally not happen if frontend sends valid data.
        return null;
      }
      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionIndex: answer.questionIndex,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      };
    });

    const score = correctAnswers;
    const totalQuestions = quiz.questions.length; // Total questions in the quiz
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const passed = percentage >= (quiz.passingScore || 50); // Match frontend logic (score > 0.5)

    const result = new Result({
      userId,
      quizId,
      score,
      totalQuestions,
      status: 'completed',
      passed,
      answers: detailedAnswers.filter(a => a !== null).map(answer => ({
        questionIndex: answer.questionIndex,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent
      })),
      timeTaken,
      completedAt: new Date()
    });

    await result.save();

    // Update user's quiz history in one call
    await User.findByIdAndUpdate(userId, {
      $push: {
        quizzesTaken: {
          quizId,
          score,
          completedAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        score,
        totalQuestions, // Keep this for frontend display
        correctAnswers,
        percentage: Math.round(percentage),
        passed,
        timeTaken
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    });
  }
};

const getUserResults = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const results = await Result.find({ userId })
      .populate('quizId', 'title category difficulty')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalResults = await Result.countDocuments({ userId });

    res.json({
      success: true,
      results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
        hasNext: page * limit < totalResults,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get results',
      error: error.message
    });
  }
};

const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('quizId', 'title description category difficulty questions');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Check if user can access this result
    if (result.userId._id.toString() !== req.user.id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this result'
      });
    }

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Get result by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get result',
      error: error.message
    });
  }
};

const getQuizResults = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const results = await Result.find({ quizId, status: 'completed' })
      .populate('userId', 'name email')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalResults = await Result.countDocuments({ quizId, status: 'completed' });

    res.json({
      success: true,
      results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
        hasNext: page * limit < totalResults,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz results',
      error: error.message
    });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const limit = parseInt(req.query.limit) || 10;

    const results = await Result.find({ quizId, status: 'completed' })
      .populate('userId', 'name email')
      .sort({ score: -1, timeTaken: 1 }) // Sort by score desc, then time asc
      .limit(limit);

    res.json({
      success: true,
      leaderboard: results.map((result, index) => ({
        rank: index + 1,
        user: {
          id: result.userId._id,
          name: result.userId.name,
          email: result.userId.email
        },
        score: result.score,
        percentage: result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0,
        timeTaken: result.timeTaken,
        completedAt: result.completedAt
      }))
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
};

const getAdminResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let results, totalResults;

    if (req.user.role === 'superadmin') {
      // Superadmin gets all results
      results = await Result.find({ status: 'completed' })
        .populate('userId', 'name email')
        .populate('quizId', 'title')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit);

      totalResults = await Result.countDocuments({ status: 'completed' });
    } else {
      // Admin gets results only for quizzes they created
      const adminId = req.user._id;
      const Quiz = require('../models/Quiz');
      const adminQuizzes = await Quiz.find({ createdBy: adminId }).select('_id');
      const quizIds = adminQuizzes.map(quiz => quiz._id);

      results = await Result.find({ quizId: { $in: quizIds }, status: 'completed' })
        .populate('userId', 'name email')
        .populate('quizId', 'title')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit);

      totalResults = await Result.countDocuments({ quizId: { $in: quizIds }, status: 'completed' });
    }

    res.json({
      success: true,
      results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
        hasNext: page * limit < totalResults,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get admin results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin results',
      error: error.message
    });
  }
};

module.exports = {
  submitQuiz,
  getUserResults,
  getResultById,
  getQuizResults,
  getLeaderboard,
  getAdminResults
};
