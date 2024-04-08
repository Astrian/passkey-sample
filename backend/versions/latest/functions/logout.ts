import Debug from 'debug'
import mariadb from '../../../utils/mariadb'

const debug = Debug("webgest:versions/latest/functions/logout.ts")

export default async (session: string, uid: string) => {
  // db
  const pool = await mariadb()
  const conn = await pool.getConnection()

  // Delete the session
  await conn.query('DELETE FROM sessions WHERE id = ? AND user = ?', [session, uid])
  
  await conn.end()
  if (conn) conn.release()
}