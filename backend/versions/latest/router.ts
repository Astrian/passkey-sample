import Router from "koa-router"
import Debug from "debug"
import body from "koa-body"
import functions from "./functions"
import HttpErrorRes from "../../utils/HttpErrorRes"

const debug = Debug("webgest:versions/latest/router.ts")
const router = new Router()
router.use(body())

router.get("/", async (ctx) => {
  ctx.body = { message: "Hello World" }
})

// Register a new account
router.post("/users", async (ctx) => {
  try {
    await functions.register(ctx.request.body.credential, ctx.request.body.challengeId, ctx.request.body.uid)
    ctx.status = 204
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Generate register options
router.get("/registeroptions", async (ctx) => {
  try {
    // get username from query
    const username: string = (ctx.request.query.username as string).toLowerCase() // Cast the username to string
    // check username
    if (!username) throw new HttpErrorRes("Username cannot be empty", 400)
    // [a-z|0-9|\.]{4, 24}
    if (!username.match(/^[a-z0-9\.]{4,24}$/)) throw new HttpErrorRes("Invalid username", 400)
    // only characters can be the first character
    if (!username.match(/^[a-z]/)) throw new HttpErrorRes("Invalid username", 400)
    ctx.body = await functions.generateRegOptions(username)
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Login
router.post("/sessions", async (ctx) => {
  debug(ctx.request.body)
  try {
    let res = await functions.login(ctx.request.body.challengeId, ctx.request.body.credential, ctx.request.header["user-agent"] || "unknown")
    ctx.status = 200
    ctx.body = res
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Generate login options
router.get("/loginoptions", async (ctx) => {
  try {
    ctx.body = await functions.generateLoginOptions()
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Get user info
router.get("/sessions/now", async (ctx) => {
  try {
    debug(ctx.request.header.authorization)
    if (!ctx.request.header.authorization) throw new HttpErrorRes("Unauthorized", 401)
    ctx.body = await functions.getSessionInfo(ctx.request.header.authorization || "")
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Get passkeys
router.get("/users/me/passkeys", async (ctx) => {
  try {
    if (!ctx.request.header.authorization) throw new HttpErrorRes("Unauthorized", 401)
    const loginRes = await functions.getSessionInfo(ctx.request.header.authorization || "")
    ctx.body = await functions.getPasskeys(loginRes.uid)
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Request to add a new passkey
router.get("/users/me/passkeyconfig", async (ctx) => {
  try {
    if (!ctx.request.header.authorization) throw new HttpErrorRes("Unauthorized", 401)
    const loginRes = await functions.getSessionInfo(ctx.request.header.authorization || "")
    ctx.body = await functions.getPasskeyConfig(loginRes.uid)
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Add a new passkey
router.post("/users/me/passkeys", async (ctx) => {
  try {
    if (!ctx.request.header.authorization) throw new HttpErrorRes("Unauthorized", 401)
    const loginRes = await functions.getSessionInfo(ctx.request.header.authorization || "")
    ctx.body = await functions.addPasskey(ctx.request.body.credential, ctx.request.body.challengeId, loginRes.uid)
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Revoke a passkey
router.delete("/users/me/passkeys/:id", async (ctx) => {
  try {
    if (!ctx.request.header.authorization) throw new HttpErrorRes("Unauthorized", 401)
    const loginRes = await functions.getSessionInfo(ctx.request.header.authorization || "")
    ctx.body = await functions.revokePasskey(ctx.params.id, loginRes.uid)
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Change passkey annotate
router.patch("/users/me/passkeys/:id/annotate", async (ctx) => {
  try {
    if (!ctx.request.header.authorization) throw new HttpErrorRes("Unauthorized", 401)
    const loginRes = await functions.getSessionInfo(ctx.request.header.authorization || "")
    // annotate cannot be empty
    if (!ctx.request.body.annotate) throw new HttpErrorRes("Annotate cannot be empty", 400)
    ctx.body = await functions.changePasskeyAnnotate(ctx.params.id, loginRes.uid, ctx.request.body.annotate)
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

// Logout
router.delete("/sessions/now", async (ctx) => {
  try {
    if (!ctx.request.header.authorization) throw new HttpErrorRes("Unauthorized", 401)
    const loginRes = await functions.getSessionInfo(ctx.request.header.authorization || "")
    ctx.body = await functions.logout(ctx.request.header.authorization || "", loginRes.uid)
  } catch (e: any) {
    if (e instanceof HttpErrorRes) {
      ctx.status = e.statusCode
      ctx.body = { message: e.message }
      return
    } else {
      debug(e)
      ctx.status = 502
      ctx.body = { message: "something went wrong" }
    }
  }
})

export default router

