const dayjs = require('dayjs')

const { ApolloServerClient } = require('@open-condo/apollo-server-client')
const conf = require('@open-condo/config')

const {
    botGql: {
        Contact: ContactGQL,
        Property: PropertyGQL,
        B2CAppProperty: B2CAppPropertyGQL,
        User: UserGQL,
        Organization: OrganizationGQL,
    },
} = require('@{{name}}/domains/condo/gql')


const { endpoint, authRequisites } = conf['SERVICE_INTEGRATION'] ? JSON.parse(conf['SERVICE_INTEGRATION']) : {}

let EXISTING_BOT


class ServiceBot extends ApolloServerClient {
    static async init () {
        if (!EXISTING_BOT) {
            EXISTING_BOT = new ServiceBot(endpoint, authRequisites, { clientName: 'service-bot' })
            await EXISTING_BOT.signIn()
        }
        return EXISTING_BOT
    }

    async getContacts (where = {}) {
        return await this.getModels({
            modelGql: ContactGQL,
            where: {
                ...where,
                deletedAt: null,
            },
        })
    }

    async createContact (createInput = {}) {
        return await this.createModel({
            modelGql: ContactGQL,
            createInput,
        })
    }

    async getProperties (where = {}, first, skip, sortBy) {
        return await this.getModels({
            modelGql: PropertyGQL,
            where: {
                ...where,
                deletedAt: null,
            },
            first, skip, sortBy,
        })
    }

    async getPropertyCount (where = {}) {
        return await this.getCount({
            modelGql: PropertyGQL,
            where: {
                ...where,
                deletedAt: null,
            },
        })
    }

    async getB2CProperties (where = {}, first, skip, sortBy) {
        return await this.getModels({
            modelGql: B2CAppPropertyGQL,
            where: {
                ...where,
                deletedAt: null,
            },
            first, skip, sortBy,
        })
    }

    async getB2CPropertyCount (where = {}) {
        return await this.getCount({
            modelGql: B2CAppPropertyGQL,
            where: {
                ...where,
                deletedAt: null,
            },
        })
    }

    async createB2CAppProperty (createInput = {}) {
        return await this.createModel({
            modelGql: B2CAppPropertyGQL,
            createInput,
        })
    }

    async softDeleteB2CAppProperty (id) {
        return await this.updateModel({
            modelGql: B2CAppPropertyGQL,
            id,
            updateInput: {
                deletedAt: dayjs().toISOString(),
            },
        })
    }

    async getUsers (where = {}, first, skip, sortBy) {
        return await this.getModels({
            modelGql: UserGQL,
            where: {
                ...where,
                deletedAt: null,
            },
            first, skip, sortBy,
        })
    }

    async getOrganizations (where = {}, first, skip, sortBy) {
        return await this.getModels({
            modelGql: OrganizationGQL,
            where: {
                ...where,
                deletedAt: null,
            },
            first, skip, sortBy,
        })
    }
}


module.exports = {
    ServiceBot,
}
