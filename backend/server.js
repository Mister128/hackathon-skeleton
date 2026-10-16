import { createServer } from 'http';
import { readFileSync } from 'fs';
import { getLocalIp } from './ip.js';
/** 
 * 
 * ENV проверяется в package.json.
 * 
 * Если .env не будет найден будет использоваться
 * по умолчанию порт 8080
*/
const port = process.env.PORT || 8080;

// проверка докера. если он в докере -> не будет писать некоторые логи
// которые могут сбить с толку
const inContainer = process.env.IN_DOCKER === 'true';

// NOTE: Перенеси контракт /health в Yjs 
// (или что ты выберешь) для проверки CI
// /status как захотишь. Так челики смогут 
// проверять статус сервака не отрывая тебя

createServer((request, response) => {
    if (request.method === 'GET' && request.url === "/health") {
        response.setHeader('Content-Type', 'application/json');
        const data = {
            "ok": true,
            "time": new Date(Date.now()).toISOString()
        }
        response.end(JSON.stringify(data));
        return;
    }
    if (request.method === 'GET' && request.url === "/status") {
        response.setHeader('Content-Type', 'text/html');
        const currentDir = import.meta.dirname;
        const htmlString = readFileSync(`${currentDir}/pages/status.html`).toString();
        response.end(htmlString);
        return;
    }
    if (request.method === 'GET' && request.url === "/") {
        response.setHeader('Content-Type', 'text/plain');
        response.end('The main page');
        return;
    }
    response.end('ping');

    // 0.0.0.0 даёт доступ подключится по LAN
}).listen(port, '0.0.0.0', function () {
    console.log(`server on Local: http://127.0.0.1:${port}`)
    console.log(`To check status: http://127.0.0.1:${port}/status`)

    if (inContainer) {
        console.log(
            `NOTE: local is not available from the host browser when it's in docker. 
            please check 'docker compose logs tunnel' to find url to visit`
        )
    }

    // не спрашивай про !!, я фиг знает. Оно работает и не трогай
    if (!inContainer) {
        const ip = getLocalIp();
        if (ip != null) {
            console.log(`server on LAN: http://${ip}:${port}`)
        } else {
            console.warn('LAN IP is not define. Idk why')
        }
    }
});