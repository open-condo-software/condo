const { isEmpty, get } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { DEFAULT_BILLING_CATEGORY_ID } = require('@condo/domains/billing/constants/constants')
const { ERRORS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')
const { WAREHOUSE_UNIT_TYPE, PARKING_UNIT_TYPE } = require('@condo/domains/property/constants/common')

const UNIT_TYPE_MAPPING = {
    [PARKING_UNIT_TYPE] : 'billing.category.parking.name',
    [WAREHOUSE_UNIT_TYPE] : 'billing.category.storage.name',
}

class CategoryResolver extends Resolver {

    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'category' })
        this.categories = []
        this.categoriesByNames = {}
        this.categoriesSearchIndex = {}
        this.forceCategoryDetect = get(billingContext, 'settings.forceCategoryDetect', false)
    }

    async init () {
        if (!isEmpty(this.categories)) {
            return
        }
        this.categories = await find('BillingCategory', { deletedAt: null })
        this.indexKeywords()
    }

    indexKeywords () {
        this.categoriesByNames = Object.fromEntries(this.categories.map(({ id, name }) => ([name, id])))
        for (const category of this.categories) {
            if (category.serviceNames && Array.isArray(category.serviceNames) && !isEmpty(category.serviceNames)) {
                this.categoriesSearchIndex[category.id] = new Set(category.serviceNames.map(keyWord => keyWord.toLowerCase()))
            } else {
                this.categoriesSearchIndex[category.id] = new Set()
            }
        }
    }

    detectCategoryByServices (services) {
        if (!services.length) {
            return DEFAULT_BILLING_CATEGORY_ID
        }
        const names = services.map(({ name }) => name.toLowerCase())
        let detected = DEFAULT_BILLING_CATEGORY_ID
        for (const categoryId of Object.keys(this.categoriesSearchIndex)) {
            if (this.categoriesSearchIndex[categoryId].size > 0) {
                const diffNames = names.filter(name => !this.categoriesSearchIndex[categoryId].has(name))
                if (diffNames.length === 0) {
                    detected = categoryId
                }
            }
        }
        return detected
    }

    detectCategoryByUnitType (unitType) {
        if (Reflect.has(UNIT_TYPE_MAPPING, unitType)) {
            return this.categoriesByNames[UNIT_TYPE_MAPPING[unitType]]
        }
    }

    detectCategory (receipt) {
        const { category = {}, services = [], addressResolve: { unitType = '' } = {} } = receipt
        const userDefinedCategory = get(category, 'id')
        if (category && userDefinedCategory && !this.categories.some(({ id }) => id === userDefinedCategory)) {
            return { error: ERRORS.BILLING_CATEGORY_NOT_FOUND }
        }
        const byServicesCategoryId = this.detectCategoryByServices(services)
        const byUnitTypeCategoryId = this.detectCategoryByUnitType(unitType)
        if (userDefinedCategory && !this.forceCategoryDetect) {
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

    async processReceipts (receiptIndex) {
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            const { error, result } = this.detectCategory(receipt, index)
            if (error) {
                receiptIndex[index].error = this.error(error, index)
                continue
            }
            if (result) {
                receiptIndex[index].category = get(result, 'id')
            }
        }
        return this.result(receiptIndex)
    }

}

module.exports = {
    CategoryResolver,
}