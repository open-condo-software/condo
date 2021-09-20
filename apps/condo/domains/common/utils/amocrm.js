
const axios = require('axios').default
const url = require('url')
const conf = require('@core/config')
const open = require('open')

class AMOCRMIntegration {
    constructor ({ client_id, client_secret }) {
        this.client_id = client_id
        this.client_secret = client_secret
        this.redirect_uri = `${conf.NGROK_URL}/amocrm`
        this.expiresAt = Date.now()
        this.axios = axios.create({
            baseURL: conf.AMOCRM_URL,
        })
        this.askAuthorize()
    }
    get integrationLink (){
        return `https://www.amocrm.ru/oauth?client_id=${this.client_id}&mode=popup`
    }
    askAuthorize () {
        console.log('👉 Please, authorize for amoCRM integration with url:', this.integrationLink)
    }
    async getToken () {
        if (!this.code) {
            if (conf.NODE_ENV == 'development') {
                this.askAuthorize()
                await open(this.integrationLink)
            }
            throw new Error('Not authorized in amoCRM')
        }
        try {
            const response = await this.axios.post('/oauth2/access_token', {
                client_id: this.client_id,
                client_secret: this.client_secret,
                code: this.code,
                redirect_uri: this.redirect_uri,
                grant_type: 'authorization_code',
            })
            if (response.status === 200) {
                this.access_token = response.data.access_token
                this.refresh_token = response.data.refresh_token
                this.expiresAt = Date.now() + response.data.expires_in * 1000
            }
        }
        catch (e) {
            console.log('amoCRM error', e.response.data)
        }
    }
    async request (query) {
        if (this.expiresAt - Date.now() < 4000) {
            await this.getToken()
        }
        try {
            this.axios.defaults.headers = {
                'Authorization': `Bearer ${this.access_token}`,
            }
            return await query()
        }
        catch (e) {
            console.log('amoCRM error', e.response.data)
            return null
        }
    }
    async addLead () {
        const query = () => this.axios.post('/api/v4/leads', [
            {
                'name': 'Сделка для примера 1',
                'created_by': 0,
                'price': 20000,
                'custom_fields_values': [
                    {
                        'field_id': 294471,
                        'values': [
                            {
                                'value': 'Наш первый клиент',
                            },
                        ],
                    },
                ],
            },
            {
                'name': 'Сделка для примера 2',
                'price': 10000,
                '_embedded': {
                    'tags': [
                        {
                            'id': 2719,
                        },
                    ],
                },
            },
        ])
        const response = await this.request(query)
        console.log(response.data)
    }
    _setCode (code) {
        this.code = code
    }
}

const amocrmInstance = new AMOCRMIntegration({
    client_id: conf.AMOCRM_CLIENT_ID,
    client_secret: conf.AMOCRM_CLIENT_SECRET,
})

/** @type {import('express').Handler} */
function amoCRMMiddlewareHandler (req, res, next) {
    const { query } = url.parse(req.url, true)
    const { code, state } = query
    amocrmInstance._setCode(code)
    res.redirect(conf.SERVER_URL)
}
module.exports = {
    amocrmInstance,
    amoCRMMiddlewareHandler,
    AMOCRMIntegration,
}