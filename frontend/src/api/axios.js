import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    console.log("TOKEN FROM LOCAL STORAGE:", token);
    console.log("REQUEST URL:", config.url);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("AUTH HEADER:", config.headers.Authorization);

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (originalRequest.url.includes('/refresh')) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const response = await axios.post(
                    'http://localhost:3000/api/refresh',
                    {},
                    { withCredentials: true }
                )

                console.log("REFRESH RESPONSE:", response.data)

                const newAccessToken = response.data.access
                const newUser = response.data.user

                if (!newAccessToken) {
                    throw new Error(
                        "Refresh endpoint did not return an access token"
                    )
                }

                if (newUser) {
                    localStorage.setItem('user', JSON.stringify(newUser))
                }

                localStorage.setItem('token', newAccessToken)

                originalRequest.headers =
                    originalRequest.headers || {}

                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`

                return api(originalRequest)

            } catch (refreshError) {
                console.error("Refresh failed:", refreshError)

                localStorage.removeItem('token')
                window.location.href = '/login'

                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api;