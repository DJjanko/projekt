import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, TextInput, Button, Image,
    ScrollView, Alert, StyleSheet, TouchableOpacity
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { UserContext } from '../userContext';
import MapView, { Marker } from 'react-native-maps';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import mqtt from 'mqtt';
import { Buffer } from 'buffer';
import { LOCAL_IP } from '../ipConfig.js';
global.Buffer = global.Buffer || Buffer;

export default function Comment() {
    const { user } = useContext(UserContext);
    const route = useRoute();
    const navigation = useNavigation();
    const { photoId } = route.params;

    const [photo, setPhoto] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [recordingActive, setRecordingActive] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    let [mqttClient, setMqttClient] = useState(null);


    const serverUrl = `http://${LOCAL_IP}:3001`;

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const photoRes = await fetch(`${serverUrl}/photos/${photoId}`);
                const photoData = await photoRes.json();
                if (isMounted) setPhoto(photoData);

                const commentsRes = await fetch(`${serverUrl}/photos/${photoId}/comments`);
                const commentsData = await commentsRes.json();

                const commentsArray = Array.isArray(commentsData) ? commentsData : [];
                const commentsWithUsers = await Promise.all(commentsArray.map(async (comment) => {
                    const userRes = await fetch(`${serverUrl}/users/${comment.postedBy}`);
                    const userData = await userRes.json();
                    return { ...comment, username: userData.username };
                }));

                if (isMounted) setComments(commentsWithUsers);
            } catch (err) {
                console.error('Error loading photo or comments:', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5 seconds

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [photoId]);


    useFocusEffect(
        React.useCallback(() => {
            return () => {
                stopLiveUpdates();
            };
        }, [intervalId])
    );

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;
        try {
            const res = await fetch(`${serverUrl}/photos/${photoId}/createComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ text: commentText }),
            });

            if (!res.ok) throw new Error('Failed to submit comment');

            setCommentText('');
            const updatedRes = await fetch(`${serverUrl}/photos/${photoId}/comments`);
            const updatedComments = await updatedRes.json();

            const commentsArray = Array.isArray(updatedComments) ? updatedComments : [];
            const commentsWithUsers = await Promise.all(commentsArray.map(async (comment) => {
                const userRes = await fetch(`${serverUrl}/users/${comment.postedBy}`);
                const userData = await userRes.json();
                return { ...comment, username: userData.username };
            }));

            setComments(commentsWithUsers);
        } catch (err) {
            console.error('Comment error:', err);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`${serverUrl}/photos/${photoId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');

            Alert.alert('Deleted', 'Photo was deleted', [
                {
                    text: 'OK',
                    onPress: () => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                    },
                },
            ]);
        } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Failed to delete photo');
        }
    };



    if (!photo) return <Text style={{ padding: 20 }}>Loading...</Text>;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{photo.name}</Text>
            <Image source={{ uri: `${serverUrl}${photo.path}` }} style={styles.image} />
            <Text style={styles.desc}>{photo.sporocilo}</Text>
            {photo.db !== undefined && (
                <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
                    Glasnost: {photo.db.toFixed(1)} dB
                </Text>
            )}

            {photo.location?.latitude && photo.location?.longitude && (
                <Text style={{ marginBottom: 10 }}>
                    Lokacija: {photo.location.latitude.toFixed(5)}, {photo.location.longitude.toFixed(5)}
                </Text>
            )}

            {user && user.id === photo.postedBy.id && (
                <Button title="Delete Photo" color="#ff4444" onPress={handleDelete} />
            )}

            <View style={styles.commentSection}>
                <Text style={styles.commentTitle}>Comments:</Text>
                {comments.length === 0 ? (
                    <Text>No comments yet.</Text>
                ) : (
                    comments.map((comment, index) => (
                        <View key={index} style={styles.commentBox}>
                            <Text style={styles.commentUser}>{comment.username}</Text>
                            <Text>{comment.text}</Text>
                            <Text style={styles.commentDate}>{new Date(comment.date).toLocaleString()}</Text>
                        </View>
                    ))
                )}
            </View>

            {user && (
                <View style={styles.inputBox}>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a comment..."
                        value={commentText}
                        onChangeText={setCommentText}
                    />
                    <Button title="Submit" onPress={handleCommentSubmit} />
                </View>
            )}

            <View style={{ marginTop: 20 }}>
                <Button
                    title={recordingActive ? "Ustavi spremljanje glasnosti" : "Začni spremljanje glasnosti"}
                    color={recordingActive ? "#dc3545" : "#007bff"}
                    onPress={recordingActive ? stopLiveUpdates : startLiveUpdates}
                />
            </View>

            {photo.location?.latitude && photo.location?.longitude && (
                <View style={{ marginTop: 20, height: 300, borderRadius: 10, overflow: 'hidden' }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Lokacija zajema:</Text>
                    <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: photo.location.latitude,
                            longitude: photo.location.longitude,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        }}
                    >
                        <Marker
                            coordinate={{
                                latitude: photo.location.latitude,
                                longitude: photo.location.longitude,
                            }}
                            pinColor={getMarkerColor(photo.db)}
                            title={photo.name}
                            description={`Glasnost: ${photo.db ?? '?'} dB`}
                        />
                    </MapView>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 15 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
    image: {
        width: '100%',
        height: 400,
        borderRadius: 10,
        marginBottom: 10,
        resizeMode: 'cover',
    },
    desc: { fontStyle: 'italic', marginBottom: 10 },
    commentSection: { marginTop: 20 },
    commentTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    commentBox: { marginBottom: 10, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 },
    commentUser: { fontWeight: 'bold' },
    commentDate: { fontSize: 12, color: '#555' },
    inputBox: { marginTop: 20 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginBottom: 10,
        borderRadius: 5,
    },
});