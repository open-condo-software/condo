import { jsx } from '@emotion/react'
import { Col, Form, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'
import { Checkbox } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useNotificationMessages } from '@condo/domains/common/hooks/useNotificationMessages'
import { INVOICE_PAYMENT_TYPE_CASH } from '@condo/domains/marketplace/constants'
import { MarketSetting } from '@condo/domains/marketplace/utils/clientSchema'
import { TicketOrganizationSetting as TicketSetting } from '@condo/domains/ticket/utils/clientSchema'

const INPUT_LAYOUT_PROPS = {
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
const CHECKBOX_STYLE: CSSProperties = { paddingLeft: '0px', fontSize: fontSizes.content }

export const MarketSettingForm: React.FC = () => {
    const intl = useIntl()
    const allowCashPaymentTypeLabel = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.defaultDeadline.label' })
    const SaveMessage = intl.formatMessage({ id: 'Save' })

    const { getSuccessfulChangeNotification } = useNotificationMessages()

    const router = useRouter()

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const { obj: marketSetting, loading } = MarketSetting.useObject({
        where: {
            organization: { id: userOrganizationId },
        },
    })

    const action = MarketSetting.useUpdate({})
    const updateAction = useCallback(async (value) => {
        await action(value, marketSetting)
        await router.push('/settings?tab=marketplace')
    }, [action, router, marketSetting])

    const initialValues = useMemo(() => {
        const result = {}
        for (const paymentType in marketSetting) {
            result[paymentType] = true
        }
        return result
    }, [marketSetting])

    const [allowCashPaymentsType, setAllowCashPaymentsType] = useState<boolean>(initialValues[INVOICE_PAYMENT_TYPE_CASH] || false)

    const handleCheckboxChange = useCallback(() => {
        setAllowCashPaymentsType(!allowCashPaymentsType)
    }, [allowCashPaymentsType])

    const settingsForm = useMemo(() => (
        <FormWithAction
            initialValues={initialValues}
            action={updateAction}
            colon={false}
            layout='horizontal'
            OnCompletedMsg={getSuccessfulChangeNotification}
        >
            {({ handleSave, isLoading }) => (
                <Row gutter={BIG_ROW_GUTTERS}>
                    <Col span={24}>
                        <Row gutter={MIDDLE_ROW_GUTTERS}>
                            <Col span={24}>
                                <Row gutter={SMALL_ROW_GUTTERS}>
                                    <Col span={24}>
                                        <Typography.Title level={5}>{allowCashPaymentTypeLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name='allowCashPaymentsType'
                                            label={allowCashPaymentTypeLabel}
                                            labelAlign='left'
                                            //{...INPUT_LAYOUT_PROPS}
                                        >
                                            <Checkbox
                                                checked={allowCashPaymentsType}
                                                onChange={handleCheckboxChange}
                                            />
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
    ), [allowCashPaymentTypeLabel, getSuccessfulChangeNotification, initialValues, updateAction, SaveMessage, allowCashPaymentsType, handleCheckboxChange])

    if (loading || !marketSetting) return null

    return settingsForm
}
