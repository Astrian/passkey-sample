import mariadb from '../../../utils/mariadb'
import HttpErrorRes from '../../../utils/HttpErrorRes'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import Debug from 'debug'
import * as uuid from 'uuid'

const debug = Debug("webgest:versions/latest/functions/generateOptions.ts")

export default async (username: string) => {
  let conn
  try {
    const pool = await mariadb()
    conn = await pool.getConnection()

    // Generate a random user id
    const uid = uuid.v4()

    // Check username availability
    const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username])
    if (rows.length > 0 && rows[0].status === 1) throw new HttpErrorRes("Username not available", 400)

    const options = await generateRegistrationOptions({
      rpName: process.env.RP_NAME || "website",
      rpID: process.env.RP_HOST || "localhost",
      userID: uid,
      userName: username,
      userDisplayName: username,
      attestationType: "none",
      excludeCredentials: []
    })

    // generate a challenge with 32 bytes of random data
    const challenge = options.challenge
    const uuidChallenge = uuid.v4()
    await conn.query('INSERT INTO challenges (id, challenge,time) VALUES (?, ?, ?)', [uuidChallenge, challenge, new Date()])

    // Create a user in database
    if (rows.length !== 0) await conn.query('DELETE FROM users WHERE username = ? AND status = 0', [username])
    await conn.query('INSERT INTO users (id, username, email, status) VALUES (?, ?, ?, ?)', [uid, username, null, 0])

    return {
      challengeId: uuidChallenge,
      options,
      uid
    }
  } catch (error) {
    throw error
  } finally {
    if (conn) conn.release()
  }
}