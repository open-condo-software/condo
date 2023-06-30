/** @jsx jsx */
import { jsx, css } from '@emotion/react'
import styled from '@emotion/styled'
import { Image, notification, Space } from 'antd'
import cookie from 'js-cookie'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useState, useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Typography, Modal } from '@open-condo/ui'

import { CREATE_BANK_ACCOUNT_REQUEST_MUTATION } from '@condo/domains/banking/gql'
import { BankAccount, BankIntegrationAccountContext } from '@condo/domains/banking/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { PROPERTY_BANK_ACCOUNT } from '@condo/domains/common/constants/featureflags'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'


import type { Property, BankAccount as BankAccountType, BankIntegrationAccountContext as BankIntegrationAccountContextType } from '@app/condo/schema'

const PROPERTY_CARD_WIDTH_THRESHOLD = 400
const INTL_DATE_FORMAT = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
}

const PropertyReportCardBottomWrapper = styled.div<{ isSmall: boolean, isButtonsHidden: boolean }>`
  display: flex;
  justify-content: space-between;
  
  ${({ isSmall }) => isSmall ? 'align-items: end;' : 'align-items: start;'}
  ${({ isSmall }) => isSmall ? 'flex-direction: row;' : 'flex-direction: column-reverse;'}
  ${({ isButtonsHidden }) => isButtonsHidden ? 'flex-direction: column-reverse;' : ''}  
  
  margin-top: 36px;
  
  & > div {
    ${({ isSmall }) => isSmall ? 'max-width: 50%;' : 'max-width: unset;'}
  }
  
  & > div:first-child {
    ${({ isSmall }) => isSmall ? 'margin-top: initial' : 'margin-top: 24px;'}
  }
`

const PropertyCardContent = styled.div`
  padding: 16px;
  
  & img {
    max-height: 180px;
    max-width: 140px;
  }
`

const ImageWrapper = styled.div`
  display: flex;
  justify-content: end;
  align-content: center;
`

const PropertyBalanceContentWrapper = styled.div`
  padding: 90px 0;
  display: flex;
  text-align: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`

const PropertyCardCss = css`
  &, & .condo-card-body {
    height: 100%;
  }
`

interface IPropertyCardBalanceContent {
    ({ bankAccount, bankIntegrationAccountContext, clickCallback }: { bankAccount: BankAccountType, bankIntegrationAccountContext: BankIntegrationAccountContextType, clickCallback: () => void }): React.ReactElement
}

const PropertyCardBalanceContent: IPropertyCardBalanceContent = ({ bankAccount, bankIntegrationAccountContext, clickCallback }) => {
    const intl = useIntl()
    const BalanceTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportBalance.title' })
    const BalanceDescription = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportBalance.description' }, {
        dateUpdated: intl.formatDate(get(bankIntegrationAccountContext, 'meta.amountAt', bankAccount.updatedAt), INTL_DATE_FORMAT),
    })
    const BalanceValue = intl.formatNumber(get(bankIntegrationAccountContext, 'meta.amount', 0), {
        style: 'currency',
        currency: bankAccount.currencyCode,
    })
    const ButtonTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportBalance.buttonTitle' })

    return (
        <>
            <Typography.Title level={3}>{BalanceTitle}</Typography.Title>
            <PropertyBalanceContentWrapper>
                <Space direction='vertical' size={20}>
                    <Space direction='vertical' size={12}>
                        <Typography.Title level={1}>{BalanceValue}</Typography.Title>
                        <Typography.Text size='small' type='secondary'>{BalanceDescription}</Typography.Text>
                    </Space>
                    <Button type='secondary' onClick={clickCallback}>{ButtonTitle}</Button>
                </Space>
            </PropertyBalanceContentWrapper>
        </>
    )
}

interface IPropertyCardInfoContent {
    ({ hasAccess, featureEnabled, setupButtonClick, organizationId, propertyId }: {
        hasAccess: boolean,
        featureEnabled: boolean,
        setupButtonClick: () => void,
        organizationId: string
        propertyId: string
    }): React.ReactElement
}

