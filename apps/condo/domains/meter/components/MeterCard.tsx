import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import styled from '@emotion/styled'
import { Alert, Col, Divider, Form, Input, Row, Space, Typography } from 'antd'
import { resourceIdIconMap } from '../utils/clientSchema'
import React  from 'react'
import { BillingAccountMeterReading } from '../../../schema'
import { IMeterFormState } from '../utils/clientSchema/Meter'
import dayjs from 'dayjs'
import { useIntl } from '@core/next/intl'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

type MeterCardProps = {
    meter: IMeterFormState
    resource: {
        id: string
        name: string
        measure: string
    }
    name: string | number
    lastMeterBillingMeterReading?: BillingAccountMeterReading
}

const MAX_METER_READING_LENGTH = 14
const GREATER_METER_READING_DELTA = 100

const MeterCardWrapper = styled(FocusContainer)`
  margin: 0;
`

export const MeterCard = ({ meter, resource, name, lastMeterBillingMeterReading }: MeterCardProps) => {
    const intl = useIntl()
    const VerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const LessThanPreviousMessage = intl.formatMessage({ id: 'pages.condo.meter.LessThanPrevious' })
    const GreaterThanPreviousMessage = intl.formatMessage({ id: 'pages.condo.meter.GreaterThanPrevious' })

    const { numberValidator, maxLengthValidator, lessThanValidator, greaterThanValidator } = useValidations()
    const maxLength = maxLengthValidator(MAX_METER_READING_LENGTH)
    const getMeterReadingInputValidations = (tariffNumber: number) => {
        return [
            numberValidator,
            maxLength,
            lastMeterBillingMeterReading &&
                lessThanValidator(lastMeterBillingMeterReading[`value${tariffNumber}`], LessThanPreviousMessage),
            lastMeterBillingMeterReading &&
                greaterThanValidator(
                    lastMeterBillingMeterReading[`value${tariffNumber}`],
                    GreaterThanPreviousMessage,
                    GREATER_METER_READING_DELTA,
                ),
        ]
    }

    const Icon = resource ? resourceIdIconMap[resource.id] : null
    const numberOfTariffs = meter.numberOfTariffs ? meter.numberOfTariffs : 1

    return (
        <MeterCardWrapper>
            <Row gutter={[10, 0]}>
                <Col span={24}>
                    <Row justify={'space-between'}>
                        <Col>
                            <Space>
                                <Icon style={{ fontSize: '20px' }} />
                                <Typography.Text style={{ fontSize: fontSizes.content }} strong>
                                    {resource.name}
                                </Typography.Text>
                            </Space>
                        </Col>
                        {
                            meter.nextVerificationDate &&
                            dayjs(meter.nextVerificationDate).diff(dayjs(), 'month') < 2 ? (
                                    <Col>
                                        <Alert
                                            showIcon
                                            type='warning'
                                            message={
                                                <>
                                                    <Typography.Text type={'warning'}>
                                                        {VerificationDateMessage}
                                                    </Typography.Text>
                                                    &nbsp;
                                                    <Typography.Text strong={true} type={'warning'}>
                                                        {dayjs(meter.nextVerificationDate).format('DD.MM.YYYY')}
                                                    </Typography.Text>
                                                </>
                                            }
                                        />
                                    </Col>
                                ) : null
                        }
                    </Row>
                </Col>
                {
                    Array.from({ length: numberOfTariffs }, (_, i) => i + 1)
                        .map(tariffNumber => (
                            <React.Fragment key={tariffNumber}>
                                {
                                    tariffNumber > 1 ? (
                                        <Divider />
                                    ) : null
                                }
                                <Col span={24}>
                                    <Row gutter={[20, 0]} align={'bottom'}>
                                        <Col span={14}>
                                            <Form.Item
                                                name={[name, `value${tariffNumber}`]}
                                                label={
                                                    `№ ${meter.number} ${meter.place ? `(${meter.place})` : ''}
                                                        ${numberOfTariffs > 1 ? `T${tariffNumber}` : ''}`
                                                }
                                                rules={getMeterReadingInputValidations(tariffNumber)}
                                            >
                                                <Input
                                                    addonAfter={resource.measure}
                                                />
                                            </Form.Item>
                                        </Col>
                                        {
                                            lastMeterBillingMeterReading ? (
                                                <Col span={8}>
                                                    <Typography.Paragraph style={{ margin: 0 }} strong={true}>
                                                        {lastMeterBillingMeterReading[`value${tariffNumber}`]} {resource.measure}
                                                    </Typography.Paragraph>
                                                    <Typography.Text type={'secondary'}>
                                                        {dayjs(lastMeterBillingMeterReading.date).format('DD.MM.YYYY')}
                                                    </Typography.Text>
                                                </Col>
                                            ) : null
                                        }
                                    </Row>
                                </Col>
                            </React.Fragment>
                        ))
                }
            </Row>
        </MeterCardWrapper>
    )
}