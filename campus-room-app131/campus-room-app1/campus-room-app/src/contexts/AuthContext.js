import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

// Create auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in via localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authAPI.login(email, password, rememberMe);
      const userData = response.data;
      
      if (userData.success !== false) {
        // Store token and user info
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify({
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role.toLowerCase()
        }));
        
        setCurrentUser({
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role.toLowerCase()
        });
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: userData.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to log in' 
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const data = response.data;
      
      return { 
        success: data.success !== false, 
        message: data.message 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create an account' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // Request password reset function (forgot password)
  const resetPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      const data = response.data;
      
      return { 
        success: data.success !== false, 
        message: data.message 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to reset password' 
      };
    }
  };

  // Reset password with token function
  const resetPasswordWithToken = async (token, password, confirmPassword) => {
    try {
      const response = await authAPI.resetPassword(token, password, confirmPassword);
      const data = response.data;
      
      return { 
        success: data.success !== false, 
        message: data.message 
      };
    } catch (error) {
      console.error('Password reset with token error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to reset password' 
      };
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    resetPassword,
    resetPasswordWithToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;