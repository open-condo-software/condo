/**
 * Generated by `createschema marketplace.MarketItem 'name:Text; marketCategory:Relationship:MarketCategory:SET_NULL; sku:Text; description:Text; organization:Relationship:Organization:CASCADE;'`
 */

import {
    MarketItem,
    MarketItemCreateInput,
    MarketItemFile,
    MarketItemPrice,
    MarketItemPriceCreateInput,
    MarketItemUpdateInput,
    MarketPriceScope,
    MarketPriceScopeCreateInput,
    Property,
    QueryAllMarketItemsArgs,
} from '@app/condo/schema'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isUndefined from 'lodash/isUndefined'

import { generateReactHooks, IUseCreateManyActionType } from '@open-condo/codegen/generate.hooks'

import { UploadFileType } from '@condo/domains/common/components/ImagesUploadList'
import { MarketItem as MarketItemGQL } from '@condo/domains/marketplace/gql'


const RELATIONS = ['marketCategory']
const DISCONNECT_ON_NULL = ['marketCategory']
const IGNORE_FORM_FIELDS = ['parentCategory']

export enum PriceType {
    Exact = 'exact',
    Min = 'min',
    Contract = 'contract',
}

export enum PriceMeasuresType {
    PerHour = 'perHour',
    PerItem = 'perItem',
    PerMeter = 'perMeter',
}

export type PriceFormValuesType = {
    properties?: string[]
    priceType?: PriceType
    measure?: PriceMeasuresType
    price?: string
    hasAllProperties?: boolean
    id?: string
}

export type MarketItemFormValuesType = {
    name?: string
    sku?: string
    parentCategory?: string
    marketCategory?: string
    description?: string
    files?: UploadFileType[]
    prices?: PriceFormValuesType[]
    selectedProperties?: string[]
}

type ConvertToFormStateArgsType = {
    marketItem: MarketItem
    marketItemPrices: MarketItemPrice[]
    marketPriceScopes: MarketPriceScope[]
    marketItemFiles: MarketItemFile[]
    initialProperties: Property[]
}

export const convertFilesToUploadType: (files: MarketItemFile[]) => UploadFileType[] = (files) => {
    return files.map(fileObj => ({
        uid: get(fileObj, 'id'),
        name: get(fileObj, 'file.originalFilename'),
        status: 'done',
        url: get(fileObj, 'file.publicUrl'),
        response: { id: get(fileObj, 'id'), url: get(fileObj, 'file.publicUrl') },
    }))
}

export function convertToFormState ({ marketItem, marketItemPrices, marketPriceScopes, marketItemFiles, initialProperties }: ConvertToFormStateArgsType): MarketItemFormValuesType {
    const result: MarketItemFormValuesType = {}

    for (const key of Object.keys(marketItem)) {
        const relationId = get(marketItem[key], 'id')

        result[key] = relationId || marketItem[key]

        if (key === 'marketCategory') {
            result['marketCategoryName'] = get(marketItem, 'marketCategory.name')
            result['parentCategory'] = get(marketItem, 'marketCategory.parentCategory.id')
        }
    }

    const prices = []
    for (const marketItemPrice of marketItemPrices) {
        const id = marketItemPrice.id
        const priceScopes = marketPriceScopes.filter(scope => scope.marketItemPrice.id === marketItemPrice.id)
        const properties = priceScopes.map(priceScope => get(priceScope, 'property.id')).filter(Boolean)
        const hasAllProperties = priceScopes.length === 1 && !priceScopes[0].property

        const [priceObj] = get(marketItemPrice, 'price')
        const priceFromObj = get(priceObj, 'price')
        const measureFromPriceObj = get(priceObj, 'measure')
        const isMinPrice = get(priceObj, 'isMin')

        let priceType
        let price
        if (isMinPrice) {
            priceType = priceFromObj === '0' ? PriceType.Contract : PriceType.Min
            price = priceFromObj === '0' ? null : priceFromObj
        } else {
            priceType = PriceType.Exact
            price = priceFromObj
        }

        if (hasAllProperties && initialProperties.length === 1) {
            prices.push({ id, priceType, price, properties: initialProperties[0].id, hasAllProperties: false, measure: measureFromPriceObj })
        } else {
            prices.push({ id, priceType, price, properties, hasAllProperties, measure: measureFromPriceObj })
        }
    }

    result['prices'] = prices

    result['files'] = convertFilesToUploadType(marketItemFiles)

    return result
}

type MarketItemMutationType = MarketItemUpdateInput | MarketItemCreateInput

export function formValuesProcessor (formValues: MarketItemFormValuesType): MarketItemMutationType {
    const result: MarketItemMutationType = {}

    for (const key of Object.keys(formValues)) {
        if (IGNORE_FORM_FIELDS.includes(key)) continue
        const isRelation = RELATIONS.includes(key)

        if (isRelation) {
            if (DISCONNECT_ON_NULL.includes(key) && formValues[key] === null) {
                result[key] = { disconnectAll: true }
            } else if (formValues[key]) {
                result[key] = { connect: { id: formValues[key] } }
            }
        } else if (!isUndefined(formValues[key])) {
            result[key] = formValues[key]
        }
    }

    return result
}

