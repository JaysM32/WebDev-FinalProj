import { db, auth } from "../firebase"
import { doc, updateDoc } from "firebase/firestore"

const ACCESS_KEY = 'XQUIXR3G3D44TLNM1C9LH3TWS'
const SECRET_ACCESS_KEY = '7Evaw19-Ja3BiXwzFfSEVMU-dgWWAh3-l9tiFgcZ8AiYxm9DTHPtKKcARPpd5VJQ'
const PROXY_SERVER = 'https://rebah-proxy.herokuapp.com'

export const getPhotoID = (user_id) => {
    const userID = [...user_id]
    let converted_userID = ""
    userID.forEach(id_string => {
        converted_userID += id_string.charCodeAt(0)
    })
    return converted_userID
}

export const nodefluxAuth = async () => {
    //return await fetch("http://localhost:5000/api/nodeflux/authorization", {
    return await fetch(PROXY_SERVER + "/api/nodeflux/authorization", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "access_key": ACCESS_KEY,
            "secret_key": SECRET_ACCESS_KEY
        })
    }).then(response => {
        return response.json()
    }).then(authorization => {
        const DATE = authorization.headers['x-nodeflux-timestamp'].slice(0, 8)
        const TOKEN = authorization.token
        return {
            "auth_key": `NODEFLUX-HMAC-SHA256 Credential=${ACCESS_KEY}/${DATE}/nodeflux.api.v1beta1.ImageAnalytic/StreamImageAnalytic, SignedHeaders=x-nodeflux-timestamp, Signature=${TOKEN}`,
            "timestamp": authorization.headers['x-nodeflux-timestamp']
        }
    }).catch(e => { console.log(e.message) })
}

export const nodefluxDeleteEnroll = async (authorization = null) => {
    let nodeflux_auth;
    if (authorization) {
        nodeflux_auth = {
            "auth_key": authorization.auth_key,
            "timestamp": authorization.timestamp
        }
    } else {
        nodeflux_auth = await nodefluxAuth()
    }
    const photo_id = getPhotoID(auth.currentUser.uid)
    //return await fetch("http://localhost:5000/api/nodeflux/authorization", {
    return await fetch(PROXY_SERVER + '/api/nodeflux/face_enrollment_delete', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": nodeflux_auth.auth_key,
            "x-nodeflux-timestamp": nodeflux_auth.timestamp,
        },
        body: JSON.stringify({
            "additional_params": {
                "face_id": photo_id
            }
        })
    }).then(response => {
        return response.json()
    }).then(result => {
        updateDoc(doc(db, 'users', auth.currentUser.uid), {
            nodeCheck: false,
            nodeCheckID: "",
            hasVerifiedSignIn: false
        })
        return { "response": result, "auth_key": nodeflux_auth.auth_key, "timestamp": nodeflux_auth.timestamp }
    }).catch(e => { console.log(e.message) })
}

export const nodefluxEnroll = async (authorization = null, image) => { //save pic
    let nodeflux_auth;
    if (authorization) {
        nodeflux_auth = {
            "auth_key": authorization.auth_key,
            "timestamp": authorization.timestamp
        }
    } else {
        nodeflux_auth = await nodefluxAuth()
    }
    const photo_id = getPhotoID(auth.currentUser.uid)
    //return await fetch("http://localhost:5000/api/nodeflux/face_enrollment", {
    return fetch(PROXY_SERVER + "/api/nodeflux/face_enrollment", {
        method: "POST",
        headers: {
            "authorization": nodeflux_auth.auth_key,
            "x-nodeflux-timestamp": nodeflux_auth.timestamp,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "additional_params": {
                "auto_orientation": false,
                "face_id": photo_id
            },
            "images": [image]
        })
    }).then(response => {
        return response.json()
    }).then(result => {
        return { "response": result, "auth_key": nodeflux_auth.auth_key, "timestamp": nodeflux_auth.timestamp }
    }).catch(e => { console.log(e) })
}

export const nodefluxMatchEnroll = async (authorization = null, capturedImg) => {
    let nodeflux_auth;
    if (authorization) {
        nodeflux_auth = {
            "auth_key": authorization.auth_key,
            "timestamp": authorization.timestamp
        }
    } else {
        nodeflux_auth = await nodefluxAuth()
    }
    const photo_id = getPhotoID(auth.currentUser.uid)
    //return fetch("http://localhost:5000/api/nodeflux/face_match", {
    return fetch(PROXY_SERVER + "/api/nodeflux/face_match", {
        method: "POST",
        headers: {
            "authorization": nodeflux_auth.auth_key,
            "x-nodeflux-timestamp": nodeflux_auth.timestamp,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "additional_params": {
                "auto_orientation": false,
                "get_main_face": true,
                "face_id": photo_id
            },
            "images": [capturedImg]
        })
    }).then(response => {
        return response.json()
    }).then(result => {
        return { "response": result, "auth_key": nodeflux_auth.auth_key, "timestamp": nodeflux_auth.timestamp }
    }).catch(e => { console.log(e) })
}