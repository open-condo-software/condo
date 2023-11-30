
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
    const createMarketPriceScope = MarketPriceScope.useCreate({})

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: get(organization, 'id', null) },
        },
    })

    const handleCreateMarketItem = useCallback(async (values) => {
        setSubmitLoading(true)

        const { prices, ...marketItemFields } = values

        const createdMarketItem = await createMarketItem(MarketItem.formValuesProcessor(marketItemFields))

        const formattedPrices: PriceFormValuesType[] = MarketItem.formatFormPricesField(prices)
        await MarketItem.createNewPricesAndPriceScopes({
            marketItem: createdMarketItem,
            prices: formattedPrices,
            invoiceContext,
            createMarketItemPrice,
            createMarketPriceScope,
        })

        setSubmitLoading(false)

        await router.push('/marketplace?tab=services')

        return createdMarketItem
    }, [createMarketItem, createMarketItemPrice, createMarketPriceScope, invoiceContext, router])

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