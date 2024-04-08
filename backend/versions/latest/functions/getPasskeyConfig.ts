import Debug from "debug"
import mariadb from '../../../utils/mariadb'
import HttpErrorRes from '../../../utils/HttpErrorRes'
import {generateRegistrationOptions} from '@simplewebauthn/server'
import * as uuid from 'uuid'

const debug = Debug("webgest:versions/latest/functions/getPasskeyConfig.ts")

export default async (uid: string) => {
  const pool = await mariadb()
  const conn = await pool.getConnection()

  // Get username
  const rows = await conn.query('SELECT * FROM users WHERE id = ?', [uid])
  if (rows.length === 0) {
    await conn.end()
    if (conn) conn.release()
    throw new HttpErrorRes("User not found", 404)
  }
  const username = rows[0].username

  // Exclude existing passkeys
  const passkeys = await conn.query('SELECT * FROM webauthn_credentials WHERE user = ?', [uid])
  const excludeCredentials = passkeys.map((passkey: {credential_id: string, transports: string}) => {
    return {
      id: passkey.credential_id,
      type: "public-key",
      transports: passkey.transports.split("\n")
    }
  })

  const options = await generateRegistrationOptions({
    rpName: process.env.RP_NAME || "website",
    rpID: process.env.RP_HOST || "localhost",
    userID: uid,
    userName: username,
    userDisplayName: username,
    attestationType: "none",
    excludeCredentials
  })

  const challenge = options.challenge 
  const uuidChallenge = uuid.v4()
  await conn.query('INSERT INTO challenges (id, challenge,time) VALUES (?, ?, ?)', [uuidChallenge, challenge, new Date()])

  await conn.end()
  if (conn) conn.release()

  return {
    challengeId: uuidChallenge,
    options
  }
}