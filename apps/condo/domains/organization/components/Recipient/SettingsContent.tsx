import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { Row, Col, Typography, Alert } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { fontSize } from 'html2canvas/dist/types/css/property-descriptors/font-size'
import { fontStyle } from 'html2canvas/dist/types/css/property-descriptors/font-style'
import React from 'react'
import { colors } from '../../../common/constants/style'
import { Recipient } from './Recipient'


const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

const StyledAlert = styled(Alert)`
  background-color: ${colors.warningAlert};
  
  .ant-alert-description > div {
    overflow: hidden;
  }
  
  & > .ant-alert-content > .ant-alert-message {
   color: ${colors.black}; 
  }
`

export const RecipientSettingsContent = (props) => {
    const intl = useIntl()
    const PaymentsDetailsTitle = intl.formatMessage({ id: 'PaymentDetails' })

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{PaymentsDetailsTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <StyledAlert
                    message={<Typography.Text strong={true}>{'На эти реквизиты приходят оплаты от жителей через моб. приложение Дома́'}</Typography.Text>}
                    description={'Напоминаем, что реквизиты взяты из Договора присоединения Поставщика услуг к Правилам. Если возникнут вопросы — напишите на help@doma.ai'}
                    showIcon
                    type={'warning'}
                />
            </Col>
            <Col span={24}>
                <Recipient />
            </Col>
            <Col span={24}>
                <Recipient />
            </Col>



        </Row>
    )
}
