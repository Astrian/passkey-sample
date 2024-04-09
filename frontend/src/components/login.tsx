import axios, { AxiosError } from 'axios'
import { useState } from 'react'
import {startRegistration, startAuthentication} from "@simplewebauthn/browser"
import styles from "./login.module.scss"
import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useTranslation, Trans } from 'react-i18next'

function Login(props: {refreshLogin: () => any}) {
  const [username, setUsername] = useState('')
  const [tabStatus, setTabStatus] = useState('register' as 'register' | 'login')
  const [processing, setProcessing] = useState(false)
  const {t} = useTranslation()

  async function register() {
    let resOps: any
    setProcessing(true)
    try {
      // check username
      // [a-z|0-9|\.]{4, 24}
      if (!/^[a-z0-9\.]{4,24}$/.test(username)) {
        setProcessing(false)
        return toast.error("Invalid username. Username must be 4-24 characters and only contain lowercase letters, numbers and period.")
      }
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
    let input = e.target.value
    if (input.length > 24) return
    input = input.toLowerCase()
    // [a-z|0-9|\.]{4, 24}
    if (!/^[a-z0-9\.]{0,24}$/.test(input)) return
    // only characters can be the first character
    if (input.length > 0 && !/^[a-z]/.test(input)) return
    setUsername(input)
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

  async function keydownDetect(e: React.KeyboardEvent<HTMLInputElement>) {
    // if enter key
    if (e.key === 'Enter') {
      if (tabStatus === "register") {
        register()
      }
    }
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
            <h1>{t('hero_title')}</h1>
            <p>{t('hero_p1')}</p>
            <p>{t('hero_p2')}</p>
            <a href="#ie"><button>{t('hero_btn')}</button></a>
          </div>
        </div>
      </div>
    </div>
    <div>
    
      <div className='container'>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle} id="ie">{t('sec1_title')}</h2>
          <div className={styles.box}>
            <ul className='tab'>
              <li className={tabStatus === "register" ? "active" : ""}>
                <button onClick={() => {setTabStatus("register")}}>{t('sec1_tab_reg')}</button>
              </li>
              <li className={tabStatus === "login" ? "active" : ""}>
                <button onClick={() => {setTabStatus("login")}}>{t('sec1_tab_login')}</button>
              </li>
            </ul>

            <div className={styles.interactiveexp}>
              {
                tabStatus === "register" ? (<>
                  <div className={styles.form}>
                    { /* pattern: a-z, 0-9 and period character */}
                    <input type='text' placeholder='username' value={username} onChange={usernameInput} disabled={processing} pattern='[a-z0-9\.]+' onKeyDown={keydownDetect}/>
                    <button disabled={username.length < 4 || processing} onClick={register}>{t('sec1_creacc_btn')}</button>
                    <div className={styles.annotate}>
                      <p>{t('sec1_anote_p1')}</p>
                      <p>{t('sec1_anote_p2')}</p>
                    </div>
                  </div>
                </>) : (<>
                  <div className={styles.form}>
                    <button onClick={login} disabled={processing}>{t('sec1_login_btn')}</button>
                    <div className={styles.annotate}>{t('sec1_login_ante')}</div>
                  </div>
                </>)
              }
            </div>
          </div>
        </div>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('sec2_title')}</h2>
          <div className={styles.qna}>
            <div className={styles.question}>
              <h3>{t('sec2_q1')}</h3>
              <p>{t('sec2_a1')}</p>
            </div>
            <div className={styles.question}>
              <h3>{t('sec2_q2')}</h3>
                <p>{t('sec2_a2_p')}</p>
                <ul>
                  <li>{t('sec2_a2_l1')}</li>
                  <li>{t('sec2_a2_l2')}</li>
                  <li>{t('sec2_a2_l3')}</li>
                </ul>
              </div>
            <div className={styles.question}>
              <h3>{t('sec2_q3')}</h3>
              <p>{t('sec2_a3_p1')}</p>
              <p>{t('sec2_a3_p2')}</p>
              <p>{t('sec2_a3_p3')}</p>
            </div>
            <div className={styles.question}>
              <h3>{t('sec2_q4')}</h3>
              <p>{t('sec2_a4')}</p>
            </div>
            <div className={styles.question}>
              <h3>{t('sec2_q5')}</h3>
              <p><Trans i18nKey="sec2_a5"><a href="https://passkeys.directory/" target="_blank">See here</a></Trans></p>
            </div>
            <div className={styles.question}>
              <h3>{t('sec2_q6')}</h3>
              <p>{t('sec2_a6')}</p>
            </div>
            <div className={styles.question}>
              <h3>{t('sec2_q7')}</h3>
              <p>{t('sec2_a7_p1')}</p>
              <p>{t('sec2_a7_p2')}</p>
            </div>
            <div className={styles.question}>
              <h3>{t('sec2_q8')}</h3>
              <p>{t('sec2_a8_p1')}</p>
              <p><Trans i18nKey="sec2_a8_p2"><a href="https://simplewebauthn.dev/" target='_blank'>@simplewebauthn</a></Trans></p>
            </div>
            <div className={styles.question}>
              <h3>{t('sec2_q9')}</h3>
              <p><Trans i18nKey="sec2_a9"><a href="https://developer.apple.com/wwdc22/10092">Apple Developer Portal</a><a href="https://developers.google.com/identity/passkeys/developer-guides">Google Developer website</a></Trans></p>
            </div>
              
          </div>
        </div>
      </div>
    </div>
  </>)
}

export default Login