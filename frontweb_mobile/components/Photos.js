import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Photo from './Photo';
import { LOCAL_IP } from '../ipConfig.js';

import mqtt from 'mqtt';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import { UserContext } from '../userContext';
import { useNavigation } from '@react-navigation/native';

export default function Photos() {
    const { user } = useContext(UserContext);
    const mqttClient = useRef(null);

    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    const serverUrl = `http://${LOCAL_IP}:3001`; // ⬅️ Your local IP


    // === Photos loading logic ===
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            setLoading(true);

            const fetchPhotos = async () => {
                try {
                    const res = await fetch(`${serverUrl}/photos`, {
                        credentials: 'include',
                    });
                    const data = await res.json();
                    if (isActive) {
                        setPhotos(data);
                    }
                } catch (error) {
                    console.error('Error fetching photos:', error);
                } finally {
                    if (isActive) {
                        setLoading(false);
                    }
                }
            };

            fetchPhotos();

            return () => {
                isActive = false;
            };
        }, [])
    );

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Photos</Text>

            {photos.length === 0 ? (
                <Text style={styles.noPhotos}>No photos available.</Text>
            ) : (
                <FlatList
                    data={photos}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <Photo photo={item} />}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noPhotos: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
        color: '#888',
    },
});
