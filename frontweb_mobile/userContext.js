import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUserContext] = useState(null);
    return (
        <UserContext.Provider value={{ user, setUserContext }}>
            {children}
        </UserContext.Provider>
    );
};
