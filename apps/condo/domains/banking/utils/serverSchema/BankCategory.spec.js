/**
 * @jest-environment node
 */

const { makeLoggedInAdminClient, setFakeClientMode, prepareKeystoneExpressApp } = require('@condo/keystone/test.utils')
const { createTestBankCategory, BankCategory } = require('../testSchema')
const { buildNestedSetIndex } = require('./BankCategory')

let keystone

const dvSender = {
    dv: 1,
    sender: { dv: 1, fingerprint: 'jest-test' },
}

describe('buildNestedSetIndex', () => {
    const keystoneIndex = require.resolve('../../../../index')
    setFakeClientMode(require.resolve(keystoneIndex))

    beforeAll(async () => {
        const result = await prepareKeystoneExpressApp(require.resolve(keystoneIndex))
        keystone = result.keystone
    })

    it('builds index according to depth-first search respecting "sortOrder" field', async () => {
        const admin = await makeLoggedInAdminClient()
        const [rootCategory] = await createTestBankCategory(admin, { name: 'root' })
        const [category1] = await createTestBankCategory(admin, { name: 'category1', parent: { connect: { id: rootCategory.id } }, sortOrder: 1 })
        const [category11] = await createTestBankCategory(admin, { name: 'category11', parent: { connect: { id: category1.id } }, sortOrder: 1 })
        const [category12] = await createTestBankCategory(admin, { name: 'category12', parent: { connect: { id: category1.id } }, sortOrder: 2 })
        const [category2] = await createTestBankCategory(admin, { name: 'category2', parent: { connect: { id: rootCategory.id } }, sortOrder: 2 })
        const [category21] = await createTestBankCategory(admin, { name: 'category21', parent: { connect: { id: category2.id } }, sortOrder: 1 })
        const [category22] = await createTestBankCategory(admin, { name: 'category22', parent: { connect: { id: category2.id } }, sortOrder: 2 })
        const [category3] = await createTestBankCategory(admin, { name: 'category3', parent: { connect: { id: rootCategory.id } }, sortOrder: 2 })
        // Different order
        const [category3_second] = await createTestBankCategory(admin, { name: 'category3_second', parent: { connect: { id: category3.id } }, sortOrder: 2 })
        const [category3_first] = await createTestBankCategory(admin, { name: 'category3_first', parent: { connect: { id: category3.id } }, sortOrder: 1 })

        await buildNestedSetIndex(keystone, dvSender, rootCategory)

        const updatedRoot = await BankCategory.getOne(admin, { id: rootCategory.id })
        expect(updatedRoot.depth).toEqual(0)
        expect(updatedRoot.left).toEqual(1)
        expect(updatedRoot.right).toEqual(20)
        const updatedCategory1 = await BankCategory.getOne(admin, { id: category1.id })
        expect(updatedCategory1.depth).toEqual(1)
        expect(updatedCategory1.left).toEqual(2)
        expect(updatedCategory1.right).toEqual(7)
        const updatedCategory11 = await BankCategory.getOne(admin, { id: category11.id })
        expect(updatedCategory11.depth).toEqual(2)
        expect(updatedCategory11.left).toEqual(3)
        expect(updatedCategory11.right).toEqual(4)
        const updatedCategory12 = await BankCategory.getOne(admin, { id: category12.id })
        expect(updatedCategory12.depth).toEqual(2)
        expect(updatedCategory12.left).toEqual(5)
        expect(updatedCategory12.right).toEqual(6)
        const updatedCategory2 = await BankCategory.getOne(admin, { id: category2.id })
        expect(updatedCategory2.depth).toEqual(1)
        expect(updatedCategory2.left).toEqual(8)
        expect(updatedCategory2.right).toEqual(13)
        const updatedCategory21 = await BankCategory.getOne(admin, { id: category21.id })
        expect(updatedCategory21.depth).toEqual(2)
        expect(updatedCategory21.left).toEqual(9)
        expect(updatedCategory21.right).toEqual(10)
        const updatedCategory22 = await BankCategory.getOne(admin, { id: category22.id })
        expect(updatedCategory22.depth).toEqual(2)
        expect(updatedCategory22.left).toEqual(11)
        expect(updatedCategory22.right).toEqual(12)
        const updatedCategory3 = await BankCategory.getOne(admin, { id: category3.id })
        expect(updatedCategory3.depth).toEqual(1)
        expect(updatedCategory3.left).toEqual(14)
        expect(updatedCategory3.right).toEqual(19)
        const updatedCategory3_first = await BankCategory.getOne(admin, { id: category3_first.id })
        expect(updatedCategory3_first.depth).toEqual(2)
        expect(updatedCategory3_first.left).toEqual(15)
        expect(updatedCategory3_first.right).toEqual(16)
        const updatedCategory3_second = await BankCategory.getOne(admin, { id: category3_second.id })
        expect(updatedCategory3_second.depth).toEqual(2)
        expect(updatedCategory3_second.left).toEqual(17)
        expect(updatedCategory3_second.right).toEqual(18)
    })
})