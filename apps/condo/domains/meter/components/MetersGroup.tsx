import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import styled from '@emotion/styled'
import { Button, Col, Row, Space, Typography } from 'antd'
import { green } from '@ant-design/colors'
import { PlusCircleFilled } from '@ant-design/icons'
import React from 'react'
import { useCreateMeterModal } from './forms/useCreateMeterModal'

const FocusContainerWithoutMargin = styled(FocusContainer)`
  margin: 0;
  width: 596px;
`

const AddMeterButton = ({ onClick }) => {
    return (
        <Button type={'text'} onClick={onClick}>
            <PlusCircleFilled style={{ color: green[6] }}/>
            <Typography.Text style={{ color: green[6] }} strong={true}>Добавить счетчик</Typography.Text>
        </Button>
    )
}

export const MetersGroup = ({ Icon, meterResource }) => {

    const handleSubmit = (values) => console.log(values)

    const { ModalForm, setVisible } = useCreateMeterModal({ handleSubmit })

    return (
        <>
            <FocusContainerWithoutMargin>
                <Row gutter={[0, 10]}>
                    <Col span={24}>
                        <Row justify={'space-between'} align={'middle'}>
                            <Space align={'center'}>
                                <Icon/>
                                <Typography.Text strong={true} style={{ fontSize: '16px' }}>
                                    {meterResource.name}
                                </Typography.Text>
                            </Space>
                            <AddMeterButton onClick={() => setVisible(true)}/>
                        </Row>
                    </Col>
                </Row>
            </FocusContainerWithoutMargin>
            <ModalForm/>
        </>
    )
}