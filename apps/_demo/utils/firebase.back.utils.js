const admin = require('firebase-admin')
const conf = require('@core/config')

const FIREBASE_ADMIN_CONFIG = conf['FIREBASE_ADMIN_CONFIG'] && JSON.parse(conf['FIREBASE_ADMIN_CONFIG'])
const FIREBASE_CONFIG = conf['FIREBASE_CONFIG'] && JSON.parse(conf['FIREBASE_CONFIG'])

if (FIREBASE_ADMIN_CONFIG) {
    admin.initializeApp({
        credential: admin.credential.cert(FIREBASE_ADMIN_CONFIG),
        databaseURL: FIREBASE_CONFIG.databaseURL,
    })
}

module.exports = {
    admin,
}
