import axios from 'axios'
import { useState } from 'react'
import { useEffect } from 'react'
import Login from './components/login'
import User from './components/user'
import { useTranslation } from 'react-i18next'

function App() {
  const [loggined, setLoggined] = useState(false)
  const [user, setUser] = useState({} as {username: string} | null)
  const {t} = useTranslation()

  // Check if user is loggined on page load
  useEffect(() => {
    if (localStorage.getItem('session')) {
      console.log('Loggined')
      setLoggined(true)
      getUserInfo()
    }
  }, [])

  function getUserInfo() {
    const auth = localStorage.getItem('session')
    if (!auth) return
    setLoggined(true)
    const authbase64 = btoa(auth)
    axios.get(`https://${import.meta.env.VITE_BACKEND}/sessions/now`, {
      headers: {
        Authorization: `Basic ${authbase64}`
      }
    }).then(res => {
      setUser(res.data)
    }).catch(e => {
      console.error(e)
      localStorage.removeItem('session')
      setLoggined(false)
    })
  }
  return (
    <>
      {
        loggined ? (<User user={user} />) : (<Login refreshLogin={getUserInfo} />)
      }
      <div className="footer">
        Develop by <a href="https://astrian.moe" target="_blank">Astrian</a> with love.
        <br /><a href="https://github.com/Astrian/passkey-sample" target="_blank">Sourcecode</a>
      </div>
    </>
  )
}

export default App