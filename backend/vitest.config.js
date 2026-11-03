import {defineConfig} from "vitest/config"

export default defineConfig({
    test: {
        // the integration suites share one test database and the in-memory game store
        fileParallelism: false,
        projects: [
            {
                test: {
                    name: "unit",
                    environment: "node",
                    include: ["tests/unit/**/*.test.js"],
                },
            },
            {
                test: {
                    name: "integration",
                    environment: "node",
                    include: ["tests/integration/**/*.test.js"],
                    globalSetup: ["./tests/setup/global-setup.js"],
                    setupFiles: ["./tests/setup/env.js"],
                    testTimeout: 15000,
                },
            },
        ],
    },
})
