import React, { useState, useContext, useEffect } from 'react';
import {
    View, Text, TextInput, Button, Image, Alert, StyleSheet, TouchableOpacity
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../userContext';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { BACKEND_URL, API_URL, MQTT_URL } from '../ipConfig';


export default function AddPhotoBase64() {
    const { user } = useContext(UserContext);
    const navigation = useNavigation();

    const [name, setName] = useState('');
    const [sporocilo, setSporocilo] = useState('');
    const [image, setImage] = useState(null);
    const [recording, setRecording] = useState(null);
    const [db, setDb] = useState(null);
    const [location, setLocation] = useState(null);


    useEffect(() => {
        if (!user) {
            navigation.navigate('Login');
        }
    }, [user]);

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission denied", "You need to allow access to your media library.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            base64: true,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setImage({ uri: asset.uri, base64: asset.base64 });
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission denied", "You need to allow camera access.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            base64: true,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setImage({ uri: asset.uri, base64: asset.base64 });
        }
    };

    const handleUpload = async () => {
        if (!name.trim()) {
            Alert.alert("Napaka", "Vnesite ime!");
            return;
        }
        if (!sporocilo.trim()) {
            Alert.alert("Napaka", "Vnesite sporočilo!");
            return;
        }
        if (!image?.base64) {
            Alert.alert("Napaka", "Izberite ali zajemite sliko!");
            return;
        }
        if (db === null) {
            Alert.alert("Opozorilo", "Posnemi zvok, preden naložiš sliko.");
            return;
        }
        let locationToSend = null;

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission denied", "Location permission is required.");
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            locationToSend = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };
        } catch (err) {
            console.error("Location error:", err);
            Alert.alert("Napaka", "Ni bilo mogoče pridobiti lokacije.");
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/photos/base64`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    sporocilo,
                    image: image.base64,
                    db,
                    location: locationToSend
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Upload error:', error);
                throw new Error(error.message || 'Upload failed');
            }

            Alert.alert('Uspešno', 'Slika je bila naložena!', [
                { text: 'OK', onPress: () => navigation.navigate('Home') },
            ]);
        } catch (err) {
            console.error('Upload error:', err);
            Alert.alert('Napaka', err.message || 'Nalaganje ni uspelo.');
        }
    };


    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Permission denied', 'Microphone permission is required.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recordingOptions = {
                android: {
                    extension: '.wav',
                    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
                    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.wav',
                    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                web: {
                    mimeType: 'audio/wav',
                    bitsPerSecond: 128000,
                },
            };

            const { recording } = await Audio.Recording.createAsync(recordingOptions);
            setRecording(recording);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            const base64Audio = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const response = await fetch(`${API_URL}/analyze-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: 'recording.wav', data: base64Audio }),
            });

            const result = await response.json();

            if (response.ok && isFinite(result.db)) {
                setDb(parseFloat(result.db));
                Alert.alert("Ocenjena glasnost", `${result.db} dB`);
            } else {
                setDb(null);
                Alert.alert("Opozorilo", "Napaka pri analizi zvoka.");
            }
        } catch (err) {
            console.error('Failed to process recording', err);
            Alert.alert("Napaka", "Ni bilo mogoče analizirati snemanja.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Ime slike:</Text>
            <TextInput
                style={styles.input}
                placeholder="Ime slike"
                value={name}
                onChangeText={setName}
            />

            <Text style={styles.label}>Sporočilo:</Text>
            <TextInput
                style={styles.input}
                placeholder="Sporočilo"
                value={sporocilo}
                onChangeText={setSporocilo}
            />

            <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
                <Text style={styles.imageButtonText}>Izberi sliko iz galerije</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={takePhoto} style={[styles.imageButton, { backgroundColor: '#28a745' }]}>
                <Text style={styles.imageButtonText}>Posnemi sliko s kamero</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={recording ? stopRecording : startRecording}
                style={[styles.imageButton, { backgroundColor: '#6c757d' }]}
            >
                <Text style={styles.imageButtonText}>
                    {recording ? 'Ustavi snemanje' : 'Snemaj in oceni glasnost'}
                </Text>
            </TouchableOpacity>

            {db !== null && (
                <Text style={{ marginTop: 10, fontWeight: 'bold', fontSize: 16 }}>
                    Ocenjena glasnost: {db} dB
                </Text>
            )}

            {image?.uri && (
                <Image source={{ uri: image.uri }} style={styles.preview} />
            )}

            <Button title="Naloži" onPress={handleUpload} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    label: { fontWeight: 'bold', marginTop: 10 },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 8,
        marginBottom: 10,
        borderRadius: 5,
    },
    imageButton: {
        backgroundColor: '#007bff',
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
    },
    imageButtonText: {
        color: '#fff',
        textAlign: 'center',
    },
    preview: {
        width: '100%',
        height: 200,
        marginBottom: 10,
        borderRadius: 5,
    },
});
