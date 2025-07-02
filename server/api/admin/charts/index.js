import express from 'express';

import verification from '../../../middlewares/verification';

import changeChartValues from './services/changeChartValues';
import getChangedChartValues from './services/getChangedChartValues';

const router = express.Router();

// router;

router.use(verification).route('/changeChartValues').post(changeChartValues);
router.route('/changeChartValues/:currency').get(getChangedChartValues); //Тут роут для получения смещений

export default router;
