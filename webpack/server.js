const path = require('path');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const httpProxy = require('http-proxy');
const ip = require('ip');
const net = require('net');

let port = process.env.PORT || 4000;
let host = process.env.HOST || '0.0.0.0';
let app = express();
let apiProxy = httpProxy.createProxyServer();
let rootPath = path.resolve(__dirname, '..');
let config = require('./dev.config');

const multiCompiler = webpack(config);

const adminCompiler = multiCompiler.compilers.find((c) => c.name === 'admin');
const clientCompiler = multiCompiler.compilers.find((c) => c.name === 'client');

// Webpack Dev Middleware
const devMiddleware = webpackDevMiddleware(multiCompiler, {
    headers: { 'Access-Control-Allow-Origin': '*' },
    publicPath: config[0].output.publicPath,
    quiet: false,
    noInfo: true,
    hot: true,
    inline: false,
    stats: 'minimal',
    writeToDisk: true, // Для SSR важно писать файлы на диск
    serverSideRender: true,
    stats: {
        timings: true,
        chunks: false,
        errors: true,
        modules: false,
        assets: false,
        errorDetails: true,
        children: false,
        warnings: true,
    },
    watchOptions: {
        poll: 1000,
        ignored: /node_modules/,
    },
});

// hotMiddleware должен быть подключён к каждому компилятору по отдельности
app.use(
    webpackHotMiddleware(adminCompiler, {
        path: '/__webpack_hmr_admin',
        log: false,
        heartbeat: 2000,
    }),
);

app.use(
    webpackHotMiddleware(clientCompiler, {
        path: '/__webpack_hmr_client',
        log: false,
        heartbeat: 2000,
    }),
);

app.use(devMiddleware);

app.use(express.static(rootPath));

let timeoutId;
function retry(cb) {
    const client = net.connect({ port: 3000 }, () => {
        clearTimeout(timeoutId);
        cb();
        client.end();
        timeoutId && process.stdout.write(' Done');
        timeoutId = null;
    });

    client.on('error', () => {
        if (process.stdout.isTTY && typeof process.stdout.clearLine === 'function') {
            process.stdout.clearLine();
        }
        if (process.stdout.isTTY && typeof process.stdout.cursorTo === 'function') {
            process.stdout.cursorTo(0);
        }
        process.stdout.write('Waiting for server...');
    });
}

// Proxy api requests
app.all('*', function (req, res) {
    retry(() =>
        apiProxy.web(req, res, {
            target: {
                port: 3000,
                host: 'localhost',
            },
        }),
    );
});

devMiddleware.waitUntilValid(() => {
    console.log('|-------------------------------------|');
    console.log('|   Local: ', 'http://localhost:' + port, '    |');
    console.log('|  Remote: ', 'http://' + ip.address() + ':' + port, ' |');
    console.log('|-------------------------------------|');
});

app.listen(port, host, (err) => err && console.log(err));
console.info('Running static webpack server on port', port); // eslint-disable-line no-console
