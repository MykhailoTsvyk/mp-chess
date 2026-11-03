// time controls players can choose in matchmaking, as "minutes+increment";
// keep in sync with frontend/src/features/chess/timeControls.js.
// category = estimated game length (initial + 40 * increment): bullet < 3 min,
// blitz < 8 min, rapid otherwise; each category has its own rating
export const TIME_CONTROLS = {
    "1+0": {initialSeconds: 60, incrementSeconds: 0, category: "bullet"},
    "3+0": {initialSeconds: 180, incrementSeconds: 0, category: "blitz"},
    "3+2": {initialSeconds: 180, incrementSeconds: 2, category: "blitz"},
    "5+0": {initialSeconds: 300, incrementSeconds: 0, category: "blitz"},
    "10+0": {initialSeconds: 600, incrementSeconds: 0, category: "rapid"},
    "15+10": {initialSeconds: 900, incrementSeconds: 10, category: "rapid"},
}

// each side must make its first move within this time, otherwise the game is aborted
export const FIRST_MOVE_TIMEOUT_MS = 60 * 1000

// users table column holding the rating of each category; the fixed map keeps
// column names out of user input when they're put into SQL
export const RATING_COLUMNS = {
    bullet: "elo_bullet",
    blitz: "elo_blitz",
    rapid: "elo_rapid",
}
