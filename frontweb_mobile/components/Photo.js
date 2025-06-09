import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_URL, API_URL, MQTT_URL } from '../ipConfig';

export default function Photo({ photo }) {
    const navigation = useNavigation();

    const handlePress = () => {
        navigation.navigate('Comment', { photoId: photo._id });
    };

    const imageUrl = `${BACKEND_URL}${photo.path}`;

    return (
        <TouchableOpacity onPress={handlePress} style={styles.card}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.title}>{photo.name}</Text>
                <Text>Description: {photo.sporocilo}</Text>
                <Text>Author: {photo.postedBy?.username || 'Unknown'}</Text>
                <Text>Posted: {new Date(photo.date).toLocaleString()}</Text>
                <Text style={styles.db}>🔊 Glasnost: {photo.db ?? 'ni znano'} dB</Text>
                <Text style={styles.location}>
                    📍 Lokacija: {photo.location?.latitude?.toFixed(5) ?? 'neznano'}, {photo.location?.longitude?.toFixed(5) ?? ''}
                </Text>

            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 200,
    },
    info: {
        padding: 10,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    likes: {
        marginTop: 5,
        fontWeight: 'bold',
        color: '#e91e63',
    },
    location: {
        latitude: Number,
        longitude: Number
    },
});
