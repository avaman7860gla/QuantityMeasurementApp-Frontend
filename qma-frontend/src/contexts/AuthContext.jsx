import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("[AuthContext] App Load - Decoded JWT Payload:", decoded);


        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          logout();
        }
        else {
          setUser({
            username: decoded.name || decoded.given_name || decoded.preferred_username || decoded.user_name || decoded.username || decoded.email || decoded.sub
          });
        }
      }
      catch (e) {
        logout();
      }
    }

    setLoading(false);
  }, []);


  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    console.log("[AuthContext] Login - Decoded JWT Payload:", decoded);

    setUser({
      username: decoded.name || decoded.given_name || decoded.preferred_username || decoded.user_name || decoded.username || decoded.email || decoded.sub
    });
  };


  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};