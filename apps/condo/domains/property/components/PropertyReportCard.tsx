/** @jsx jsx */
import React, { useState, useCallback } from 'react'
import { Space, Image, notification } from 'antd'
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import cookie from 'js-cookie'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Typography, Modal } from '@open-condo/ui'
import { useMutation } from '@open-condo/next/apollo'
import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { PROPERTY_BANK_ACCOUNT } from '@condo/domains/common/constants/featureflags'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { CREATE_BANK_ACCOUNT_REQUEST_MUTATION } from '@condo/domains/banking/gql'
import type { Property } from '@app/condo/schema'

const PROPERTY_CARD_WIDTH_THRESHOLD = 400

const PropertyReportCardBottomWrapper = styled.div<{ isSmall: boolean }>`
  display: flex;
  justify-content: space-between;
  ${({ isSmall }) => isSmall ? 'align-items: end;' : 'align-items: start;'}
  ${({ isSmall }) => isSmall ? 'flex-direction: row;' : 'flex-direction: column-reverse;'}
  
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
    max-width: 156px;
    max-height: 204px;
  }
`

const ImageWrapper = styled.div`
  display: flex;
  justify-content: end;
  align-content: center;
`

interface IPropertyReportCard {
    ({ organizationId, property }: { organizationId: string, property: Property }): React.ReactElement
}

const PropertyReportCard: IPropertyReportCard = ({ organizationId, property }) => {
    const intl = useIntl()
    const PropertyReportTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportTitle' })
    const PropertyReportDescription = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportDescription' })
    const PropertyReportComingSoonTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportComingSoonTitle' })
    const PropertyReportComingSoonSubTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportComingSoonSubTitle' })
    const PropertyReportComingSoonDescription = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportComingSoonDescription' })
    const BecomeSberClientTitle = intl.formatMessage({ id: 'pages.condo.property.id.becomeSberClientTitle' })
    const SetupReportTitle = intl.formatMessage({ id: 'pages.condo.property.id.setupReportTitle' })
    const ModalTitle = intl.formatMessage({ id: 'pages.condo.property.id.ModalTitle' })
    const ModalDescription = intl.formatMessage({ id: 'pages.condo.property.id.ModalDescription' })
    const AlreadySentTitle = intl.formatMessage({ id: 'pages.condo.property.id.AlreadySentTitle' })
    const LoadingError = intl.formatMessage({ id: 'errors.LoadingError' })

    const { useFlag } = useFeatureFlags()
    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()

    const [createBankAccountRequest, { loading: createBankAccountRequestLoading }] = useMutation(CREATE_BANK_ACCOUNT_REQUEST_MUTATION)

    const [bankAccountModalVisible, setBankAccountModalVisible] = useState(false)

    const createBankAccountRequestCallback = useCallback(async () => {
        const alreadySent = cookie.get('createBankAccountRequestSent')
        if (alreadySent) {
            notification.error({ message: AlreadySentTitle })
        } else {
            const { error } = await createBankAccountRequest({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        organizationId,
                        propertyId: property.id,
                    },
                },
            })

            if (error) {
                notification.error({
                    message: LoadingError,
                })
            } else {
                cookie.set('createBankAccountRequestSent', true, { expires: 1 })
                setBankAccountModalVisible(true)
            }
        }
    }, [AlreadySentTitle, LoadingError, organizationId, property, createBankAccountRequest])
    const closeBankAccountModal = () => setBankAccountModalVisible(false)


    const bankAccountCardEnabled = useFlag(PROPERTY_BANK_ACCOUNT)
    const isSmall = width >= PROPERTY_CARD_WIDTH_THRESHOLD

    return (
        <>
            <Card>
                <PropertyCardContent>
                    <Space direction='vertical' size={12}>
                        <Typography.Title level={3}>
                            {bankAccountCardEnabled ? PropertyReportTitle : PropertyReportComingSoonTitle}
                        </Typography.Title>
                        {bankAccountCardEnabled ? (
                            <Typography.Paragraph>{PropertyReportDescription}</Typography.Paragraph>
                        ) : (
                            <>
                                <Typography.Paragraph>{PropertyReportComingSoonSubTitle}</Typography.Paragraph>
                                <Typography.Paragraph>{PropertyReportComingSoonDescription}</Typography.Paragraph>
                            </>
                        )}
                    </Space>
                    <PropertyReportCardBottomWrapper ref={setRef} isSmall={isSmall}>
                        <Space direction='vertical' size={12}>
                            {bankAccountCardEnabled ? (
                                <>
                                    <Button type='primary'>
                                        {SetupReportTitle}
                                    </Button>
                                    <Button
                                        type='secondary'
                                        onClick={createBankAccountRequestCallback}
                                        loading={createBankAccountRequestLoading}
                                    >
                                        {BecomeSberClientTitle}
                                    </Button>
                                </>
                            )
                                : null
                            }
                        </Space>
                        <ImageWrapper>
                            <Image src='/property-empty-report.png' preview={false} />
                        </ImageWrapper>
                    </PropertyReportCardBottomWrapper>
                </PropertyCardContent>
            </Card>
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

export {
    PropertyReportCard,
}
