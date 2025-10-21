const { isEmpty, get, has } = require('lodash')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')


// const SNGPhoneTest = /^((\+?7|8)(?!95[4-79]|99[08]|907|94[^0]|336)([348]\d|9[0-6789]|7[0247])\d{8}|\+?(99[^4568]\d{7,11}|994\d{9}|9955\d{8}|996[57]\d{8}|9989\d{8}|380[34569]\d{8}|375[234]\d{8}|372\d{7,8}|37[0-4]\d{8}))$/
const AllCountriesTest = /^\+?([87](?!95[5-79]|99[08]|907|94[^0]|336)([348]\d|9[0-6789]|7[01247])\d{8}|[1246]\d{9,13}|68\d{7}|5[1-46-9]\d{8,12}|55[1-9]\d{9}|55[138]\d{10}|55[1256][14679]9\d{8}|554399\d{7}|500[56]\d{4}|5016\d{6}|5068\d{7}|502[45]\d{7}|5037\d{7}|50[4567]\d{8}|50855\d{4}|509[34]\d{7}|376\d{6}|855\d{8,9}|856\d{10}|85[0-4789]\d{8,10}|8[68]\d{10,11}|8[14]\d{10}|82\d{9,10}|852\d{8}|90\d{10}|96(0[79]|17[0189]|181|13)\d{6}|96[23]\d{9}|964\d{10}|96(5[569]|89)\d{7}|96(65|77)\d{8}|92[023]\d{9}|91[1879]\d{9}|9[34]7\d{8}|959\d{7,9}|989\d{9}|971\d{8,9}|97[02-9]\d{7,11}|99[^4568]\d{7,11}|994\d{9}|9955\d{8}|996[2579]\d{8}|9989\d{8}|380[345679]\d{8}|381\d{9}|38[57]\d{8,9}|375[234]\d{8}|372\d{7,8}|37[0-4]\d{8}|37[6-9]\d{7,11}|30[69]\d{9}|34[679]\d{8}|3459\d{11}|3[12359]\d{8,12}|36\d{9}|38[169]\d{8}|382\d{8,9}|46719\d{10})$/

const validateConfig = (config, required) => {
    const missedFields = required.filter(field => !get(config, field))
    if (!isEmpty(missedFields)) {
        console.error(`SMSadapter missing fields in config file: ${[missedFields.join(', ')]}`)
        return false
    }
    return true
}

class SMSAdapter {

    constructor (type = conf.SMS_PROVIDER || 'SMS') {
        this.whitelist = conf['SMS_WHITE_LIST'] ? JSON.parse(conf['SMS_WHITE_LIST']) : {}
        this.allowedPhonePrefixes = conf['SMS_ALLOWED_PHONE_PREFIXES']
            ? conf['SMS_ALLOWED_PHONE_PREFIXES']
                .split(',')
                .map(p => p.trim())
                .filter(p => p.length > 0)
            : ['*']
        this.adapter = null
        switch (type) {
            case 'SMS':
                this.adapter = new SmsRu()
                break
            case 'SMSC':
                this.adapter = new SmsCRu()
                break
            case 'TWILIO':
                this.adapter = new TwilioSms()
                break
            case 'INSTASENT':
                this.adapter = new InstasentSms()
                break
            default:
                console.error(`Unknown SMS-adapter: ${type}`)
        }
    }

    get isConfigured () {
        return this.adapter.isConfigured
    }

    async checkIsAvailable () {
        return await this.adapter.checkIsAvailable()
    }

    isPhoneAllowedByPrefix (phone) {
        const allowedPhonePrefixes = this.allowedPhonePrefixes

        if (!Array.isArray(allowedPhonePrefixes) || allowedPhonePrefixes.length === 0) {
            return false
        }

        if (allowedPhonePrefixes.includes('*')) return true

        if (allowedPhonePrefixes.some(prefix => phone.startsWith(prefix.trim()))) return true

        return false
    }

    isPhoneSupported (phone) {
        return this.adapter.isPhoneSupported(phone)
    }

    async send ({ phone, message, meta }, extendedParams = {}) {
        if (!this.isPhoneSupported(phone)) {
            throw new Error(`Unsupported phone number ${phone}`)
        }

        if (!this.isPhoneAllowedByPrefix(phone)) {
            return [false, { error: 'phone number is not allowed by prefix' }]
        }

        // don't send real sms for white list phones - for developers
        if (has(this.whitelist, phone)) {
            return [true, {}]
        }

        return await this.adapter.send({ phone, message, meta }, extendedParams)
    }
}

class InstasentSms {

    isConfigured = false

    constructor () {
        let config = conf['INSTASENT_API_CONFIG'] ?  JSON.parse(conf['INSTASENT_API_CONFIG']) : {}
        this.isConfigured = validateConfig(config, [
            'apiKey',
            'api_url',
            'from',
        ])
        this.apiKey = config.apiKey
        this.api_url = config.api_url
        this.from = config.from
    }

    isPhoneSupported (phoneNumber) {
        return AllCountriesTest.test(phoneNumber)
    }

    async checkIsAvailable () {
        const result = await fetch(
            `${this.api_url}/organization/account`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json',
                },
            }
        )
        return result.ok
    }

    async send ({ phone, message }, extendedParams = {}) {
        const body = {
            from: this.from,
            to: phone,
            text: message,
            allowUnicode: true,
            ...extendedParams,
        }
        const result = await fetch(
            `${this.api_url}/sms`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(body),
            }
        )
        const json = await result.json()
        const isOk =  result.ok
        return [isOk, json]
    }
}

