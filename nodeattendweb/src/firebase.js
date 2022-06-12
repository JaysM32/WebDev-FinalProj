import firebase from 'firebase/compat/app'
import {getAuth} from "firebase/auth";
import {getFirestore} from 'firebase/firestore'
import {getStorage} from 'firebase/storage'

const app = firebase.initializeApp({
  apiKey: "AIzaSyDghLOP7QQCuyu2K4OwLlw74RGsSfXvHKo",
  authDomain: "nodeattendweb.firebaseapp.com",
  projectId: "nodeattendweb",
  storageBucket: "nodeattendweb.appspot.com",
  messagingSenderId: "144192411303",
  appId: "1:144192411303:web:86388f88eba3d102f12d82"
})

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { app, auth, db, storage };
