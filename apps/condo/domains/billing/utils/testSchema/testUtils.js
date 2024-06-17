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
        const resolvedMixins = this.resolveMixins(mixins)
        if (resolvedMixins.length) {
            Object.assign(this, ...resolvedMixins)
        }
        this.mixins = resolvedMixins
    }

    resolveMixins(mixins) {
        const resolvedMixins = new Map()
        const dependencyGraph = new Map()
        const addMixinToGraph = (mixin) => {
            if (!resolvedMixins.has(mixin)) {
                resolvedMixins.set(mixin, mixin)
                dependencyGraph.set(mixin, mixin.dependsOn || [])
                if (mixin.dependsOn) {
                    mixin.dependsOn.forEach(addMixinToGraph)
                }
            }
        }
        mixins.forEach(addMixinToGraph)
        const sortedMixins = this.topologicalSort(dependencyGraph)
        return sortedMixins.map(mixin => resolvedMixins.get(mixin))
    }

    topologicalSort(dependencyGraph) {
        const inDegree = new Map()
        const zeroInDegreeQueue = []
        const sortedMixins = []

        dependencyGraph.forEach((dependencies, mixin) => {
            if (!inDegree.has(mixin)) {
                inDegree.set(mixin, 0);
            }
            dependencies.forEach(dependency => {
                inDegree.set(dependency, (inDegree.get(dependency) || 0) + 1)
            })
        });

        inDegree.forEach((degree, mixin) => {
            if (degree === 0) {
                zeroInDegreeQueue.push(mixin);
            }
        });

        while (zeroInDegreeQueue.length > 0) {
            const mixin = zeroInDegreeQueue.shift();
            sortedMixins.push(mixin);
            dependencyGraph.get(mixin).forEach(dependency => {
                inDegree.set(dependency, inDegree.get(dependency) - 1)
                if (inDegree.get(dependency) === 0) {
                    zeroInDegreeQueue.push(dependency)
                }
            })
        }

        if (sortedMixins.length !== dependencyGraph.size) {
            throw new Error('There is a cycle in the mixin dependencies')
        }

        return sortedMixins.reverse()
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
            mixin.initMixin && await mixin.initMixin.call(this)
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