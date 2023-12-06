import { Col, Form } from 'antd'
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
    getSaveButtonTooltipMessage,
    INITIAL_PRICE_FORM_VALUE,
    PriceFormValuesType,
} from '@condo/domains/marketplace/utils/clientSchema/MarketItem'
import { Property } from '@condo/domains/property/utils/clientSchema'

import { BaseMarketItemForm } from './BaseMarketItemForm'


export const CreateMarketItemForm = () => {
    const intl = useIntl()
    const CreateMessage = intl.formatMessage({ id: 'Create' })

    const router = useRouter()
    const { organization, loading: organizationLoading } = useOrganization()
    const organizationId = get(organization, 'id', null)
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)
    const createMarketItem = MarketItem.useCreate({
        organization: { connect: { id: organizationId } },
    })
    const createMarketItemPrice = MarketItemPrice.useCreate({})
    const createMarketPriceScopes = MarketPriceScope.useCreateMany({})
    const updateMarketItemFile = MarketItemFile.useUpdate({})

    const { obj: invoiceContext, loading: contextLoading } = InvoiceContext.useObject({
        where: {
            organization: { id: organizationId },
        },
    }, { skip: organizationLoading || !organization })

    const handleCreateMarketItem = useCallback(async (values) => {
        setSubmitLoading(true)

        const { prices, files, ...marketItemFields } = values
        const createdMarketItem = await createMarketItem(MarketItem.formValuesProcessor(marketItemFields))
        const formattedPrices: PriceFormValuesType[] = MarketItem.formatFormPricesField(prices)
        await MarketItem.createNewPricesAndPriceScopes({
            marketItem: createdMarketItem,
            prices: formattedPrices,
            invoiceContext,
            createMarketItemPrice,
            createMarketPriceScopes,
        })

        // handle changed files
        for (const file of files) {
            const marketItemFileId = get(file, 'response.id')

            if (marketItemFileId) {
                await updateMarketItemFile({
                    marketItem: { connect: { id: createdMarketItem.id } },
                }, { id: marketItemFileId } )
            }
        }

        setSubmitLoading(false)

        await router.push('/marketplace?tab=services')

        return createdMarketItem
    }, [createMarketItem, createMarketItemPrice, createMarketPriceScopes, invoiceContext, router, updateMarketItemFile])

    const { count: propertiesCount } = Property.useCount({
        where: {
            organization: { id: organizationId },
        },
    }, { skip: organizationLoading || !organization })

    const { objs: properties, loading: propertiesLoading } = Property.useObjects(
        {
            where: {
                organization: { id: organizationId },
            },
        }, { skip: propertiesCount !== 1 }
    )

    const dataLoading = organizationLoading || propertiesLoading || contextLoading
    const initialValues = useMemo(() => ({ files: [] }), [])

    if (propertiesCount === 1 && !dataLoading) {
        const propertyId = get(properties, '0.id')

        initialValues['prices'] = [{ ...INITIAL_PRICE_FORM_VALUE, properties: [propertyId] }]
    } else {
        initialValues['prices'] = [INITIAL_PRICE_FORM_VALUE]
    }

    if (dataLoading) {
        return (
            <LoadingOrErrorPage
                loading={dataLoading}
            />
        )
    }

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
                                (form) => {
                                    const tooltipTitle = getSaveButtonTooltipMessage(form, intl)
                                    const disabled = submitLoading || dataLoading || !isEmpty(tooltipTitle)

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
                                                                loading={submitLoading || dataLoading}
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