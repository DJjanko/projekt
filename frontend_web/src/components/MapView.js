import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CorrelationMap from './CorrelationMap';
import mqtt from 'mqtt';
import { LOCAL_IP } from '../ipConfig';


// Default icon fix for react-leaflet + Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Photo icons
const greenIcon = new L.Icon({
    iconUrl: require('../assets/marker-icon-2x-green.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: require('../assets/marker-icon-2x-red.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Speed icons
const speedIcon30 = new L.Icon({
    iconUrl: require('../assets/speed-30.png'),
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});
const speedIcon50 = new L.Icon({
    iconUrl: require('../assets/speed-50.png'),
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});
const speedIcon70 = new L.Icon({
    iconUrl: require('../assets/speed-70.png'),
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

function getSpeedIcon(speed) {
    if (speed <= 30) return speedIcon30;
    else if (speed <= 50) return speedIcon50;
    else return speedIcon70;
}

// Component for speed markers (no filtering here)
function SpeedLimitMarkers({ speedLimits }) {
    const map = useMap();
    const [zoom, setZoom] = useState(map.getZoom());

    useEffect(() => {
        const handleZoom = debounce(() => {
            setZoom(map.getZoom());
        }, 700); // 300ms delay after zooming stops

        map.on('zoomend', handleZoom);
        return () => {
            map.off('zoomend', handleZoom);
        };
    }, [map]);

    if (zoom < 7) {
        return null;
    }

    return (
        <MarkerClusterGroup
            iconCreateFunction={(cluster) => {
                return L.divIcon({
                    html: `<div style="background-color: rgba(255, 75, 75, 0.8); border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold;">+${cluster.getChildCount()}</div>`,
                    className: '',
                    iconSize: [40, 40]
                });
            }}
        >
            {speedLimits.map((limit) => {
                const position = [limit.latitude, limit.longitude];
                const icon = getSpeedIcon(limit.speedLimit);
                return (
                    <Marker key={`speed-${limit.id}`} position={position} icon={icon}>
                        <Popup>
                            Speed limit: {limit.speedLimit} km/h
                        </Popup>
                    </Marker>
                );
            })}
        </MarkerClusterGroup>
    );
}
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function MapView() {
    const defaultPosition = [46.5547, 15.6459];
    const [userPosition, setUserPosition] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [filteredSpeedLimits, setFilteredSpeedLimits] = useState([]);
    const mqttClientRef = useRef(null);   //MQTT ref

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserPosition([
                        position.coords.latitude,
                        position.coords.longitude
                    ]);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setUserPosition(defaultPosition);
                }
            );
        } else {
            console.log("Geolocation not available");
            setUserPosition(defaultPosition);
        }
    }, []);

    useEffect(() => {
        const getPhotos = async () => {
            try {
                const res = await fetch("http://localhost:3001/photos");
                const data = await res.json();
                setPhotos(data);
            } catch (err) {
                console.error("Error fetching photos:", err);
            }
        };

        const getSpeedLimits = async () => {
            try {
                const res = await fetch("http://localhost:3001/speed");
                const data = await res.json();
                const filtered = data.filter((_, index) => index % 4 === 0);
                setFilteredSpeedLimits(filtered);
            } catch (err) {
                console.error("Error fetching speed limits:", err);
            }
        };

        getPhotos();
        getSpeedLimits();
    }, []);

    useEffect(() => {
        const client = mqtt.connect(`ws://${LOCAL_IP}:9001`);

        client.on('connect', () => {
            console.log('🟢 MQTT connected (MapView)');
            client.subscribe('audio/decibel');
        });

        client.on('message', (topic, message) => {
            try {
                const update = JSON.parse(message.toString());
                console.log('📥 MQTT update received (MapView):', update);

                setPhotos(prevPhotos =>
                    prevPhotos.map(photo =>
                        photo._id === update.photoId
                            ? { ...photo, db: update.db, location: update.location }
                            : photo
                    )
                );
            } catch (e) {
                console.error('⚠️ Failed to parse MQTT message (MapView):', e);
            }
        });

        mqttClientRef.current = client;

        return () => {
            client.end();
            console.log('🔌 MQTT disconnected (MapView)');
        };
    }, []);

    return (
        <div className="container mt-5 text-white">
            <h2 className="text-center">Map View - User Location & Photos & Speed Limits</h2>
            <div style={{height: '500px', width: '100%'}}>
                <MapContainer center={userPosition || defaultPosition} zoom={7} style={{height: '100%', width: '100%'}}>
                    <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={userPosition || defaultPosition}>
                        <Popup>
                            {userPosition ? "You are here!" : "Default location: Maribor"}
                        </Popup>
                    </Marker>

                    {photos.map((photo) => {
                        const position = [
                            photo.location.latitude,
                            photo.location.longitude
                        ];
                        const dbValue = parseFloat(photo.db);
                        const icon = dbValue >= -30 ? redIcon : greenIcon;

                        return (
                            <Marker key={photo.id} position={position} icon={icon}>
                                <Popup>
                                    name: {photo.name}<br/>
                                    db: {photo.db}
                                </Popup>
                            </Marker>
                        );
                    })}

                    <SpeedLimitMarkers speedLimits={filteredSpeedLimits}/>
                </MapContainer>

                <h2 className="text-center">Correlation Map</h2>
                <div style={{height: '400px', width: '100%', marginTop: '30px'}}>
                    <MapContainer center={userPosition || defaultPosition} zoom={7} style={{height: '100%', width: '100%'}}>
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <CorrelationMap photos={photos} speedLimits={filteredSpeedLimits}/>
                    </MapContainer>
                    {/* Legend etc */}
                </div>

                <div className="container mt-5 text-white" style={{paddingBottom: '200px'}}></div>

            </div>
        </div>
    );
}

export default MapView;
