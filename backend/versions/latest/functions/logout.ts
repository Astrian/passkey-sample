import Debug from 'debug'
import mariadb from '../../../utils/mariadb'

const debug = Debug("webgest:versions/latest/functions/logout.ts")

export default async (session: string, uid: string) => {
  let conn
  try {
    // db
    const pool = await mariadb()
    conn = await pool.getConnection()

    // Delete the session
    await conn.query('DELETE FROM sessions WHERE id = ? AND user = ?', [session, uid])
  } catch (error) {
    throw error
  } finally {
    if (conn) await conn.release()
  }
}