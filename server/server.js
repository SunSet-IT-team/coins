import 'log-timestamp-moment';
import express from 'express';
import React from 'react';
import os from 'os';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import expressStaticGzip from 'express-static-gzip';
import {renderToString} from 'react-dom/server';
import {Worker, isMainThread, parentPort, workerData} from 'worker_threads';

import ordersController from './controllers/ordersController';
import pricesController from './controllers/pricesController';
import pricesWebsocketController from './controllers/websockets/pricesWebsocketController';
import messagesWebsocketController from './controllers/websockets/messagesWebsocketController';
import transactionsWebsocketController from './controllers/websockets/transactionsWebsocketController.js';

import map from '@tinkoff/utils/array/map';

import adminAuthenticationApi from './api/admin/authentication';
import adminPaymentApi from './api/admin/payment';
import adminArticleApi from './api/admin/article';
import clientArticleApi from './api/client/article';
import adminFilesApi from './api/admin/files';
import adminDbApi from './api/admin/db';
import adminUserApi from './api/admin/user';
import clientUserApi from './api/client/user';
import adminManagerApi from './api/admin/manager';
import clientAuthenticationApi from './api/client/authentication';
import adminQiwiApi from './api/admin/qiwi';
import clientQiwiApi from './api/client/qiwi';
import adminMessageApi from './api/admin/message';
import clientMessageApi from './api/client/message';
import clientOrderApi from './api/client/order';
import adminOrderApi from './api/admin/order';
import changeChartValuesApi from './api/admin/charts'; //// this is charts api
import clientDataApi from './api/client/data';
import clientTransactionApi from './api/client/transaction';
import adminTransactionApi from './api/admin/transaction';
import clientTempApi from './api/client/temp';
import adminPaymentsApi from './api/admin/payments';
import clientPaymentsApi from './api/client/payments';
import adminMoneyInputApi from './api/admin/moneyInput';
import adminMoneyOutputApi from './api/admin/moneyOutput';
import clientMoneyInputApi from './api/client/moneyInput';
import clientMoneyOutputApi from './api/client/moneyOutput';

import {DATABASE_URL} from './constants/constants';
import {ADMIN_PANEL_URL} from '../src/apps/admin/constants/constants';
import backups from './helpers/backup/backups';
import actions from './actions';
import getStore from '../src/apps/client/store/getStore';
import renderAppPage from '../src/apps/client/html';
import renderAdminPage from '../src/apps/admin/html';

import {httpsRedirect, startHttpsServer} from './httpsServer';

import {Provider} from 'react-redux';
import {StaticRouter} from 'react-router-dom';
import Helmet from 'react-helmet';
import App from '../src/apps/client/App.jsx';

const rootPath = path.resolve(__dirname, '..');
const PORT = 3003;

// Критические ошибки, чтобы понять место
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'REASON:', reason);
});

