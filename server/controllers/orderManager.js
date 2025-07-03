import _remove from 'lodash.remove';
import Bluebird from 'bluebird';
import {AUTO_CLOSE_ORDER_EVENT} from '../constants/events';
import {pricesEvents} from './pricesController';
import {calculateNetProfit} from '../../src/apps/client/utils/calculateProfit';

export class OrderManager {
    constructor(apiService, prices) {
        this.apiService = apiService;
        this.prices = prices;
        this.orders = [];
    }

    async refreshOrders() {
        this.orders = await this.apiService.getOpenOrders();
    }

    async checkAndCloseOrders() {
        while (true) {
            for (const order of this.orders) {
                const assetPriceObj = this.prices[order.assetName];
                if (assetPriceObj === undefined) continue;

                const assetPrice = assetPriceObj.value;

                const netProfit = calculateNetProfit(order, assetPrice);

                if (
                    (order.takeProfit && netProfit >= order.takeProfit) ||
                    (order.stopLoss && netProfit <= -order.stopLoss)
                ) {
                    _remove(this.orders, (item) => item.id === order.id);
                    try {
                        const data = await this.apiService.closeOrder(order, assetPrice);
                        pricesEvents.emit(AUTO_CLOSE_ORDER_EVENT, data);
                    } catch (e) {
                        console.error('Error closing order:', e);
                    }
                }
            }
            await Bluebird.delay(1000);
        }
    }
}
