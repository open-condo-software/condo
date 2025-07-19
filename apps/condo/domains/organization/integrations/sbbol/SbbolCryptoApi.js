const fs = require('fs')

const Ajv = require('ajv')

const { getLogger } = require('@open-condo/keystone/logging')

const { SbbolRequestApi } = require('./SbbolRequestApi')
const { buildBicryptId } = require('./utils/buildBicryptId')

const ajv = new Ajv()
const logger = getLogger('sbbol-crypto-api')

/**
 * Schema for Certificate Signing Request (SCR)
 */
const CSR_REQUEST_PARAMS_SCHEMA = {
    type: 'object',
    properties: {
        externalId: { type: 'string' },
        number: { type: 'string' },
        userName: { type: 'string' },
        orgName: { type: 'string' },
        email: { type: 'string' },
        userPosition: { type: 'string' },
        pkcs10: {
            type: 'object',
            properties: {
                bicryptId: { type: 'string' },
                cms: { type: 'string' },
            },
            additionalProperties: false,
            required: ['bicryptId', 'cms'],
        },
    },
    additionalProperties: false,
    required: ['externalId', 'number', 'userName', 'orgName', 'email', 'userPosition', 'pkcs10'],
}

const csrRequestParamsValidator = ajv.compile(CSR_REQUEST_PARAMS_SCHEMA)

/**
 * @typedef {Object} SbbolCryptoProfileInfo
 * @property {String} alias
 * @property {String} typeName
 * @property {String[]} certificateInfos
 */
/**
 * @typedef {Object} SbbolCryptoInfo
 * @property {String} certCenterCode
 * @property {String} certCenterNum
 * @property {String} certBank
 * @property {String} certBankUuid
 * @property {String[]} certsCA values of digital certificates
 * @property {SbbolCryptoProfileInfo[]} cryptoProfileInfos
 */

class SbbolCryptoApi extends SbbolRequestApi {

    /**
     * Get crypto profile info for organization, that is specified in constructor
     * @return {Promise<SbbolCryptoInfo>}
     */
    async getCryptoInfo () {
        const { data } = await this.request({ method: 'GET', path: this.cryptoInfoPath })
        const parsedData = JSON.parse(data)
        return parsedData
    }

    /**
     * Post Certificate Signing Request (CSR) in PKCS#10 format
     * @param {SbbolCryptoInfo} cryptoInfo
     * @param {String} cms Cryptographic Message Syntax (CMS) in PKCS #10 format
     * @param {String} email
     * @param {String} externalId identifier at our side
     * @param {String} numbmer index of certificate, being requested. "1" for first
     * @param {String} firstName
     * @param {String} lastName
     * @param {String} patronymic
     * @param {String} userPosition
     * @return {Promise<void>}
     */
    async postCertificateSigningRequest (data) {
        const { cryptoInfo, cms, email, externalId, number, orgName, firstName, lastName, patronymic, userPosition } = data
        const { certCenterCode, certCenterNum } = cryptoInfo

        const bicryptId = buildBicryptId({
            certCenterCode,
            certCenterNum,
            firstName,
            lastName,
            patronymic,
        })
        const csrRequestParams = {
            externalId,
            number,
            email,
            orgName,
            userName: [lastName, firstName, patronymic].join(' '),
            userPosition,
            pkcs10: {
                bicryptId,
                cms,
            },
        }

        if (!csrRequestParamsValidator(csrRequestParams)) {
            const errors = csrRequestParamsValidator.errors.map(({ message, instancePath }) => ({
                instancePath,
                message,
            }))
            logger.error({ msg: 'wrong Certificate Signing Request (CSR)', data: errors })
            throw new Error('Wrong data for Certificate Signing Request (CSR)')
        }

        return await this.request({
            method: 'POST',
            path: this.certificateSigningRequestPath,
            body: csrRequestParams,
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    /**
     *
     * @param externalId means at our site, with is external relative to SBBOL
     * @return {Promise<void>}
     */
    async getCertificateSigningRequestState (externalId) {
        const { data } = await this.request({
            method: 'GET',
            path: this.certificateSigningRequestStatePath.replace(':externalId', externalId),
        })
        const parsedData = JSON.parse(data)
        return parsedData
    }

    async getCertificateSigningRequestPrint (externalId, filename) {
        const { data } = await this.request({
            method: 'GET',
            path: this.certificateSigningRequestPrintPath.replace(':externalId', externalId),
        })
        fs.writeFileSync(filename, data)
        console.log('Print version of certificate request was written to file', filename)
    }

    async activateCertificate (externalId) {
        const { data } = await this.request({
            method: 'POST',
            path: this.activateCertificatePath.replace(':externalId', externalId),
        })
        const parsedData = JSON.parse(data)
        return parsedData
    }

    get cryptoInfoPath () {
        return `${this.apiPrefix}/v1/crypto`
    }

    get certificateSigningRequestPath () {
        return `${this.apiPrefix}/v1/crypto/cert-requests`
    }

    get certificateSigningRequestStatePath () {
        return `${this.apiPrefix}/v1/crypto/cert-requests/:externalId/state`
    }

    get certificateSigningRequestPrintPath () {
        return `${this.apiPrefix}/v1/crypto/cert-requests/:externalId/print`
    }

    get activateCertificatePath () {
        return `${this.apiPrefix}/v1/crypto/cert-requests/:externalId/activate`
    }

    get apiPrefix () {
        return '/fintech/api'
    }
}

module.exports = {
    SbbolCryptoApi,
}