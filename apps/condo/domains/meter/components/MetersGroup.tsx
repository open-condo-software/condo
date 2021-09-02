import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import styled from '@emotion/styled'
import { Col, Divider, Form, Input, Row, Space, Typography } from 'antd'
import { green } from '@ant-design/colors'
import { DeleteFilled, PlusCircleFilled } from '@ant-design/icons'
import React, { useCallback } from 'react'
import { useCreateMeterModal } from './hooks/useCreateMeterModal'
import { shadows, transitions } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'
import { NamePath } from 'antd/lib/form/interface'
import moment from 'moment'
import { useRemoveMeterModal } from './hooks/useRemoveMeterModal'

const MeterGroupContainer = styled(FocusContainer)`
  margin: 0;
  width: 100%;
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

const OldMeterReading = ({
    meterNumber,
    measure,
    name,
    meterId,
    billingMeterReadings,
}) => {
    // TODO(nomerdvadcatpyat): Now in BillingAccountMeterReading there is no reference to Meter, so this logic will not work.
    //  Consider the advisability of adding Meter to BillingAccountMeterReading or think of another way to get BillingAccountMeterReading by Meter
    const lastMeterReading = billingMeterReadings.find(billingMeterReading => billingMeterReading.meter.id === meterId)

    return (
        <Col span={24}>
            <Form.Item
                label={meterNumber}
                name={name}
            >
                <Row align={'middle'} justify={'space-between'}>
                    <Col span={12}>
                        <Input addonAfter={measure} />
                    </Col>
                    {
                        lastMeterReading ? (
                            <Col span={10}>
                                <Typography.Paragraph strong={true} style={{ margin: 0 }}>
                                    {lastMeterReading.value} {measure}
                                </Typography.Paragraph>
                                <Typography.Paragraph style={{ fontSize: '12px', margin: 0 }}>
                                    {lastMeterReading.source.name} {moment(lastMeterReading.date).format('DD.MM')}
                                </Typography.Paragraph>
                            </Col>
                        ) : null
                    }
                </Row>
            </Form.Item>
        </Col>
    )
}


interface INewMeterReadingProps {
    meterNumber: string,
    measure: string,
    remove?,
    name: NamePath
}

const NewMeterReading = ({
    meterNumber,
    measure,
    remove,
    name,
}: INewMeterReadingProps) => {
    const { RemoveModal, setIsRemoveModalVisible } = useRemoveMeterModal()

    const handleDeleteButtonClick = useCallback(() => {
        setIsRemoveModalVisible(true)
    }, [])

    return (
        <>
            <Col span={24}>
                <Form.Item
                    label={meterNumber}
                    name={name}
                >
                    <Row align={'middle'} justify={'space-between'}>
                        <Col span={12}>
                            <Input addonAfter={measure} />
                        </Col>
                        <Col span={10}>
                            <Button
                                type='sberDanger'
                                secondary
                                onClick={handleDeleteButtonClick}
                            >
                                <DeleteFilled/>
                            </Button>
                        </Col>
                    </Row>
                </Form.Item>
            </Col>
            <RemoveModal removeAction={() => remove(name)} />
        </>
    )
}

export const MetersGroup = ({ name, form, existedMeters = [], billingMeterReadings, Icon, meterResource }) => {
    const { CreateModal, setIsCreateModalVisible } = useCreateMeterModal()

    return (
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
                            <AddMeterButton className={'addMeterButton'} onClick={() => setIsCreateModalVisible(true)}/>
                        </Row>
                    </Col>
                    {
                        existedMeters && existedMeters.map((meter, index) => (
                            <>
                                <OldMeterReading
                                    key={meter.number}
                                    name={['existedMeters', meter.id]}
                                    billingMeterReadings={billingMeterReadings}
                                    meterId={meter.id}
                                    meterNumber={meter.number}
                                    measure={meterResource.measure}
                                />
                                {index !== existedMeters.length - 1 ? <Divider style={{ marginBottom: 0 }}/> : null}
                            </>

                        ))
                    }
                    <Form.List name={name}>
                        {(fields, { add, remove }) => (
                            <>
                                {
                                    fields.map((field, index) => {
                                        const meter = form.getFieldValue([name, index])
                                        return (
                                            <>
                                                {index === 0 && existedMeters.length > 0 ? <Divider style={{ marginBottom: 0 }}/> : null}
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'value']}
                                                    key={field.key}
                                                    noStyle
                                                >
                                                    <NewMeterReading
                                                        name={[field.name, 'value']}
                                                        meterNumber={meter.number}
                                                        measure={meterResource.measure}
                                                        remove={remove}
                                                    />
                                                </Form.Item>
                                                {index !== fields.length - 1 ? <Divider style={{ marginBottom: 0 }}/> : null}
                                            </>
                                        )
                                    })
                                }
                                <CreateModal handleSubmit={(values) => {
                                    add({ ...values, meterResource })
                                }}/>
                            </>
                        )}
                    </Form.List>
                </Row>
            </MeterGroupContainer>
        </>
    )
}