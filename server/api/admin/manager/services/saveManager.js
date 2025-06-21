import Admin from '../../../admin/authentication/model';
import md5 from 'md5';
import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';
import getAllManagers from '../../../admin/authentication/queries/getAllManagers';

export default function saveManager(req, res) {
    const newManager = {
        login: req.body.email,
        password: md5(req.body.password),
        email: req.body.email,
        id: 'manager_id',
        name: req.body.name,
        surname: req.body.surname,
    };

    const newAdmin = new Admin(newManager);

    newAdmin
        .save()
        .then(() => {
            return getAllManagers().then((managers) => {
                res.status(OKEY_STATUS_CODE).send(managers);
            });
        })
        .catch((error) => {
            res.status(SERVER_ERROR_STATUS_CODE).send(error);
        });
}
