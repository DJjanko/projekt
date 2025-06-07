import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserContext } from "./userContext";
import Header from "./components/Header";
import Photos from "./components/Photos";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import Logout from "./components/Logout";
import AddPhoto from "./components/AddPhoto";
import Comment from "./components/Comment";
import MapView from "./components/MapView";

function App() {
    /**
     * Podatek o tem, ali je uporabnik prijavljen ali ne, bomo potrebovali v vseh komponentah.
     * State je dosegljiv samo znotraj trenutne komponente. Če želimo deliti spremenljivke z
     * ostalimi komponentami, moramo uporabiti Context.
     * Vsebino Contexta smo definirali v datoteki userContext.js. Poleg objekta 'user', potrebujemo
     * še funkcijo, ki bo omogočala posodabljanje te vrednosti. To funkcijo definiramo v komponenti App
     * (updateUserData). V render metodi pripravimo UserContext.Provider, naš Context je potem dosegljiv
     * v vseh komponentah, ki se nahajajo znotraj tega providerja.
     * V komponenti Login ob uspešni prijavi nastavimo userContext na objekt s trenutno prijavljenim uporabnikom.
     * Ostale komponente (npr. Header) lahko uporabijo UserContext.Consumer, da dostopajo do prijavljenega
     * uporabnika.
     * Context se osveži, vsakič ko osvežimo aplikacijo v brskalniku. Da preprečimo neželeno odjavo uporabnika,
     * lahko context trajno hranimo v localStorage v brskalniku.
     */
    const [user, setUser] = useState(localStorage.user ? JSON.parse(localStorage.user) : null);
    const updateUserData = (userInfo) => {
        localStorage.setItem("user", JSON.stringify(userInfo));
        setUser(userInfo);
    }

    const backgroundStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/background.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
    };

    return (
        <BrowserRouter>
            <UserContext.Provider value={{
                user: user,
                setUserContext: updateUserData
            }}>
                {/* Background layer */}
                <div style={backgroundStyle}></div>

                {/* Foreground content */}
                <div className="App" style={{ position: 'relative', zIndex: 1 }}>
                    <Header title="Projekt" />
                    <Routes>
                        <Route path="/" exact element={<Photos />} />
                        <Route path="/login" exact element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/comment/:photoID" element={<Comment />} />
                        <Route path="/mapview" element={<MapView />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/logout" element={<Logout />} />
                    </Routes>
                </div>
            </UserContext.Provider>
        </BrowserRouter>
    );
}

export default App;
