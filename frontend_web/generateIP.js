const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const blacklist = ['VMware', 'VirtualBox', 'vEthernet', 'Docker'];

    for (const name in interfaces) {
        if (blacklist.some(v => name.includes(v))) {
            continue;
        }

        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const ip = getLocalIP();
const content = `export const LOCAL_IP = "${ip}";\n`;

// ⬇ This ensures ipConfig.js goes into src folder relative to where you run generateIP.js
const filePath = path.join(__dirname, 'src', 'ipConfig.js');
fs.writeFileSync(filePath, content);

console.log(`Generated ${filePath} with IP: ${ip}`);
