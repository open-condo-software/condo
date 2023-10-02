const { DEFAULT_BILLING_CATEGORY_ID } = require('@condo/domains/billing/constants/constants')

const { CategoryResolver } = require('./categoryResolver')

const mockCategories = [
    { id: DEFAULT_BILLING_CATEGORY_ID, name: 'billing.category.housing.name', serviceNames: [] },
    { id: 'overhaul', name: 'billing.category.overhaul.name', serviceNames: ['Overhaul', 'Penny for overhaul'] },
    { id: 'electricity', name: 'billing.category.electricity.name', serviceNames: ['Electricity'] },
]

const mockReceipts = [
    {
        receipt: { category: { id: 'unknown category' }, services: [ { name: 'Electricity' } ] },
        error: 'BILLING_CATEGORY_NOT_FOUND',
        result: DEFAULT_BILLING_CATEGORY_ID,
        description: 'return error on bad user defined category',
    },
    {
        receipt: { category: { id: 'overhaul' }, services: [] },
        result: 'overhaul',
        error: null,
        description: 'do not correct user defined category on empty services',
    },
    {
        receipt: { category: { id: 'overhaul' }, services: [ { name: 'Electricity' } ] },
        error: null,
        result: 'overhaul',
        description: 'do not correct user defined category if can auto-detect by services',
    },
    {
        receipt: { services: [{ name: 'Penny for overhaul' }, { name: 'Overhaul' }] },
        error: null,
        result: 'overhaul',
        description: 'set category on a several services - all in serviceNames for one category',
    },
    {
        receipt: { services: [{ name: 'Electricity' }] },
        result: 'electricity',
        error: null,
        description: 'set category on a single service',
    },
    {
        receipt: { services: [{ name: 'Penny for overhaul' }, { name: 'Overhaul' }, { name: 'Electricity' }] },
        error: null,
        result: DEFAULT_BILLING_CATEGORY_ID,
        description: 'set default category on mixed services' },
    {
        receipt: { services: [{ name: 'Some unknown service name' }] },
        error: null,
        result: DEFAULT_BILLING_CATEGORY_ID,
        description: 'set default category on unknown services',
    },
]

let helper = new CategoryResolver()
helper.indexKeywords(mockCategories, mockCategories[0])

describe('Detect Billing Category', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    test.each(mockReceipts)('$description', ({ receipt, result, error, description }) => {
        const { error: detectError, categoryId } = helper.detectCategory(receipt)
        expect(categoryId).toEqual(result)
        expect(error).toEqual(detectError)
    })
})
