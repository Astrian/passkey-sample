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
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Frequent Asked Questions</h2>
          <div className={styles.qna}>
            <div className={styles.question}>
              <h3>What is passkey?</h3>
              <p>Passkey is an alternative authentication method to verify your identity. Compared to passwords, it is simple and easy to use and has exceptionally high security. You already have a passkey-enabled device if you have an iPhone (iOS 15 or higher) or an Android smartphone (Google Play Services supported).</p>
            </div>
            <div className={styles.question}>
              <h3>Is it secure?</h3>
              <p>In a nutshell, a passkey is combined with two parts: a private key (held by you) and a public key (held by the server). When you log in to a website, the server will send the login challenge with the public key, which can only be resolved by the private key owner. Throughout the process, the private key is always kept in your hand.</p>
              <p>Hackers can do nothing throughout the process, including guessing the private key with the public key, which can be fetched public if the public key has leaked, fetching your private key if your network is bugged, or faking a challenge to cheat the server. That is why a passkey is considered a great alternative to a password.</p>
              <p>However, cyber security is a massive project for everyone, no matter who you are. The passkey is only part of security, so make sure you have a good habit of using the Internet.</p>
            </div>
            <div className={styles.question}>
              <h3>Is, it, secure - give me a tl;dr!</h3>
              <p>The passkey is not secure for you if you cannot keep your passkey secure. The basic requirement for using a passkey to secure your account is that you secure your USB key or phone, which includes your passkeys, by a strong PIN.</p>
            </div>
            <div className={styles.question}>
              <h3>Which services support passkey?</h3>
              <p>The 1Password team is maintaining a list of all service support passkeys. <a href="https://passkeys.directory/" target='_blank'>See here</a>.</p>
            </div>
            <div className={styles.question}>
              <h3>How can I use passkey if the website supports it?</h3>
              <p>The easiest way to add a passkey to your account is to use your browser profile or the credential manager provided by your operating system. However, you can also put your passkey on your FIDO-enabled USB key or supported password managers. In most cases, the USB key or password manager can help you use your passkey across different devices.</p>
            </div>
            <div className={styles.question}>
              <h3>Can passkey be used if a website does not support it directly?</h3>
              <p>If this website has a 2-factor authentication option called “hardware USB key,” you can use a passkey to replace the actual hardware USB key in most cases. In practice, Mastodon, Fastmail, Twitter (X), Cloudflare, Facebook, and AWS have supported the use of a passkey as a 2-factor authentication.</p>
              <p>The only downside is you cannot remove your account password, and you still need to input it each time you log in. However, using a passkey to alternate TOTP can improve the security level of your account.</p>
            </div>
            <div className={styles.question}>
              <h3>How can I integrate passkey into my website?</h3>
              <p>In most cases, using an open-source library is encouraged. For the frequent changes of WebAuthn, the fundamental technology of passkey, the open-source library can help you make the integrated process more straightforward, and you can avoid most security exposures.</p>
              <p>For Node.js, you can add passkey support with <a href="https://simplewebauthn.dev/" target='_blank'>@simplewebauthn</a> (used by this project!). There are also many other libraries for different programming languages.</p>
            </div>
            <div className={styles.question}>
              <h3>How about app developers?</h3>
                <p>Apple and Google have their own guidance for supporting passkeys in your app. You can let users use the same passkey across the app and the web. For more information, check out the <a href="https://developer.apple.com/wwdc22/10092">Apple Developer Portal</a> and <a href="https://developers.google.com/identity/passkeys/developer-guides">Google Developer website</a>.</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  </>)
}

export default Login