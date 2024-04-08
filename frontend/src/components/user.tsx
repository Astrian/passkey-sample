import axios from 'axios'
import { useEffect, useState } from 'react'
import moment from 'moment'
import { startRegistration } from '@simplewebauthn/browser'
import style from './user.module.scss'

function User(props: {user: {username: string} | null}) {
  const [passkeys, setPasskeys] = useState([])
  useEffect(() => {
    refreshPasskeys()
  }, [])

  function listPasskeys() {
    return (<>
      { passkeys.map((passkey: { id: string, created_at: string, updated_at: string, annotate: string }) => {
        return (<div className={style.passkeyitem} key={passkey.id}>
          <div className={style.left}>
            <div className={style.passkeyname}>{passkey.annotate || "Passkey"}</div>
            <div className={style.info}>Created at {moment(passkey.created_at).fromNow()}</div>
            <div className={style.info}>Last used at {moment(passkey.updated_at).fromNow()}</div>
          </div>
          <div className={style.right}>
            <button onClick={() => revokePasskey(passkey.id)}>Revoke</button>
            <button onClick={() => changeAnnotate(passkey.id)}>Change annotate</button>
          </div>
        </div>)
      }) }
    </>)
  }

  function refreshPasskeys() {
    axios.get(`https://${import.meta.env.VITE_BACKEND}/users/me/passkeys`, {
      headers: {
        Authorization: `Basic ${btoa(localStorage.getItem('session') || '')}`
      }
    }).then(res => {
      setPasskeys(res.data)
    }).catch(e => {
      console.error(e)
    })
  }

  async function assignPasskey() {
    try {
      let configRes = await axios.get(`https://${import.meta.env.VITE_BACKEND}/users/me/passkeyconfig`, {
        headers: {
          Authorization: `Basic ${btoa(localStorage.getItem('session') || '')}`
        }
      })
      let waRes = await startRegistration(configRes.data.options)
      console.log(waRes)
      await axios.post(`https://${import.meta.env.VITE_BACKEND}/users/me/passkeys`, {
        challengeId: configRes.data.challengeId,
        credential: waRes
      }, {
        headers: {
          Authorization: `Basic ${btoa(localStorage.getItem('session') || '')}`
        }
      })
      refreshPasskeys()
    } catch (e: any) {
      console.error(e)
      alert('Error: ' + e)
    }
  }

  async function revokePasskey(id: string) {
    try {
      if (!await confirm('Are you sure to revoke this passkey?')) return
      await axios.delete(`https://${import.meta.env.VITE_BACKEND}/users/me/passkeys/${id}`, {
        headers: {
          Authorization: `Basic ${btoa(localStorage.getItem('session') || '')}`
        }
      })
      refreshPasskeys()
    } catch (e: any) {
      console.error(e)
      alert('Error: ' + e)
    } 
  }

  async function changeAnnotate(id: string) {
    const annotate = prompt('Enter new annotate')
    if (!annotate) alert('Annotate cannot be empty')
    try {
      await axios.patch(`https://${import.meta.env.VITE_BACKEND}/users/me/passkeys/${id}/annotate`, {
        annotate
      }, {
        headers: {
          Authorization: `Basic ${btoa(localStorage.getItem('session') || '')}`
        }
      })
      refreshPasskeys()
    } catch (e: any) {
      console.error(e)
      alert('Error: ' + e)
    }
  }

  async function logout() {
    try {
      if(!confirm('Are you sure to logout?')) return
      await axios.delete(`https://${import.meta.env.VITE_BACKEND}/sessions/now`, {
        headers: {
          Authorization: `Basic ${btoa(localStorage.getItem('session') || '')}`
        }
      })
      localStorage.removeItem('session')
      window.location.reload()
    }  catch (e: any) {
      console.error(e)
      alert('Error: ' + e)
    }
  }


  
  return(<>
    <div className={style.navbar}>
      <div className={`container ${style.navbarcontent}`}>
        <div className={style.websitename}>
          Try Passkey
        </div>
        <div className={style.right}>{props.user?.username} · <button onClick={logout}>Log out</button></div>
      </div>
    </div>  
    <div className={style.body}>
      <div className="container">
        <div className={style.section}>
          <div className={style.sectiontitle}>
            <h2>My passkeys</h2>
            <button onClick={assignPasskey}>Assign new passkey</button>
          </div>
            {listPasskeys()}
        </div>
      </div>
    </div>
  </>)
}

export default User