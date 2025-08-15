import getUserById from '../../../client/user/queries/getUserById';
import {OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE} from '../../../../constants/constants';

export default function getFinancials(req, res) {
    try {
        const {userId} = req.query;

        if (!userId) {
            return res.status(SERVER_ERROR_STATUS_CODE).end();
        }

        getUserById(userId)
            .then((user) => {
                if (!user) {
                    return res.status(SERVER_ERROR_STATUS_CODE).end();
                }

                // Возвращаем только финансовые поля
                const financials = {
                    id: user.id,
                    mainBalance: user.mainBalance,
                    bonuses: user.bonuses,
                    credFacilities: user.credFacilities,
                    freeBalance: user.adminFreeBalance,
                    deposit: user.adminPledge,
                    marginLevel: user.adminMarginLevel,
                };

                res.status(OKEY_STATUS_CODE).send(financials);
            })
            .catch(() => {
                res.status(SERVER_ERROR_STATUS_CODE).end();
            });
    } catch (error) {
        res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}
