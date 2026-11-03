// how much a single game can move a rating
export const K_FACTOR = 32

// chance of scoring against the opponent, from 0 to 1 (0.5 for equal ratings)
export function expectedScore(rating, opponentRating) {
    return 1 / (1 + 10 ** ((opponentRating - rating) / 400))
}

// new ratings after a game; whiteScore is 1 (white won), 0.5 (draw) or 0 (black won)
export function calculateRatings(whiteRating, blackRating, whiteScore) {
    const whiteExpected = expectedScore(whiteRating, blackRating)
    const blackExpected = expectedScore(blackRating, whiteRating)

    return {
        white: Math.round(whiteRating + K_FACTOR * (whiteScore - whiteExpected)),
        black: Math.round(blackRating + K_FACTOR * ((1 - whiteScore) - blackExpected))
    }
}
