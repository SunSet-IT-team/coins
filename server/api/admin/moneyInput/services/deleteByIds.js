import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import getAllInputs from '../../../client/moneyInput/queries/getMoneyInput';
import deleteByIdsQuery from '../../../client/moneyInput/queries/deleteByIds';

/**
 * Удаление депозитов
 */
export default function deleteByIds(req, res) {
    const {ids} = req.body;

    deleteByIdsQuery(ids)
        .then(() => {
            getAllInputs().then((inputs) => {
                res.status(OKEY_STATUS_CODE).send(inputs);
            });
        })
        .catch(() => {
            res.status(SERVER_ERROR_STATUS_CODE).end();
        });
}
