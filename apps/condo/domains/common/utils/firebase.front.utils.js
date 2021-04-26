import getConfig from 'next/config'
import firebase from 'firebase/app'
import 'firebase/auth'

const {
    publicRuntimeConfig: { firebaseConfig },
} = getConfig()

export const FIREBASE_CONFIG = firebaseConfig || {}

export const IS_FIREBASE_CONFIG_VALID = !!FIREBASE_CONFIG.apiKey

export const AUTH = firebase.auth

export const initFirebase = () => {
    try {
        if (FIREBASE_CONFIG.apiKey) {
            firebase.initializeApp(FIREBASE_CONFIG)
        }
    } catch (err) {
        // ignore app already initialized error on snack
        console.error(err)
    }
}

export const initRecaptcha = (onSuccess, onExpired) => {
    return new AUTH.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': function (response) {
            onSuccess(response)
        },
        'expired-callback': function () {
            onExpired('')
        },
    })
}

export const resetRecaptcha = () => {
    try {
        window.recaptchaVerifier.render().then((widgetId) => {
            // eslint-disable-next-line no-undef
            grecaptcha.reset(widgetId)
        })
    } catch (err) {
        console.error(err)
    }
}
