import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../userContext';
import * as ImagePicker from 'expo-image-picker';
import mqtt from 'mqtt';
import { Buffer } from 'buffer';
import { BACKEND_URL, API_URL, MQTT_URL } from '../ipConfig';
global.Buffer = global.Buffer || Buffer;

export default function Login() {
    const navigation = useNavigation();
    const { user, setUserContext } = useContext(UserContext);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [image, setImage] = useState(null);

    const mqttClient = useRef(null);

    const handleLogin = async () => {
        try {
            if (!image) {
                setError('Please take or select a face image first');
                return;
            }

            const res = await fetch(`${BACKEND_URL}/users/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (data._id !== undefined) {
                console.log('✅ Username/password correct:', data);

                console.log('📸 Uploading face image to /login...');
                const formData = new FormData();
                formData.append('file', {
                    uri: image.uri,
                    type: image.mimeType || 'image/jpeg',
                    name: `${username}.jpg`,
                });

                const faceRes = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    body: formData,
                });

                if (faceRes.ok) {
                    console.log('✅ Face verified OK');
                    setUserContext(data);
                    navigation.navigate('Home');
                } else {
                    console.log('❌ Face verification failed');
                    setError('Face verification failed');
                }
            } else {
                setUsername('');
                setPassword('');
                setError('Invalid username or password');
            }
        } catch (err) {
            console.error('❌ Network error:', err);
            setError('Network error');
        }
    };

    const pickImageForVerification = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log('✅ Face image selected:', result);
                const pickedImage = result.assets[0];
                setImage(pickedImage);
            }
        } catch (err) {
            console.error('❌ Error selecting image:', err);
        }
    };

    const takePhotoForVerification = async () => {
        try {
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log('✅ Face image captured with camera:', result);
                const capturedImage = result.assets[0];
                setImage(capturedImage);
            }
        } catch (err) {
            console.error('❌ Error capturing image:', err);
        }
    };


    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />
            <TouchableOpacity onPress={handleLogin} style={styles.button}>
                <Text style={styles.buttonText}>Log in</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={takePhotoForVerification} style={styles.button}>
                <Text style={styles.buttonText}>Take Face Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={pickImageForVerification} style={styles.button}>
                <Text style={styles.buttonText}>Select Face Image</Text>
            </TouchableOpacity>

            {image && (
                <Image
                    source={{ uri: image.uri }}
                    style={{ width: 100, height: 100, marginTop: 12, borderRadius: 50 }}
                />
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#25292e',
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
    },
    button: {
        backgroundColor: '#00aaff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginTop: 12,
        textAlign: 'center',
    },
});
