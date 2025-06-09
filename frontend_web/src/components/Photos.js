import { useState, useEffect, useRef, useContext } from 'react';
import Photo from './Photo';
import mqtt from 'mqtt';
import { UserContext } from '../userContext';
import { LOCAL_IP } from '../ipConfig';

function Photos() {
    const { user } = useContext(UserContext);
    const [photos, setPhotos] = useState([]);
    const mqttClientRef = useRef(null);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const res = await fetch(`http://localhost:3001/photos`);
                const data = await res.json();
                setPhotos(data);
            } catch (err) {
                console.error('❌ Failed to load photos:', err);
            }
        };

        fetchPhotos();

        // 🚫 If user is not logged in → do not connect MQTT
        if (!user) {
            console.log('⚠️ User not logged in → skipping MQTT connection');
            return;
        }

        // ✅ User is logged in → proceed with MQTT
        const client = mqtt.connect(`ws://localhost:9001`);
        const userId = user.username;

        client.on('connect', () => {
            console.log('🟢 MQTT connected');
            client.publish(`presence/${userId}`, 'online', { retain: true });
            client.subscribe('audio/decibel');
        });

        client.on('message', (topic, message) => {
            try {
                const update = JSON.parse(message.toString());
                console.log('📥 MQTT update received:', update);

                setPhotos(prevPhotos =>
                    prevPhotos.map(photo =>
                        photo._id === update.photoId
                            ? { ...photo, db: update.db, location: update.location }
                            : photo
                    )
                );
            } catch (e) {
                console.error('⚠️ Failed to parse MQTT message:', e);
            }
        });

        mqttClientRef.current = client;

        return () => {
            client.publish(`presence/${userId}`, '', { retain: true });
            client.end();
            console.log('🔌 MQTT disconnected');
        };
    }, [user]);

    return (
        <div className="container mt-4">
            <div className="d-flex flex-wrap justify-content-start gap-3">
                {photos.map(photo => (
                    <Photo photo={photo} key={photo._id} />
                ))}
            </div>
        </div>
    );
}

export default Photos;
