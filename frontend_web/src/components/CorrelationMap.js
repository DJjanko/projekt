import React from 'react';
import { Rectangle, Popup } from 'react-leaflet';

function CorrelationMap({ photos, speedLimits }) {
    const gridSize = 0.1; // ~10km grid

    const bins = {};

    const getKey = (lat, lon) => {
        const latKey = Math.floor(lat / gridSize) * gridSize;
        const lonKey = Math.floor(lon / gridSize) * gridSize;
        return `${latKey},${lonKey}`;
    };

    photos.forEach(photo => {
        const key = getKey(photo.location.latitude, photo.location.longitude);
        if (!bins[key]) bins[key] = { db: [], speed: [] };
        bins[key].db.push(parseFloat(photo.db));
    });

    speedLimits.forEach(limit => {
        const key = getKey(limit.latitude, limit.longitude);
        if (!bins[key]) bins[key] = { db: [], speed: [] };
        bins[key].speed.push(limit.speedLimit);
    });

    return (
        <>
            {Object.entries(bins).map(([key, values]) => {
                const [latKey, lonKey] = key.split(',').map(Number);
                const avgDB = values.db.length > 0 ? values.db.reduce((a, b) => a + b, 0) / values.db.length : 0;
                const avgSpeed = values.speed.length > 0 ? values.speed.reduce((a, b) => a + b, 0) / values.speed.length : 0;

                let color = 'gray';
                if (avgDB >= 50 && avgSpeed >= 50) color = 'red';
                else if (avgDB >= 40 || avgSpeed >= 40) color = 'orange';
                else color = 'green';

                return (
                    <Rectangle
                        key={key}
                        bounds={[
                            [latKey, lonKey],
                            [latKey + gridSize, lonKey + gridSize]
                        ]}
                        pathOptions={{ color, weight: 1, fillOpacity: 0.4 }}
                    >
                        <Popup>
                            Avg Speed: {avgSpeed.toFixed(1)} km/h<br />
                            Avg dB: {avgDB.toFixed(1)}
                        </Popup>
                    </Rectangle>
                );
            })}
        </>
    );
}

export default CorrelationMap;
