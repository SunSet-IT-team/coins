import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import getMoneyInputQuery from '../../../client/moneyInput/queries/getMoneyInput';

/**
 * Получить ВСЕ депозиты
 */
export default function getMoneyInput(req, res) {
    getMoneyInputQuery()
        .then((inputs) => res.status(OKEY_STATUS_CODE).send(inputs))
        .catch(() => res.status(SERVER_ERROR_STATUS_CODE).end());
}
