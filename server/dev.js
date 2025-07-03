/* eslint-disable import/no-commonjs, global-require, no-console */
const path = require('path');
const webpack = require('webpack');
const {spawn} = require('child_process');
const MemoryFs = require('memory-fs');
const nodeFs = require('fs');

const config = require('../webpack/server/dev.config');
const pkg = require('../package.json');

const childEnv = Object.assign(process.env, {
    VERSION: pkg.version,
    PORT: +process.env.PORT || 3000,
});
const isDebugMode = process.env.DEBUG_SERVER;

if (isDebugMode) {
    config.devtool = 'source-map';
}
const compiler = webpack(config);

// Для корректного отображения source-map необходимо
// использование настоящей fs - https://github.com/evanw/node-source-map-support/issues/178
const fs = isDebugMode ? nodeFs : new MemoryFs();

if (!isDebugMode) {
    compiler.outputFileSystem = fs;
}

const filename = path.resolve(config.output.path, `${Object.keys(config.entry)[0]}.js`);
let child;

compiler.hooks.watchRun.tap('DevServer', () => {
    console.log('Rebuild...', new Date().toISOString());
});

compiler.hooks.done.tap('DevServer', (stats) => {
    console.log('Build completed', new Date().toISOString());
    if (stats.hasErrors()) {
        console.error(stats.compilation.errors);
        return;
    }

    if (stats.hasWarnings()) {
        console.warn(stats.compilation.warnings);
    }

    const createChildProcess = () => {
        const childOpts = {
            env: childEnv,
            stdio: ['pipe', process.stdout, process.stderr],
        };

        if (isDebugMode) {
            child = spawn(
                'node',
                ['--inspect', '-r', 'source-map-support/register', filename],
                childOpts
            );
            return;
        }
        child = spawn('node', [], childOpts);

        child.stdin.on('error', (err) => {
            console.error(err);
        });

        child.stdin.end(fs.readFileSync(filename));
    };

    if (child && !child.killed) {
        console.log('Stopping server...');
        // Используем SIGTERM вместо kill() для более мягкого завершения
        child.kill('SIGTERM');

        // Уменьшаем таймаут ожидания
        const timeout = setTimeout(() => {
            console.log('Force killing server...');
            child.kill('SIGKILL');
        }, 2000); // 2 секунды вместо долгого ожидания

        child.on('close', () => {
            clearTimeout(timeout);
            console.log('Server stopped, starting new instance...');
            createChildProcess();
        });
    } else {
        createChildProcess();
    }
});

compiler.watch(
    {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
    },
    (err) => {
        if (err) {
            console.error(err);
        }
    }
);
