import { MarketSetting as MarketSettingType } from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Checkbox } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useNotificationMessages } from '@condo/domains/common/hooks/useNotificationMessages'
import { INVOICE_PAYMENT_TYPE_CASH, INVOICE_PAYMENT_TYPE_ONLINE, INVOICE_PAYMENT_TYPES } from '@condo/domains/marketplace/constants'
import { MarketSetting } from '@condo/domains/marketplace/utils/clientSchema'


const CHECKBOX_LAYOUT_PROPS = {
    labelCol: {
        span: 24,
        md: 5,
    },
    wrapperCol: {
        span: 24,
        md: 6,
    },
    styled: {
        paddingBottom: '12px',
    },
    colon: false,
}
const BIG_ROW_GUTTERS: [Gutter, Gutter] = [0, 60]
const MIDDLE_ROW_GUTTERS: [Gutter, Gutter] = [0, 40]
const SMALL_ROW_GUTTERS: [Gutter, Gutter] = [0, 20]
const IS_CASH_PAYMENT_TYPE_BLOCKED = 'isPaymentCashTypeBlocked'

interface IMarketSettingForm {
    marketSetting?: MarketSettingType,
    userOrganizationId: string
    loading: boolean
}
export const MarketSettingForm: React.FC<IMarketSettingForm> = ({ marketSetting, userOrganizationId, loading }) => {
    const intl = useIntl()
    const allowCashPaymentTypeLabel = intl.formatMessage({ id: 'pages.condo.settings.marketplace.cashCheckbox.label' })
    const SaveMessage = intl.formatMessage({ id: 'Save' })

    const { getSuccessfulChangeNotification } = useNotificationMessages()

    const router = useRouter()

    const updateHook = MarketSetting.useUpdate({}, () => router.push('/settings?tab=marketplace'))
    const updateAction = async (data) => {
        await updateHook(data, marketSetting)
    }
    const createAction = MarketSetting.useCreate({ organization: { connect: { id: userOrganizationId } } }, () => router.push('/settings?tab=marketplace'))

    const action = marketSetting ? updateAction : createAction

    const initialValues = useMemo(() => {
        const result = {}
        const residentAllowedPaymentTypes = get(marketSetting, 'residentAllowedPaymentTypes', []) || []
        result[IS_CASH_PAYMENT_TYPE_BLOCKED] = !residentAllowedPaymentTypes.includes(INVOICE_PAYMENT_TYPE_CASH)
        return result
    }, [marketSetting])

    const settingsForm = useMemo(() => (
        <FormWithAction
            initialValues={initialValues}
            action={action}
            colon={false}
            layout='horizontal'
            OnCompletedMsg={getSuccessfulChangeNotification}
            formValuesToMutationDataPreprocessor={(values) => {
                const residentAllowedPaymentTypes = [INVOICE_PAYMENT_TYPE_ONLINE]
                if (!values[IS_CASH_PAYMENT_TYPE_BLOCKED]) residentAllowedPaymentTypes.push(INVOICE_PAYMENT_TYPE_CASH)
                values.residentAllowedPaymentTypes = uniq(residentAllowedPaymentTypes)

                return omit(values, [IS_CASH_PAYMENT_TYPE_BLOCKED])
            }}
        >
            {({ handleSave, isLoading }) => (
                <Row gutter={BIG_ROW_GUTTERS}>
                    <Col span={24}>
                        <Row gutter={MIDDLE_ROW_GUTTERS}>
                            <Col span={24}>
                                <Row gutter={SMALL_ROW_GUTTERS}>
                                    <Col span={24}>
                                        <Form.Item
                                            name={IS_CASH_PAYMENT_TYPE_BLOCKED}
                                            label={allowCashPaymentTypeLabel}
                                            labelAlign='left'
                                            valuePropName='checked'
                                            {...CHECKBOX_LAYOUT_PROPS}
                                        >
                                            <Checkbox/>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <ActionBar
                            actions={[
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='primary'
                                    loading={isLoading}
                                >
                                    {SaveMessage}
                                </Button>,
                            ]}
                        />
                    </Col>
                </Row>
            )}
        </FormWithAction>
    ), [initialValues, action, getSuccessfulChangeNotification, allowCashPaymentTypeLabel, SaveMessage])

    if (loading) return null

    return settingsForm
}
