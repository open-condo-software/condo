
import { Col, Form } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Tooltip } from '@open-condo/ui'

import {
    InvoiceContext,
    MarketItem,
    MarketItemPrice,
    MarketPriceScope,
} from '@condo/domains/marketplace/utils/clientSchema'
import {
    INITIAL_PRICE_FORM_VALUE,
    PriceFormValuesType,
    PriceType,
} from '@condo/domains/marketplace/utils/clientSchema/MarketItem'

import { BaseMarketItemForm } from './BaseMarketItemForm'


export const CreateMarketItemForm = () => {
    const intl = useIntl()
    const CreateMessage = intl.formatMessage({ id: 'Create' })
    const ManyAllPropertiesPriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.actionButtonTooltip.manyHasAllProperties' })

    const router = useRouter()
    const { organization } = useOrganization()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)
    const createMarketItem = MarketItem.useCreate({
        organization: { connect: { id: get(organization, 'id', null) } },
    })
    const createMarketItemPrice = MarketItemPrice.useCreate({})
    const createMarketItemPriceScope = MarketPriceScope.useCreate({})

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: get(organization, 'id', null) },
        },
    })

    const handleCreateMarketItem = useCallback(async (values) => {
        setSubmitLoading(true)

        const { prices, ...marketItemFields } = values

        const createdMarketItem = await createMarketItem(MarketItem.formValuesProcessor(marketItemFields))

        const formattedPrices: PriceFormValuesType[] = prices.map(
            priceObj => ({ ...priceObj, price: priceObj.price?.replace(',', '.') })
        )
        for (const formPrice of formattedPrices) {
            const { properties, hasAllProperties, price, priceType } = formPrice

            const vatPercent = get(invoiceContext, 'vatPercent')
            const salesTaxPercent = get(invoiceContext, 'salesTaxPercent')
            const currencyCode = get(invoiceContext, 'currencyCode')
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

            const createdPrice = await createMarketItemPrice({
                price: [{ type: 'variant', group: '', name: createdMarketItem.name,
                    price: resultPrice, isMin, vatPercent, salesTaxPercent, currencyCode }],
                marketItem: { connect: { id: createdMarketItem.id } },
            })

            if (hasAllProperties) {
                await createMarketItemPriceScope({
                    marketItemPrice: { connect: { id: createdPrice.id } },
                })
            } else {
                for (const propertyId of properties ) {
                    await createMarketItemPriceScope({
                        marketItemPrice: { connect: { id: createdPrice.id } },
                        property: { connect: { id: propertyId } },
                    })
                }
            }
        }

        setSubmitLoading(false)

        await router.push('/marketplace?tab=services')

        return createdMarketItem
    }, [createMarketItem, createMarketItemPrice, createMarketItemPriceScope, invoiceContext, router])

    const initialValues = { prices: [INITIAL_PRICE_FORM_VALUE] }

    return (
        <BaseMarketItemForm
            action={handleCreateMarketItem}
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
                                ({ getFieldsValue }) => {
                                    // check that required fields filled and if not set button to disable state
                                    const { prices } = getFieldsValue(['prices'])
                                    const hasManyAllPropertiesCheckboxes = prices && prices.filter(price => price.hasAllProperties).length > 1

                                    const disabled = submitLoading || hasManyAllPropertiesCheckboxes

                                    let tooltipTitle
                                    if (hasManyAllPropertiesCheckboxes) {
                                        tooltipTitle = ManyAllPropertiesPriceLabel
                                    }

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
                                                                onClick={handleSave}
                                                                type='primary'
                                                                loading={submitLoading}
                                                                disabled={disabled}
                                                            >
                                                                {CreateMessage}
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