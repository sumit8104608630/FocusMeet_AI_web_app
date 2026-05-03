import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosconfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeMeeting, setActiveMeeting] = useState(null);

    const checkAuth = async () => {
        try {
            const response = await axiosInstance.get('/user/user_info');
            if (response.data.success) {
                setUser(response.data.data);
                
                // Check for active meeting in Redis
                const meetingRes = await axiosInstance.get('/user/active_meeting');
                if (meetingRes.data.success && meetingRes.data.data?.meetingId) {
                    setActiveMeeting(meetingRes.data.data.meetingId);
                } else {
                    setActiveMeeting(null);
                }
            } else {
                setUser(null);
                setActiveMeeting(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            setActiveMeeting(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axiosInstance.post('/user/login', { email, password });
            if (response.data.success) {
                // After successful login, fetch user info and active meeting
                await checkAuth();
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed' 
            };
        }
    };

    const logout = async () => {
        try {
            await axiosInstance.post('/user/logout');
            setUser(null);
            setActiveMeeting(null);
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if the request fails, clear the user state
            setUser(null);
            setActiveMeeting(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, activeMeeting, setActiveMeeting }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
