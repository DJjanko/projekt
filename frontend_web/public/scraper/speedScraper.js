const axios = require('axios');

const overpassURL = 'https://overpass-api.de/api/interpreter';
const query = `
[out:json];
area["name"="Slovenija"]->.searchArea;
way["maxspeed"](area.searchArea);
out body;
>;
out skel qt;
`;

async function getSpeedLimits() {
    const response = await axios.post(overpassURL, query, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;

    /*data.elements.forEach((element) => {
        console.log(JSON.stringify(element, null, 2));
    });*/

    // Build node map for quick lookup
    const nodeMap = {};
    data.elements.forEach(el => {
        if (el.type === 'node') {
            nodeMap[el.id] = { lat: el.lat, lon: el.lon };
        }
    });

// Build list of extracted ways
    const ways = [];

    data.elements.forEach(el => {
        if (el.type === 'way') {
            const tags = el.tags || {};
            const maxspeed = tags.maxspeed || null;

            const firstNodeId = el.nodes[0];
            const coord = nodeMap[firstNodeId]; // simplify: first node as approx location

            if (coord && maxspeed) {
                ways.push({
                    id: el.id,
                    latitude: coord.lat,
                    longitude: coord.lon,
                    speedLimit: parseInt(maxspeed)
                });
            }
        }
    });

    const responseBackend = await axios.post('http://localhost:3001/speed/postMany', ways);
    console.log('✅ Data sent to backend successfully.');
    console.log('Response from backend:', responseBackend.data);

}

getSpeedLimits();