export function formatFormPricesField (prices, propertiesCount): PriceFormValuesType[] {
    const mappedPrices = prices.map(
        priceObj => ({ ...priceObj, price: priceObj.price?.replace(',', '.') })
    )

    if (propertiesCount === 1 && mappedPrices.length === 1) {
        mappedPrices[0].hasAllProperties = true
    }

    return mappedPrices
}

export function getPriceValueFromFormPrice ({ priceType, price }) {
    let resultPrice
    let isMin
    if (priceType === PriceType.Exact) {
        resultPrice = price
        isMin = false
    } else if (priceType === PriceType.Min) {
        resultPrice = price
        isMin = true
    } else if (priceType === PriceType.Contract) {
        resultPrice = '0'
        isMin = true
    }

    return { price: resultPrice, isMin }
}

type CreateNewPricesAndPriceScopesArgType = {
    marketItem: MarketItem
    prices: PriceFormValuesType[]
    createMarketItemPrice: (data: MarketItemPriceCreateInput) => Promise<MarketItemPrice>
    createMarketPriceScopes: IUseCreateManyActionType<MarketPriceScope, MarketPriceScopeCreateInput>
}

export async function createNewPricesAndPriceScopes ({
    marketItem,
    prices,
    createMarketItemPrice,
    createMarketPriceScopes,
}: CreateNewPricesAndPriceScopesArgType) {
    for (const formPrice of prices) {
        const { properties, hasAllProperties, price, priceType, measure } = formPrice

        let processedMeasure = measure
        if (!measure) {
            processedMeasure = undefined
        }

        const { price: resultPrice, isMin } = getPriceValueFromFormPrice({ priceType, price })

        const createdPrice = await createMarketItemPrice({
            price: [{ type: 'variant', name: marketItem.name, price: resultPrice, isMin, measure: processedMeasure }],
            marketItem: { connect: { id: marketItem.id } },
        })

        if (hasAllProperties) {
            await createMarketPriceScopes([
                {
                    marketItemPrice: { connect: { id: createdPrice.id } },
                },
            ])
        } else {
            if (!isEmpty(properties)) {
                await createMarketPriceScopes(
                    properties.map(propertyId => ({
                        marketItemPrice: { connect: { id: createdPrice.id } },
                        property: { connect: { id: propertyId } },
                    }))
                )
            }
        }
    }
}

export const INITIAL_PRICE_FORM_VALUE = { properties: [], priceType: PriceType.Exact }

const FORM_REQUIRED_FIELDS = ['prices', 'name', 'sku', 'parentCategory', 'marketCategory']

export const getSaveButtonTooltipMessage = (form, intl) => {
    const RequiredErrorMessage = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const ManyAllPropertiesPriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.actionButtonTooltip.manyHasAllProperties' })

    const requiredFields = form.getFieldsValue(FORM_REQUIRED_FIELDS)
    const { prices } = requiredFields
    const hasManyAllPropertiesCheckboxes = prices && prices.filter(price => price.hasAllProperties).length > 1

    const errors = []
    const requiredFieldsMessage = FORM_REQUIRED_FIELDS.map(fieldName => {
        if (fieldName === 'prices') {
            const hasEmptyAddresses = prices.some(price => isEmpty(get(price, 'properties')) && !price.hasAllProperties)
            const hasEmptyPrice = prices.some(price => isEmpty(get(price, 'price')) && get(price, 'priceType') !== PriceType.Contract)
            const messages = []

            if (hasEmptyAddresses) {
                messages.push(
                    intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.addresses' }).toLowerCase()
                )
            }
            if (hasEmptyPrice) {
                messages.push(
                    intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.price' }).toLowerCase()
                )
            }

            return messages.join(', ')
        }

        if (!requiredFields[fieldName]) {
            return intl.formatMessage({ id: `pages.condo.marketplace.marketItem.form.field.${fieldName}` })
                .toLowerCase()
        }

        return ''
    }).filter(Boolean)

    if (hasManyAllPropertiesCheckboxes) {
        errors.push(ManyAllPropertiesPriceLabel)
    }

    if (!isEmpty(requiredFieldsMessage)) {
        errors.push(`${RequiredErrorMessage} ${requiredFieldsMessage.join(', ')}`)
    }

    return errors.join('. ')
}


const {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useSoftDelete,
    useCount,
    useAllObjects,
} = generateReactHooks<MarketItem, MarketItemCreateInput, MarketItemUpdateInput, QueryAllMarketItemsArgs>(MarketItemGQL)

export {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useSoftDelete,
    useCount,
    useAllObjects,
}
