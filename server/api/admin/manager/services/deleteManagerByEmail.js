import { OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE } from '../../../../constants/constants';

import getAllManagers from '../../../admin/authentication/queries/getAllManagers';
import deleteByEmailQuery from '../../../admin/authentication/queries/deleteByEmail';

export default function deleteManagerByEmail (req, res) {
    const { email } = req.body;

    deleteByEmailQuery(email)
        .then(() => {
            getAllManagers()
                .then(managers => {
                    res.status(OKEY_STATUS_CODE).send(managers);
                });
        })
        .catch(() => {
            res.status(SERVER_ERROR_STATUS_CODE).end();
        });
}
