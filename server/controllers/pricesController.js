import EventEmitter from 'eventemitter3';
import {WebSocketManager} from './websockets/webSocketManager';
import {OrderManager} from './orderManager';
import {HeartbeatManager} from './heartbeatManager';
import {apiService} from './apiService';
import Chart from '../api/admin/charts/model';

export const pricesEvents = new EventEmitter();

class PricesController {
    constructor() {
        this.prices = {};
        this.prevPrices = {};
        this.wsManager = new WebSocketManager(this.prices);
        this.orderManager = new OrderManager(apiService, this.prices);
        this.heartbeatManager = new HeartbeatManager(this.prices, this.prevPrices);

        pricesEvents.on('FORCE_UPDATE_PRICE', (symbolName) => {
            this.wsManager.forceSendCurrentPrice(symbolName);
        });
    }

    /**
     * Смещение цены?
     */
    async loadChartOffsets() {
        const charts = await Chart.aggregate([
            {$sort: {date: -1}},
            {$group: {_id: '$currency', offset: {$first: '$offset'}}},
        ]);

        charts.forEach((item) => {
            const name = item._id.toUpperCase();
            if (!this.prices[name]) {
                this.prices[name] = {value: 0, offset: item.offset};
            } else {
                this.prices[name].offset = item.offset;
            }

            console.log(`[offset loaded] ${name}: ${item.offset}`);
        });
    }

    async start() {
        await this.loadChartOffsets();

        this.wsManager.connect();
        this.heartbeatManager.start();
        await this.orderManager.refreshOrders();
        this.orderManager.checkAndCloseOrders();

        setInterval(() => this.orderManager.refreshOrders(), 10000);
    }
}

export default new PricesController();