const dgram = require('dgram');
const fs = require('fs');
console.log("generate")
function getCurrentIPAddress() {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        socket.connect(80, '8.8.8.8', () => {
            const address = socket.address();
            socket.close();
            resolve(address.address);
        });
        socket.on('error', (err) => {
            reject(err);
        });
    });
}

(async () => {
    try {
        const ip = await getCurrentIPAddress();
        console.log(`Your IPv4 Address is: ${ip}`);
        fs.writeFileSync('ipConfig.js', `export const LOCAL_IP = '${ip}';\n`);
    } catch (err) {
        console.error('Error getting IP address:', err);
    }
})();
