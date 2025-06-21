import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';
import User from '../../../client/user/model';
import detachUserQuery from '../../../client/user/queries/detachUser';

export default function detachUser(req, res) {
    const {userEmail} = req.body;

    User.findOne({email: userEmail})
        .then((user) => {
            if (!user) {
                return res.status(400).json({
                    error: 'Пользователь с таким email не существует',
                });
            }

            return detachUserQuery(userEmail)
                .then(() => User.find({}))
                .then((users) => {
                    res.status(OKEY_STATUS_CODE).json(users);
                });
        })
        .catch(() => {
            res.status(SERVER_ERROR_STATUS_CODE).json({
                error: 'Ошибка при откреплении пользователя',
            });
        });
}
