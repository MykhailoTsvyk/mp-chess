import fs from "node:fs"
import path from "node:path"
import pgPromise from "pg-promise"
import {loadTestEnv} from "./test-env.js"

// creates the test database if needed and rebuilds it from db-schema.sql before every run
export default async function setup() {
    loadTestEnv()

    const pgp = pgPromise()
    const connection = {
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
    }
    const name = process.env.DB_NAME

    try {
        const admin = pgp({...connection, database: "postgres"})
        const exists = await admin.oneOrNone(`SELECT 1 FROM pg_database WHERE datname = $1`, [name])
        if (!exists) {
            await admin.none(`CREATE DATABASE $1:name`, [name])
        }

        const db = pgp({...connection, database: name})
        const schema = fs.readFileSync(path.resolve(import.meta.dirname, "../../db/db-schema.sql"), "utf8")
        await db.none(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`)
        await db.none(schema)
    } finally {
        pgp.end()
    }
}
