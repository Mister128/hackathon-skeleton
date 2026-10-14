import { createServer } from 'http';
import { readFileSync } from 'fs';

const port = process.env.PORT;

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
    if (request.method === 'GET' && request.url === "/") {
        response.setHeader('Content-Type', 'text/html');
        const currentDir = import.meta.dirname;
        const htmlString = readFileSync(`${currentDir}/pages/index.html`).toString();
        response.end(htmlString);
        return;
    }
    response.end('ping');

}).listen(port, '0.0.0.0', function () {
    console.log(`server on Local: http://127.0.0.1:${port}`)
    console.log(`server on LAN: http://<ipv4>:${port}`)
});