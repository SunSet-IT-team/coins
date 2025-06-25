import EventEmitter from 'eventemitter3';
import {WebSocketManager} from './webSocketManager';
import {OrderManager} from './orderManager';
import {HeartbeatManager} from './heartbeatManager';
import {apiService} from './apiService';

export const pricesEvents = new EventEmitter();

class PricesController {
    constructor() {
        this.prices = {};
        this.prevPrices = {};
        this.wsManager = new WebSocketManager(this.prices);
        this.orderManager = new OrderManager(apiService, this.prices);
        this.heartbeatManager = new HeartbeatManager(this.prices, this.prevPrices);
    }

    start() {
        this.wsManager.connect();
        this.heartbeatManager.start();
        this.orderManager.refreshOrders().then(() => this.orderManager.checkAndCloseOrders());
        setInterval(() => this.orderManager.refreshOrders(), 10000);
    }
}

export default new PricesController();
