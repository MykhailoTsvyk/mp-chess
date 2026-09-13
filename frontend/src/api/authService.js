import api from './axios.js'

export const registerUser = async (credentials) => {
    const responce = await api.post('/register', credentials)
    return responce.data
}

export const loginUser = async (credentials) => {
    const responce = await api.post('/login', credentials)
    return responce.data
}