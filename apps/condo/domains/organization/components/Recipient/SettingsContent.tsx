import get from 'lodash/get'
import { useIntl } from '@condo/next/intl'

import React from 'react'
import { Row, Col, Typography, Alert } from 'antd'
import styled from '@emotion/styled'
import { Gutter } from 'antd/es/grid/row'
import { colors } from '@condo/domains/common/constants/style'

import { useOrganization } from '@condo/next/organization'
import { Recipient } from '@condo/domains/organization/components/Recipient'

import { BillingRecipient, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'


const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

const StyledAlert = styled(Alert)`
  background-color: ${colors.warningAlert};

  & > .ant-alert-description > div {
    overflow: hidden;
  }
  
  & > .ant-alert-content > .ant-alert-message {
   color: ${colors.black}; 
  }
`

export const RecipientSettingsContent = () => {
    const intl = useIntl()
    const PaymentsDetailsTitle = intl.formatMessage({ id: 'PaymentDetails' })
    const AlertTitle = intl.formatMessage({ id: 'pages.condo.settings.recipient.alert.title' })
    const AlertContent = intl.formatMessage({ id: 'pages.condo.settings.recipient.alert.content' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])


    //TODO(MAXIMDANILOV): DOMA-3252 go from BillingRecipient to Index
    const {
        obj: context,
    } = BillingIntegrationOrganizationContext.useObject({
        where: { organization: { id: userOrganizationId } },
    })

    const contextId = get(context, ['id'], null)


    const {
        loading: isRecipientsLoading,
        objs: recipients,
    } = BillingRecipient.useObjects({
        where: {
            context: { id : contextId },
            isApproved: true,
        },
    })

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{PaymentsDetailsTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <StyledAlert
                    message={<Typography.Text strong={true}>{AlertTitle}</Typography.Text>}
                    description={AlertContent}
                    showIcon
                    type={'warning'}
                />
            </Col>

            {
                recipients.map((recipient, index) => {
                    return (
                        <Recipient recipient={recipient} key={index}/>
                    )
                })
            }
        </Row>
    )
}
