import express from 'express';

import verification from '../../../middlewares/verificationClient';
import saveMoneyInput from './services/saveMoneyInput';
import getClientMoneyInput from './services/getClientMoneyInput';

const router = express.Router();

router.use(verification);

router.route('/new').post(saveMoneyInput);

router.route('/client').get(getClientMoneyInput);

export default router;
