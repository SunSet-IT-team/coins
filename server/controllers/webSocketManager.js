import WebSocket from 'ws';
import {CHART_SYMBOL_GROUPS} from '../constants/symbols';
import {pricesEvents} from './pricesController';
import {SYMBOL_PRICE_CHANGE_EVENT} from '../constants/events';

const FINNHUB_WS = `wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY_PROD}`;
const MAX_SUBS_PER_SECOND = 50;
const RECONNECT_INITIAL_DELAY = 3000;
const RECONNECT_MAX_DELAY = 60000;

export class WebSocketManager {
    constructor(prices) {
        this.prices = prices;
        this.socket = null;
        this.wss = new WebSocket.Server({port: 8080});

        this.reconnectDelay = RECONNECT_INITIAL_DELAY;

        this.wss.on('connection', (client) => {
            this.sendCacheToClient(client);
        });
    }

    connect() {
        this.socket = new WebSocket(FINNHUB_WS);

        this.socket.on('open', () => {
            console.log('[Finnhub] ПОДКЛЮЧЕНО');
            this.reconnectDelay = RECONNECT_INITIAL_DELAY;

            const allSymbols = CHART_SYMBOL_GROUPS.flatMap((group) => group.symbols);
            const validSymbols = allSymbols
                .filter((s) => s && typeof s.name === 'string')
                .map((s) => s.name);

            // validSymbols.forEach((symbol, index) => {
            //     setTimeout(
            //         () => {
            //             if (this.socket.readyState === WebSocket.OPEN) {
            //                 const payload = {type: 'subscribe', symbol};
            //                 this.socket.send(JSON.stringify(payload));
            //                 console.log(`[Finnhub] ПОДПИСКА НА ${symbol}`);
            //             } else {
            //                 console.warn(
            //                     `[Finnhub] ПОДПИСКА НА ${symbol} — СОКЕТ СОЕДИНЕНИЕ НЕ ОТКРЫТО!!!`
            //                 );
            //             }
            //         },
            //         Math.floor(index / MAX_SUBS_PER_SECOND) * 1000
            //     );
            // });
        });

        this.socket.on('message', (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw);
            } catch (e) {
                console.error('[Finnhub]:', e.message);
                return;
            }

            if (msg.type !== 'trade' || !Array.isArray(msg.data)) return;

            msg.data.forEach((trade) => this.handleTrade(trade));
        });

        this.socket.on('close', () => {
            console.warn(`[Finnhub] ОТКЛЮЧЕНО ПЕРЕПОДКЛЮЧЕНИЕ ЧЕРЕЗ ${this.reconnectDelay}ms...`);
            setTimeout(() => {
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_DELAY);
                this.connect();
            }, this.reconnectDelay);
        });

        this.socket.on('error', (err) => {
            console.error('[Finnhub] ОШИБКА:', err.message);
        });
    }

    handleTrade({s, p, t}) {
        const symbolName = s.includes(':') ? s : `FINNHUB:${s}`;
        const rawPrice = parseFloat(p);
        const timestamp = t;

        if (!this.prices[symbolName]) {
            this.prices[symbolName] = {value: 0, offset: 0};
        }

        const {offset = 0} = this.prices[symbolName];
        const newPrice = rawPrice + offset;
        const prev = this.prices[symbolName].value;

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
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    }

    sendCacheToClient(client) {
        if (client.readyState === WebSocket.OPEN) {
            const allCachedPrices = Object.entries(this.prices).map(
                ([symbolName, {value, offset}]) => ({
                    name: symbolName,
                    price: value,
                    time: Date.now(),
                    changes: 'cached',
                    prevPrice: value - offset,
                    offset,
                })
            );

            client.send(JSON.stringify({type: 'PRICE_CACHE', data: allCachedPrices}));
        }
    }

    restart() {
        if (this.socket) {
            this.socket.close();
        }
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
