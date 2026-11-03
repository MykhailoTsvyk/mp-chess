import dotenv from "dotenv"
import path from "node:path"

// the tests use their own database, so the dev data in DB_NAME is never touched
export function loadTestEnv() {
    dotenv.config({path: path.resolve(import.meta.dirname, "../../.env"), quiet: true})
    process.env.DB_NAME = process.env.TEST_DB_NAME || "chessMP_test"

    // the setup drops and recreates the schema, so refuse anything that isn't a test database
    if (!process.env.DB_NAME.endsWith("_test")) {
        throw new Error(`Refusing to run tests against "${process.env.DB_NAME}": the name must end with _test`)
    }
}
