import React, { useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../userContext';
import * as ImagePicker from 'expo-image-picker';
import mqtt from 'mqtt';
import { Buffer } from 'buffer';
import { LOCAL_IP } from '../ipConfig.js';
global.Buffer = global.Buffer || Buffer;

export default function TwoFA() {
    const navigation = useNavigation();
    const { user } = useContext(UserContext);
    const mqttClient = React.useRef(null);

    useEffect(() => {
        if (user && user.username) {
            console.log('✅ 2FA.js Connecting MQTT for user:', user.username);

            const client = mqtt.connect(`ws://${LOCAL_IP}:9001`);
            mqttClient.current = client;

            client.on('connect', () => {
                console.log('✅ 2FA.js MQTT connected');
            });

            client.on('error', (err) => {
                console.error('❌ 2FA.js MQTT error:', err);
            });

            return () => {
                if (client) {
                    console.log('🔌 2FA.js disconnecting MQTT');
                    client.end();
                }
            };
        }
    }, [user]);

    const handleFaceVerification = async (source = 'gallery') => {
        try {
            let result;

            if (source === 'gallery') {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    quality: 1,
                });
            } else if (source === 'camera') {
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    quality: 1,
                    cameraType: ImagePicker.CameraType.front, // Front camera
                });
            }

            if (result.canceled || !result.assets || result.assets.length === 0) {
                console.log('⚠️ No face image selected → sending fail');
                mqttClient.current.publish(`login_response/${user.username}`, 'fail');
                navigation.navigate('Home');
                return;
            }

            const pickedImage = result.assets[0];
            console.log('✅ Face image selected:', pickedImage.uri);

            const formData = new FormData();
            formData.append('file', {
                uri: pickedImage.uri,
                type: pickedImage.mimeType || 'image/jpeg',
                name: `${user.username}.jpg`,
            });

            const faceRes = await fetch(`http://${LOCAL_IP}:5000/login`, {
                method: 'POST',
                body: formData,
            });

            if (faceRes.ok) {
                console.log('✅ Face verified OK → publishing ok');
                mqttClient.current.publish(`login_response/${user.username}`, 'ok');
            } else {
                console.log('❌ Face verification failed → publishing fail');
                mqttClient.current.publish(`login_response/${user.username}`, 'fail');
            }

            // After sending → go back to Home:
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
        } catch (err) {
            console.error('❌ Error during face verification:', err);
            mqttClient.current.publish(`login_response/${user.username}`, 'fail');
            navigation.navigate('Home');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Face Verification</Text>
            <Text style={styles.subtitle}>Please select or capture your face image to verify login</Text>

            <TouchableOpacity onPress={() => handleFaceVerification('gallery')} style={styles.button}>
                <Text style={styles.buttonText}>Select Face Image</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleFaceVerification('camera')} style={styles.button}>
                <Text style={styles.buttonText}>Take Face Photo (Front Camera)</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#25292e',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#00aaff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        width: '80%',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
