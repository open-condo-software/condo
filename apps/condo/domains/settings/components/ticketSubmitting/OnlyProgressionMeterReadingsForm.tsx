import { MobileFeatureConfig as MobileFeatureConfigType } from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Checkbox, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
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

export const OnlyProgressionMeterReadingsForm: React.FC<ITicketSubmittingSettingsForm> = ({ mobileConfig, userOrganizationId }) => {
    const intl = useIntl()
    const SaveMessage = intl.formatMessage({ id: 'Save' })
    const MessageAboutFeat = intl.formatMessage({ id: 'pages.condo.settings.mobileFeatureConfig.OnlyProgressionMeterReadings.messageAboutFeat' })
    const EnableMessage = intl.formatMessage({ id: 'pages.condo.settings.mobileFeatureConfig.OnlyProgressionMeterReadings.isEnabled' })

    const router = useRouter()

    const initialValues = {
        onlyGreaterThanPreviousMeterReadingIsEnabled: get(mobileConfig, 'onlyGreaterThanPreviousMeterReadingIsEnabled'),
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
                                            name='onlyGreaterThanPreviousMeterReadingIsEnabled'
                                            label={EnableMessage}
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
    ), [action, mobileConfig])
}
