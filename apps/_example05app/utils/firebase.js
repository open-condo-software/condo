import * as firebase from 'firebase'
import getConfig from 'next/config'

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

export default firebase
export {
    isFirebaseConfigValid,
    FIREBASE_CONFIG,
}
