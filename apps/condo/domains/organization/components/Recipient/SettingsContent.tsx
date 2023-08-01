import styled from '@emotion/styled'
import { Row, Col, Typography, Alert } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { BankAccountInfo } from '@condo/domains/banking/components/BankAccountInfo'
import { BankAccount } from '@condo/domains/banking/utils/clientSchema'
import { colors } from '@condo/domains/common/constants/style'


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
    const userOrganizationName = get(userOrganization, ['organization', 'name'])

    const {
        objs: bankAccounts,
        loading: bankAccountsIsLoading,
    } = BankAccount.useObjects(
        { where: { organization: { id: userOrganizationId }, deletedAt: null } }
    )

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{PaymentsDetailsTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <StyledAlert
                    message={<Typography.Text strong>{AlertTitle}</Typography.Text>}
                    description={AlertContent}
                    showIcon
                    type='warning'
                />
            </Col>

            {
                bankAccounts.map((bankAccount, index) => {
                    return (
                        <BankAccountInfo bankAccount={bankAccount} organizationName={userOrganizationName} key={index}/>
                    )
                })
            }
        </Row>
    )
}
