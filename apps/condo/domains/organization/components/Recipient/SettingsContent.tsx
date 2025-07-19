import styled from '@emotion/styled'
import { Row, Col, Typography, Alert } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { colors } from '@open-condo/ui/colors'

import { BankingInfo } from '@condo/domains/banking/components/BankAccountInfo'
import { BankAccount } from '@condo/domains/banking/utils/clientSchema'
import { CardsContainer, CardsPerRowType } from '@condo/domains/common/components/Card/CardsContainer'


const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

const StyledAlert = styled(Alert)`
  background-color: ${colors.blue[1]};

  & > .ant-alert-description > div {
    overflow: hidden;
  }
  
  & > .ant-alert-content > .ant-alert-message {
   color: ${colors.black}; 
  }
`

export const RecipientSettingsContent = () => {
    const intl = useIntl()
    const AlertTitle = intl.formatMessage({ id: 'pages.condo.settings.recipient.alert.title' })
    const AlertContent = intl.formatMessage({ id: 'pages.condo.settings.recipient.alert.content' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const {
        objs: bankAccounts,
        loading: BankAccountsIsLoading,
    } = BankAccount.useObjects(
        { where: { organization: { id: userOrganizationId }, deletedAt: null } }
    )

    const cardsPerRow = bankAccounts.length < 3 ? bankAccounts.length as CardsPerRowType : 3

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <StyledAlert
                    message={<Typography.Text strong>{AlertTitle}</Typography.Text>}
                    description={AlertContent}
                    showIcon
                    type='info'
                />
            </Col>

            <CardsContainer cardsPerRow={cardsPerRow} children={bankAccounts.map((bankAccount) => {
                return (
                    <BankingInfo bankAccount={bankAccount} key={bankAccount.id}/>
                )
            })}/>
        </Row>
    )
}
