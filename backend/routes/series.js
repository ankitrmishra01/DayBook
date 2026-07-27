import express from 'express';
import { createSeries, getSeries, deleteSeries } from '../controllers/seriesController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createSeries)
  .get(getSeries);

router.route('/:id')
  .delete(deleteSeries);

export default router;
