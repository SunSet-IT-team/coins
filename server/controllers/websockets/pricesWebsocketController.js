import socketIo from 'socket.io';
import WebSocket from 'ws';

import {SYMBOL_PRICE_CHANGE_EVENT} from '../../constants/constants';

import {pricesEvents} from '../pricesController';

import https from 'https';
import http from 'http';
import fs from 'fs';
import express from 'express';
import {isMainThread} from 'worker_threads';

const credentials = {
    key: fs.readFileSync('server/https/private-new.key'),
    cert: fs.readFileSync('server/https/certificate.crt'),
    ca: [],
};

class PricesWebsocketController {
    constructor() {
        if (isMainThread) {
            const app = express();

            /**
             * Буфер всех изменений
             */
            this.bufferMessages = [];

            /**
             * Буфер всех клиентов
             */
            this.clients = new Set();

            const server =
                process.env.NODE_ENV === 'production'
                    ? https.createServer(credentials, app)
                    : http.createServer(app);

            server.listen(8443, () => {});

            this.io = socketIo(server);
        }
    }

    start() {
        pricesEvents.on(SYMBOL_PRICE_CHANGE_EVENT, (data) => {
            this.bufferMessages.push(data.assetPriceChange);
        });

        this.io.on('connection', (client) => {
            this.clients.add(client);
            client.on('close', () => clients.delete(client));
        });

        setInterval(() => {
            if (this.bufferMessages.length > 0) {
                this.clients.forEach((client) => {
                    if (client.connected) {
                        client.emit('message', this.bufferMessages);
                    }
                });
                this.bufferMessages.length = 0;
            }
        }, 1500);
    }
}

const pricesWebsocketController = new PricesWebsocketController();

export default pricesWebsocketController;
