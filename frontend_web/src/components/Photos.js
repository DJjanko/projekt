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
                const res = await fetch(`http://${LOCAL_IP}:3001/photos`);
                const data = await res.json();
                setPhotos(data);
            } catch (err) {
                console.error('❌ Failed to load photos:', err);
            }
        };

        fetchPhotos();


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
