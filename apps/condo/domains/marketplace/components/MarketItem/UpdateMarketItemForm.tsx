import { Col } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import { MarketItem, MarketItemPrice, MarketPriceScope } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseMarketItemForm } from './BaseMarketItemForm'

import LoadingOrErrorPage from '../../../common/components/containers/LoadingOrErrorPage'



export const UpdateMarketItemForm = ({ marketItem }) => {
    const intl = useIntl()
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })

    const {
        objs: marketItemPrices,
        loading: marketItemPricesLoading,
        error: marketItemPriceError,
    } = MarketItemPrice.useObjects({
        where: {
            marketItem: { id: get(marketItem, 'id') },
        },
    }, { skip: !marketItem })

    const {
        objs: marketPriceScopes,
        loading: marketPriceScopesLoading,
        error: marketPriceScopesError,
    } = MarketPriceScope.useObjects({
        where: { marketItemPrice: { id_in: marketItemPrices.map(({ id }) => id) } },
    }, { skip: isEmpty(marketItemPrices) })

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

    const initialValues = useMemo(
        () => MarketItem.convertToFormState({ marketItem, marketItemPrices, marketPriceScopes }),
        [marketItem, marketItemPrices, marketPriceScopes])

    const loading = marketItemPricesLoading || marketPriceScopesLoading
    const error = marketItemPriceError || marketPriceScopesError
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