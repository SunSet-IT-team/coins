import {
    OKEY_STATUS_CODE,
    SERVER_ERROR_STATUS_CODE,
    BAD_REQUEST_STATUS_CODE,
} from '../../../../constants/constants';

import editUserQuery from '../../../client/user/queries/editUser';
import editOrderQuery from '../../../client/order/queries/editOrder';
import getUserById from '../../../client/user/queries/getUserById';

import {getCommission, getProfit} from '../../../../../src/apps/client/utils/getAssetValues';
import getOrderById from '../../../client/order/queries/getOrderById';
import {COMMISSION} from '../../../../../src/apps/client/constants/constants';
import {CHART_SYMBOL_INFO_MAP} from '../../../../constants/symbols';
import numeral from 'numeral';

export default function closeOrder(req, res) {
    try {
        const orderInfo = req.body;

        getOrderById(orderInfo.id)
            .then((order) => {
                if (!order) return res.status(BAD_REQUEST_STATUS_CODE).send();
                getUserById(order.userId)
                    .then((user) => {
                        if (!user || user.id !== order.userId) {
                            return res.status(BAD_REQUEST_STATUS_CODE).send();
                        }

                        const closedPrice = numeral(orderInfo.closedPrice).value();
                        const asset = CHART_SYMBOL_INFO_MAP[order.assetName];

                        // Корректный расчёт прибыли, если она не задана
                        let profit =
                            typeof order.profit === 'number'
                                ? order.profit
                                : getProfit(
                                      order.amount,
                                      order.openingPrice,
                                      closedPrice,
                                      order.type,
                                      asset
                                  );

                        const commission = getCommission(order.pledge, COMMISSION);
                        const netProfit = profit - commission;

                        const closedOrder = {
                            id: order.id,
                            isClosed: true,
                            closedAt: orderInfo.closedAt,
                            closedPrice,
                            profit,
                        };

                        const updatedUser = {
                            id: user.id,
                            balance: user.balance + netProfit,
                            mainBalance: user.balance + netProfit,
                        };

                        Promise.all([editOrderQuery(closedOrder), editUserQuery(updatedUser)])
                            .then(() => res.status(OKEY_STATUS_CODE).end())
                            .catch(() => {
                                res.status(SERVER_ERROR_STATUS_CODE).end();
                            });
                    })
                    .catch(() => res.status(SERVER_ERROR_STATUS_CODE).end());
            })
            .catch(() => res.status(SERVER_ERROR_STATUS_CODE).end());
    } catch (e) {
        res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}