class TwilioSms {

    isConfigured = false

    constructor () {
        let config = conf['TWILIO_API_CONFIG'] ?  JSON.parse(conf['TWILIO_API_CONFIG']) : {}
        this.isConfigured = validateConfig(config, [
            'accountSid',
            'authToken',
            'fromNumber',
            'api_url',
        ])
        this.accountSid = config.accountSid
        this.authToken = config.authToken
        this.fromNumber = config.fromNumber
        this.api_url = config.api_url
    }

    isPhoneSupported (phoneNumber) {
        return AllCountriesTest.test(phoneNumber)
    }

    async checkIsAvailable () {
        const result = await fetch(
            `${this.api_url}/${this.accountSid}/Balance.json`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(this.accountSid + ':' + this.authToken).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        )
        return result.ok
    }

    async send ({ phone, message }, extendedParams = {}) {
        const body = {
            To: phone,
            From: this.fromNumber,
            Body: message,
            ...extendedParams,
        }
        const result = await fetch(
            `${this.api_url}/${this.accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(this.accountSid + ':' + this.authToken).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded', 
                },
                body: new URLSearchParams(body).toString(),
            }
        )
        const json = await result.json()
        const status = json['status']
        const isOk =  status === 'queued'
        return [isOk, json]
    }
}

class SmsRu {

    isConfigured = false

    constructor () {
        let config = conf['SMSRU_API_CONFIG'] ?  JSON.parse(conf['SMSRU_API_CONFIG']) : {}
        //TODO(zuch): Remove old env record
        if (isEmpty(config)) {
            config = conf['SMS_API_CONFIG'] ? JSON.parse(conf['SMS_API_CONFIG']) : {}
        }
        this.isConfigured = validateConfig(config, [
            'api_url',
            'token',
            'from',
        ])
        this.api_url = config.api_url
        this.token = config.token
        this.from = config.from
    }

    isPhoneSupported (phoneNumber) {
        return /^[+]7[0-9]{10}$/g.test(phoneNumber)
    }

    async checkIsAvailable () {
        const result = await fetch(
            `${this.api_url}/auth/check`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `api_id=${this.token}&json=1`,
            }
        )
        const json = await result.json()
        const status = json['status_code']
        const isOk = status === 100
        return isOk
    }

    async send ({ phone, message }, extendedParams = {}) {
        const body = {
            api_id: this.token,
            to: phone,
            from: this.from,
            json: 1,
            msg: message,
            ...extendedParams,
        }
        const result = await fetch(
            `${this.api_url}/sms/send`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: Object.entries(body)
                    .map(([name, value]) => `${name}=${encodeURI(value)}`)
                    .join('&'),
            }
        )
        const json = await result.json()
        const status = json['status_code']
        const isOk = status === 100
        return [isOk, json]
    }
}

class SmsCRu {
    static fieldsToCheck = ['api_url', 'login', 'password', 'sender']

    isConfigured = false

    constructor () {
        const defaultConfig = conf['SMSCRU_API_CONFIG'] ? JSON.parse(conf['SMSCRU_API_CONFIG']) : {}
        const appsConfigs = conf['SMSCRU_API_APPS_CONFIGS'] ? JSON.parse(conf['SMSCRU_API_APPS_CONFIGS']) : {}

        this.isConfigured = validateConfig(defaultConfig, SmsCRu.fieldsToCheck)
            && Object.values(appsConfigs).every(config => validateConfig(config, SmsCRu.fieldsToCheck))

        this.defaultConfig = SmsCRu.parseConfig(defaultConfig)
        // nosemgrep: javascript.lang.security.insecure-object-assign.insecure-object-assign
        this.appsConfigs = Object.assign({},
            ...Object.entries(appsConfigs)
                .map(([app, config]) => ({ [app]: SmsCRu.parseConfig(config) }))
        )
    }

    static parseConfig (config) {
        return {
            ...config,
            flash: config.flash || 0, // sms that appears on screen and is not saved to history
        }
    }

    isPhoneSupported (phoneNumber) {
        return AllCountriesTest.test(phoneNumber)
    }

    async checkIsAvailable () {
        const body = {
            login: this.defaultConfig.login,
            psw: this.defaultConfig.password,
            fmt: 3, // JSON answer
        }
        const result = await fetch(
            `${this.defaultConfig.api_url}/sys/balance.php`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(body).toString(),
            }
        )
        const json = await result.json()
        const { error_code } = json
        const isOk = !error_code
        return isOk
    }

    async send ({ phone, message, meta }, extendedParams = {}) {
        const appId = get(meta, 'appId')
        const config = appId && this.appsConfigs.hasOwnProperty(appId) ? this.appsConfigs[appId] : this.defaultConfig

        const body = {
            login: config.login,
            psw: config.password,
            sender: config.sender,
            phones: phone,
            mes: message,
            flash: config.flash,
            fmt: 3, // JSON answer
            ...extendedParams,
        }
        const result = await fetch(
            `${config.api_url}/sys/send.php`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(body).toString(),
            }
        )
        const json = await result.json()
        const { error_code } = json
        const isOk = !error_code
        return [isOk, json]
    }
}


module.exports = {
    SMSAdapter,
}
