import express from 'express';

import verification from '../../../middlewares/verification';

import getManagers from './services/getManagers';
import saveManager from './services/saveManager';
import deleteManagerByEmail from './services/deleteManagerByEmail';

const router = express.Router();

router.use(verification);

router.route('/all')
    .get(getManagers);

router.route('/save')
    .post(saveManager);

router.route('/delete')
    .delete(deleteManagerByEmail);

export default router;
