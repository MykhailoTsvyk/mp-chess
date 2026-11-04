import api from './axios.js'

// profile with ratings ({bullet, blitz, rapid}: {rating, games}) and game stats
export const getUserProfile = async (userID) => {
    const response = await api.get(`/user/${userID}`)
    return response.data
}

export const getUserMatches = async (userID, {limit, offset} = {}) => {
    const response = await api.get(`/recent-matches/${userID}`, {params: {limit, offset}})
    return response.data
}
