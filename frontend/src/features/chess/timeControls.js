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

// rating categories, in display order; ids match the backend's rating_category
export const RATING_CATEGORIES = [
    {id: "bullet", label: "Bullet"},
    {id: "blitz", label: "Blitz"},
    {id: "rapid", label: "Rapid"},
]

// "3+2" -> "3 + 2"
export const formatTimeControl = (id) => id?.replace("+", " + ")
