import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import getMoneyInputQuery from '../queries/getMoneyInput';

export default function getClientMoneyInput(req, res) {
    const {id: userId} = res.locals.user;

    getMoneyInputQuery({userId}) // передаем userId прямо в запрос
        .then((clientInputs) => {
            res.status(OKEY_STATUS_CODE).send(clientInputs);
        })
        .catch(() => {
            res.status(SERVER_ERROR_STATUS_CODE).end();
        });
}
