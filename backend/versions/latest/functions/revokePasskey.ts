import Debug from 'debug'
import mariadb from '../../../utils/mariadb'
import HttpErrorRes from '../../../utils/HttpErrorRes'

const debug = Debug("webgest:versions/latest/functions/revokePasskey.ts")

export default async (passkeyId: string, uid: string) => {
  // db
  const pool = await mariadb()
  const conn = await pool.getConnection()

  // Check how many passkeys the user has
  // if less than 2, return error
  const passkeys = await conn.query('SELECT * FROM webauthn_credentials WHERE user = ?', [uid])
  if (passkeys.length < 2) {
    
    if (conn) conn.release()
    throw new HttpErrorRes("You must have at least 1 passkey", 400)
  }

  // Check if the passkey exists to the user
  const passkey = await conn.query('SELECT * FROM webauthn_credentials WHERE id = ? AND user = ?', [passkeyId, uid])
  if (passkey.length === 0) {
    
    if (conn) conn.release()
    throw new HttpErrorRes("Passkey not found", 404)
  }

  // Delete the passkey
  await conn.query('DELETE FROM webauthn_credentials WHERE id = ?', [passkeyId])
  
  if (conn) conn.release()
}