import axios from 'axios'
import { useEffect, useState } from 'react'
import moment from 'moment'
import { startRegistration } from '@simplewebauthn/browser'

function User(props: {user: {username: string} | null}) {
  const [passkeys, setPasskeys] = useState([])
  useEffect(() => {
    refreshPasskeys()
  }, [])

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
    <h1>Welcome, {props.user?.username}</h1>
    <hr />
    <h2>Passkeys</h2>
    <table>
      <thead>
        <tr>
          <th>Annotate</th>
          <th>Created at</th>
          <th>Last used</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {passkeys.map((passkey: {id: string, created_at: Date, updated_at: Date, annotate: string}) => {
          return(<tr key={passkey.id}>
            <td>{passkey.annotate || "Passkey"}</td>
            <td>{moment(passkey.created_at).fromNow()}</td>
            <td>{moment(passkey.updated_at).fromNow()}</td>
            <td>
              <button onClick={() => revokePasskey(passkey.id)}>Revoke</button>
              <button onClick={() => changeAnnotate(passkey.id)}>Change annotate</button>
            </td>
          </tr>)
        })}
      </tbody>
    </table>
    <button onClick={assignPasskey}>Assign a new passkey</button>
    <hr/>
    <button onClick={() => logout()}>Logout</button>
  </>)
}

export default User