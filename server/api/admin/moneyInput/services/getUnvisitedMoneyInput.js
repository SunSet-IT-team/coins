import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import getMoneyInputQuery from '../../../client/moneyInput/queries/getMoneyInput';

/**
 * Получить непрочитанные депозиты
 */
export default function getUnvisitedMoneyInput(req, res) {
    getMoneyInputQuery({visited: false})
        .then((unvisitedInputs) => res.status(OKEY_STATUS_CODE).send(unvisitedInputs))
        .catch(() => res.status(SERVER_ERROR_STATUS_CODE).end());
}
