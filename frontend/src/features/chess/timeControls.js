// time controls offered in matchmaking ("minutes+increment");
// keep in sync with backend/config/timeControls.js, which validates them
export const TIME_CONTROLS = [
    {id: "1+0", category: "Bullet"},
    {id: "3+0", category: "Blitz"},
    {id: "3+2", category: "Blitz"},
    {id: "5+0", category: "Blitz"},
    {id: "10+0", category: "Rapid"},
    {id: "15+10", category: "Rapid"},
]

export const DEFAULT_TIME_CONTROL = "10+0"

// "3+2" -> "3 + 2"
export const formatTimeControl = (id) => id?.replace("+", " + ")
