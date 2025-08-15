import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

import md5 from 'md5';

import prepareUser from '../utils/prepareUser';

import editUserQuery from '../../../client/user/queries/editUser';

export default function editFinancials(req, res) {
    const userData = prepareUser(req.body);

    // Маппим поля с фронта на поля базы данных
    const mappedData = {
        ...userData,
        // Маппинг финансовых полей
        mainBalance: userData.balance,
        bonuses: userData.bonuses,
        credFacilities: userData.creditFunds,
        adminFreeBalance: userData.freeBalance,
        adminPledge: userData.deposit,
        adminMarginLevel: userData.marginLevel,
    };

    console.log('editFinancials data:', mappedData);

    editUserQuery(mappedData)
        .then((user) => {
            res.status(OKEY_STATUS_CODE).send(user);
        })
        .catch((error) => {
            console.error('Ошибка обновления финансов:', error);
            res.status(SERVER_ERROR_STATUS_CODE).end();
        });
}
