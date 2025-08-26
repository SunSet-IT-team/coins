import io from 'socket.io-client';

import {TOKEN_LOCAL_STORAGE_NAME} from '../../constants/constants';
import EventEmitter from 'eventemitter3';

const WEBSOCKET_URL =
    process.env.NODE_ENV === 'production'
        ? 'wss://renessans-broker.online:6060'
        : 'ws://localhost:6060';

/**
 * Изменения любых транзакций в админке
 */
class TransactionsWebsocketController {
    events = new EventEmitter();

    connect() {
        const socket = io(WEBSOCKET_URL, {transports: ['websocket']});

        this.socket = socket;

        socket.on('connect', () => {
            const token = localStorage.getItem(TOKEN_LOCAL_STORAGE_NAME);

            socket.emit('token', {
                type: 'admin',
                token,
            });
        });

        /**
         * Вывод
         */
        socket.on('output', (data) => {
            this.events.emit('output', data);
        });

        /**
         * Депозит
         */
        socket.on('input', (data) => {
            this.events.emit('input', data);
        });
    }

    disconnect() {
        this.socket && this.socket.disconnect();
        this.socket = null;
    }
}

const transactionsWebsocketController = new TransactionsWebsocketController();

export default transactionsWebsocketController;
