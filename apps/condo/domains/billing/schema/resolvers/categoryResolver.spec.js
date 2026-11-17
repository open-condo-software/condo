const { DEFAULT_BILLING_CATEGORY_ID } = require('@condo/domains/billing/constants/constants')
const { PARKING_UNIT_TYPE } = require('@condo/domains/property/constants/common')

const { createCategoryIndex, detectCategory } = require('./categoryResolver')

const mockCategories = [
    { id: DEFAULT_BILLING_CATEGORY_ID, name: 'billing.category.housing.name', serviceNames: [] },
    { id: 'overhaul', name: 'billing.category.overhaul.name', serviceNames: ['Overhaul', 'Penny for overhaul'] },
    { id: 'electricity', name: 'billing.category.electricity.name', serviceNames: ['Electricity'] },
    { id: 'parking', name: 'billing.category.parking.name' },
]

const mockReceipts = [
    {
        receipt: { category: { id: 'unknown category' }, services: [ { name: 'Electricity' } ] },
        expectError: { code: 'BAD_USER_INPUT', type: 'NOT_FOUND' },
        description: 'return error on bad user defined category',
    },
    {
        receipt: { category: { id: 'overhaul' }, services: [] },
        result: 'overhaul',
        description: 'do not correct user defined category on empty services',
    },
    {
        receipt: { category: { id: 'overhaul' }, services: [ { name: 'Electricity' } ] },
        result: 'overhaul',
        description: 'do not correct user defined category if can auto-detect by services',
    },
    {
        receipt: { services: [{ name: 'Penny for overhaul' }, { name: 'Overhaul' }] },
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
        result: DEFAULT_BILLING_CATEGORY_ID,
        description: 'set default category on mixed services' },
    {
        receipt: { services: [{ name: 'Some unknown service name' }] },
        result: DEFAULT_BILLING_CATEGORY_ID,
        description: 'set default category on unknown services',
    },
    {
        receipt: { category: { id: DEFAULT_BILLING_CATEGORY_ID }, services: [ { name: 'Electricity' } ] },
        result: DEFAULT_BILLING_CATEGORY_ID,
        description: 'User-defined category has priority over auto-detection',
    },
    {
        receipt: { addressMeta: { unitType: PARKING_UNIT_TYPE }, services: [ { name: 'Electricity' } ] },
        result: 'electricity',
        description: 'Services have higher priority than the type of premises',
    },
    {
        receipt: { addressResolve: { unitType: PARKING_UNIT_TYPE }, services: [ { name: 'Some service' } ] },
        result: 'parking',
        description: 'If services have no information unitType will determine category',
    },
]

const categoryIndex = createCategoryIndex(mockCategories)

describe('Detect Billing Category', () => {
    test.each(mockReceipts)('$description', ({ receipt, result, expectError }) => {
        const { error, result: { id: categoryId } = {} } = detectCategory(receipt, categoryIndex)
        expect(categoryId).toEqual(result)
        if (expectError) {
            expect(error.code).toEqual(expectError.code)
            expect(error.type).toEqual(expectError.type)
        }
    })
})
