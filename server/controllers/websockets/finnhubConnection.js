const https = require('https');
const WebSocket = require('ws');
const {parentPort, workerData} = require('worker_threads');

const {token, symbols, KEY_REST, tokenIndex} = workerData;

const FINNHUB_WS = `wss://ws.finnhub.io?token=${token}`;

const MAX_SUBS_PER_SECOND = 50;
const RECONNECT_INITIAL_DELAY = 3000;
const RECONNECT_MAX_DELAY = 60000;

async function fetchWithRetry(symbol, key, retries = 3, delayMs = 500) {
    return new Promise((resolve) => {
        const tryRequest = (attempt) => {
            https
                .get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`, (res) => {
                    let data = '';
                    res.on('data', (chunk) => (data += chunk));
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (error) {
                            if (attempt < retries) {
                                setTimeout(() => tryRequest(attempt + 1), delayMs);
                            } else {
                                console.log(
                                    `ERROR parsing data for symbol ${symbol}, attempts: ${attempt}`
                                );
                                resolve(null);
                            }
                        }
                    });
                })
                .on('error', (err) => {
                    if (attempt < retries) {
                        setTimeout(() => tryRequest(attempt + 1), delayMs);
                    } else {
                        console.error(
                            `Request error for ${symbol} after ${attempt} attempts:`,
                            err
                        );
                        resolve(null);
                    }
                });
        };

        tryRequest(1);
    });
}

/**
 * Получить начальные данные для валюты
 */
async function getCurrentRates(symbols, key) {
    return Promise.all(symbols.map((symbol) => fetchWithRetry(symbol, key)));
}

class WebSocketManager {
    constructor() {
        this.reconnectDelay = RECONNECT_INITIAL_DELAY;
    }

    connect() {
        this.socket = new WebSocket(FINNHUB_WS);

        this.socket.on('open', async () => {
            // console.log(`[Finnhub][Worker ${tokenIndex}] ПОДКЛЮЧЕНО`);

            this.reconnectDelay = RECONNECT_INITIAL_DELAY;

            symbols.forEach((symbol, index) => {
                setTimeout(() => {
                    if (this.socket.readyState === WebSocket.OPEN) {
                        const payload = {type: 'subscribe', symbol};
                        this.socket.send(JSON.stringify(payload));
                        // console.log(`[Finnhub][Worker ${tokenIndex}] ПОДПИСКА НА ${symbol}`);
                    } else {
                        // console.warn(
                        //     `[Finnhub][Worker ${tokenIndex}] ПОДПИСКА НА ${symbol} — СОКЕТ СОЕДИНЕНИЕ НЕ ОТКРЫТО!!!`
                        // );
                    }
                }, index * 400);
            });

            // // Получаем текущие значения
            const currentRates = await getCurrentRates(symbols, KEY_REST);

            const initialRates = currentRates.map((rate, index) => {
                const symbol = symbols[index];

                if (!rate || typeof rate.c !== 'number') {
                    // console.warn(`[Finnhub][Worker ${tokenIndex}] Нет данных для ${symbol}, ставим нули`);
                    return {
                        s: symbol,
                        p: 0,
                        t: Date.now(),
                    };
                }

                return {
                    s: symbol,
                    p: rate.c,
                    t: rate.t || Date.now(),
                };
            });

            parentPort.postMessage({
                type: 'initial',
                payload: initialRates,
            });

            this.pingInterval = setInterval(() => {
                if (this.socket.readyState === WebSocket.OPEN) {
                    this.socket.ping();
                }
            }, 20000);
        });

        this.socket.on('message', (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw);
            } catch (e) {
                // console.error('[Finnhub]:', e.message);
                return;
            }

            if (msg.type !== 'trade' || !Array.isArray(msg.data)) return;

            parentPort.postMessage({
                type: 'message',
                payload: msg,
            });
        });

        this.socket.on('close', (code, reason) => {
            this.pingInterval && clearInterval(this.pingInterval);
            // console.warn(
            //     `[Finnhub][Worker ${tokenIndex}] ОТКЛЮЧЕНО: код ${code}, причина: ${reason}`
            // );
            // console.warn(
            //     `[Finnhub][Worker ${tokenIndex}] ОТКЛЮЧЕНО ПЕРЕПОДКЛЮЧЕНИЕ ЧЕРЕЗ ${this.reconnectDelay}ms...`
            // );
            setTimeout(() => {
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_DELAY);
                this.connect();
            }, this.reconnectDelay);
        });

        this.socket.on('error', (err) => {
            // console.error(`[Finnhub][Worker ${tokenIndex}] ОШИБКА:`, err.message);
        });
    }
}

const wsManager = new WebSocketManager();
wsManager.connect();
