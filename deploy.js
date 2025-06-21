const {exec} = require('child_process');
const path = require('path');
const http = require('http');
const cron = require('node-cron');

const serverPath = path.join(__dirname, 'server');
const PORT = 3002;

function runReload(res) {
    console.log(`[${new Date().toLocaleString()}] Запуск перезагрузки...`);

    exec('yarn deploy:server', {cwd: serverPath}, (error, stdout, stderr) => {
        if (error) {
            console.error(`[${new Date().toLocaleString()}] Ошибка перезагрузки: ${error.message}`);
            if (res) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Ошибка перезагрузки');
            }
            return;
        }
        if (stderr) {
            console.error(`[${new Date().toLocaleString()}] stderr: ${stderr}`);
        }
        console.log(`[${new Date().toLocaleString()}] stdout: ${stdout}`);
        console.log(`[${new Date().toLocaleString()}] Перезагрузка успешно завершена.`);

        if (res) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Перезагрузка успешно завершена.');
        }
    });
}

cron.schedule('*/15 * * * *', () => {
    console.log(`[${new Date().toLocaleString()}] Автоматический запуск перезагрузки...`);
    runReload();
});

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/deploy') {
        console.log(`[${new Date().toLocaleString()}] Получен запрос на развёртывание...`);

        exec('yarn deploy', {cwd: serverPath}, (error, stdout, stderr) => {
            if (error) {
                console.error(
                    `[${new Date().toLocaleString()}] Ошибка развёртывания: ${error.message}`
                );
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Ошибка развёртывания');
                return;
            }
            if (stderr) {
                console.error(`[${new Date().toLocaleString()}] stderr: ${stderr}`);
            }
            console.log(`[${new Date().toLocaleString()}] stdout: ${stdout}`);
            console.log(`[${new Date().toLocaleString()}] Развёртывание успешно завершено.`);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Развёртывание успешно завершено.');
        });
    } else if (req.method === 'POST' && req.url === '/reload') {
        console.log(`[${new Date().toLocaleString()}] Получен запрос на перезагрузку...`);
        runReload(res);
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[${new Date().toLocaleString()}] HTTP-сервер запущен на порту ${PORT}`);
});
