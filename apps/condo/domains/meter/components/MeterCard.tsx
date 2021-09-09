import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import styled from '@emotion/styled'
import { Alert, Col, Divider, Form, Input, Row, Space, Typography } from 'antd'
import { resourceIdToIcon } from '../utils/clientSchema'
import React from 'react'
import { css } from '@emotion/core'
import { NamePath } from 'antd/lib/form/interface'

type MeterCardProps = {
    meter: {
        commissioningDate?
        installationDate?
        sealingDate?
        number?: string
        place?: string
        resource?: string
        numberOfTariffs?: number
    }
    resource: {
        id: string
        name: string
        measure: string
    }
    name: NamePath
}

const MeterCardWrapper = styled(FocusContainer)`
  margin: 0;
`

export const MeterCard = ({ meter, resource, name }: MeterCardProps) => {
    const Icon = resource ? resourceIdToIcon[resource.id] : null
    const numberOfTariffs = meter.numberOfTariffs ? meter.numberOfTariffs : 1

    return (
        <MeterCardWrapper>
            <Row gutter={[10, 0]}>
                <Col span={24}>
                    <Row justify={'space-between'}>
                        <Col>
                            <Space style={{ fontSize: '20px' }}>
                                <Icon css={css` width: 30px; height: 30px `} />
                                <Typography.Text style={{ fontSize: '16px' }} strong={true}>
                                    {resource.name}
                                </Typography.Text>
                            </Space>
                        </Col>
                        <Col>
                            <Alert showIcon type='warning' message={'тест'} />
                        </Col>
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
                                                    `№ ${meter.number} (${meter.place}) ${numberOfTariffs > 1 ?
                                                        `T-${tariffNumber}` : ''}`
                                                }
                                            >
                                                <Input addonAfter={resource.measure} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Typography.Paragraph style={{ margin: 0 }} strong={true}>
                                                16 {resource.measure}
                                            </Typography.Paragraph>
                                            <Typography.Text type={'secondary'}>Звонок жителя 26.07</Typography.Text>
                                        </Col>
                                    </Row>
                                </Col>
                            </React.Fragment>
                        ))
                }
            </Row>
        </MeterCardWrapper>
    )
}