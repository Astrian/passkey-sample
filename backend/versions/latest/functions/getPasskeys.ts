import Debug from "debug"
import mariadb from "../../../utils/mariadb"

const debug = Debug("webgest:versions/latest/functions/getPasskeys.ts")

export default async (uid: string) => {
  // db
  const pool = await mariadb()
  const conn = await pool.getConnection()

  // find the passkeys
  const rows = await conn.query('SELECT id, created_at, updated_at, annotate FROM webauthn_credentials WHERE user = ?', [uid])

  
  if (conn) conn.release()

  return rows
}
