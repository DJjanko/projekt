import React, { useContext, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator,
    TextInput, Alert, Button
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../userContext';
import { BACKEND_URL, API_URL, MQTT_URL } from '../ipConfig';

export default function Profile() {
    const { user } = useContext(UserContext);
    const navigation = useNavigation();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert("Napaka", "Gesli se ne ujemata.");
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/users/${user._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: profile.username,
                    email: profile.email,
                    password: newPassword
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Sprememba gesla ni uspela.');

            Alert.alert('Uspeh', 'Geslo je bilo uspešno spremenjeno.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            Alert.alert('Napaka', err.message);
        }
    };

    useEffect(() => {
        if (!user) {
            navigation.replace('Login');
            return;
        }

        const loadProfile = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}:3001/users/profile`, {
                    credentials: 'include',
                });
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                console.error('Error loading profile:', err);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    if (!user || loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#00aaff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>User Profile</Text>
            <Text style={styles.info}>Username: {profile?.username}</Text>
            <Text style={styles.info}>Email: {profile?.email}</Text>

            <Text style={styles.label}>Trenutno geslo:</Text>
            <TextInput
                style={styles.input}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
            />

            <Text style={styles.label}>Novo geslo:</Text>
            <TextInput
                style={styles.input}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
            />

            <Text style={styles.label}>Potrdi novo geslo:</Text>
            <TextInput
                style={styles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            <Button title="Spremeni geslo" onPress={handleChangePassword} />
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#25292e',
    },
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#25292e',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 20,
    },
    info: {
        fontSize: 18,
        color: '#ffffff',
        marginBottom: 10,
    },
    label: {
        color: '#fff',
        fontWeight: 'bold',
        marginTop: 15,
    },
    input: {
        backgroundColor: '#fff',
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
    },
});
