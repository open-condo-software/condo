import { Col } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { MarketItem } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseMarketItemForm } from './BaseMarketItemForm'


export const CreateMarketItemForm = () => {
    const intl = useIntl()
    const CreateMessage = intl.formatMessage({ id: 'Create' })

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

        const createdMarketItem = await createAction(MarketItem.formValuesProcessor(values))

        console.log(createdMarketItem)

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