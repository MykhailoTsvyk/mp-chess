import {describe, expect, test} from "vitest"
import {calculateRatings, expectedScore, K_FACTOR} from "../../services/elo.service.js"

// reference values worked out by hand from E = 1 / (1 + 10^((Rb - Ra) / 400)), R' = R + 32 (S - E)
describe("expectedScore", () => {
    test("equal ratings expect half a point", () => {
        expect(expectedScore(1500, 1500)).toBe(0.5)
    })

    test("a 400 point gap gives the stronger player 10/11 of a point", () => {
        expect(expectedScore(1900, 1500)).toBeCloseTo(10 / 11, 10)
        expect(expectedScore(1500, 1900)).toBeCloseTo(1 / 11, 10)
    })

    test("both players' expectations add up to one", () => {
        for (const [a, b] of [[800, 800], [1234, 987], [2700, 1100], [100, 3000]]) {
            expect(expectedScore(a, b) + expectedScore(b, a)).toBeCloseTo(1, 12)
        }
    })
})

describe("calculateRatings", () => {
    test("uses K = 32", () => {
        expect(K_FACTOR).toBe(32)
    })

    test("equal players: the winner gains 16 and the loser drops 16", () => {
        expect(calculateRatings(1500, 1500, 1)).toEqual({white: 1516, black: 1484})
        expect(calculateRatings(1500, 1500, 0)).toEqual({white: 1484, black: 1516})
    })

    test("equal players: a draw changes nothing", () => {
        expect(calculateRatings(800, 800, 0.5)).toEqual({white: 800, black: 800})
    })

    test("the underdog winning gains more than the favourite winning", () => {
        // 1500 vs 1600: E(1500) = 0.3599, so an upset is worth 32 * 0.64 = 20.5
        expect(calculateRatings(1500, 1600, 1)).toEqual({white: 1520, black: 1580})
        // the favourite only gets 32 * 0.36 = 11.5
        expect(calculateRatings(1600, 1500, 1)).toEqual({white: 1612, black: 1488})
    })

    test("a draw moves points from the higher rated player to the lower rated one", () => {
        // E(1400 vs 1800) = 1/11, so the draw is worth 32 * (0.5 - 0.0909) = 13.1
        expect(calculateRatings(1400, 1800, 0.5)).toEqual({white: 1413, black: 1787})
        expect(calculateRatings(1800, 1400, 0.5)).toEqual({white: 1787, black: 1413})
    })

    test("a rating never moves by more than K", () => {
        expect(calculateRatings(100, 3000, 1)).toEqual({white: 132, black: 2968})
        expect(calculateRatings(3000, 100, 1)).toEqual({white: 3000, black: 100})
    })

    test("rating points are neither created nor lost", () => {
        const ratings = [400, 800, 1013, 1500, 1777, 2200, 2851]
        for (const white of ratings) {
            for (const black of ratings) {
                for (const score of [0, 0.5, 1]) {
                    const result = calculateRatings(white, black, score)
                    expect((result.white - white) + (result.black - black), `${white} vs ${black}, score ${score}`).toBe(0)
                }
            }
        }
    })

    test("the result is whole numbers", () => {
        const result = calculateRatings(1013, 1777, 0.5)
        expect(Number.isInteger(result.white)).toBe(true)
        expect(Number.isInteger(result.black)).toBe(true)
    })
})
