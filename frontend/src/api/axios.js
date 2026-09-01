import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true
})

api.interceptors.request.use((config) => {
    const token = ''

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

// interceptor to update jwt access token when it is expired by sending request to api /refresh
// api.interceptors.response.use(
//     function (response) {
//         return response
//     },
//
//     async function (error) {
//
//     }
// )

export default api