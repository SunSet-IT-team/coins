import {AUTO_CLOSE_ORDER_EVENT, SYMBOL_PRICE_CHANGE_EVENT, DOMAIN} from '../constants/constants';

import WebSocket from 'ws';
import EventEmitter from 'eventemitter3';
import _remove from 'lodash.remove';
import fs from 'fs';
import path from 'path';
import Bluebird from 'bluebird';
import schedule from 'node-schedule';

import {CRYPTO_CURRENCIES_SYMBOLS} from '../constants/symbols';
import base from '../../src/apps/admin/services/base';
import request from 'superagent';
import {COMMISSION} from '../../src/apps/client/constants/constants';

export const pricesEvents = new EventEmitter();

const key = fs.readFileSync(path.resolve('./server/https/private.key'), 'utf8');
const cert = fs.readFileSync(path.resolve('./server/https/certificate.crt'), 'utf8');

class PricesController {
    prices = {};
    prevPrices = {};
    socket = null;

    constructor() {
        this.orders = [];

        this.prefix =
            process.env.NODE_ENV === 'production' ? `https://${DOMAIN}` : 'http://localhost:3003';

        this.getOredrs()
            .then((orders) => {
                this.orders = orders;
                this.checkBeforeCloseOrder();
            })
            .catch((e) => console.error('Error getting orders:', e));

        setInterval(() => {
            this.getOredrs()
                .then((orders) => {
                    this.orders = orders;
                })
                .catch((e) => {
                    console.error('Error refreshing orders:', JSON.stringify(e));
                });
        }, 10 * 1000);
    }

    start() {
        this.setWebsocket();
        this.startHeartbeat();

        const hours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
        const minutes = [10, 35, 55];
        hours.forEach((h) => schedule.scheduleJob({hour: h}, this.restartConnection));
        minutes.forEach((m) => schedule.scheduleJob({minute: m}, this.restartConnection));
    }

    setWebsocket() {
        try {
            const socket = new WebSocket('wss://stream.binance.com:9443/ws');

            socket.addEventListener('open', () => {
                console.log('WebSocket connected to Binance');

                const pairs = CRYPTO_CURRENCIES_SYMBOLS.map(
                    ({name}) => name.replace('BINANCE:', '').toLowerCase() + '@trade'
                );

                socket.send(
                    JSON.stringify({
                        method: 'SUBSCRIBE',
                        params: pairs,
                        id: 1,
                    })
                );
            });

            socket.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                if (!data.p || !data.s || !data.T) return;

                const symbolName = `BINANCE:${data.s}`;
                const newPrice = parseFloat(data.p);
                const symbolTime = data.T;

                if (this.prices[symbolName] !== newPrice) {
                    const assetPriceChange = {
                        name: symbolName,
                        price: newPrice,
                        time: symbolTime,
                        changes: newPrice > (this.prices[symbolName] || 0) ? 'up' : 'down',
                        prevPrice: this.prices[symbolName] || newPrice,
                    };

                    this.prevPrices[symbolName] = this.prices[symbolName];
                    this.prices[symbolName] = newPrice;

                    pricesEvents.emit(SYMBOL_PRICE_CHANGE_EVENT, {
                        prices: this.prices,
                        assetPriceChange,
                    });
                }
            });

            socket.addEventListener('close', (event) => {
                console.warn(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
                setTimeout(() => this.setWebsocket(), 1000);
            });

            socket.addEventListener('error', (err) => {
                console.error('WebSocket error:', err.message || err);
            });

            this.socket = socket;
        } catch (e) {
            console.error('Binance socket setup failed:', e);
        }
    }

    startHeartbeat() {
        const lastUpdateMap = {};

        pricesEvents.on(SYMBOL_PRICE_CHANGE_EVENT, ({assetPriceChange}) => {
            lastUpdateMap[assetPriceChange.name] = assetPriceChange.time;
        });

        setInterval(() => {
            const now = Date.now();

            Object.entries(this.prices).forEach(([symbolName, price]) => {
                const lastUpdate = lastUpdateMap[symbolName] || 0;

                if (now - lastUpdate >= 5000) {
                    const assetPriceChange = {
                        name: symbolName,
                        price,
                        time: now,
                        changes: 'same',
                        prevPrice: this.prevPrices[symbolName] || price,
                    };

                    pricesEvents.emit(SYMBOL_PRICE_CHANGE_EVENT, {
                        prices: this.prices,
                        assetPriceChange,
                    });

                    lastUpdateMap[symbolName] = now;
                }
            });
        }, 1000);
    }

    restartConnection = () => {
        if (this.socket) {
            console.warn('Restarting WebSocket connection...');
            this.socket.close();
        }
    };

    async checkBeforeCloseOrder() {
        for (const order of this.orders) {
            const assetPrice = this.prices[order.assetName];
            if (assetPrice === undefined) continue;

            const {amount, openingPrice, type, takeProfit, stopLoss, pledge, profit} = order;

            let orderType = null;

            let grossProfit = 0;

            if (typeof profit === 'number' && profit !== 0) {
                // Используем ручное значение, заданное админом
                grossProfit = profit;
            } else {
                // Вычисляем актуальную прибыль
                if (type === 'buy') {
                    grossProfit = (assetPrice - openingPrice) * amount;
                } else if (type === 'sell') {
                    grossProfit = (openingPrice - assetPrice) * amount;
                }
            }

            const commission = pledge * COMMISSION;
            const netProfit = grossProfit - commission;

            if (takeProfit && netProfit >= takeProfit) {
                orderType = 'takeProfit';
            } else if (stopLoss && netProfit <= -stopLoss) {
                orderType = 'stopLoss';
            }

            if (orderType) {
                _remove(this.orders, (item) => item.id === order.id);
                this.closeOrder(order.id, order.userId, assetPrice)
                    .then((data) => pricesEvents.emit(AUTO_CLOSE_ORDER_EVENT, data))
                    .catch((e) => console.error('Error closing order:', e));
            }
        }

        await Bluebird.delay(1000);
        await this.checkBeforeCloseOrder();
    }

    async getOredrs() {
        return base(request.get(`${this.prefix}/api/client/order/all-open`).cert(cert).key(key));
    }

    closeOrder(id, userId, closedPrice) {
        return base(
            request
                .get(`${this.prefix}/api/client/order/close-all/${id}__${userId}__${closedPrice}`)
                .cert(cert)
                .key(key)
        );
    }
}

const pricesController = new PricesController();
export default pricesController;
