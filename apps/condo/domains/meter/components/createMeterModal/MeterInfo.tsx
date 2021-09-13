import { Button, Col, DatePicker, Form, Input, Row, Select, Space, Typography } from 'antd'
import React, { useState } from 'react'
import { IMeterResourceUIState } from '../../utils/clientSchema/MeterResource'
import { useIntl } from '@core/next/intl'
import { ChevronIcon } from '@condo/domains/common/components/icons/ChevronIcon'
import { ELECTRICITY_METER_RESOURCE_ID } from '../../constants/constants'
import styled from '@emotion/styled'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

const { Option } = Select

const METER_INFO_INPUT_COL_SPAN = 11

const getTariffNumberSelectOptions = () => {
    return Array.from({ length: 4 }, (_, i) => i + 1)
        .map(number => (
            <Option key={number} value={number}>
                {number}
            </Option>
        ))
}

const CreateMeterModalDatePicker = ({ label, name }) => (
    <Col span={METER_INFO_INPUT_COL_SPAN}>
        <Form.Item
            label={label}
            name={name}
        >
            <DatePicker
                format='DD.MM.YYYY'
                style={{ width: '100%' }}
            />
        </Form.Item>
    </Col>
)

type ChevronIconWrapperProps = {
    direction: 'down' | 'up',
}

const ChevronIconWrapper = styled.div<ChevronIconWrapperProps>`
    transform: rotate(${props => props.direction === 'down' ? 0 : 180}deg);
    display: flex;
`

type MeterInfoProps = {
    resource: IMeterResourceUIState
}

export const MeterInfo = ({ resource }: MeterInfoProps) => {
    const intl = useIntl()
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const MeterPlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterPlace' })
    const MoreParametersMessage = intl.formatMessage({ id: 'MoreParameters' })
    const LessParametersMessage = intl.formatMessage({ id: 'LessParameters' })
    const TariffsCountMessage = intl.formatMessage({ id: 'pages.condo.meter.TariffsNumber' })
    const InstallationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.InstallationDate' })
    const CommissioningDateMessage = intl.formatMessage({ id: 'pages.condo.meter.CommissioningDate' })
    const SealingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.SealingDate' })
    const VerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const NextVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.NextVerificationDate' })

    const validations = useValidations()

    const [isAdditionalFieldsCollapsed, setIsAdditionalFieldsCollapsed] = useState<boolean>(true)

    const isElectricityMeter = resource.id === ELECTRICITY_METER_RESOURCE_ID

    return (
        <Row gutter={[0, 20]}>
            <Col span={24}>
                <Row justify={'space-between'} gutter={[0, 20]}>
                    <Col span={METER_INFO_INPUT_COL_SPAN}>
                        <Form.Item
                            label={MeterNumberMessage}
                            name='number'
                            rules={[validations.requiredValidator]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={METER_INFO_INPUT_COL_SPAN}>
                        <Form.Item
                            label={MeterPlaceMessage}
                            name='place'
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    {
                        isElectricityMeter ? (
                            <Col span={METER_INFO_INPUT_COL_SPAN}>
                                <Form.Item
                                    rules={[validations.requiredValidator]}
                                    hidden={!isElectricityMeter}
                                    label={TariffsCountMessage}
                                    name='numberOfTariffs'
                                >
                                    <Select>
                                        { getTariffNumberSelectOptions() }
                                    </Select>
                                </Form.Item>
                            </Col>
                        ) : null
                    }
                    {
                        !isAdditionalFieldsCollapsed ? (
                            <>
                                <CreateMeterModalDatePicker
                                    label={InstallationDateMessage}
                                    name='installationDate'
                                />
                                <CreateMeterModalDatePicker
                                    label={CommissioningDateMessage}
                                    name='commissioningDate'
                                />
                                <CreateMeterModalDatePicker
                                    label={SealingDateMessage}
                                    name='sealingDate'
                                />
                                <CreateMeterModalDatePicker
                                    label={VerificationDateMessage}
                                    name='verificationDate'
                                />
                                <CreateMeterModalDatePicker
                                    label={NextVerificationDateMessage}
                                    name='nextVerificationDate'
                                />
                            </>
                        ) : null
                    }
                </Row>
            </Col>
            <Col>
                <Button
                    type="text"
                    onClick={() => { setIsAdditionalFieldsCollapsed(prevState => !prevState) }}
                    style={{
                        padding: 0,
                    }}
                >
                    <Typography.Text type={'success'} strong={true}>
                        <Space direction={'horizontal'} align={'center'}>
                            {isAdditionalFieldsCollapsed ? MoreParametersMessage : LessParametersMessage}
                            <ChevronIconWrapper direction={isAdditionalFieldsCollapsed ? 'down' : 'up'}>
                                <ChevronIcon />
                            </ChevronIconWrapper>
                        </Space>
                    </Typography.Text>
                </Button>
            </Col>
        </Row>
    )
}