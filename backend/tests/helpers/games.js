import {gameStore} from "../../store/game.store.js"

// drops live games left over by a test, with their timers, without saving anything
export function clearLiveGames() {
    for (const [id, entry] of gameStore.getAll()) {
        clearTimeout(entry.clock.flagTimer)
        clearTimeout(entry.clock.firstMoveTimer)
        for (const {timer} of entry.leaveTimers.values()) clearTimeout(timer)
        gameStore.delete(id)
    }
}
