import React, { useRef, useState, useEffect } from "react"
import { Form, Button, Card, Alert, Container } from "react-bootstrap"
import { useAuth } from "../backends/AuthCont"
import { auth, db } from '../firebase'
import { Link, useHistory } from "react-router-dom"
import './login.css'
import { BsFillInfoSquareFill, BsFillXCircleFill, BsCheckCircleFill} from "react-icons/bs";
import { setDoc, doc } from 'firebase/firestore'

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

export default function Signup() {
  const emailRef = useRef()
  const passwordRef = useRef()
  const passwordConfirmRef = useRef()
  const { signup } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const history = useHistory()

  const [email, setEmail] = useState('');

  const [pwd, setPwd] = useState('');
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const [matchPwd, setMatchPwd] = useState('');
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);



  
  useEffect(() => {
    emailRef.current.focus();
  }, [])

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
    setValidMatch(pwd === matchPwd);
  }, [pwd, matchPwd])

  useEffect(() => {
    setError('');
  }, [email, pwd, matchPwd])


  async function handleSubmit(e) {
    e.preventDefault()


    try {
      setError("")
      setLoading(true)
      const result = await signup(email, pwd)
      await setDoc(doc(db, 'users', result.user.uid), {
        uniqID: result.user.uid,
        email,
        nodeCheck: false,
        nodeVerifLogin: false,
      });
      history.push("/")
    } catch(err413) {
      setError("Failed to create an account")
    }

    setLoading(false)
  }



  return (
    <>
    <Container>
       <section className='bg'>
        <div className="overlay"></div>
       </section>
       <section className="wrapper">
        <div className="loginbox"> 
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Sign Up</h2>
                {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
              <Form.Group id="email">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                type="email" 
                ref={emailRef} autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="name@example.com"
                />

              </Form.Group>
                <Form.Group id="password">
                <Form.Label>Password
                <BsCheckCircleFill className={validPwd ? "valid" : "hide"} />
                <BsFillXCircleFill className={validPwd || !pwd ? "hide" : "invalid"} />
                </Form.Label>
                <Form.Control 
                type="password" 
                ref={passwordRef} 
                required 
                onChange={(e) => setPwd(e.target.value)}
                aria-invalid={validPwd ? "false" : "true"}
                onFocus={() => setPwdFocus(true)}
                onBlur={() => setPwdFocus(false)}
                />
                <p id="pwdnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                  <BsFillInfoSquareFill /> <br/>
                    8 to 24 characters.<br/>
                    Must include uppercase and lowercase letters, a number and a special character.<br />
                    Allowed special characters: <span aria-label="exclamation mark">!</span> <span aria-label="at symbol">@</span> <span aria-label="hashtag">#</span> <span aria-label="dollar sign">$</span> <span aria-label="percent">%</span>
                </p>

              </Form.Group>
                <Form.Group id="password-confirm">
                <Form.Label>Password Confirmation
                <BsCheckCircleFill className={validMatch && matchPwd ? "valid" : "hide"} />
                <BsFillXCircleFill className={validMatch || !matchPwd ? "hide" : "invalid"} />
                </Form.Label>
                <Form.Control 
                type="password" 
                ref={passwordConfirmRef} 
                onChange={(e) => setMatchPwd(e.target.value)}
                aria-invalid={validMatch ? "false" : "true"} 
                required 
                onFocus={() => setMatchFocus(true)}
                onBlur={() => setMatchFocus(false)}
                />
                <p id="confirmnote" className={matchFocus && !validMatch ? "instructions" : "offscreen"}>
                  <BsFillInfoSquareFill />
                  Must match the first password input field.
                </p>
              </Form.Group>
              <Button disabled={loading || !validPwd || !validMatch ? true : false} className="w-100" type="submit">
                Sign Up
              </Button>
            </Form>
            <div className="w-100 text-center mt-2">
              Already have an account? <Link to="/login">Log In</Link>
            </div>
            </Card.Body>
          </Card>
        </div>
      </section>
    </Container>
    </>
  )
}
