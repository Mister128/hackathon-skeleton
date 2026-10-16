import os from 'os';

// если спросишь зачем. Просто чтобы лог был более динамичный
// если удалишь, не расстроюсь
// P.S. если у тебя есть какой-то адаптер, может и врать иногда
export function getLocalIp() {
    const interfaces = os.networkInterfaces();

    // Ключевые слова, которые часто используют виртуальные адаптеры
    const virtualKeywords = ['virtual', 'vbox', 'docker', 'wsl', 'vpn', 'veth'];

    for (const name of Object.keys(interfaces)) {
        const isVirtual = virtualKeywords.some(keyword => name.toLowerCase().includes(keyword));
        if (isVirtual) continue; // Пропускаем этот адаптер

        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' 
                && !iface.internal 
                && iface.address.includes('192.168.') // вроде как обычно именно так всегда надрес начинается
            ) {
                return iface.address; // Возвращаем первый реальный физический IP (Wi-Fi или Ethernet)
            }
        }
    }
    return null;
}