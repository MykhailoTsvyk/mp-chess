import pgPromise from "pg-promise";
const pgp = pgPromise()

// production (Neon) gives one connection string and requires SSL;
// locally the separate DB_* variables from .env are used
const db = pgp(process.env.DATABASE_URL
    ? {connectionString: process.env.DATABASE_URL, ssl: true}
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
    })

export default db
