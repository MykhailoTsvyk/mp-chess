import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true
});

// gets a new access token using the refreshToken cookie and stores it;
// used by the 401 interceptor below and by the socket when its session is rejected
export async function refreshSession() {
    const response = await axios.post(
        'http://localhost:3000/api/refresh',
        {},
        { withCredentials: true }
    )

    const {access, user} = response.data

    if (!access) {
        throw new Error("Refresh endpoint did not return an access token")
    }

    if (user) {
        localStorage.setItem('user', JSON.stringify(user))
    }

    localStorage.setItem('token', access)

    return {access, user}
}

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

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
                const {access: newAccessToken} = await refreshSession()

                originalRequest.headers =
                    originalRequest.headers || {}

                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`

                return api(originalRequest)

            } catch (refreshError) {
                console.error("Refresh failed:", refreshError)

                localStorage.removeItem('token')
                window.location.href = '/authentication'

                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api;