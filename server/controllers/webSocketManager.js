import WebSocket from 'ws';
import {CRYPTO_CURRENCIES_SYMBOLS} from '../constants/symbols';
import {pricesEvents} from './pricesController';
import {SYMBOL_PRICE_CHANGE_EVENT} from '../constants/events';

const BINANCE_WS = 'wss://stream.binance.com:9443/ws';
const MAX_SYMBOLS = 50;

export class WebSocketManager {
    constructor(prices) {
        this.prices = prices; // { BINANCE:BTCUSDT: { value, offset } }
        this.socket = null;
        this.wss = new WebSocket.Server({port: 8080});
    }

    connect() {
        this.socket = new WebSocket(BINANCE_WS);

        this.socket.on('open', () => {
            const pairs = CRYPTO_CURRENCIES_SYMBOLS.slice(0, MAX_SYMBOLS).map(
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

        this.socket.on('message', (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw);
            } catch (e) {
                return;
            }

            if (!msg.p || !msg.s || !msg.T) return;
            this.handleTrade(msg);
        });

        this.socket.on('close', () => setTimeout(() => this.connect(), 1000));
        this.socket.on('error', console.error);
    }

    handleTrade({s, p, T}) {
        const symbolName = 'BINANCE:' + s;
        const rawPrice = parseFloat(p);
        const timestamp = T;

        if (!this.prices[symbolName]) this.prices[symbolName] = {value: 0, offset: 0};

        const {offset = 0} = this.prices[symbolName];
        const newPrice = rawPrice + offset;
        const prev = this.prices[symbolName].value || 0;
        if (newPrice === prev) return;

        this.prices[symbolName].value = newPrice;

        const change = {
            name: symbolName,
            price: newPrice,
            time: timestamp,
            changes: newPrice > prev ? 'up' : 'down',
            prevPrice: prev,
            offset,
        };

        pricesEvents.emit(SYMBOL_PRICE_CHANGE_EVENT, {
            prices: this.prices,
            assetPriceChange: change,
        });

        this.sendToClients(change);
    }

    sendToClients(data) {
        const payload = JSON.stringify({type: 'PRICE_UPDATE', data});
        this.wss.clients.forEach((c) => {
            if (c.readyState === WebSocket.OPEN) c.send(payload);
        });
    }

    restart() {
        if (this.socket) this.socket.close();
    }

    forceSendCurrentPrice(symbolName) {
        const pd = this.prices[symbolName];
        if (!pd) return;

        this.sendToClients({
            name: symbolName,
            price: pd.value,
            time: Date.now(),
            changes: 'refresh',
            prevPrice: pd.value - pd.offset,
            offset: pd.offset,
        });
    }
}
