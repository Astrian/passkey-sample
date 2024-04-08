import Debug from "debug"
import mariadb from "../../../utils/mariadb"

const debug = Debug("webgest:versions/latest/functions/getPasskeys.ts")

export default async (uid: string) => {
  let conn
  try {
    // db
    const pool = await mariadb()
    conn = await pool.getConnection()

    // find the passkeys
    const rows = await conn.query('SELECT id, created_at, updated_at, annotate FROM webauthn_credentials WHERE user = ?', [uid])

    return rows
  } catch (error) {
    throw error
  } finally {
    if (conn) await conn.release()
  }
}
