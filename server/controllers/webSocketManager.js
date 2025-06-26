import WebSocket from 'ws';
import {CRYPTO_CURRENCIES_SYMBOLS} from '../constants/symbols';
import {pricesEvents} from './pricesController';
import {SYMBOL_PRICE_CHANGE_EVENT} from '../constants/events';

const BINANCE_WS = 'wss://stream.binance.com:9443/ws';

export class WebSocketManager {
    constructor(prices) {
        this.prices = prices;
        this.socket = null;
    }

    connect() {
        this.socket = new WebSocket(BINANCE_WS);

        this.socket.on('open', () => {
            const pairs = CRYPTO_CURRENCIES_SYMBOLS.map(
                ({name}) => name.replace('BINANCE:', '').toLowerCase() + '@trade'
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

            const symbolName = `BINANCE:${message.s}`;
            const newPrice = parseFloat(message.p);
            const symbolTime = message.T;

            if (this.prices[symbolName] !== newPrice) {
                const assetPriceChange = {
                    name: symbolName,
                    price: newPrice,
                    time: symbolTime,
                    changes: newPrice > (this.prices[symbolName] || 0) ? 'up' : 'down',
                    prevPrice: this.prices[symbolName] || newPrice,
                };

                this.prices[symbolName] = newPrice;

                pricesEvents.emit(SYMBOL_PRICE_CHANGE_EVENT, {
                    prices: this.prices,
                    assetPriceChange,
                });
            }
        });

        this.socket.on('close', () => setTimeout(() => this.connect(), 1000));
        this.socket.on('error', console.error);
    }

    restart() {
        if (this.socket) this.socket.close();
    }
}
