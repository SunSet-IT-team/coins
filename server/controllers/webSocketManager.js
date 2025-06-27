import WebSocket from 'ws';
import {CRYPTO_CURRENCIES_SYMBOLS} from '../constants/symbols';
import {pricesEvents} from './pricesController';
import {SYMBOL_PRICE_CHANGE_EVENT} from '../constants/events';

const BINANCE_WS = 'wss://stream.binance.com:9443/ws';

export class WebSocketManager {
    constructor(prices) {
        this.prices = prices;
        this.socket = null;

        this.wss = new WebSocket.Server({port: 8080});
    }

    connect() {
        this.socket = new WebSocket(BINANCE_WS);

        this.socket.on('open', () => {
            const pairs = CRYPTO_CURRENCIES_SYMBOLS.map(
                (item) => item.name.replace('BINANCE:', '').toLowerCase() + '@trade'
            );

            this.socket.send(
                JSON.stringify({
                    method: 'SUBSCRIBE',
                    params: pairs,
                    id: 1,
                })
            );
        });

        this.socket.on('message', (data) => {
            const message = JSON.parse(data);
            if (!message.p || !message.s || !message.T) return;

            const symbolName = 'BINANCE:' + message.s;
            const rawPrice = parseFloat(message.p);
            const symbolTime = message.T;

            if (!this.prices[symbolName]) {
                this.prices[symbolName] = {value: 0, offset: 0};
            }

            const offset = this.prices[symbolName].offset || 0;
            const newPrice = rawPrice + offset;
            const prevPrice = this.prices[symbolName].value || 0;

            if (newPrice !== prevPrice) {
                const assetPriceChange = {
                    name: symbolName,
                    price: newPrice,
                    time: symbolTime,
                    changes: newPrice > prevPrice ? 'up' : 'down',
                    prevPrice: prevPrice,
                    offset,
                };

                this.prices[symbolName].value = newPrice;

                pricesEvents.emit(SYMBOL_PRICE_CHANGE_EVENT, {
                    prices: this.prices,
                    assetPriceChange: assetPriceChange,
                });

                // Сразу отправляем клиентам
                this.sendToClients(assetPriceChange);
            }
        });

        this.socket.on('close', () => {
            setTimeout(() => this.connect(), 1000);
        });

        this.socket.on('error', console.error);
    }

    restart() {
        if (this.socket) {
            this.socket.close();
        }
    }

    sendToClients(data) {
        // console.log(data);
        const message = JSON.stringify({
            type: 'PRICE_UPDATE',
            data: {
                name: data.name,
                price: data.price,
                time: data.time,
                changes: data.changes,
                prevPrice: data.prevPrice,
                offset: data.offset,
            },
        });

        this.wss.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    }

    forceSendCurrentPrice(symbolName) {
        const priceData = this.prices[symbolName];

        if (!priceData) return;

        const data = {
            name: symbolName,
            price: priceData.value,
            time: Date.now(),
            changes: 'offset_updated',
            prevPrice: priceData.value - priceData.offset,
        };

        this.sendToClients(data);
    }
}
