import {CHART_SYMBOL_INFO_MAP} from '../../../../server/constants/symbols';
import getAssetValues from './getAssetValues';
import calculateBuyPrice from './calculateBuyPrice';
import {COMMISSION} from '../constants/constants';

export default (user, orders, prices) => {
    let userBalance = user.balance;

    const ordersInfo = {};

    orders.forEach((order) => {
        const symbolInfo = CHART_SYMBOL_INFO_MAP[order.assetName];
        const symbolPrice = prices[order.assetName];

        if (!symbolPrice) return;

        const realSymbolPrice =
            order.type === 'buy' ? calculateBuyPrice(symbolInfo.name, symbolPrice) : symbolPrice;
        const assetValues = getAssetValues(
            symbolInfo,
            {openingPrice: order.openingPrice, amount: order.amount, type: order.type},
            realSymbolPrice,
            userBalance,
            COMMISSION
        );

        userBalance = assetValues.balance;

        /**
         * @TODO проверить сходятся ли price
         */
        ordersInfo[order.id] = {
            price: symbolPrice,
            commission: assetValues.commissionValue,
            profit: assetValues.profit,
        };
    });

    return {
        ordersInfo,
        balance: userBalance,
    };
};
