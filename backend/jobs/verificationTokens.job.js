import cron from 'node-cron';
import db from "../db/db.js";

export const initTokenCleanupJob = () => {
    cron.schedule('0 * * * *', async () => {
        try {
            const result = await db.query('DELETE FROM activation_tokens WHERE expires_at < CURRENT_TIMESTAMP');
            console.log("Cleaned expired verification tokens");
        } catch (err) {
            console.error('Error cleaning expired tokens:', err)
        }
    })
}