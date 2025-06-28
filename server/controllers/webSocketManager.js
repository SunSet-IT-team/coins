import WebSocket from 'ws';
import {CRYPTO_CURRENCIES_SYMBOLS} from '../constants/symbols';
import {pricesEvents} from './pricesController';
import {SYMBOL_PRICE_CHANGE_EVENT} from '../constants/events';

const FINNHUB_WS = `wss://ws.finnhub.io?token=cpkt1rhr01qulsvjo5m0cpkt1rhr01qulsvjo5mg`;
const BASE_RECONNECT_DELAY = 5000;
const MAX_BACKOFF_MULTIPLIER = 8;
const HEARTBEAT_INTERVAL = 1000;
const SUBSCRIBE_RATE_DELAY = 1100; // 1.1 сек на подписку

export class WebSocketManager {
    constructor(prices) {
        this.prices = prices;
        this.socket = null;
        this.wss = new WebSocket.Server({port: 8080});

        this.backoffMultiplier = 1;
        this.reconnectTimer = null;

        this.subscriptionQueue = [];
        this.heartbeatTimer = null;
        this.heartbeatIndex = 0;

        this.isConnected = false;
        this.fakeStreamTimer = null;
        this.latestBroadcastedPrices = {};
    }

    connect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.socket = new WebSocket(FINNHUB_WS);

        this.socket.on('open', async () => {
            console.log('[Finnhub] connected');
            this.backoffMultiplier = 1;
            this.isConnected = true;

            this.stopFakeStream();
            this.enqueueSubscriptions();
            await this.processQueueWithRateLimit();
            this.startHeartbeat();
        });

        this.socket.on('message', (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw);
            } catch (e) {
                return;
            }

            if (msg.type === 'error') {
                console.error('[Finnhub] error:', msg.msg);
                if (msg.msg.toLowerCase().includes('limit')) {
                    this.handleRateLimit();
                }
                return;
            }

            if (msg.type === 'trade' && Array.isArray(msg.data)) {
                for (const trade of msg.data) this.onTrade(trade);
            }
        });

        this.socket.on('error', (err) => {
            console.error('[Finnhub] socket error:', err.message);
            this.isConnected = false;
            if (err.message.includes('429')) {
                this.handleRateLimit();
            } else {
                this.socket.close();
            }
        });

        this.socket.on('close', () => {
            console.warn(
                `[Finnhub] closed, reconnect in ${BASE_RECONNECT_DELAY * this.backoffMultiplier}ms`
            );
            this.isConnected = false;
            this.stopHeartbeat();
            this.startFakeStream();
            this.scheduleReconnect(BASE_RECONNECT_DELAY * this.backoffMultiplier);
        });
    }

    enqueueSubscriptions() {
        // максимум 50 символов
        this.subscriptionQueue = Array.from(
            new Set(CRYPTO_CURRENCIES_SYMBOLS.map((c) => c.name))
        ).slice(0, 50);
    }

    async processQueueWithRateLimit() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        for (const sym of this.subscriptionQueue) {
            console.log('[Finnhub] subscribing to', sym);
            try {
                this.socket.send(JSON.stringify({type: 'subscribe', symbol: sym}));
            } catch (err) {
                console.warn(`[Finnhub] failed to subscribe to ${sym}`, err.message);
            }
            await new Promise((res) => setTimeout(res, SUBSCRIBE_RATE_DELAY));
        }
        this.subscriptionQueue = [];
    }

    handleRateLimit() {
        console.warn('[Finnhub] rate limit — backing off');
        this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, MAX_BACKOFF_MULTIPLIER);
        this.socket.close();
    }

    scheduleReconnect(delay) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
    }

    onTrade(trade) {
        const symbolName = trade.s;
        const rawPrice = parseFloat(trade.p);
        const timestamp = trade.t;

        if (!this.prices[symbolName]) {
            this.prices[symbolName] = {value: 0, offset: 0};
        }

        const offset = this.prices[symbolName].offset || 0;
        const newPrice = rawPrice + offset;
        const prev = this.prices[symbolName].value || 0;

        if (newPrice !== prev) {
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
            this.broadcast(change);
        }
    }

    broadcast(data) {
        this.latestBroadcastedPrices[data.name] = data;

        if (!this.isConnected) return;

        const msg = JSON.stringify({type: 'PRICE_UPDATE', data});
        for (const c of this.wss.clients) {
            if (c.readyState === WebSocket.OPEN) c.send(msg);
        }
    }

    startHeartbeat() {
        if (this.heartbeatTimer) return;
        this.heartbeatTimer = setInterval(() => {
            if (!this.isConnected) return;

            const symbols = Object.keys(this.prices);
            if (symbols.length === 0) return;

            const sym = symbols[this.heartbeatIndex % symbols.length];
            const pd = this.prices[sym];
            const now = Date.now();

            const update = {
                name: sym,
                price: pd.value,
                time: now,
                changes: 'refresh',
                prevPrice: pd.value - pd.offset,
                offset: pd.offset,
            };

            this.broadcast(update);
            this.heartbeatIndex++;
        }, HEARTBEAT_INTERVAL);
    }

    stopHeartbeat() {
        if (!this.heartbeatTimer) return;
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
    }

    startFakeStream() {
        if (this.fakeStreamTimer) return;
        console.log('[Stream] starting fake stream');
        this.fakeStreamTimer = setInterval(() => {
            const now = Date.now();
            for (const [symbol, data] of Object.entries(this.latestBroadcastedPrices)) {
                const fakeData = {
                    ...data,
                    time: now,
                    changes: 'fake',
                };
                const msg = JSON.stringify({type: 'PRICE_UPDATE', data: fakeData});
                for (const c of this.wss.clients) {
                    if (c.readyState === WebSocket.OPEN) c.send(msg);
                }
            }
        }, 2000);
    }

    stopFakeStream() {
        if (!this.fakeStreamTimer) return;
        clearInterval(this.fakeStreamTimer);
        this.fakeStreamTimer = null;
        console.log('[Stream] fake stream stopped');
    }

    restart() {
        if (this.socket) this.socket.close();
    }

    forceSendCurrentPrice(symbolName) {
        const pd = this.prices[symbolName];
        if (!pd) return;

        const data = {
            name: symbolName,
            price: pd.value,
            time: Date.now(),
            changes: 'refresh',
            prevPrice: pd.value - pd.offset,
            offset: pd.offset,
        };

        this.broadcast(data);
    }
}
