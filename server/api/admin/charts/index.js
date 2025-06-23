import express from 'express';

import verification from '../../../middlewares/verification';

import changeChartValues from './services/changeChartValues';

const router = express.Router();

router.use(verification);

router.route('/changeChartValues').post(changeChartValues);

export default router;
