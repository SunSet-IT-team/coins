import WebSocket from 'ws';
import {Worker} from 'worker_threads';
import {CHART_SYMBOL_GROUPS} from '../../constants/symbols';
import {pricesEvents} from '../pricesController';
import {SYMBOL_PRICE_CHANGE_EVENT} from '../../constants/events';
import {FINNHUB_API_KEY_REST} from '../../constants/constants';
import path from 'path';

const FINNHUB_TOKENS =
    process.env.NODE_ENV === 'production'
        ? [
              'd1m2na9r01qvvurjoi40d1m2na9r01qvvurjoi4g',
              'd1m2ocpr01qvvurjop60d1m2ocpr01qvvurjop6g',
              'd1m2orpr01qvvurjosdgd1m2orpr01qvvurjose0',
              'd1m2p61r01qvvurjoul0d1m2p61r01qvvurjoulg',
              'd1m2pr9r01qvvurjp2qgd1m2pr9r01qvvurjp2r0',
              'd1m2qb1r01qvvurjp5q0d1m2qb1r01qvvurjp5qg',
              'd1m48ihr01qvvurk1co0d1m48ihr01qvvurk1cog',
              'd1m4919r01qvvurk1fg0d1m4919r01qvvurk1fgg',
              'd1m498pr01qvvurk1gtgd1m498pr01qvvurk1gu0',
              'd1m49i9r01qvvurk1imgd1m49i9r01qvvurk1in0',
              'd1m49q9r01qvvurk1k2gd1m49q9r01qvvurk1k30',
          ]
        : [
              'd1jjro1r01qvg5gv0460d1jjro1r01qvg5gv046g',
              'd1jjs41r01qvg5gv06d0d1jjs41r01qvg5gv06dg',
              'd1jjsd1r01qvg5gv0810d1jjsd1r01qvg5gv081g',
              'd1jjsphr01qvg5gv0ae0d1jjsphr01qvg5gv0aeg',
              'd1jedm9r01qvg5gu10g0d1jedm9r01qvg5gu10gg',
              'ct9hjspr01qusoq8am0gct9hjspr01qusoq8am10',
              'd1jjlk1r01qvg5guv1q0d1jjlk1r01qvg5guv1qg',
              'd1jjrc1r01qvg5gv023gd1jjrc1r01qvg5gv0240',
              'd1m35f1r01qvvurjr7r0d1m35f1r01qvvurjr7rg',
              'd1m35opr01qvvurjr9n0d1m35opr01qvvurjr9ng',
              'd1m3621r01qvvurjrbh0d1m3621r01qvvurjrbhg',
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

        const MAX_PER_SOCKET = 26;

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

    handleTrade({ s, p, t }) {
    const symbolName = s;
    const rawPrice = parseFloat(p);
    const timestamp = t;

    if (!this.prices[symbolName]) {
        this.prices[symbolName] = { value: 0, offset: 0 };
    }

    const offset = this.prices[symbolName].offset || 0;
    const prev = this.prices[symbolName].value || 0;
    const newPrice = rawPrice + offset;

    // Пропускаем, если цена не изменилась
    if (newPrice === prev) return;

    // Сохраняем новое значение
    this.prices[symbolName].value = newPrice;

    const disabled = newPrice === 0;

    const change = {
        name: symbolName,
        price: newPrice,
        time: timestamp,
        changes: newPrice > prev ? 'up' : 'down',
        prevPrice: prev,
        offset,
        disabled,
    };

    if (disabled) {
        console.log(`[DISABLED] Цена = 0 для ${symbolName}`, change);
    }

    pricesEvents.emit(SYMBOL_PRICE_CHANGE_EVENT, {
        prices: this.prices,
        assetPriceChange: change,
    });
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