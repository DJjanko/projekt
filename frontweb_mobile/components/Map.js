import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { LOCAL_IP } from '../ipConfig.js';
export default function MapScreen() {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const serverUrl = `http://${LOCAL_IP}:3001`;

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const res = await fetch(`${serverUrl}/photos`);
                const data = await res.json();
                setPhotos(data);
            } catch (err) {
                console.error('Error fetching photos:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPhotos();
    }, []);

    const getMarkerColor = (db) => {
        if (db >= -30) return 'red';
        if (db >= -50) return 'orange';
        if (db >= -70) return 'yellow';
        return 'green';
    };

    const groupedLocations = {};
    photos.forEach((photo) => {
        if (!photo.location) return;
        const key = `${photo.location.latitude.toFixed(5)},${photo.location.longitude.toFixed(5)}`;
        if (!groupedLocations[key]) groupedLocations[key] = [];
        groupedLocations[key].push(photo);
    });

    const adjustedPhotos = [];
    Object.values(groupedLocations).forEach((group) => {
        group.forEach((photo, index) => {
            const jitter = index * 0.00005;
            const angle = (index * 45) % 360;
            const rad = angle * (Math.PI / 180);
            const latOffset = Math.sin(rad) * jitter;
            const lngOffset = Math.cos(rad) * jitter;

            adjustedPhotos.push({
                ...photo,
                location: {
                    latitude: photo.location.latitude + latOffset,
                    longitude: photo.location.longitude + lngOffset,
                },
            });
        });
    });

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#00aaff" />
            </View>
        );
    }

    return (
        <MapView
            style={styles.map}
            mapType="none" // 🚨 THIS disables Apple Maps base layer
            initialRegion={{
                latitude: 46.165,
                longitude: 14.947,
                latitudeDelta: 1.5,
                longitudeDelta: 1.5,
            }}
        >
            {/* 🚨 This overlays OpenStreetMap tiles */}
            <UrlTile
                urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
            />

            {adjustedPhotos.map((photo) =>
                    photo.location && (
                        <Marker
                            key={photo._id}
                            coordinate={photo.location}
                            pinColor={getMarkerColor(photo.db)}
                            title={photo.name}
                            description={`${photo.db ?? '?'} dB`}
                        />
                    )
            )}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
