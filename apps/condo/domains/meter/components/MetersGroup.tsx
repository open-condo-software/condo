import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import styled from '@emotion/styled'
import { Col, Divider, Form, Input, Row, Space, Typography } from 'antd'
import { green } from '@ant-design/colors'
import { DeleteFilled, PlusCircleFilled } from '@ant-design/icons'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useCreateMeterModal } from './forms/useCreateMeterModal'
import { shadows, transitions } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'
import { omit, get } from 'lodash'

const MeterGroupContainer = styled(FocusContainer)`
  margin: 0;
  width: 596px;
  transition: ${transitions.allDefault};

  & .addMeterButton {
    visibility: hidden;
    opacity: 0;
  }

  &:hover {
    box-shadow: ${shadows.hover};

    .addMeterButton {
      visibility: visible;
      opacity: 1;
    }
  }
`

const AddMeterButton = ({ className, onClick }) => {
    return (
        <Button className={className} type={'text'} onClick={onClick}>
            <PlusCircleFilled style={{ color: green[6] }}/>
            <Typography.Text style={{ color: green[6] }} strong={true}>Добавить счетчик</Typography.Text>
        </Button>
    )
}

interface IMeterReadingProps {
    isNewMeter: boolean,
    meterNumber: string,
    measure: string,
    lastReadingData?: {
        date: string,
        source: string,
        lastValue: number,
    },
    setMeters,
    setMeterReadings,
}

const MeterReading = ({ isNewMeter, meterNumber, measure, lastReadingData, setMeters, setMeterReadings }: IMeterReadingProps) => {
    const handleDeleteButtonClick = useCallback(() => {
        setMeters(meters => meters.filter(meter => meter.meterNumber !== meterNumber))
        setMeterReadings(meterReadings => omit(meterReadings, meterNumber))
    }, [])

    const [value, setValue] = useState()
    const valueRef = useRef(value)
    useEffect(() => {
        valueRef.current = value
        setMeterReadings(meterReadings => ({ ...meterReadings, [meterNumber]: value }))
    }, [value])

    const valueInputHandler = (e) => {
        const value = e.target?.value
        setValue(value)
    }

    return (
        <Col span={24}>
            <Form.Item label={meterNumber}>
                <Row align={'middle'} justify={'space-between'}>
                    <Col span={12}>
                        <Input addonAfter={measure} onChange={valueInputHandler} value={valueRef.current}/>
                    </Col>
                    {
                        lastReadingData ? (
                            <Col span={10}>
                                <Typography.Paragraph strong={true} style={{ margin: 0 }}>
                                    {lastReadingData.lastValue} {measure}
                                </Typography.Paragraph>
                                <Typography.Paragraph style={{ fontSize: '12px', margin: 0 }}>
                                    {lastReadingData.source} {lastReadingData.date}
                                </Typography.Paragraph>
                            </Col>
                        ) : isNewMeter ? (
                            <Col span={10}>
                                <Button
                                    type='sberDanger'
                                    secondary
                                    onClick={handleDeleteButtonClick}
                                >
                                    <DeleteFilled/>
                                </Button>
                            </Col>
                        ) : null
                    }
                </Row>
            </Form.Item>
        </Col>
    )
}

export const MetersGroup = ({ form, Icon, meterResource, meters, setMeters, setMeterReadings }) => {
    // const handleSubmit = (values) => {
    //     const { number, place } = values
    //     const newMeter = {
    //         meterNumber: number,
    //         isNewMeter: true,
    //         place,
    //         resourceId: meterResource.id,
    //     }
    //     setMeters(meters => ([...meters, newMeter]))
    // }

    const { ModalForm, setVisible } = useCreateMeterModal()

    return (
        <Form.List name="meters">
            {(fields, { add, remove }) => (
                <>
                    <MeterGroupContainer>
                        <Row gutter={[0, 10]}>
                            <Col span={24}>
                                <Row justify={'space-between'} align={'middle'}>
                                    <Space align={'center'}>
                                        <Icon/>
                                        <Typography.Text strong={true} style={{ fontSize: '16px' }}>
                                            {meterResource.name}
                                        </Typography.Text>
                                    </Space>
                                    <AddMeterButton className={'addMeterButton'} onClick={() => setVisible(true)}/>
                                </Row>
                            </Col>
                            {
                                fields.map(field => {
                                    console.log(field)

                                    return (
                                        <Form.Item
                                            {...field}
                                            validateTrigger={['onChange', 'onBlur']}
                                            key={field.key}
                                            rules={[
                                                {
                                                    required: true,
                                                    whitespace: true,
                                                    message: 'Please input passenger\'s name or delete this field.',
                                                },
                                            ]}
                                            noStyle
                                        >
                                            {
                                                console.log('field value', form.getFieldsValue({}))
                                            }
                                            <Input placeholder="passenger name" style={{ width: '60%' }} />
                                        </Form.Item>
                                    )
                                })
                            }
                            {/*{*/}
                            {/*    meters.map((meter, index) => (*/}
                            {/*        <>*/}
                            {/*            <MeterReading*/}
                            {/*                key={meter.meterNumber}*/}
                            {/*                meterNumber={meter.meterNumber}*/}
                            {/*                isNewMeter={meter.isNewMeter}*/}
                            {/*                measure={meterResource.measure}*/}
                            {/*                setMeterReadings={setMeterReadings}*/}
                            {/*                setMeters={setMeters}*/}
                            {/*            />*/}
                            {/*            {index !== meters.length - 1 ? <Divider/> : null}*/}
                            {/*        </>*/}
                            {/*    ))*/}
                            {/*}*/}
                        </Row>
                    </MeterGroupContainer>
                    <ModalForm handleSubmit={(values) => { add(values) }}/>
                </>
            )}
        </Form.List>
    )
}