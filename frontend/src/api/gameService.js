import api from './axios.js'

// {id, timeControl, color, opponent} of the game the user is playing, or null
export const getActiveGame = async () => {
    const response = await api.get('/active-game')
    return response.data.activeGame
}
