import api from './axios.js'

export const registerUser = async (credentials) => {
    const responce = await api.post('/register', credentials)
    return responce.data
}

export const loginUser = async (credentials) => {
    console.log(credentials)
    const responce = await api.post('/login', credentials)
    console.log(responce)
    return responce.data
}