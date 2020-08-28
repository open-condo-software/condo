const admin = require('firebase-admin')
const conf = require('@core/config')

const FIREBASE_ADMIN_CONFIG = conf['FIREBASE_ADMIN_CONFIG'] && JSON.parse(conf['FIREBASE_ADMIN_CONFIG'])

if (FIREBASE_ADMIN_CONFIG) {
    admin.initializeApp({
        credential: admin.credential.cert(FIREBASE_ADMIN_CONFIG),
        databaseURL: 'https://coddi-f83aa.firebaseio.com',
    })
}

module.exports = {
    admin,
}
