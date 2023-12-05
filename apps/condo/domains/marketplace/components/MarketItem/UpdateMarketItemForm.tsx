import { SortMarketItemFilesBy, SortMarketItemPricesBy } from '@app/condo/schema'
import { Col, Form } from 'antd'
import { isEqual, sortBy } from 'lodash'
import difference from 'lodash/difference'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Tooltip } from '@open-condo/ui'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import {
    InvoiceContext,
    MarketItem,
    MarketItemFile,
    MarketItemPrice,
    MarketPriceScope,
} from '@condo/domains/marketplace/utils/clientSchema'
import {
    getPriceValueFromFormPrice,
    getSaveButtonTooltipMessage,
} from '@condo/domains/marketplace/utils/clientSchema/MarketItem'

import { BaseMarketItemForm } from './BaseMarketItemForm'


export const UpdateMarketItemForm = ({ marketItem }) => {
    const intl = useIntl()
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })

    const { organization } = useOrganization()

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: get(organization, 'id', null) },
        },
    })

    const {
        objs: marketItemPrices,
        loading: marketItemPricesLoading,
        error: marketItemPriceError,
    } = MarketItemPrice.useObjects({
        where: {
            marketItem: { id: get(marketItem, 'id') },
        },
        sortBy: [SortMarketItemPricesBy.CreatedAtAsc],
    }, { skip: !marketItem })

    const initialMarketItemPricesIds = useMemo(
        () => marketItemPrices.map(({ id }) => id),
        [marketItemPrices])

    const {
        objs: marketPriceScopes,
        loading: marketPriceScopesLoading,
        error: marketPriceScopesError,
    } = MarketPriceScope.useAllObjects({
        where: { marketItemPrice: { id_in: initialMarketItemPricesIds } },
    }, { skip: isEmpty(initialMarketItemPricesIds) })

    const {
        objs: marketItemFiles,
        loading: marketItemFilesLoading,
        error: marketItemFilesError,
    } = MarketItemFile.useObjects({
        where: {
            marketItem: { id: get(marketItem, 'id') },
        },
        sortBy: [SortMarketItemFilesBy.CreatedAtAsc],
    })

    const router = useRouter()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)

    const updateMarketItem = MarketItem.useUpdate({})
    const createMarketItemPrice = MarketItemPrice.useCreate({})
    const updateMarketItemPrice = MarketItemPrice.useUpdate({})
    const softDeleteMarketItemPrice = MarketItemPrice.useSoftDelete()
    const createMarketPriceScopes = MarketPriceScope.useCreateMany({})
    const createMarketPriceScope = MarketPriceScope.useCreate({})
    const softDeleteMarketPriceScopes = MarketPriceScope.useSoftDeleteMany()
    const softDeleteMarketPriceScope = MarketPriceScope.useSoftDelete()
    const updateMarketItemFile = MarketItemFile.useUpdate({})
    const softDeleteMarketItemFile = MarketItemFile.useSoftDelete()

    const handleUpdateMarketItem = useCallback(async (values) => {
        setSubmitLoading(true)
        const { prices: formPrices, files, ...marketItemValues } = values

        const updatedMarketItem = await updateMarketItem(MarketItem.formValuesProcessor(marketItemValues), marketItem)

        const prices = MarketItem.formatFormPricesField(formPrices)
        // handle changed prices and price scopes
        const newPrices = prices.filter(price => !price.id)
        await MarketItem.createNewPricesAndPriceScopes({
            marketItem: updatedMarketItem,
            prices: newPrices,
            invoiceContext,
            createMarketItemPrice,
            createMarketPriceScopes,
        })

        const existedPrices = prices.filter(price => price.id)

        for (const price of existedPrices) {
            const { priceType, price: formPrice, id, hasAllProperties, properties } = price
            const { price: resultPrice, isMin } = getPriceValueFromFormPrice({ priceType, price: formPrice })

            const initialMarketItemPrice = marketItemPrices.find(marketItemPrice => marketItemPrice.id === price.id)
            const initialPriceArray = get(initialMarketItemPrice, 'price')
            const initialPriceObj = get(initialPriceArray, '0')

            if (get(initialPriceObj, 'price') !== resultPrice || get(initialPriceObj, 'isMin') !== isMin) {
                const { __typename, ...initialPrice } = initialPriceObj
                const newPrice = { ...initialPrice, price: resultPrice, isMin }
                await updateMarketItemPrice({
                    price: [newPrice],
                }, { id })
            }

            const initialPriceScopes = marketPriceScopes.filter(scope => scope.marketItemPrice.id === id)

            const isInitialHasAllProperties = initialPriceScopes.length === 1 && !initialPriceScopes[0].property
            const initialPriceScopeProperties = initialPriceScopes.map(scope => get(scope, 'property.id')).filter(Boolean)

            if (isInitialHasAllProperties && !hasAllProperties) {
                const scopeWithAllProperties = initialPriceScopes.find(scope => !scope.property)
                if (!isEmpty(scopeWithAllProperties)) {
                    await softDeleteMarketPriceScope(scopeWithAllProperties)
                }

                if (!isEmpty(properties)) {
                    await createMarketPriceScopes(properties.map(propertyId => ({
                        marketItemPrice: { connect: { id } },
                        property: { connect: { id: propertyId } },
                    })))
                }
            } else if (!isInitialHasAllProperties && hasAllProperties) {
                if (initialPriceScopes) {
                    await softDeleteMarketPriceScopes(initialPriceScopes)
                }

                await createMarketPriceScope({
                    marketItemPrice: { connect: { id } },
                    property: null,
                })
            } else if (!isEqual(sortBy(initialPriceScopeProperties), sortBy(properties))) {
                const propertiesToCreateScope = difference(properties, initialPriceScopeProperties)
                const propertiesToDeleteScope = difference(initialPriceScopeProperties, properties)

                if (!isEmpty(propertiesToCreateScope)) {
                    await createMarketPriceScopes(propertiesToCreateScope.map(propertyId => ({
                        marketItemPrice: { connect: { id } },
                        property: { connect: { id: propertyId } },
                    })))
                }

                const scopesToDelete = initialPriceScopes
                    .filter(scope => propertiesToDeleteScope.includes(get(scope, 'property.id')))

                if (!isEmpty(scopesToDelete)) {
                    await softDeleteMarketPriceScopes(scopesToDelete)
                }
            }
        }

        const deletedPricesIds = difference(initialMarketItemPricesIds, existedPrices.map(price => price.id))
        for (const priceToDeleteId of deletedPricesIds) {
            await softDeleteMarketItemPrice({ id: priceToDeleteId })
        }

        // handle changed files
        const initialFileIds = marketItemFiles.map(file => file.id)
        const formFileIds = files.map(file => get(file, 'response.id'))
        const newFileIds = difference(formFileIds, initialFileIds)
        const deletedFileIds = difference(initialFileIds, formFileIds)

        for (const fileId of newFileIds) {
            await updateMarketItemFile({
                marketItem: { connect: { id: updatedMarketItem.id } },
            }, { id: fileId } )
        }
        for (const fileIdToDelete of deletedFileIds) {
            await softDeleteMarketItemFile({ id: fileIdToDelete })
        }

        setSubmitLoading(false)

        // await router.push(`/marketplace/marketItem/${get(marketItem, 'id')}`)

        return updatedMarketItem
    }, [createMarketItemPrice, createMarketPriceScope, createMarketPriceScopes, initialMarketItemPricesIds, invoiceContext, marketItem, marketItemFiles, marketItemPrices, marketPriceScopes, router, softDeleteMarketItemFile, softDeleteMarketItemPrice, softDeleteMarketPriceScope, softDeleteMarketPriceScopes, updateMarketItem, updateMarketItemFile, updateMarketItemPrice])

    const initialValues = useMemo(
        () => MarketItem.convertToFormState({ marketItem, marketItemPrices, marketPriceScopes, marketItemFiles }),
        [marketItem, marketItemFiles, marketItemPrices, marketPriceScopes])

    const loading = marketItemPricesLoading || marketPriceScopesLoading || marketItemFilesLoading
    const error = marketItemPriceError || marketPriceScopesError || marketItemFilesError
    if (loading || error) {
        return (
            <LoadingOrErrorPage
                error={error}
                loading={loading}
            />
        )
    }

    return (
        <BaseMarketItemForm
            action={handleUpdateMarketItem}
            initialValues={initialValues}
        >
            {
                ({ handleSave }) => {
                    return (
                        <Form.Item
                            noStyle
                            shouldUpdate
                        >
                            {
                                (form) => {
                                    const tooltipTitle = getSaveButtonTooltipMessage(form, intl)
                                    const disabled = submitLoading || !isEmpty(tooltipTitle)

                                    return (
                                        <Col span={24}>
                                            <ActionBar
                                                actions={[
                                                    <Tooltip
                                                        key='submit'
                                                        title={tooltipTitle}
                                                    >
                                                        <span>
                                                            <Button
                                                                key='submit'
                                                                onClick={handleSave}
                                                                type='primary'
                                                                loading={submitLoading}
                                                                disabled={disabled}
                                                            >
                                                                {UpdateMessage}
                                                            </Button>
                                                        </span>
                                                    </Tooltip>,
                                                ]}
                                            />
                                        </Col>
                                    )
                                }
                            }
                        </Form.Item>
                    )
                }
            }
        </BaseMarketItemForm>
    )
}