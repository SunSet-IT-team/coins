import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import getMoneyInputQuery from '../queries/getMoneyInput'; //*

export default function getClientMoneyOutput(req, res) {
    const {id: userId} = res.locals.user;

    getMoneyInputQuery()
        .then((outputs) => {
            const clientInputs = outputs.filter((output) => output.userId === userId);
            res.status(OKEY_STATUS_CODE).send(clientInputs);
        })
        .catch(() => {
            res.status(SERVER_ERROR_STATUS_CODE).end();
        });
}
