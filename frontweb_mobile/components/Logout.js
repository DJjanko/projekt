import { useEffect, useContext } from 'react';
import { UserContext } from '../userContext';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_URL, API_URL, MQTT_URL } from '../ipConfig';

export default function Logout() {
    const { setUserContext } = useContext(UserContext);
    const navigation = useNavigation();

    useEffect(() => {
        const logout = async () => {
            setUserContext(null);
            try {
                await fetch(`${BACKEND_URL}/users/logout`, {
                    credentials: 'include',
                });
            } catch (err) {
                console.error('Logout failed:', err);
            }
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }], // Replace stack with Login screen
            });
        };

        logout();
    }, []);

    return null; // No UI needed
}
