import axios from 'axios'
import { useState } from 'react'
import {startRegistration, startAuthentication} from "@simplewebauthn/browser"
import styles from "./login.module.scss"

function Login(props: {refreshLogin: () => any}) {
  const [username, setUsername] = useState('')
  const [tabStatus, setTabStatus] = useState('register' as 'register' | 'login')

  async function register() {
    try {
      // Get challenge and options
      const resOps = await axios.get(`https://${import.meta.env.VITE_BACKEND}/registeroptions?username=${username}`)
      
      // Require browser to launch WebAuthn dialog
      const waRes = await startRegistration(resOps.data.options)
      
      // Send response to server
      await axios.post(`https://${import.meta.env.VITE_BACKEND}/users`, {
        challengeId: resOps.data.challengeId,
        credential: waRes,
        uid: resOps.data.uid
      })
      
    } catch (e: any) {
      console.error(e)
      if (e.name === 'InvalidStateError') {
        alert('Error: Authenticator was probably already registered by user')
      } else {
        alert('Error: ' + e);
      }
    }
  }
  async function usernameInput(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value.toLowerCase())
  }
  async function login () {
    try {
      // Get options
      const resOps = await axios.get(`https://${import.meta.env.VITE_BACKEND}/loginoptions`)
      console.log(resOps.data)
      // Require browser to launch WebAuthn dialog
      const waRes = await startAuthentication(resOps.data.options)
      // Send response to server
      let loginRes = await axios.post(`https://${import.meta.env.VITE_BACKEND}/sessions`, {
        credential: waRes,
        challengeId: resOps.data.challengeId
      })
      const token = loginRes.data.token
      const session = loginRes.data.session

      // Save token
      localStorage.setItem('session', `${session}:${token}`)
      props.refreshLogin()
    } catch (e: any) {
      console.error(e)
      if (e.name === 'InvalidStateError') {
        alert('Error: Authenticator was probably not registered by user')
      } else {
        alert('Error: ' + e);
      }
    }
  }

  return( <>
    { /*<input value={username} onChange={usernameInput}/>
    <button onClick={register}>Register</button>
    <hr />
  <button onClick={login}>Login</button>*/ }
    { /*<div className={styles.hero}>
      <div className={styles.bgcolor}>
        <div className='container'>
          <div className={`${styles.intro}`}>
            <h1>Passkey is the future of online identities.</h1>
            <p>With passkey, you can create and login to your account with ease. No need to “think”, remember or input complex passwords, just click and you are all set.</p>
            <p>For server-side, it also have multiple open-sourced libraries across different platforms and programming languages to help you to intergrate it to your website. It possibile that done it in one day by one developer.</p>
            <button>Give it a try!</button>
          </div>
        </div>
      </div>
</div> */}
    <div>
      <div className='container'>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Interactive experience</h2>
          <div className={styles.box}>
            <ul className='tab'>
              <li className={tabStatus === "register" ? "active" : ""}>
                <button onClick={() => {setTabStatus("register")}}>Register</button>
              </li>
              <li className={tabStatus === "login" ? "active" : ""}>
                <button onClick={() => {setTabStatus("login")}}>Login</button>
              </li>
            </ul>

            <div className={styles.interactiveexp}>
              {
                tabStatus === "register" ? (<>
                  <div className={styles.form}>
                    <input type='text' placeholder='username' value={username} onChange={usernameInput}/>
                    <button disabled={username.length < 4} onClick={register}>Create Account</button>
                    <div className={styles.annotate}>Use your browser profile, FIDO USB key, phone or supported password manager to create your account.</div>
                  </div>
                </>) : (<>
                  <div className={styles.form}>
                    <button onClick={login}>Login</button>
                    <div className={styles.annotate}>Yes, even the username is not necessery!</div>
                  </div>
                </>)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </>)
}

export default Login