import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import getMoneyOutputQuery from '../queries/getMoneyOutput';

export default function getClientMoneyOutput(req, res) {
    const {id: userId} = res.locals.user;

    getMoneyOutputQuery()
        .then((outputs) => {
            const clientOutputs = outputs.filter((output) => output.userId === userId);
            res.status(OKEY_STATUS_CODE).send(clientOutputs);
        })
        .catch(() => {
            res.status(SERVER_ERROR_STATUS_CODE).end();
        });
}
