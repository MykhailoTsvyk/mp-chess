const games = new Map()

// game store to make games map safe from accident cleans, etc
export const gameStore = {
    get: (gameID) => games.get(gameID),
    set: (gameID, gameData) => games.set(gameID, gameData),
    delete: (gameID) => games.delete(gameID),
    has: (gameID) => games.has(gameID),
    getAll: () => games
}