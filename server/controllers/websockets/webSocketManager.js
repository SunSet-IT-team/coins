import WebSocket from 'ws';
import {Worker} from 'worker_threads';
import {CHART_SYMBOL_GROUPS} from '../../constants/symbols';
import {pricesEvents} from '../pricesController';
import {SYMBOL_PRICE_CHANGE_EVENT} from '../../constants/events';
import {FINNHUB_API_KEY_REST} from '../../constants/constants';
import path from 'path';

const FINNHUB_WS = `wss://ws.finnhub.io?token=d1jedm9r01qvg5gu10g0d1jedm9r01qvg5gu10gg`;
// const FINNHUB_WS = `wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY_PROD}`;

const FINNHUB_TOKENS = [
    'd1jjro1r01qvg5gv0460d1jjro1r01qvg5gv046g',
    'd1jjs41r01qvg5gv06d0d1jjs41r01qvg5gv06dg',
    'd1jjsd1r01qvg5gv0810d1jjsd1r01qvg5gv081g',
    'd1jjsphr01qvg5gv0ae0d1jjsphr01qvg5gv0aeg',
    'd1jedm9r01qvg5gu10g0d1jedm9r01qvg5gu10gg',
    'ct9hjspr01qusoq8am0gct9hjspr01qusoq8am10',
    'd1jjlk1r01qvg5guv1q0d1jjlk1r01qvg5guv1qg',
    'd1jjrc1r01qvg5gv023gd1jjrc1r01qvg5gv0240',
];

export class WebSocketManager {
    constructor(prices) {
        this.prices = prices;
        this.socket = null;
        this.wss = new WebSocket.Server({port: 8080});

        this.wss.on('connection', (client) => {
            this.sendCacheToClient(client);
        });
    }

    connect() {
        const allSymbols = CHART_SYMBOL_GROUPS.flatMap((group) => group.symbols)
            .filter((s) => s && s.name)
            .map((s) => s.name);

        const MAX_PER_SOCKET = 25;

        for (let index = 0; index < FINNHUB_TOKENS.length; index++) {
            const token = FINNHUB_TOKENS[index];
            const symbolsChunk = allSymbols.slice(
                index * MAX_PER_SOCKET,
                (index + 1) * MAX_PER_SOCKET
            );

            if (symbolsChunk.length == 0) break;

            const workerPath = path.resolve('./server/controllers/websockets/finnhubConnection.js');

            const worker = new Worker(workerPath, {
                workerData: {
                    token,
                    symbols: symbolsChunk,
                    KEY_REST: FINNHUB_API_KEY_REST,
                    tokenIndex: index,
                },
            });

            worker.on('message', (msg) => {
                switch (msg.type) {
                    case 'initial':
                        msg.payload.forEach((trade) => this.handleTrade(trade));
                        break;
                    case 'message':
                        msg.payload.data.forEach((trade) => this.handleTrade(trade));
                        break;
                    case 'error':
                        console.error('[MAIN] Ошибка из воркера:', msg.payload);
                        break;
                    default:
                        console.warn('[MAIN] Неизвестный тип сообщения:', msg);
                }
            });

            worker.on('error', (err) => {
                console.error(`[Worker ${index}] Ошибка: ${err.message}`);
            });

            worker.on('exit', (code) => {
                console.warn(`[Worker ${index}] Завершён с кодом ${code}`);
            });
        }
    }

    handleTrade({s, p, t}) {
        const symbolName = s;
        // const symbolName = s.includes(':') ? s : `FINNHUB:${s}`;
        const rawPrice = parseFloat(p);
        const timestamp = t;

        const prev = this.prices[symbolName] ? this.prices[symbolName].value : 0;

        if (!this.prices[symbolName]) {
            this.prices[symbolName] = {value: rawPrice, offset: 0};
        }

        const {offset = 0} = this.prices[symbolName];
        const newPrice = rawPrice + offset;

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

        // this.sendToClients(change);
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
