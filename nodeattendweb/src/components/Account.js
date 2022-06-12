import React, { useState, useEffect } from "react"
import { Card, Button, Alert, Container } from "react-bootstrap"
import { useAuth } from "../backends/AuthCont"
import { Link, useHistory } from "react-router-dom"
import './styling.css'
import { Nav } from "react-bootstrap"
import { Navbar } from "react-bootstrap"
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { nodefluxAuth, nodefluxDeleteEnroll } from '../backends/nodeflux';

export default function Dashboard() {
  const [error, setError] = useState("")
  const { currentUser, logout } = useAuth()
  const [useFaceMatch, setUseFaceMatch] = useState(false)
  const [loading, setLoading] = useState(false)
  const history = useHistory()

  async function handleLogout() {
    setError("")

    try {
      await logout()
      history.push("/login")
    } catch {
      setError("Failed to log out")
    }
  }

  useEffect(() => {
    let facematch_listener = onSnapshot(doc(db, 'users', auth.currentUser.uid), doc => {
        setUseFaceMatch(doc.data().nodeCheck)
    })
    return () => facematch_listener()
}, [])

  const nodeRegister = async (e) => {
    e.preventDefault()
    history.push("/Account/nodeRegister")
  }

  const delNode = async (e) => {
    const disable_confirm = window.confirm("Are you sure you want to disable sign in using Face Match?")
      if (disable_confirm) {
        setLoading(true)
        const delete_result = await loop_delete_enroll()
        if (delete_result.response.job.result.status === 'incompleted') {
          alert("Something happened during the deletion of the record data and resulted in failure. Please try again")
        } else {
           alert("Sign in using Face Match has been successfully disabled. Feel free to enable it again at any time")
        }
        setLoading(false)
    }
  }

  const doSomething = delay_amount_ms =>
        new Promise(resolve => setTimeout(() => resolve("delay"), delay_amount_ms))

  const loop_delete_enroll = async () => {
    // set loading to true here
    let status, result;
    let nodeflux_auth = await nodefluxAuth()
    while (['success', 'incompleted'].includes(status) !== true) {
        result = await nodefluxDeleteEnroll({ "auth_key": nodeflux_auth.auth_key, "timestamp": nodeflux_auth.timestamp })
        status = result.response.job.result.status
        await doSomething(1000)
        console.log("Returned status: " + status)
    }
    return result
  }

  return (
    <section>
    <div>
    <div>
      <Navbar bg='basecolor' variant="dark" sticky='top' expand='sm' collapseOnSelect >
        <Navbar.Brand href="/">
        <img src={require('../images/3msFaceRecog.png')} alt="logo"/>
          3msFaceRecog
        </Navbar.Brand>

        <Navbar.Toggle />
        <Navbar.Collapse className="right-align">
        <Nav>
          <Nav.Link href="/">Registry</Nav.Link>
          <Nav.Link href="StudClass">Database</Nav.Link>
          <Nav.Link href="Account">Account</Nav.Link>
          <Button className="logoutbutton" variant="link" onClick={handleLogout}>
          Log Out
        </Button>
        </Nav>
        </Navbar.Collapse>
      </Navbar>
    </div>
      <Container className="profile">
        <Card className="profilecard">
            <Card.Body>
            <h2 className="text-center mb-4">Profile</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <strong>Email:</strong> {currentUser.email}<br/>
            </Card.Body>
            <Card.Footer>
            <Link to="/update-profile" className="btn btn-primary w-100 mt-3">
                Update Profile
            </Link>
              <div class={`${useFaceMatch ? "hide" : ""}`}>
                <Button className="btn btn-primary w-100 mt-3" onClick={nodeRegister}>Enable Face Recognition verification</Button>
              </div>
              <div class={`${useFaceMatch ? "" : "hide"}`}>
                <Button className="btn btn-primary w-100 mt-3" onClick={delNode}>Disable Face Recognition verification</Button>
              </div>
            </Card.Footer>
        </Card>
      </Container>
      </div>
      </section>
  )
}