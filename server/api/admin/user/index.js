import express from 'express';

import verification from '../../../middlewares/verification';

import getUsers from './services/getUsers';
import saveUser from './services/saveUser';
import editUser from './services/editUser';
import assignUser from './services/assignUser';
import detachUser from './services/detachUser';
import deleteByIds from './services/deleteByIds';

const router = express.Router();

router.use(verification);

router.route('/all').get(getUsers);

router.route('/save').post(saveUser);

router.route('/edit').put(editUser);

router.route('/assign').put(assignUser);

router.route('/detach').put(detachUser);

router.route('/delete-few').delete(deleteByIds);

export default router;
