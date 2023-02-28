const jwt = require('jsonwebtoken')
const { get, isEmpty, isString } = require('lodash')

const { getCurrTimeStamp } = require('@condo/domains/common/utils/date')

const ENCRYPTION_ALGORITHM = 'ES256'
/** APNS accepts tokens no more than 1 hour old, so we should refresh token some time ahead of deadline */
const JWT_EXPIRES_IN_SEC = 60 * 60 - 10 // 1 hour - 10 seconds
const APNS_KEY_LENGTH = 10
const PRIVATE_KEY_LENGTH_MIN = 180

/**
 *
 */
class AppleJSONWebToken {
    #config = null
    #iss = null
    #kid = null
    #privateKey = null
    #token = null
    #expires = null

    /**
     * Initializes AppleJSONWebToken instance
     * @param conf
     */
    constructor (conf) {
        this.#config = conf
        this.#iss = get(conf, 'iss', null)
        this.#kid = get(conf, 'kid', null)
        this.#privateKey = get(conf, 'privateKey', null)
        this.#validateConfig()
    }

    #validateConfig () {
        if (!this.#isValidKey(this.#iss)) throw new Error('Valid parameter `iss` is missing in config')
        if (!this.#isValidKey(this.#kid)) throw new Error('Valid parameter `kid` is missing in config')
        if (!this.#isValidPrivateKey(this.#privateKey)) throw new Error('Valid parameter `privateKey` is missing in config')
    }

    /**
     * Validated iss & kid values
     * @param key
     * @returns {*|boolean}
     */
    #isValidKey (key) {
        return isString(key) && key.length === APNS_KEY_LENGTH
    }

    /**
     * Validates privateKey value
     * @param key
     * @returns {*|boolean}
     */
    #isValidPrivateKey (key) {
        return isString(key) && key.length >= PRIVATE_KEY_LENGTH_MIN
    }

    /**
     * Created and signs JWT
     * @param currTime
     * @returns {null}
     */
    #createSignedToken (currTime) {
        const createdAt = currTime || getCurrTimeStamp()
        const payload = { iss: this.#iss, iat: createdAt }
        const signingOptions = {
            algorithm: ENCRYPTION_ALGORITHM,
            header: { kid: this.#kid },
            expiresIn: JWT_EXPIRES_IN_SEC,
        }

        this.#expires = createdAt + JWT_EXPIRES_IN_SEC
        this.#token = jwt.sign(payload, this.#privateKey, signingOptions)

        return this.#token
    }

    /**
     * Checks & refreshes/creates JWT
     */
    #checkAndRefreshToken () {
        const currTime = getCurrTimeStamp()

        if (isEmpty(this.#expires) || this.#expires <= currTime) this.#createSignedToken(currTime)
    }

    /**
     * Getter for token value, will be lazily created/refreshed or demand
     * @returns {null}
     */
    get value () {
        this.#checkAndRefreshToken()

        return this.#token
    }
}

module.exports = AppleJSONWebToken