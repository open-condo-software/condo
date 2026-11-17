const { find } = require('@open-condo/keystone/schema')

const { DEFAULT_BILLING_CATEGORY_ID } = require('@condo/domains/billing/constants/constants')
const { ERRORS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { createStageContext } = require('@condo/domains/billing/schema/resolvers/resolver')
const { PARKING_UNIT_TYPE } = require('@condo/domains/property/constants/common')

const UNIT_TYPE_MAPPING = {
    [PARKING_UNIT_TYPE] : 'billing.category.parking.name',
}

function createCategoryIndex (categories) {
    const categoryIds = new Set()
    const categoriesByNames = new Map()
    const serviceNamesByCategory = new Map()
    for (const { id, name, serviceNames } of categories) {
        categoryIds.add(id)
        categoriesByNames.set(name, id)
        serviceNamesByCategory.set(id, new Set(
            Array.isArray(serviceNames) ? serviceNames.map(serviceName => serviceName.toLowerCase()) : []
        ))
    }
    return { categoryIds, categoriesByNames, serviceNamesByCategory }
}

function detectCategoryByServices (services, serviceNamesByCategory) {
    if (!services.length) return DEFAULT_BILLING_CATEGORY_ID

    const names = services.map(({ name }) => name.toLowerCase())
    let detected = DEFAULT_BILLING_CATEGORY_ID
    for (const [categoryId, serviceNames] of serviceNamesByCategory) {
        if (serviceNames.size > 0 && names.every(name => serviceNames.has(name))) {
            detected = categoryId
        }
    }
    return detected
}

function detectCategory (receipt, categoryIndex) {
    const { category = {}, services = [], addressResolve: { unitType = '' } = {} } = receipt
    const userDefinedCategory = category?.id
    if (category && userDefinedCategory && !categoryIndex.categoryIds.has(userDefinedCategory)) {
        return {
            error: ERRORS.BILLING_CATEGORY_NOT_FOUND,
            messageInterpolation: { categoryId: userDefinedCategory },
        }
    }
    const byServicesCategoryId = detectCategoryByServices(services, categoryIndex.serviceNamesByCategory)
    const byUnitTypeCategoryId = Reflect.has(UNIT_TYPE_MAPPING, unitType)
        ? categoryIndex.categoriesByNames.get(UNIT_TYPE_MAPPING[unitType])
        : undefined
    if (userDefinedCategory) {
        return { error: null, result: { id: userDefinedCategory } }
    }
    if (byServicesCategoryId && byServicesCategoryId !== DEFAULT_BILLING_CATEGORY_ID) {
        return { error: null, result: { id: byServicesCategoryId } }
    }
    if (byUnitTypeCategoryId && byUnitTypeCategoryId !== DEFAULT_BILLING_CATEGORY_ID) {
        return { error: null, result: { id: byUnitTypeCategoryId } }
    }
    return  { error: null, result: { id: DEFAULT_BILLING_CATEGORY_ID } }
}

async function resolveCategories (receiptIndex, { context }) {
    const stage = createStageContext({ name: 'category', context })
    const categories = await find('BillingCategory', { deletedAt: null })
    const categoryIndex = createCategoryIndex(categories)
    for (const [index, receipt] of Object.entries(receiptIndex)) {
        const { error, messageInterpolation, result } = detectCategory(receipt, categoryIndex)
        if (error) {
            receiptIndex[index].error = stage.error(error, index, null, messageInterpolation)
            continue
        }
        if (result) {
            receiptIndex[index].category = result.id
        }
    }
    return stage.result(receiptIndex)
}

module.exports = {
    createCategoryIndex,
    detectCategory,
    resolveCategories,
}