function createApp() {
    return new Promise((resolve) => {
        const app = express();

        app.use(helmet());

        // mongodb
        mongoose.connect(DATABASE_URL, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true,
        });
        backups();

        httpsRedirect(app);
        const fetch = require('node-fetch');

        app.post('/api/redeploy', async (req, res) => {
            try {
                const response = await fetch('http://localhost:3002/deploy', {
                    method: 'POST',
                });

                if (response.ok) {
                    res.send('Развёртывание успешно запущено.');
                } else {
                    res.status(500).send('Ошибка при запуске развёртывания.');
                }
            } catch (error) {
                console.error(`Ошибка при отправке запроса на развёртывание: ${error.message}`);
                res.status(500).send('Ошибка при запуске развёртывания.');
            }
        });

        app.post('/api/reload', async (req, res) => {
            try {
                const response = await fetch('http://localhost:3002/reload', {
                    method: 'POST',
                });

                if (response.ok) {
                    res.send('Быстрая перезагрузка успешно запущена.');
                } else {
                    res.status(500).send('Ошибка при перезагрузке.');
                }
            } catch (error) {
                console.error(`Ошибка при отправке запроса на перезагрузку: ${error.message}`);
                res.status(500).send('Ошибка при запуске перезагрузки.');
            }
        });

        // static
        app.get(
            /\.chunk\.(js|css)$/,
            expressStaticGzip(rootPath, {
                enableBrotli: true,
                orderPreference: ['br'],
            })
        );
        app.use(compression());
        app.use((req, res, next) => {
            const isCodeFiles = req.url.match(/(.js|.jsx|.json|.css|.key|.pem)$/i);

            if (isCodeFiles) {
                return handleApp(req, res);
            }
            next();
        });
        app.use(express.static(rootPath));

        // helpers
        app.use(bodyParser.urlencoded({limit: '25mb', extended: true}));
        app.use(bodyParser.json({limit: '25mb', extended: true}));
        app.use(cookieParser());

        // api
        app.use('/api/admin/authentication', adminAuthenticationApi);
        app.use('/api/admin/payment', adminPaymentApi);
        app.use('/api/admin/article', adminArticleApi);
        app.use('/api/admin/files', adminFilesApi);
        app.use('/api/admin/db', adminDbApi);
        app.use('/api/admin/user', adminUserApi);
        app.use('/api/admin/manager', adminManagerApi);
        app.use('/api/admin/qiwi', adminQiwiApi);
        app.use('/api/admin/message', adminMessageApi);
        app.use('/api/admin/order', adminOrderApi);
        app.use('/api/admin/transaction', adminTransactionApi);
        app.use('/api/admin/payments', adminPaymentsApi);
        app.use('/api/admin/input', adminMoneyInputApi);
        app.use('/api/admin/output', adminMoneyOutputApi);
        app.use('/api/admin', changeChartValuesApi);

        app.use('/api/client/article', clientArticleApi);
        app.use('/api/client/user', clientUserApi);
        app.use('/api/client/authentication', clientAuthenticationApi);
        app.use('/api/client/qiwi', clientQiwiApi);
        app.use('/api/client/message', clientMessageApi);
        app.use('/api/client/order', clientOrderApi);
        app.use('/api/client/transaction', clientTransactionApi);
        app.use('/api/client/data', clientDataApi);
        app.use('/api/client/temp', clientTempApi);
        app.use('/api/client/payments', clientPaymentsApi);
        app.use('/api/client/output', clientMoneyOutputApi);
        app.use('/api/client/input', clientMoneyInputApi);

        // admin
        const adminUrlRegex = new RegExp(`^${ADMIN_PANEL_URL}`);

        app.get(adminUrlRegex, function (req, res) {
            const page = renderAdminPage();

            res.send(page);
        });

        // app
        app.get('*', handleApp);

        function handleApp(req, res) {
            const store = getStore();
            Promise.all(
                map((actionFunc) => {
                    return actionFunc(req, res)(store.dispatch);
                }, actions)
            ).then(() => {
                const context = {};
                const html = renderToString(
                    <Provider store={store}>
                        <StaticRouter location={req.originalUrl} context={context}>
                            <App />
                        </StaticRouter>
                    </Provider>
                );
                const helmet = Helmet.renderStatic();
                const preloadedState = store.getState();
                const page = renderAppPage(html, helmet, preloadedState);

                res.send(page);
            });
        }

        app.listen(isMainThread ? PORT : workerData.port, '0.0.0.0', () => {
            console.log('listening on port', isMainThread ? PORT : workerData.port);

            if (isMainThread) {
                pricesController.start();
                ordersController.start();
                pricesWebsocketController.start();
                messagesWebsocketController.start();
                transactionsWebsocketController.start();
            }

            resolve();
        });

        // TODO: добавьте сертификаты https в код и верните эту строку
        isMainThread ? startHttpsServer(app) : '';
    });
}

// eslint-disable-next-line no-inner-declarations
async function startMain() {
    console.log('start main');

    const env = process.env.NODE_ENV;
    const pathToScript = `${__dirname}/compiled/server.js`;
    let port = PORT;

    const totalCPUs = os.cpus().length;
    const freeCPUs = 4;
    const workersToCreate = Math.max(0, totalCPUs - freeCPUs);

    for (let i = 0; i < workersToCreate; i++) {
        port += i + 1;
        // console.log('thread', i + 1, 'port', port);
        await new Promise((resolve) => {
            const worker = new Worker(pathToScript, {workerData: {port, env}});
            worker.on('message', (data) => {
                if (data.request === 'init') {
                    // console.log('init api worker', data.env, data.port);

                    resolve();
                }
            });
            worker.on('error', (data) => console.log(data));
            worker.on('exit', (code) => console.log('exit', code));
        });

        port = PORT;
    }
}

if (isMainThread) {
    try {
        process.env.NODE_ENV === 'production' ? startMain() : '';
        createApp();
    } catch (err) {
        console.error('Main thread error:', err);
    }
} else {
    try {
        createApp().then(() =>
            parentPort.postMessage({request: 'init', env: process.env.NODE_ENV})
        );
    } catch (err) {
        console.error('Worker thread error:', err);
        process.exit(1);
    }
}
