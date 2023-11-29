import { Col } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import { MarketItem } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseMarketItemForm } from './BaseMarketItemForm'


export const UpdateMarketItemForm = ({ marketItem }) => {
    const intl = useIntl()
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })

    const router = useRouter()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)
    const updateAction = MarketItem.useUpdate({},
        // () => router.push(`/marketplace/marketItem/${get(marketItem, 'id')}`)
    )

    const handleUpdateMarketItem = useCallback(async (values) => {
        setSubmitLoading(true)

        const updatedMarketItem = await updateAction(MarketItem.formValuesProcessor(values), marketItem)

        console.log(updatedMarketItem)

        // create MarketItemFile's, MarketItemPrice's and MarketItemPriceScope's related to MarketItem

        setSubmitLoading(false)

        return updatedMarketItem
    }, [marketItem, updateAction])

    const initialValues = MarketItem.convertToFormState(marketItem)

    return (
        <BaseMarketItemForm
            action={handleUpdateMarketItem}
            initialValues={initialValues}
        >
            {
                ({ handleSave, form }) => {
                    // check that required fields filled and if not set button to disable state

                    return (
                        <Col span={24}>
                            <ActionBar
                                actions={[
                                    <Button
                                        key='submit'
                                        onClick={handleSave}
                                        type='primary'
                                        loading={submitLoading}
                                        disabled={submitLoading}
                                    >
                                        {UpdateMessage}
                                    </Button>,
                                ]}
                            />
                        </Col>
                    )
                }
            }
        </BaseMarketItemForm>
    )
}