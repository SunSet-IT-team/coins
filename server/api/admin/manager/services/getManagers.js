import getAllManagers from '../../../admin/authentication/queries/getAllManagers';

import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

export default function getManagers(req, res) {
    try {
        console.log('getManagers');
        getAllManagers()
            .then((managers) => {
                console.log('managers', managers);
                res.status(OKEY_STATUS_CODE).send(managers);
            })
            .catch((e) => {
                res.status(SERVER_ERROR_STATUS_CODE).end();
            });
    } catch (e) {
        res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}
