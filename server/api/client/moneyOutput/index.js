import express from 'express';

import verification from '../../../middlewares/verificationClient';
import saveMoneyOutput from './services/saveMoneyOutput';
import getClientMoneyOutput from './services/getClientMoneyOutput';

const router = express.Router();

router.use(verification);

router.route('/new').post(saveMoneyOutput);

router.route('/client').get(getClientMoneyOutput);

export default router;
