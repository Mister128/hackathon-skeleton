import os from 'os';

// если спросишь зачем. Просто чтобы лог был более динамичный
// если удалишь, не расстроюсь
// P.S. если у тебя есть какой-то адаптер, может и врать иногда
export function getLocalIps() {
    const interfaces = os.networkInterfaces();

    // Ключевые слова, которые часто используют виртуальные адаптеры
    const virtualKeywords = ['virtual', 'vbox', 'docker', 'wsl', 'veth', 'vmware', 'vnic'];
    const results = [];

    for (const name of Object.keys(interfaces)) {
        const isVirtual = virtualKeywords.some(keyword => name.toLowerCase().includes(keyword));
        if (isVirtual) continue; // Пропускаем виртуальные адаптеры

        for (const iface of interfaces[name]) {
            // Берем только IPv4 и исключаем внутренние (loopback 127.0.0.1)
            if (iface.family === 'IPv4' && !iface.internal) {
                results.push({
                    interfaceName: name, // Имя адаптера (например, 'Ethernet' или 'Wi-Fi')
                    ip: iface.address
                });
            }
        }
    }
    
    return results;
}