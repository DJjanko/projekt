import React, { useContext, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Menu, IconButton, Provider as PaperProvider } from 'react-native-paper';

import Register from './components/Register';
import Login from './components/Login';
import Logout from './components/Logout';
import Profile from './components/Profile';
import AddPhoto from './components/Addphoto';
import Photos from './components/Photos';
import Comment from './components/Comment';
import Map from './components/Map';
import TwoFA from './components/2fa';

import { UserProvider, UserContext } from './userContext';

const Stack = createNativeStackNavigator();

// Move Paper Provider here to wrap the whole app once
export default function App() {

    return (
        <PaperProvider>
            <UserProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="Home">
                        <Stack.Screen
                            name="Home"
                            component={Photos}
                            options={({ navigation }) => ({
                                title: 'Photos',
                                headerRight: () => <HeaderButtons navigation={navigation} />,
                                headerStyle: { backgroundColor: '#25292e' },
                                headerTitleStyle: { color: '#ffffff' },
                            })}
                        />
                        <Stack.Screen name="Register" component={Register} />
                        <Stack.Screen name="Login" component={Login} />
                        <Stack.Screen name="Logout" component={Logout} />
                        <Stack.Screen name="AddPhoto" component={AddPhoto} />
                        <Stack.Screen name="Profile" component={Profile} />
                        <Stack.Screen name="Comment" component={Comment} />
                        <Stack.Screen name="Map" component={Map} />
                        <Stack.Screen
                            name="2FA"
                            component={TwoFA}
                            options={{
                                presentation: 'modal',
                                headerShown: false,
                            }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </UserProvider>
        </PaperProvider>
    );
}

function HeaderButtons({ navigation }) {
    const { user } = useContext(UserContext);
    const [visible, setVisible] = useState(false);

    return (
        <View style={{ flexDirection: 'row', marginRight: 8 }}>
            <Menu
                visible={visible}
                onDismiss={() => setVisible(false)}
                anchor={
                    <IconButton
                        icon="account-circle"
                        color="#ffffff"
                        size={28}
                        onPress={() => setVisible(true)}
                        style={{
                            backgroundColor: '#00d9ff',
                            borderRadius: 20,
                            elevation: 3,
                            marginTop: 5,
                        }}
                    />
                }
                contentStyle={{
                    backgroundColor: '#2c2c2e',
                    borderRadius: 8,
                    paddingVertical: 2,
                }}
            >
                {user ? (
                    <>
                        <Menu.Item
                            onPress={() => { setVisible(false); navigation.navigate('Profile'); }}
                            title="👤 Profile"
                            titleStyle={{ color: 'white' }}
                        />
                        <Menu.Item
                            onPress={() => { setVisible(false); navigation.navigate('AddPhoto'); }}
                            title="📸 Add Location"
                            titleStyle={{ color: 'white' }}
                        />
                        <Menu.Item
                            onPress={() => { setVisible(false); navigation.navigate('Map'); }}
                            title="🗺️ Map"
                            titleStyle={{ color: 'white' }}
                        />
                        <Menu.Item
                            onPress={() => { setVisible(false); navigation.navigate('Logout'); }}
                            title="🚪 Logout"
                            titleStyle={{ color: 'white' }}
                        />
                    </>
                ) : (
                    <>
                        <Menu.Item
                            onPress={() => { setVisible(false); navigation.navigate('Login'); }}
                            title="🔐 Login"
                            titleStyle={{ color: 'white' }}
                        />
                        <Menu.Item
                            onPress={() => { setVisible(false); navigation.navigate('Register'); }}
                            title="📝 Register"
                            titleStyle={{ color: 'white' }}
                        />
                    </>
                )}
            </Menu>
        </View>
    );
}

