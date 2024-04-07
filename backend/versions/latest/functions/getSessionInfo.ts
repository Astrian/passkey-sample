import Debug from "debug"
import mariadb from "../../../utils/mariadb"
import HttpErrorRes from "../../../utils/HttpErrorRes"
import argon2 from "argon2"

const debug = Debug("webgest:versions/latest/functions/getSessionInfo.ts")

export default async (authenticationInfo: string) => {
  // Basic auth header
  if (!authenticationInfo.startsWith("Basic ")) {
    throw new HttpErrorRes("Unauthorized access", 403)
  }
  // split auth info with :
  const auth = Buffer.from(authenticationInfo.split(" ")[1], 'base64').toString('utf-8').split(":")
  const session = auth[0]
  const token = auth[1]

  // db
  const pool = await mariadb()
  const conn = await pool.getConnection()

  // find the session
  const rows = await conn.query('SELECT * FROM sessions WHERE id = ?', [session])
  if (rows.length === 0) {
    await conn.end()
    await conn.release()
    throw new HttpErrorRes("Unauthorized access", 403)
  }

  // find the user
  const user = await conn.query('SELECT * FROM users WHERE id = ?', [rows[0].user])

  // check if token is correct, compare with hash
  if (!await argon2.verify(rows[0].token, token)) {
    await conn.end()
    await conn.release()
    throw new HttpErrorRes("Unauthorized access", 403)
  }
  await conn.end()
  await conn.release()

  return {
    username: user[0].username,
    uid: user[0].id
  }
}