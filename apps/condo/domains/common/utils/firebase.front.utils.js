import getConfig from 'next/config'
import firebase from 'firebase/app'
import 'firebase/auth'

const {
    publicRuntimeConfig: { firebaseConfig },
} = getConfig()

const FIREBASE_CONFIG = firebaseConfig || {}
try {
    if (FIREBASE_CONFIG.apiKey) {
        firebase.initializeApp(FIREBASE_CONFIG)
        // firebase.analytics()
    }
} catch (err) {
    // ignore app already initialized error on snack
    console.error(err)
}

const isFirebaseConfigValid = !!FIREBASE_CONFIG.apiKey

const auth = firebase.auth
export {
    auth,
    isFirebaseConfigValid,
    FIREBASE_CONFIG,
}
