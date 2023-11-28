import { Col } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import { MarketItem } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseMarketItemForm } from './BaseMarketItemForm'


export const CreateMarketItemForm = () => {
    const intl = useIntl()
    const CreateMessage = intl.formatMessage({ id: 'Create' })

    const router = useRouter()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)
    const createAction = MarketItem.useCreate({},
        () => router.push('/marketplace/marketItem/index')
    )

    const handleCreateMarketItem = useCallback(async (values) => {
        setSubmitLoading(true)
        console.log(values)
        setSubmitLoading(false)

        return

        const createdMarketItem = await createAction(MarketItem.formValuesProcessor(values))

        // create MarketItemFile's, MarketItemPrice's and MarketItemPriceScope's related to MarketItem

        setSubmitLoading(false)

        return createdMarketItem
    }, [createAction])

    return (
        <BaseMarketItemForm
            action={handleCreateMarketItem}
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
                                        {CreateMessage}
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