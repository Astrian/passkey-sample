/// <reference path="../../../types/WebauthnCred.d.ts" />

import Debug from "debug"
import mariadb from "../../../utils/mariadb"
import HttpErrorRes from "../../../utils/HttpErrorRes"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"
import crypto from "crypto"
import argon2 from "argon2"
import useragent from "useragent"
import * as uuid from "uuid"

const debug = Debug("webgest:versions/latest/functions/login.ts")

export default async (challengeId: string, credential: WebauthnCred, userAgentString: string) => {
  // db
  const pool = await mariadb()
  const conn = await pool.getConnection()

  // Pre-operate: clear all challenges longer than 5 mins
  await conn.query('DELETE FROM challenges WHERE time < ?', [new Date(new Date().getTime() - 300000)])

  // get expected challenge
  const challenge = await conn.query('SELECT * FROM challenges WHERE id = ?', [challengeId])
  if (challenge.length === 0) {
    
    if (conn) conn.release()
    throw new HttpErrorRes("Invalid challenge", 400)
  }

  // Find user by userHandle, then get Uid
  const user = await conn.query('SELECT * FROM users WHERE id = ?', [credential.response.userHandle])
  if (user.length === 0) {
    
    if (conn) conn.release()
    throw new HttpErrorRes("User not found", 404)
  }
  // Find authenticator by uid and credential id
  // Decode credential id to normal base64
  const credentialId = Buffer.from(credential.rawId, 'base64').toString('base64')
  const authenticator = await conn.query('SELECT * FROM webauthn_credentials WHERE user = ? AND credential_id = ?', [user[0].id, credentialId])
  if (authenticator.length === 0) {
    
    if (conn) conn.release()
    throw new HttpErrorRes("Credential verification failed", 403)
  }

  // Transfer credential public key and credential ID from base64 to Uint8Array
  debug(authenticator[0])
  authenticator[0].public_key = Buffer.from(authenticator[0].public_key, 'base64')
  authenticator[0].credential_id = Buffer.from(authenticator[0].credential_id, 'base64')
  

  // Verify credential
  const verification = await verifyAuthenticationResponse({
    response: {
      id: credential.id,
      rawId: credential.rawId,
      response: {
        clientDataJSON: credential.response.clientDataJSON,
        authenticatorData: credential.response.authenticatorData,
        signature: credential.response.signature || "",
        userHandle: credential.response.userHandle || ""
      },
      type: credential.type,
      clientExtensionResults: credential.clientExtensionResults,
    },
    expectedChallenge: challenge[0].challenge,
    expectedOrigin: `https://${process.env.FRONTEND_HOST}`,
    expectedRPID: process.env.RP_HOST || "localhost",
    authenticator: {
      credentialPublicKey: authenticator[0].public_key,
      credentialID: authenticator[0].credential_id,
      counter: authenticator[0].sign_count,
      transports: authenticator[0].transports.split("\n"),
    }
  })
  if (!verification.verified) {
    
    if (conn) conn.release()
    throw new HttpErrorRes("Credential verification failed", 403)
  }

  // Update sign count
  await conn.query('UPDATE webauthn_credentials SET sign_count = ? WHERE id = ?', [verification.authenticationInfo.newCounter, authenticator[0].id])

  // Update last used time
  await conn.query('UPDATE webauthn_credentials SET updated_at = ? WHERE id = ?', [new Date(), authenticator[0].id])

  // Delete challenge
  await conn.query('DELETE FROM challenges WHERE id = ?', [challengeId])

  // Generate session with random token
  const sessionToken = crypto.randomBytes(32).toString('base64')
  const hashedToken = await argon2.hash(sessionToken)

  // annotate the session with user agent
  const agent = useragent.parse(userAgentString)
  const annotate = `${agent.toAgent()} on ${agent.os.family} ${agent.os.toVersion()}`

  // Assign an UUID for the session
  const sessionId = uuid.v4()

  await conn.query('INSERT INTO sessions (id, user, token, created_at, annotate) VALUES (?,?,?,?,?)', [sessionId, user[0].id, hashedToken, new Date(), annotate])
  
  if (conn) conn.release()
  return {
    token: sessionToken,
    session: sessionId
  }
}