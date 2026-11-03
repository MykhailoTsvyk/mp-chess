// time controls players can choose in matchmaking, as "minutes+increment";
// keep in sync with frontend/src/features/chess/timeControls.js
export const TIME_CONTROLS = {
    "1+0": {initialSeconds: 60, incrementSeconds: 0},
    "3+0": {initialSeconds: 180, incrementSeconds: 0},
    "3+2": {initialSeconds: 180, incrementSeconds: 2},
    "5+0": {initialSeconds: 300, incrementSeconds: 0},
    "10+0": {initialSeconds: 600, incrementSeconds: 0},
    "15+10": {initialSeconds: 900, incrementSeconds: 10},
}

// each side must make its first move within this time, otherwise the game is aborted
export const FIRST_MOVE_TIMEOUT_MS = 60 * 1000
