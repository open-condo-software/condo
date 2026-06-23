const path = require('path')

const index = require('@app/condo/index')

const conf = require('@open-condo/config')
const { FileMiddlewareTests } = require('@open-condo/files/fileMiddleware.test')
const { FileMiddlewareUtilsTests } = require('@open-condo/files/utils.test')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser, User } = require('@condo/domains/user/utils/testSchema')

const TEST_FILE = path.resolve(conf['PROJECT_ROOT'], 'apps/condo/domains/common/test-assets/dino.png')

setFakeClientMode(index, { excludeApps: ['NextApp', 'AdminUIApp'] })

describe('external file middleware tests', () => {
    FileMiddlewareTests(TEST_FILE, User, makeClientWithNewRegisteredAndLoggedInUser, createTestOrganization)
})

describe('external file middleware utils', () => {
    FileMiddlewareUtilsTests()
})
