const { isEmpty, get } = require('lodash')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')

const { DEFAULT_BILLING_CATEGORY_ID } = require('@condo/domains/billing/constants/constants')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')

const BILLING_CATEGORY_FIELDS = '{ id name serviceNames }'
const BillingCategoryGQL = generateGqlQueries('BillingCategory', BILLING_CATEGORY_FIELDS)
const BillingCategoryApi = generateServerUtils(BillingCategoryGQL)

class CategoryResolver {
    constructor () {
        this.categories = {}
    }

    async loadCategories (context) {
        if (!isEmpty(this.categories)) {
            return
        }

        const categories = await loadListByChunks({
            context,
            list: BillingCategoryApi,
        })

        this.indexKeywords(categories)
    }

    indexKeywords (categories) {
        for (const category of categories) {
            if (category.serviceNames && Array.isArray(category.serviceNames) && !isEmpty(category.serviceNames)) {
                this.categories[category.id] = new Set(category.serviceNames.map(keyWord => keyWord.toLowerCase()))
            } else {
                this.categories[category.id] = new Set()
            }
        }
    }

    detectCategory (receipt) {
        const { category = {}, services = [] } = receipt
        const userDefinedCategory = get(category, 'id')
        if (category && userDefinedCategory && !Reflect.has(this.categories, userDefinedCategory)) {
            return { error: 'BILLING_CATEGORY_NOT_FOUND', categoryId: DEFAULT_BILLING_CATEGORY_ID, isUserDefinedCategory: true }
        }
        if (userDefinedCategory) {
            return { error: null, categoryId: userDefinedCategory, isUserDefinedCategory: true }
        }
        if (!services.length) {
            return { error: null, categoryId: DEFAULT_BILLING_CATEGORY_ID, isUserDefinedCategory: false }
        }
        const names = services.map(({ name }) => name.toLowerCase())
        let detected = DEFAULT_BILLING_CATEGORY_ID
        for (const categoryId of Object.keys(this.categories)) {
            if (this.categories[categoryId].size > 0) {
                const diffNames = names.filter(name => !this.categories[categoryId].has(name))
                if (diffNames.length === 0) {
                    detected = categoryId
                }
            }
        }

        if (isEmpty(detected)) {
            return { error: 'BILLING_CATEGORY_NOT_FOUND', categoryId: detected, isUserDefinedCategory: false }
        }

        return { error: null, categoryId: detected, isUserDefinedCategory: false }
    }
}

module.exports = {
    CategoryResolver,
}
