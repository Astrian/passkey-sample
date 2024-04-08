import Debug from 'debug'
import mariadb from '../../../utils/mariadb'
import HttpErrorRes from '../../../utils/HttpErrorRes'

const debug = Debug("webgest:versions/latest/functions/changePasskeyAnnotate.ts")

export default async (passkeyId: string, uid: string, annotate: string) => {
  // db
  let conn
  try {
    const pool = await mariadb()
    conn = await pool.getConnection()

    // Check if the passkey exists to the user
    const passkey = await conn.query('SELECT * FROM webauthn_credentials WHERE id = ? AND user = ?', [passkeyId, uid])
    if (passkey.length === 0) {

      if (conn) await conn.release()
      throw new HttpErrorRes("Passkey not found", 404)
    }

    // Update the passkey
    await conn.query('UPDATE webauthn_credentials SET annotate = ? WHERE id = ?', [annotate, passkeyId])
  } catch (error) {
    throw error
  } finally {


    if (conn) await conn.release()
  }
}