import express from 'express';
import { getTasks, getYearTasks, createTask, updateTask, deleteTask, searchTasks, exportTasks } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All task routes require authentication

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/search').get(searchTasks);
router.route('/export').get(exportTasks);

router.route('/year/:year')
  .get(getYearTasks);

router.route('/:id')
  .patch(updateTask)
  .delete(deleteTask);

export default router;
