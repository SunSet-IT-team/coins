import {
    OKEY_STATUS_CODE,
    NOT_FOUND_STATUS_CODE,
    SERVER_ERROR_STATUS_CODE,
    MONGODB_DUPLICATE_CODE,
} from '../../../../constants/constants';

import prepareMoneyInput from '../utils/prepareMoneyInput';

import editMoneyInputQuery from '../../../client/moneyInput/queries/editMoneyInput';

/**
 * Изменение депозита
 */
export default function editMoneyInput(req, res) {
    try {
        const prepareInputs = prepareMoneyInput(req.body);
        editMoneyInputQuery(prepareInputs)
            .then((inputs) => res.status(OKEY_STATUS_CODE).send(inputs))
            .catch((err) => {
                if (err.code === MONGODB_DUPLICATE_CODE) {
                    return res.status(NOT_FOUND_STATUS_CODE).send({code: 'duplication'});
                }

                res.status(SERVER_ERROR_STATUS_CODE).end();
            });
    } catch (e) {
        res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}
