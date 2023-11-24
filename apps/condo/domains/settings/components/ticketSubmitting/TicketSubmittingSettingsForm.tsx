import { MobileFeatureConfig as MobileFeatureConfigType } from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Checkbox, Typography } from '@open-condo/ui'

import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { MobileFeatureConfig } from '@condo/domains/settings/utils/clientSchema'

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

interface ITicketSubmittingSettingsForm {
    mobileConfig?: MobileFeatureConfigType,
    userOrganizationId: string,
}

export const TicketSubmittingSettingsForm: React.FC<ITicketSubmittingSettingsForm> = ({ mobileConfig, userOrganizationId }) => {
    const intl = useIntl()
    const SaveMessage = intl.formatMessage({ id: 'Save' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const RequiredCommonPhoneMessage = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const InvalidPhoneMessage = intl.formatMessage({ id: 'global.input.error.wrongMobilePhone' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const CommonPhoneMessage = intl.formatMessage({ id: 'pages.condo.settings.mobileFeatureConfig.submittingPeriod.commonPhoneField' })
    const IsEnabledMessage = intl.formatMessage({ id: 'pages.condo.settings.mobileFeatureConfig.submittingPeriod.isEnabled' })
    const MessageAboutFeat = intl.formatMessage({ id: 'pages.condo.settings.mobileFeatureConfig.submittingPeriod.messageAboutFeat' })

    const router = useRouter()

    const initialValues = {
        commonPhone: get(mobileConfig, 'commonPhone'),
        ticketSubmittingIsDisabled: get(mobileConfig, 'ticketSubmittingIsDisabled'),
    }

    const updateHook = MobileFeatureConfig.useUpdate({}, () => router.push('/settings?tab=mobileFeatureConfig'))
    const updateAction = async (data) => {
        await updateHook(data, mobileConfig)
    }
    const createAction = MobileFeatureConfig.useCreate({}, () => router.push('/settings?tab=mobileFeatureConfig'))
    const action = mobileConfig ? updateAction : createAction

    return useMemo(() => (
        <FormWithAction
            initialValues={initialValues}
            action={action}
            colon={false}
            layout='horizontal'
            formValuesToMutationDataPreprocessor={(values) => {
                if (!mobileConfig) {
                    values.organization = { connect: { id: userOrganizationId } }
                }
                return values
            }}
        >
            {({ handleSave, isLoading }) => (
                <Row gutter={BIG_ROW_GUTTERS}>
                    <Col span={24}>
                        <Row gutter={MIDDLE_ROW_GUTTERS}>
                            <Col span={24}>
                                <Row gutter={SMALL_ROW_GUTTERS}>
                                    <Col span={24}>
                                        <Typography.Text >{MessageAboutFeat}</Typography.Text>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name='commonPhone'
                                            label={CommonPhoneMessage}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <PhoneInput
                                                placeholder={ExamplePhoneMessage}
                                                block
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name='ticketSubmittingIsDisabled'
                                            label={IsEnabledMessage}
                                            labelAlign='left'
                                            {...INPUT_LAYOUT_PROPS}
                                            valuePropName='checked'
                                        >
                                            <Checkbox/>
                                        </Form.Item>
                                    </Col>

                                </Row>
                            </Col>

                        </Row>
                    </Col>
                    <Col span={24}>
                        <Col span={24}>
                            <Form.Item
                                noStyle
                                dependencies={['ticketSubmittingIsDisabled', 'commonPhone']}
                                shouldUpdate>
                                {
                                    ({ getFieldsValue, getFieldError }) => {
                                        const {
                                            ticketSubmittingIsDisabled,
                                            commonPhone,
                                        } = getFieldsValue(['ticketSubmittingIsDisabled', 'commonPhone'])

                                        const messageLabels = []
                                        if (ticketSubmittingIsDisabled && !commonPhone) messageLabels.push(RequiredCommonPhoneMessage)

                                        const requiredErrorMessage = !isEmpty(messageLabels) && ErrorsContainerTitle.concat(' ', messageLabels.join(', '))
                                        const hasInvalidPhoneError = commonPhone && (normalizePhone(commonPhone, true) !== commonPhone) ? InvalidPhoneMessage : undefined
                                        const errors = [requiredErrorMessage, hasInvalidPhoneError]
                                            .filter(Boolean)
                                            .join(', ')

                                        const isDisabled = hasInvalidPhoneError || requiredErrorMessage

                                        return (
                                            <ActionBar
                                                actions={[
                                                    <ButtonWithDisabledTooltip
                                                        key='submit'
                                                        type='primary'
                                                        disabled={isDisabled}
                                                        title={errors}
                                                        onClick={handleSave}
                                                        loading={isLoading}
                                                    >
                                                        {SaveMessage}
                                                    </ButtonWithDisabledTooltip>,
                                                ]}
                                            />
                                        )
                                    }
                                }
                            </Form.Item>
                        </Col>
                    </Col>
                </Row>
            )}
        </FormWithAction>
    ), [action, mobileConfig])
}
