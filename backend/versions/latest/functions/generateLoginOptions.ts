import { generateAuthenticationOptions } from "@simplewebauthn/server"
import Debug from 'debug'
import mariadb from '../../../utils/mariadb'
import * as uuid from 'uuid'

const debug = Debug("webgest:versions/latest/functions/generateLoginOptions.ts")

export default async () => {
  const pool = await mariadb()
  const conn = await pool.getConnection()

  const options = await generateAuthenticationOptions({
    rpID: process.env.RP_HOST || "localhost",
    userVerification: "preferred"
  })

  // storage challenge
  const challenge = options.challenge
  const uuidChallenge = uuid.v4()
  await conn.query('INSERT INTO challenges (id, challenge, time) VALUES (?, ?, ?)', [uuidChallenge, challenge, new Date()])

  return {
    challengeId: uuidChallenge,
    options
  }
}