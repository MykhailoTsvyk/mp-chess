import "@testing-library/jest-dom/vitest"
import {afterEach} from "vitest"
import {cleanup} from "@testing-library/react"

// jsdom has no DragEvent, so drag events would lose their pointer position (clientX / clientY)
if (!window.DragEvent) {
    window.DragEvent = class DragEvent extends MouseEvent {
        constructor(type, init = {}) {
            super(type, init)
            this.dataTransfer = init.dataTransfer ?? null
        }
    }
}

afterEach(() => {
    cleanup()
    localStorage.clear()
})
