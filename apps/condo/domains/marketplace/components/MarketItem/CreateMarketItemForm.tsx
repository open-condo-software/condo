import { Col, Form } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Tooltip } from '@open-condo/ui'

import { MarketItem } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseMarketItemForm } from './BaseMarketItemForm'


export const CreateMarketItemForm = () => {
    const intl = useIntl()
    const CreateMessage = intl.formatMessage({ id: 'Create' })
    const ManyAllPropertiesPriceLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.actionButtonTooltip.manyHasAllProperties' })

    const router = useRouter()
    const { organization } = useOrganization()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)
    const createAction = MarketItem.useCreate({
        organization: { connect: { id: get(organization, 'id', null) } },
    },
    // () => router.push('/marketplace?tab=services')
    )

    const handleCreateMarketItem = useCallback(async (values) => {
        setSubmitLoading(true)
        console.log(MarketItem.formValuesProcessor(values))
        setSubmitLoading(false)
        return

        const createdMarketItem = await createAction(MarketItem.formValuesProcessor(values))

        console.log(createdMarketItem)

        // create MarketItemFile's, MarketItemPrice's and MarketItemPriceScope's related to MarketItem

        setSubmitLoading(false)

        return createdMarketItem
    }, [createAction])

    const initialValues = { prices: [{ properties: [] }] }

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