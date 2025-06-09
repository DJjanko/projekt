const fs = require('fs');
const http = require('http');



function fetchTunnels(callback) {
    http.get('http://127.0.0.1:4043/api/tunnels', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => callback(null, JSON.parse(data)));
    }).on('error', (err) => callback(err));
}

function tryFetchWithRetry(retries = 10, delay = 1000) {
    fetchTunnels((err, tunnelsData) => {
        if (err) {
            if (retries > 0) {
                console.log(`Waiting for ngrok... (${retries} retries left)`);
                setTimeout(() => tryFetchWithRetry(retries - 1, delay), delay);
            } else {
                console.error('Error fetching tunnels after retries:', err);
                process.exit(1);
            }
            return;
        }

        let backendURL = '';
        let apiURL = '';
        let mqttURL = '';

        tunnelsData.tunnels.forEach(tunnel => {
            const addr = tunnel.config.addr;
            if (addr === 'http://localhost:3001') {
                backendURL = tunnel.public_url;
            } else if (addr === 'http://localhost:5000') {
                apiURL = tunnel.public_url;
            } else if (addr === 'http://localhost:9001') {
                mqttURL = tunnel.public_url.replace('https', 'wss'); // MQTT must be wss
            }
        });

        if (!backendURL || !apiURL || !mqttURL) {
            console.error('Could not detect all required tunnels. Exiting.');
            process.exit(1);
        }

        const content = `
export const BACKEND_URL = '${backendURL}';
export const API_URL = '${apiURL}';
export const MQTT_URL = '${mqttURL}';
`;

        fs.writeFileSync('ipConfig.js', content.trim() + '\n');
        console.log('Generated ipConfig.js');
    });
}

tryFetchWithRetry();

