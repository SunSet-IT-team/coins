import express from 'express';

import verification from '../../../middlewares/verification';

import getMoneyInput from './services/getMoneyInput';
import editMoneyInput from './services/editMoneyInput';
import getUnvisitedMoneyInput from './services/getUnvisitedMoneyInput';
import deleteMoneyInput from './services/deleteByIds';

const router = express.Router();

router.use(verification);

router.route('/').get(getMoneyInput);

router.route('/unvisited').get(getUnvisitedMoneyInput);

router.route('/edit').put(editMoneyInput);

router.route('/delete').delete(deleteMoneyInput);

export default router;