const PropertyCardInfoContent: IPropertyCardInfoContent = (props) => {
    const intl = useIntl()
    const PropertyReportTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportTitle' })
    const PropertyReportDescription = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportDescription' })
    const PropertyReportComingSoonTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportComingSoonTitle' })
    const PropertyReportComingSoonSubTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportComingSoonSubTitle' })
    const PropertyReportAccessDeniedTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportAccessDenied' })
    const BecomeSberClientTitle = intl.formatMessage({ id: 'pages.condo.property.id.becomeSberClientTitle' })
    const SetupReportTitle = intl.formatMessage({ id: 'pages.condo.property.id.setupReportTitle' })
    const ModalTitle = intl.formatMessage({ id: 'pages.condo.property.id.ModalTitle' })
    const ModalDescription = intl.formatMessage({ id: 'pages.condo.property.id.ModalDescription' })
    const AlreadySentTitle = intl.formatMessage({ id: 'pages.condo.property.id.AlreadySentTitle' })
    const LoadingError = intl.formatMessage({ id: 'errors.LoadingError' })

    const { featureEnabled, setupButtonClick, organizationId, propertyId, hasAccess } = props

    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()
    const [createBankAccountRequest, { loading: createBankAccountRequestLoading }] = useMutation(CREATE_BANK_ACCOUNT_REQUEST_MUTATION)

    const [bankAccountModalVisible, setBankAccountModalVisible] = useState(false)

    const createBankAccountRequestCallback = useCallback(async () => {
        const alreadySent = cookie.get(`createBankAccountRequestSent-${propertyId}`)
        if (alreadySent) {
            notification.error({ message: AlreadySentTitle })
        } else {
            const { error } = await createBankAccountRequest({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        organizationId,
                        propertyId: propertyId,
                    },
                },
            })

            if (error) {
                notification.error({
                    message: LoadingError,
                })
            } else {
                cookie.set(`createBankAccountRequestSent-${propertyId}`, true, { expires: 1 })
                setBankAccountModalVisible(true)
            }
        }
    }, [AlreadySentTitle, LoadingError, organizationId, propertyId, createBankAccountRequest])
    const closeBankAccountModal = () => setBankAccountModalVisible(false)

    const isButtonsHidden = !hasAccess || !featureEnabled
    const isSmall = width >= PROPERTY_CARD_WIDTH_THRESHOLD

    return (
        <>
            <Space direction='vertical' size={12}>
                <Typography.Title level={3}>
                    {featureEnabled ? PropertyReportTitle : PropertyReportComingSoonTitle}
                </Typography.Title>
                <>
                    <Typography.Paragraph>{PropertyReportDescription}</Typography.Paragraph>
                    {featureEnabled
                        ? hasAccess ? null : (
                            <Typography.Paragraph>{PropertyReportAccessDeniedTitle}</Typography.Paragraph>
                        )
                        : (
                            <Typography.Paragraph>{PropertyReportComingSoonSubTitle}</Typography.Paragraph>
                        )}
                </>
            </Space>
            <PropertyReportCardBottomWrapper
                ref={setRef}
                isSmall={isSmall}
                isButtonsHidden={isButtonsHidden}
            >
                <Space direction='vertical' size={12} hidden={isButtonsHidden}>
                    <Button type='primary' onClick={setupButtonClick}>
                        {SetupReportTitle}
                    </Button>
                    <Button
                        type='secondary'
                        onClick={createBankAccountRequestCallback}
                        loading={createBankAccountRequestLoading}
                    >
                        {BecomeSberClientTitle}
                    </Button>
                </Space>
                <ImageWrapper>
                    <Image src='/property-empty-report.png' preview={false} />
                </ImageWrapper>
            </PropertyReportCardBottomWrapper>
            <Modal
                title={ModalTitle}
                open={bankAccountModalVisible}
                onCancel={closeBankAccountModal}
            >
                <Typography.Paragraph type='secondary'>
                    {ModalDescription}
                </Typography.Paragraph>
            </Modal>
        </>
    )
}

interface IPropertyReportCard {
    ({ organizationId, property, role }: { organizationId: string, property: Property, role: unknown }): React.ReactElement
}

const PropertyReportCard: IPropertyReportCard = ({ organizationId, property, role }) => {
    const { asPath, push } = useRouter()
    const { useFlag } = useFeatureFlags()

    const { obj: bankAccount, loading } = BankAccount.useObject({
        where: {
            organization: { id: organizationId },
            property: { id: property.id },
        },
    })
    const { objs: [bankIntegrationAccountContext], loading: loadingIntegrationContext } = BankIntegrationAccountContext.useObjects({
        where: {
            id: get(bankAccount, 'integrationContext.id'),
        },
        first: 1,
    })

    const setupReportClick = useCallback(async () => {
        await push(asPath + '/report')
    }, [asPath, push])

    const bankAccountCardEnabled = useFlag(PROPERTY_BANK_ACCOUNT)
    const canManageBankAccount = get(role, 'canManageBankAccounts', false)

    return (
        <>
            <Card css={PropertyCardCss}>
                {loading || loadingIntegrationContext ? <Loader fill size='large' /> : (
                    <PropertyCardContent>
                        {bankAccountCardEnabled && bankAccount && canManageBankAccount
                            ? <PropertyCardBalanceContent
                                bankAccount={bankAccount}
                                bankIntegrationAccountContext={bankIntegrationAccountContext}
                                clickCallback={setupReportClick} />
                            : <PropertyCardInfoContent
                                hasAccess={canManageBankAccount}
                                featureEnabled={bankAccountCardEnabled}
                                setupButtonClick={setupReportClick}
                                organizationId={organizationId}
                                propertyId={property.id}
                            />
                        }
                    </PropertyCardContent>
                )}
            </Card>
        </>
    )
}

export {
    PropertyReportCard,
}
