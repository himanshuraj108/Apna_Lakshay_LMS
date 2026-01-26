const express = require('express');
const router = express.Router();
const { protect, authorizeActive } = require('../middleware/auth');
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    logPomodoro,
    getStats,
    getExams,
    createExam,
    deleteExam
} = require('../controllers/studyPlannerController');

router.use(protect, authorizeActive); // All routes protected and require active membership

router.route('/tasks')
    .get(getTasks)
    .post(createTask);

router.route('/tasks/:id')
    .patch(updateTask)
    .delete(deleteTask);

router.post('/pomodoro', logPomodoro);
router.get('/stats', getStats);

router.route('/exams')
    .get(getExams)
    .post(createExam);

router.route('/exams/:id')
    .delete(deleteExam);

module.exports = router;
