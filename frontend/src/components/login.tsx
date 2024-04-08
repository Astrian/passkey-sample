import axios, { AxiosError } from 'axios'
import { useState } from 'react'
import {startRegistration, startAuthentication} from "@simplewebauthn/browser"
import styles from "./login.module.scss"
import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function Login(props: {refreshLogin: () => any}) {
  const [username, setUsername] = useState('')
  const [tabStatus, setTabStatus] = useState('register' as 'register' | 'login')
  const [processing, setProcessing] = useState(false)

  async function register() {
    let resOps: any
    setProcessing(true)
    try {
      // Get challenge and options
      resOps = await axios.get(`https://${import.meta.env.VITE_BACKEND}/registeroptions?username=${username}`)
    } catch (e) {
      // if error is AxiosError
      if (axios.isAxiosError(e)) {
        setProcessing(false)
        const err = e as AxiosError
        const data = err.response?.data as {message: string}
        return toast(data.message)
      }
    }
    let waRes: any
    try {
      // Require browser to launch WebAuthn dialog
      waRes = await startRegistration(resOps.data.options)
    } catch (e: any) {
      setProcessing(false)
      return toast("You may canceled the WebAuthn request, or the browser does not support WebAuthn.")
    }
    try {
      // Send response to server
      await axios.post(`https://${import.meta.env.VITE_BACKEND}/users`, {
        challengeId: resOps.data.challengeId,
        credential: waRes,
        uid: resOps.data.uid
      })
    } catch(e:any) {
      // if error is AxiosError
      if (axios.isAxiosError(e)) {
        setProcessing(false)
        const err = e as AxiosError
        const data = err.response?.data as {message: string}
        return toast(data.message)
      }
    }
    toast("Done! Now you can login with your new account.")
    setTabStatus("login")
    setProcessing(false)
  }
  async function usernameInput(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value.toLowerCase())
  }
  async function login () {
    setProcessing(true)
    let resOps: any
    try {
      // Get options
      resOps = await axios.get(`https://${import.meta.env.VITE_BACKEND}/loginoptions`)
      console.log(resOps.data)
    } catch (e: any) {
      // if error is AxiosError
      if (axios.isAxiosError(e)) {
        setProcessing(false)
        const err = e as AxiosError
        const data = err.response?.data as {message: string}
        throw toast(data.message)
      }
    }
    let waRes
    try {
      // Require browser to launch WebAuthn dialog
      waRes = await startAuthentication(resOps.data.options)
    } catch (e: any) {
      console.log(e)
      setProcessing(false)
      throw toast("You may canceled the WebAuthn request, or the browser does not support WebAuthn.")
    }

    try {
      console.log("register")
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
      // if error is AxiosError
      if (axios.isAxiosError(e)) {
        setProcessing(false)
        const err = e as AxiosError
        const data = err.response?.data as {message: string}
        return toast(data.message)
      }
    }
    setProcessing(false)
  }

  return( <>
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={true}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      transition={Slide}
    />
    <div className={styles.hero}>
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
    </div>
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
                    <input type='text' placeholder='username' value={username} onChange={usernameInput} disabled={processing}/>
                    <button disabled={username.length < 4 || processing} onClick={register}>Create Account</button>
                    <div className={styles.annotate}>Use your browser profile, FIDO USB key, phone or supported password manager to create your account.</div>
                  </div>
                </>) : (<>
                  <div className={styles.form}>
                    <button onClick={login} disabled={processing}>Login</button>
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