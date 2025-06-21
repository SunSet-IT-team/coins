import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';
import User from '../../../client/user/model';
import assignUserQuery from '../../../client/user/queries/assignUser';

export default function assignUser(req, res) {
    const {managerEmail, userEmail} = req.body;

    User.findOne({email: userEmail})
        .then((user) => {
            if (!user) {
                return res.status(400).json({
                    error: 'Пользователь с таким email не существует',
                });
            }

            if (user.manager && user.manager !== '') {
                return res.status(400).json({
                    error: 'У пользователя уже назначен менеджер',
                });
            }

            return assignUserQuery({email: userEmail, manager: managerEmail})
                .then(() => User.find({}))
                .then((users) => {
                    res.status(OKEY_STATUS_CODE).json(users);
                });
        })
        .catch(() => {
            res.status(SERVER_ERROR_STATUS_CODE).json({
                error: 'Ошибка при назначении менеджера',
            });
        });
}
