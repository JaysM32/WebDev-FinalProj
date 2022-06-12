import React, { useRef, useState, useEffect } from "react"
import { useAuth } from "../backends/AuthCont"
import { Link, useHistory } from "react-router-dom"
import './login.css'
import { auth, db } from '../firebase'
import { updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore'
import { nodefluxAuth, nodefluxMatchEnroll, getPhotoID } from '../backends/nodeflux';

export default function Login() {
  const emailRef = useRef()
  const passwordRef = useRef()
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const { login, logout } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const history = useHistory()

  const [captured, setCaptured] = useState(false)
  const [capturedImg, setCapturedImg] = useState("")
  const [videoElem, setVideoElem] = useState()
  const [pageJobDone, setPageJobDone] = useState(false)
  const [hasFaceMatch, setHasFaceMatch] = useState(false)

  useEffect(() => {
    const login_check = async () => {
        try {
            setLoading(true)
            console.log(auth.currentUser)
            if (auth.currentUser) {
                const current_user = await getDoc(doc(db, 'users', auth.currentUser.uid))
                if (current_user.data().nodeCheck && !current_user.data().nodeVerifLogin) {
                    setHasFaceMatch(true)
                }
            }
            setLoading(false)
        } catch (e) { }
    }
    login_check()
  }, [])

  useEffect(() => {
    if (hasFaceMatch) {
      startVideo()
    } else {
      try {
          stopVideo()
      } catch (e) { }
    }
  }, [hasFaceMatch])

  const handleSignOutNotMe = async (e) => {
    e.preventDefault()
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        nodeVerifLogin: false
    })
    await logout(auth)
    setHasFaceMatch(false)
    try {
        stopVideo()
    } catch (e) { }
    document.getElementById("reset_all").click()
}


  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setError("")
      setLoading(true) 
      console.log(emailRef.current.value, passwordRef.current.value)
      await login(emailRef.current.value, passwordRef.current.value)
      const current_user = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (current_user.data().nodeCheck && !current_user.data().nodeVerifLogin) {
        setHasFaceMatch(true)
      } else {
        history.push("/");
      }

    } catch {
      setError("Failed to log in. User credentials incorrect.")
    }

    setLoading(false)
  }
  useEffect(() => {
    const login_check = async () => {
      try {
        setLoading(true)
          if (auth.currentUser) {
            const current_user = await getDoc(doc(db, 'users', auth.currentUser.uid))
            console.log(current_user.data().faceEnrollment)
            if (current_user.data().faceEnrollment && !current_user.data().hasVerifiedSignIn) {
              setHasFaceMatch(true)
            }
          }
          setLoading(false)
      } catch (e) { }
    }
    login_check()
    }, [])

  const startVideo = () => {
    const video = document.getElementsByClassName('videoPage2')[0]
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((mediaStream) => {
            video.srcObject = mediaStream;
            video.onloadedmetadata = (e) => {
                video.play();
            };
            setVideoElem(video)
        })
        .catch((err) => {
            console.log(err.name + ": " + err.message);
            if (err.name === "NotReadableError" && err.message === "Could not start video source") {
                alert("Another application is blocking access to your camera.")
            } else {
                alert("Something is blocking access to your camera.")
            }
        });
  }

  const stopVideo = () => {
    const video = document.getElementsByClassName('videoPage2')[0]
    try {
        video.srcObject.getTracks()[0].stop()
    } catch (e) {
    }
  }
  const handleCaptured = () => {
    setCaptured(!captured)
    setCapturedImg("")
    if (!captured) {
        let canvas = document.getElementsByClassName('videoCapturePage2')[0]
        canvas.getContext('2d').drawImage(videoElem, 0, 0, canvas.width, canvas.height)
        setCapturedImg(canvas.toDataURL('image/jpeg'))
    }
  }

  const handleFinish = (e) => {
    e.preventDefault()
    try {
        stopVideo()
    } catch (e) { }
    history.push("/")
  }

  const handleNodefluxFaceMatchEnroll = async () => {
    setLoading(true)
    let nodeflux_auth = await nodefluxAuth()
    const photo_id = getPhotoID(auth.currentUser.uid)

    const doSomething = delay_amount_ms =>
      new Promise(resolve => setTimeout(() => resolve("delay"), delay_amount_ms))

    const loop = async () => {
      let status;
      let result;
      while (['success', 'incompleted'].includes(status) !== true) {
          result = await nodefluxMatchEnroll({
              "auth_key": nodeflux_auth.auth_key,
              "timestamp": nodeflux_auth.timestamp
          }, capturedImg)
          status = result.response.job.result.status
          await doSomething(1000)
          console.log("Returned status: " + status)
      }
      if (result.response.message === "No face detected") {
          alert("No face detected in the photo you submitted.")

      } else if (result.response.message === "Face Match Enrollment Success") {
          updateDoc(doc(db, 'users', auth.currentUser.uid), {
              nodeCheck: true,
              nodeCheckID: photo_id
          })
          alert("Face verification succeeded.")
          setPageJobDone(true)
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              hasVerifiedSignIn: true
          })
          try {
              stopVideo()
          } catch (e) { }
          history.push("/")
      } else {
          alert(result.response.message)
      }
      return;
  }

    await loop().then(() => {
      console.log('Face match verification succeeded')
    })
    setLoading(false)
  }

  return (
    <>
    
       <section className='bg'>
        <div className="overlay"></div>
       <section className="wrapper">
          <div className={`${hasFaceMatch ? "hide" : "col d-flex justify-content-center"}`}>
            <div class='card text-center' style={{width:'600px'}}>
            <div class="card-header">
              <h1>Log In</h1>
            </div>
            <div class={`${error ? "col d-flex justify-content-center": "hide"}`}>
              <button class='btn btn-warning' style={{width:'83%'}}>{error}</button>
            </div><br/>
            <form class='text-left' onSubmit={handleSubmit} style={{marginLeft:'20px', marginRight:'20px'}}>
            <div class="form-group row">
              <label for="staticEmail" class="col-sm-2 col-form-label">Email</label>
              <div class="col-sm-10">
                <input type="text" readonly class="form-control" id="staticEmail" placeholder="email@example.com" ref={emailRef}></input>
              </div>
            </div>
            <div class="form-group row">
              <label for="inputPassword" class="col-sm-2 col-form-label">Password</label>
              <div class="col-sm-10">
                <input type="password" class="form-control" id="inputPassword" placeholder="Password" ref={passwordRef}></input>
              </div>
              </div>
            </form>
            <div class='col text-center'>
            <button class='btn btn-primary' disabled={loading} onClick={handleSubmit} style={{width:'300px'}}>
              Log In
            </button>
            </div>
            <div className="w-100 text-center mt-3">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
            <div className="w-100 text-center mt-2">
              Need an account? <Link to="/signup">Sign Up</Link>
            </div><br/>
            </div>
          </div>

        <div className={`${hasFaceMatch ? "col d-flex justify-content-center" : "hide"}`}>
          <div class='card text-center' style={{width:'600px'}}>
            <div class="card-header">
            <h1>Face Verification</h1>
            </div><br/>
            <div class={`${videoElem ? "card-img-top" : ""}`}>
              <div class={`${captured ? "hide" : ""}`} >
                <video muted autoPlay className='videoPage2' style={{height:'400px'}}/>
              </div>
              <div className={`${captured ? "" : "hide"}`}>
                <canvas className='videoCapturePage2' style={{width:'550px', height:'400px'}}></canvas>
              </div>
            </div>
              <h3 className='text-4xl font-bold'>Take a Picture!</h3>
              <p>in order to make sure the portraits works,<br/>
              we would like to take your current self.</p>
            <div class={`${error ? "": "hide"}`}>
              <button class='btn btn-warning' style={{width:'83%'}}>{error}</button>
            </div><br/>
            <div class="btn-group-vertical" role="group" aria-label="Basic example" style={{marginLeft:'50px', marginRight:'50px'}}>
              <button class={`btn btn-primary ${loading ? "hidden" : ""} ${pageJobDone ? "hidden" : ""}`} onClick={handleCaptured}>
                {captured ? "Re-capture photo" : "Capture photo"}
              </button>
              <button class={`btn btn-secondary ${capturedImg ? "" : "hidden"} ${pageJobDone ? "hidden" : ""}`} disabled={loading ? true : false} onClick={handleNodefluxFaceMatchEnroll}>
                {`${loading ? "Loading" : "Verify my identity"}`}
              </button>
              <button className={`btn btn-info ${pageJobDone.page_2 ? "" : "hidden"}`} onClick={handleFinish}>
                Finish
              </button>
            </div> <br/>
            <div className='card-footer'>
              <p>Not {auth.currentUser ? auth.currentUser.email : "placeholder@email.com"}?</p>
              <button className='btn btn-primary' onClick={handleSignOutNotMe} disabled={pageJobDone ? true : false || loading ? true : false}>
                Sign out
              </button>
              <p>and sign in again using your account</p>
            </div>
          </div>
        </div>
      </section>
      </section>
    </>
  )
}
