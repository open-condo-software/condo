const { faker  } = require('@faker-js/faker/locale/ru')

const { makeLoggedInAdminClient, makeClient } = require('@open-condo/keystone/test.utils')

const {
    makeClientWithServiceUser,
    makeClientWithSupportUser,
    makeLoggedInClient,
} = require('@condo/domains/user/utils/testSchema')

const { AcquiringTestMixin } = require('@condo/domains/billing/utils/testSchema/mixins/acquiring')
const { BillingTestMixin } = require('@condo/domains/billing/utils/testSchema/mixins/billing')
const { MeterTestMixin } = require('@condo/domains/billing/utils/testSchema/mixins/meter')
const { OrganizationTestMixin } = require('@condo/domains/billing/utils/testSchema/mixins/organization')
const { PropertyTestMixin } = require('@condo/domains/billing/utils/testSchema/mixins/property')
const { ResidentTestMixin } = require('@condo/domains/billing/utils/testSchema/mixins/resident')
const { ContactTestMixin } = require('@condo/domains/billing/utils/testSchema/mixins/contact')

/**
 * @mixes BillingTestMixinType
 * @mixes BillingTestMixin
 * @mixes AcquiringTestMixin
 * @mixes MeterTestMixin
 * @mixes ResidentTestMixin
 * @mixes PropertyTestMixin
 * @mixes ContactTestMixin
 */
class TestUtils {
    /**
     * @param {Object[]} [mixins=[]] - An array of mixins to apply
     */
    constructor (mixins = []) {
        this.clients = {}
        this.mixins = mixins
        if (mixins.length) {
            Object.assign(this, ...mixins)
        }
    }

    async init () {
        this.clients = {
            anonymous: await makeClient(),
            user: await makeLoggedInClient(),
            support: await makeClientWithSupportUser(),
            service: await makeClientWithServiceUser(),
            admin: await makeLoggedInAdminClient(),
            employee: {},
        }
        for (const mixin of this.mixins) {
            await mixin.initMixin.call(this)
        }
    }

    randomNumber (numDigits) {
        const min = 10 ** (numDigits - 1)
        const max = 10 ** numDigits - 1
        return faker.datatype.number({ min, max })
    }
}

module.exports = {
    TestUtils,
    AcquiringTestMixin,
    BillingTestMixin,
    MeterTestMixin,
    OrganizationTestMixin,
    PropertyTestMixin,
    ResidentTestMixin,
    ContactTestMixin,
}