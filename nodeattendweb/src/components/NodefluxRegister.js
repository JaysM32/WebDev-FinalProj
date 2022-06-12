import React, { useState, useEffect } from "react"
import { Link, useHistory } from "react-router-dom"
import './nodestyling.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { auth, db } from '../firebase'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { nodefluxAuth, nodefluxEnroll, nodefluxMatchEnroll, nodefluxDeleteEnroll, getPhotoID } from '../backends/nodeflux'


const NodefluxRegister = () => {
    const history = useHistory()
    const [init, setInit] = useState(true)
    const [portrait, setPortrait] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [useVideo, setUseVideo] = useState(false)
    const [captured, setCaptured] = useState(false)
    const [videoElem, setVideoElem] = useState()
    const [capturedImg, setCapturedImg] = useState("")
    const [nodeCheck, setNodeCheck] = useState(false)
    const [page, setPage] = useState({ page_1: true, page_2: false, page_3: false }) //change back later
    const [pageJobDone, setPageJobDone] = useState({ page_1: false, page_2: false, page_3: false })//change back later
    const [passedPage, setPassedPage] = useState({ page_2: false, page_3: false })//change back later

    useEffect(() => {
        const verify_test = async () => {
            setLoading(true)
            const verify = await getDoc(doc(db, 'users', auth.currentUser.uid))
            if (verify.data().nodeCheck && !verify.data().nodeVerifLogin) {
                history.push("/login")
            }
            setLoading(false)

        }
        verify_test()
    }, [])

    useEffect(() => {
        try {
            async function updateEnrollment() {
                const q = await getDoc(doc(db, 'users', auth.currentUser.uid))
                setNodeCheck(q.data().nodeCheck)
            }
            updateEnrollment()
        } catch (e) {
            console.log(e)
        }
        const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), docsnap => {
            setNodeCheck(docsnap.data().nodeCheck)
        })
        return () => { unsub() }
    }, [])

    useEffect(() => {
        setCaptured(captured && (!captured))
        setCapturedImg(capturedImg && (""))
        if (page.page_1) {
            setUseVideo(false)
            try {
                stopVideo()
            } catch (e) {
            }
        } else if (page.page_2) {
            if (!useVideo) {
                setUseVideo(true)
            }
            try {
                stopVideo()
                startVideo()
            } catch (e) {
                startVideo()
            }
        }
    }, [page])
    
    useEffect(() => {
        setTimeout(() => {
            setInit(false)
        }, 1500);
    }, [])

    const handleFinish = (e) => {
        e.preventDefault()
        stopVideo()
        history.push("/Account")
    }

    const abortAll = (e) => {
        e.preventDefault()
        const confirm_abort = window.confirm("Proceed?")
        if (confirm_abort) {
            try {
                //stopVideo()
            } catch (e) {
                // if error in stopping video then just pass
            }
            history.push("/Account")
        }
    }


    const uploadIMG = () => {
        let reader = new FileReader();
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg'
        input.onchange = _this => {
            setError("")
            let files = Array.from(input.files)[0];
            if (files.type !== 'image/jpeg') {
                alert("Please upload a proper JPEG/JPEG file")
                setError("Please upload a JPEG photo only.")
                return;
            }
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setPortrait(reader.result)
                    console.log(typeof portrait)
                }
            }
            reader.readAsDataURL(files)
        };
        input.click();
    }

    const startVideo = () => {
        let video;
        if (page.page_2) {
            video = document.getElementsByClassName('videoPage2')[0]
        } else {
            video = document.getElementsByClassName('videoWebcam')[0]
        }

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
        // i use array to store this because the video won't stop if I change 
        // pages. It is a logic thingy
        let video = [
            document.getElementsByClassName('videoWebcam')[0],
            document.getElementsByClassName('videoPage2')[0]
        ]

        try {
            video[0].srcObject.getTracks()[0].stop()
            video[1].srcObject.getTracks()[0].stop()
        } catch (e) {
            try {
                video[1].srcObject.getTracks()[0].stop()
                video[0].srcObject.getTracks()[0].stop()
            } catch (e) {
                // if error stopping again then just pass
            }
        }
    }

    const handleCaptured = () => {
        setCaptured(!captured)
        setCapturedImg("")
        if (!captured) {
            let canvas = document.getElementsByClassName('videoCapturePage2')[0]
            canvas.getContext('2d').drawImage(videoElem, 0, 0, canvas.width, canvas.height)
            setCapturedImg(page.page_2 ? canvas.toDataURL('image/jpeg') : canvas.toDataURL('image/jpeg'))
        }
    }

    const handleNodefluxEnroll = async () => {
        setLoading(true)
        let nodeflux_auth = await nodefluxAuth()
        const photo_id = getPhotoID(auth.currentUser.uid)

        const doSomething = delay_amount_ms =>
            new Promise(resolve => setTimeout(() => resolve("delay"), delay_amount_ms))

        const loop = async () => {
            console.log('bla bla')
            let status;
            let result;
            while (['success', 'incompleted'].includes(status) !== true) {
                result = await nodefluxEnroll({
                    "auth_key": nodeflux_auth.auth_key,
                    "timestamp": nodeflux_auth.timestamp
                }, portrait)
                status = result.response.job.result.status
                await doSomething(1000)
                console.log(status)
            }
            console.log(result)
            if (result.response.message === "No face detected") {
                if (useVideo) {
                    alert("No face detected in the photo you submitted.")
                } else {
                    alert("No face detected in the photo you submitted.")
                }
            } else if (result.response.message === "Face Enrollment Success") {
                updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    nodeCheck: true,
                    nodeCheckID: photo_id
                })
                alert("Face Enrollment succeeded! The verification process will begin afterwards.")
                setPageJobDone({ ...pageJobDone, page_1: true })
            } else {
                alert(result.response.message)
            }
            return;
        }
        const loop_delete_enroll = async () => {
            // set loading to true here
            let status;
            let result;
            while (['success', 'incompleted'].includes(status) !== true) {
                result = await nodefluxDeleteEnroll({ "auth_key": nodeflux_auth.auth_key, "timestamp": nodeflux_auth.timestamp })
                status = result.response.job.result.status
                // status = result // CHANGE THIS LATER TO NORMAL, THIS IS FOR DEBUGGING ONLY
                await doSomething(1000)
                console.log("Returned status: " + status)
            }
            // console.log(result) // DISABLE LATER
            if (status === 'incompleted') {
                console.log(result)
                alert("something happened and we cannot delete your enrolled photo. please try again.\n message: " + result.response.message)
                return;
            } else {
                console.log("Face enrollment delete success, beginning new face enrollment process...")
            }
            status = undefined
            while (['success', 'incompleted'].includes(status) !== true) {
                result = await nodefluxEnroll({
                    "auth_key": nodeflux_auth.auth_key,
                    "timestamp": nodeflux_auth.timestamp
                }, portrait && !useVideo ? portrait : capturedImg)
                status = result.response.job.result.status
                await doSomething(1000)
                console.log("Returned status: " + status)
            }
            // console.log(result) // DISABLE LATER
            if (result.response.message === "No face detected") {
                if (useVideo) {
                    alert("No face detected in the photo you submitted. If you haven't enabled your camera permission yet, please enable it. If you have, make sure that the camera lens is clean and your head is straight. Please look into the camera for best result too.")
                } else {
                    alert("No face detected in the photo you submitted. Please upload a photo with your face being shown clearly in the photo. Try to upload a non-blurry photo too to maximize the accuracy of the face matching verification.")
                }
            } else if (result.response.message === "Face Enrollment Success") {
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    nodeCheck: true,
                    nodeCheckID: photo_id
                })
                alert("Face Enrollment succeeded! The verification process will begin afterwards.")
                setPageJobDone({ ...pageJobDone, page_1: true })
            } else {
                alert(result.response.message)
            }
            // set loading to false here
            return;
        }

        if (nodeCheck) {
            const confirmation = window.confirm(
                "You have added an enrollment face before. For security purposes, we only allow one enrollment per user. Do you want to proceed? If so, the existing enrollment will be deleted and replaced with this new one. Proceed?"
            )
            if (confirmation) {
                await loop_delete_enroll().then(() => console.log("New face enrollment success"))
            }
        } else {
            await loop().then(() => console.log("New face enrollment success"))
        }
        setLoading(false)
    }

    const handlePage = (currentPage) => {
        if (currentPage === 'page_1') {
            setPage({ page_1: true, page_2: false, page_3: false })
            setPassedPage({ page_2: false, page_3: false })
        } else if (currentPage === 'page_2') {
            if (pageJobDone.page_1) {
                setPage({ page_1: false, page_2: true, page_3: false })
                setPassedPage({ page_2: true, page_3: false })
            } else {
                alert("Please finish the Face Enrollment step first before moving on to the next step")
            }
        } else if (currentPage === 'page_3') {
            if (pageJobDone.page_1 && pageJobDone.page_2) {
                stopVideo()
                setPage({ page_1: false, page_2: false, page_3: true })
                setPassedPage({ page_2: true, page_3: true })
            } else {
                alert("Please finish the Face Enrollment and verification steps first before moving on to the next step")
            }
        }
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
                alert("No face detected. Please upload a photo with your face being shown clearly in the photo.")

            } else if (result.response.message === "Face Match Enrollment Success") {
                updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    nodeCheck: true,
                    nodeCheckID: photo_id
                })
                alert("Face verification succeeded! Face Auth will be used instead.")
                setPageJobDone({ ...pageJobDone, page_2: true })
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
    <div>
        <section className='bg'>
            <div className="overlay"></div>
        </section>
        <section className="wrapper">
           {/*step 1*/}
           <div class={`${page.page_1 ? "col d-flex justify-content-center": "hide"}`}>
                <div class='card text-center' style={{width:'600px'}}>
                    <div class="card-header">
                    <h1>Nodeflux Face <br/>Recognition Registration</h1>
                    </div>
                    <div>
                        {portrait ?
                            <React.Fragment>
                                <div>
                                <img  class='card-img-top'style={{ padding:'10px', maxHeight:'300px', width:'auto'}} src={portrait}></img><br />
                                </div>
                            </React.Fragment>
                            :
                            <React.Fragment>
                            <br/>
                            <div style={{height:'150px'}}>
                            <svg class='card-img-top bi bi-person' xmlns="http://www.w3.org/2000/svg" width="64" height="150" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                            </svg>
                            </div>
                            </React.Fragment>  
                        }
                    </div>
                    <h3>Upload Your Image</h3>
                    <p>Upload your portrait. The photo must be in JPG/JPEG format with <br/>
                        a max file size of 800 KB and a max resolution of 2000 x 2000 pixels.</p>
                    <div class={`${error ? "": "hide"}`}>
                        <button class='btn btn-warning' style={{width:'83%'}}>{error}</button>
                    </div><br/>
                    <button type='button' class="btn btn-primary" style={{height: '50px', marginLeft:'50px', marginRight:'50px'}} onClick={handleNodefluxEnroll}> Upload Image </button><br/>
                    <button type='button' class={`btn btn-primary ${loading ? "hide" : ""} ${pageJobDone.page_1 ? "hide" : ""}`} style={{height: '50px', marginLeft:'50px', marginRight:'50px'}} onClick={uploadIMG}> Select Image </button><br/>
                    <button type='button' class='btn btn-link' onClick={abortAll} style={{marginLeft:'50px', marginRight:'50px'}}>Cancel</button><br/>
                    <div class='card-footer'>
                        <nav aria-label="Page navigation example">
                            <ul class="pagination justify-content-center">
                                <li class="page-item active"><a class="page-link" onClick={() => { handlePage('page_1')}}>1</a></li>
                                <li class="page-item"><a class="page-link" onClick={() => { handlePage('page_2')}}>2</a></li>
                                <li class="page-item"><a class="page-link" onClick={() => { handlePage('page_3')}}>3</a></li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
            {/*Step2*/}
            <div class={`${page.page_2 ? "col d-flex justify-content-center": "hide"}`}>
                <div class='card text-center' style={{width:'600px'}}>
                    <div class="card-header">
                        <h1>Verification test</h1>
                    </div><br/>
                    <div class={`${useVideo ? "card-img-top" : ""}`}>
                        <div class={`${captured ? "hide" : ""}`} >
                            <video muted autoPlay className='videoPage2' style={{height:'400px'}}/>
                        </div>
                        <div className={`${captured ? "" : "hide"}`}>
                            <canvas className='videoCapturePage2' style={{width:'550px'}}></canvas>
                        </div>
                    </div><br/>
                    <h3 className='text-4xl font-bold'>Take a Picture!</h3>
                    <p>in order to make sure the portraits works,<br/>
                        we would like to take your current self.</p><br/>
                    <div class={`${error ? "": "hide"}`}>
                    <button class='btn btn-warning' style={{width:'83%'}}>{error}</button>
                    </div><br/>
                    <div class="btn-group-vertical" role="group" aria-label="Basic example" style={{marginLeft:'50px', marginRight:'50px'}}>
                        <button class={`btn btn-primary ${loading ? "hidden" : ""} ${pageJobDone.page_2 ? "hidden" : ""}`} onClick={handleCaptured}>
                            {captured ? "Re-capture photo" : "Capture photo"}
                        </button>
                        <button class={`btn btn-secondary ${capturedImg ? "" : "hidden"} ${pageJobDone.page_2 ? "hidden" : ""}`} disabled={loading ? true : false} onClick={handleNodefluxFaceMatchEnroll}>
                            {`${loading ? "Loading" : "Verify my identity"}`}
                        </button>
                        <button className={`btn btn-info ${pageJobDone.page_2 ? "" : "hidden"}`} onClick={() => { handlePage("page_3") }}>
                             Next
                        </button>
                    </div> <br/>
                    <div class='card-footer'>
                        <nav aria-label="Page navigation example">
                            <ul class="pagination justify-content-center">
                                <li class="page-item"><a class="page-link" onClick={() => { handlePage('page_1')}}>1</a></li>
                                <li class="page-item active"><a class="page-link" onClick={() => { handlePage('page_2')}}>2</a></li>
                                <li class="page-item"><a class="page-link" onClick={() => { handlePage('page_3')}}>3</a></li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
            {/*Step3*/}
            <div class={`${page.page_3 ? "col d-flex justify-content-center": "hide"}`}>
                <div class='card text-center' style={{width:'600px'}}>
                    <div class="card-header">
                        <h1>Registration Sucessful</h1>
                    </div><br/>
                    <h3 className='text-4xl font-bold'>Nodeflux Face Authentication<br/> 
                        will now be used!</h3>
                    <p>User Password will not be used and <br/>
                        Face Authentication will now be used instead</p><br/>
                    <button className='btn btn-primary' onClick={handleFinish} style={{marginLeft:'50px', marginRight:'50px'}}>Return</button><br/>
                    <div class='card-footer'>
                        <nav aria-label="Page navigation example">
                            <ul class="pagination justify-content-center">
                                <li class="page-item"><a class="page-link" onClick={() => { handlePage('page_1')}}>1</a></li>
                                <li class="page-item"><a class="page-link" onClick={() => { handlePage('page_2')}}>2</a></li>
                                <li class="page-item active"><a class="page-link" onClick={() => { handlePage('page_3')}}>3</a></li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
      </section>
    </div>
  )
}

export default NodefluxRegister