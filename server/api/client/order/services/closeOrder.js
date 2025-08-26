import {
    OKEY_STATUS_CODE,
    BAD_REQUEST_STATUS_CODE,
    SERVER_ERROR_STATUS_CODE,
    NOT_FOUND_STATUS_CODE,
} from '../../../../constants/constants';
import editOrder from '../queries/editOrder';
import editUser from '../../user/queries/editUser';
import getOrderById from '../queries/getOrderById';

import pricesController from '../../../../controllers/pricesController';
import {getCommission, getProfit} from '../../../../../src/apps/client/utils/getAssetValues';
import {COMMISSION} from '../../../../../src/apps/client/constants/constants';
import {CHART_SYMBOL_INFO_MAP} from '../../../../constants/symbols';

import calculateBuyingPrice from '../../../../../src/apps/client/utils/calculateBuyPrice';
import getUserByIdQuery from '../../user/queries/getUserById';
import getOrdersByInfo from '../queries/getOrdersByInfo';
import Order from '../model';

export default function closeOrder(req, res) {
    try {
        (async () => {
            let id;
            let userId;
            let balance;
            let closedPriceParam;

            if (req.originalUrl.match(/\/api\/client\/order\/close-all\/(.*?)/)) {
                if (req.params.id.includes('__')) {
                    const info = req.params.id.split('__');
                    const user = await getUserByIdQuery(info[1]);
                    if (!user) {
                        return res.status(NOT_FOUND_STATUS_CODE).end();
                    }

                    res.locals.user = user;

                    id = info[0];
                    userId = res.locals.user.id;
                    balance = res.locals.user.balance;
                    info[2] ? (closedPriceParam = +info[2]) : '';
                }
            } else {
                id = req.params.id;
                userId = res.locals.user.id;
                balance = res.locals.user.balance;
            }

            getOrderById(id).then((order) => {
                if (!order || order.userId !== userId) {
                    return res.status(BAD_REQUEST_STATUS_CODE).send();
                }
                const closedPrice = pricesController.prices[order.assetName];
                const closedPriceReal =
                    order.type === 'sell'
                        ? closedPrice
                        : calculateBuyingPrice(order.assetName, closedPrice);

                /**
                 * TODO
                 * Нужно решить что с ценами делать
                 * На них можно вилять милионами способов:
                 * 1) Заморозить профит
                 * 2) Изменить отклонение графика
                 * 3) Черещ lotVolume
                 * 4) Получать по real-time обычную цену
                 */
                const finalClosedPrice = order.profitFreeze
                    ? order.closedPrice
                    : closedPriceParam || closedPriceReal.value;

                const closedOrder = {
                    id,
                    isClosed: true,
                    closedAt: Date.now(),
                    closedPrice: finalClosedPrice,
                };

                const asset = CHART_SYMBOL_INFO_MAP[order.assetName];

                const profit = getProfit(
                    order.amount,
                    order.openingPrice,
                    finalClosedPrice,
                    order.type,
                    asset
                );

                const finalProfit = order.profitFreeze ? order.profit : profit;

                const commission = getCommission(order.pledge, COMMISSION);

                const updatedUser = {
                    id: userId,
                    balance: balance + finalProfit - commission,
                    mainBalance: balance + finalProfit - commission,
                };

                Promise.all([editUser(updatedUser), editOrder(closedOrder)])
                    .then(async ([user, order]) => {
                        const openOrders = await getOrdersByInfo({userId, isClosed: false});
                        const countClosedOrders = await Order.countDocuments({
                            userId,
                            isClosed: true,
                        });
                        return res
                            .status(OKEY_STATUS_CODE)
                            .send({openOrders, closedOrders: [order], countClosedOrders, user});
                    })
                    .catch((e) => {
                        console.log('-----------Тут егор-------------');
                        console.log(e);
                        console.log('------------Тут егор------------');
                        res.status(SERVER_ERROR_STATUS_CODE).end();
                    });
            });
        })();
    } catch (e) {
        res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}
