import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { BACKEND_URL, API_URL, MQTT_URL } from '../ipConfig';

export default function Register() {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [image, setImage] = useState(null);

    const pickImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log('✅ Image selected:', result);
                const pickedImage = result.assets[0];
                setImage(pickedImage);
            }
        } catch (err) {
            console.error('❌ Error selecting image:', err);
        }
    };

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera permissions to make this work!');
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log('✅ Image captured:', result);
                const capturedImage = result.assets[0];
                setImage(capturedImage);
            }
        } catch (err) {
            console.error('❌ Error capturing image:', err);
        }
    };


    const handleRegister = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/users`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await res.json();
            if (data._id !== undefined) {
                console.log('✅ User registered:', data);

                if (image) {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: image.uri,
                        type: image.mimeType || 'image/jpeg',
                        name: `${username}.jpg`,
                    });

                    console.log('📡 Uploading image to /upload...');
                    const uploadRes = await fetch(`${API_URL}/upload`, {
                        method: 'POST',
                        body: formData,
                    });

                    if (!uploadRes.ok) {
                        setError('Image upload failed');
                        console.error('❌ Image upload failed');
                        return;
                    } else {
                        console.log('✅ Image uploaded successfully');
                    }
                } else {
                    setError('No image selected');
                    return;
                }

                navigation.navigate('Home');
            } else {
                setUsername('');
                setPassword('');
                setEmail('');
                setError('Registration failed');
            }
        } catch (err) {
            console.error('❌ Network error:', err);
            setError('Network error');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
            />
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

            <TouchableOpacity onPress={takePhoto} style={styles.button}>
                <Text style={styles.buttonText}>Take Face Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={pickImage} style={styles.button}>
                <Text style={styles.buttonText}>Select Face Image</Text>
            </TouchableOpacity>

            {image && (
                <Image
                    source={{ uri: image.uri }}
                    style={{ width: 100, height: 100, marginTop: 12, borderRadius: 50 }}
                />
            )}

            <TouchableOpacity onPress={handleRegister} style={styles.button}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>

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
