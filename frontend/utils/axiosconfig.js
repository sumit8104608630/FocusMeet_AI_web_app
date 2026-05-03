import axios from 'axios';

const axiosInstance=axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || "https://focusmeet-ai-web-app.onrender.com",
    withCredentials:true,
    headers:{
        'Content-Type':'application/json'
    }
})

export default axiosInstance;
