const path = require('path')

const conf = require('@open-condo/config')
const { FileMiddlewareTests } = require('@open-condo/files/schema/models/index')

const { makeClientWithNewRegisteredAndLoggedInUser, User } = require('@condo/domains/user/utils/testSchema')

const TEST_FILE = path.resolve(conf['PROJECT_ROOT'], 'apps/condo/domains/common/test-assets/dino.png')


describe('external file middleware tests', () => {
    FileMiddlewareTests(TEST_FILE, User, makeClientWithNewRegisteredAndLoggedInUser)
})
