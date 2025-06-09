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
import { BACKEND_URL, API_URL, MQTT_URL } from '../ipConfig';

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

    const serverUrl = `${BACKEND_URL}`; // ⬅️ Your local IP

    // === MQTT useEffect ===
    useEffect(() => {
        if (user && user.username) {
            console.log('✅ Photos.js: Connecting MQTT for user:', user.username);

            const client = mqtt.connect(`${MQTT_URL}`);
            mqttClient.current = client;

            client.on('connect', () => {
                console.log('✅ Photos.js MQTT connected');
                const challengeTopic = `login_challenge/${user.username}`;
                client.subscribe(challengeTopic);
                console.log(`📡 Photos.js subscribed to ${challengeTopic}`);
            });

            client.on('message', async (topic, message) => {
                console.log(`Photos.js received:`, topic, message);

                if (topic === `login_challenge/${user.username}` && message.toString() === 'please_scan_face') {
                    console.log('➡️ Redirecting to 2FA screen');
                    navigation.navigate('2FA');
                    // DO NOT send POST /login here!
                    // DO NOT publish login_response here!
                }
            });

            client.on('error', (err) => {
                console.error('❌ Photos.js MQTT error:', err);
            });

            return () => {
                if (client) {
                    console.log('🔌 Photos.js disconnecting MQTT');
                    client.end();
                }
            };
        }
    }, [user]);

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
