import axios from "axios";

const axiosClient = axios.create({
    baseURL: "https://leeforces-finalized-project.onrender.com",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// Add request interceptor for debugging
axiosClient.interceptors.request.use(
    (config) => {
        console.log("Request:", config.method.toUpperCase(), config.url);
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for debugging
axiosClient.interceptors.response.use(
    (response) => {
        console.log("Response:", response.status, response.data);
        return response;
    },
    (error) => {
        console.error("Error:", error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

export default axiosClient;
