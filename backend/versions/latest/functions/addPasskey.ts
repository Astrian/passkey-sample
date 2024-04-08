import Debug from "debug"
import mariadb from '../../../utils/mariadb'
import HttpErrorRes from '../../../utils/HttpErrorRes'
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import * as uuid from "uuid"

const debug = Debug("webgest:versions/latest/functions/addPasskey.ts")

export default async (credential: WebauthnCred, challengeId: string, uid: string) => {
  let conn
  try {
    debug(credential)
    const pool = await mariadb()
    conn = await pool.getConnection()

    // Pre-operate: clear all challenges longer than 5 mins
    await conn.query('DELETE FROM challenges WHERE time < ?', [new Date(new Date().getTime() - 300000)])

    // Get challenge
    const challenge = await conn.query('SELECT * FROM challenges WHERE id = ?', [challengeId])
    if (challenge.length === 0) throw new HttpErrorRes("Invalid challenge", 400)
    debug("challenge ok")

    // Verify credential
    const verification = await verifyRegistrationResponse({
      response: {
        id: credential.id,
        rawId: credential.rawId,
        response: {
          attestationObject: credential.response.attestationObject || "",
          clientDataJSON: credential.response.clientDataJSON,
          authenticatorData: credential.response.authenticatorData
        },
        type: credential.type,
        clientExtensionResults: credential.clientExtensionResults
      },
      expectedChallenge: challenge[0].challenge,
      expectedOrigin: `https://${process.env.FRONTEND_HOST}`,
      expectedRPID: process.env.RP_HOST || "localhost"
    })

    if (!verification.verified) throw new HttpErrorRes("Credential verification failed", 400)

    debug(verification)

    // Create a new credential in database
    const credentialId = Buffer.from(verification.registrationInfo?.credentialID!).toString('base64')
    const credentialPublicKey = Buffer.from(verification.registrationInfo?.credentialPublicKey!).toString('base64')

    await conn.query('INSERT INTO webauthn_credentials (id, user, credential_id, public_key, sign_count, created_at, updated_at, device_type, annotate, backed_up, transports) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [
      uuid.v4(),
      uid,
      credentialId,
      credentialPublicKey,
      verification.registrationInfo?.counter,
      new Date(),
      new Date(),
      verification.registrationInfo?.credentialDeviceType,
      "",
      verification.registrationInfo?.credentialBackedUp,
      credential.response.transports ? credential.response.transports.join("\n") : ""
    ])

    // Delete challenge
    await conn.query('DELETE FROM challenges WHERE id = ?', [challengeId])
  } catch (error) {
    throw error
  } finally {

    if (conn) conn.release()
  }
}