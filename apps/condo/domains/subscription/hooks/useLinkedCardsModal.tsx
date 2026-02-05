import { useGetOrganizationMetaQuery, useUpdateOrganizationPaymentMethodsMutation, useGetOrganizationActivatedSubscriptionsQuery } from '@app/condo/gql'
import { notification, Row, Col } from 'antd'
import dayjs from 'dayjs'
import getConfig from 'next/config'
import React, { useCallback, useMemo, useState } from 'react'

import { Trash } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal, Typography, Space, Card, Button } from '@open-condo/ui'

const { publicRuntimeConfig } = getConfig()
const CARD_ISSUER_IMAGES = publicRuntimeConfig?.cardIssuerImages || {}

// TODO(DOMA-12895): Move payment methods from Organization.meta to separate model
type PaymentMethod = {
    id: string
    type: string
    cardMask: string
    cardType: string
    title: string
    cardIssuerCountry?: string
    cardIssuerName?: string
}

export const useLinkedCardsModal = () => {
    const intl = useIntl()
    const { organization, role } = useOrganization()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [isUnbinding, setIsUnbinding] = useState(false)
    
    const { data: organizationMetaData, refetch: refetchOrganizationMeta } = useGetOrganizationMetaQuery({
        variables: { id: organization?.id || '' },
        skip: !organization?.id,
    })
    
    const { data: activatedSubscriptionsData } = useGetOrganizationActivatedSubscriptionsQuery({
        variables: { 
            organizationId: organization?.id || '',
            now: dayjs().format('YYYY-MM-DD'),
        },
        skip: !organization?.id,
    })

    const LinkedCardsTitle = intl.formatMessage({ id: 'subscription.linkedCards.title' })
    const UnbindCardTitle = intl.formatMessage({ id: 'subscription.linkedCards.unbind.title' })
    const UnbindCardMessage = intl.formatMessage({ id: 'subscription.linkedCards.unbind.message' })
    const UnbindButtonLabel = intl.formatMessage({ id: 'subscription.linkedCards.unbind.action' })
    const NotificationTitle = intl.formatMessage({ id: 'subscription.linkedCards.unbind.notification.title' })
    const NotificationDescription = intl.formatMessage({ id: 'subscription.linkedCards.unbind.notification.description' })
    const ForSubscriptionPaymentMessage = intl.formatMessage({ id: 'subscription.linkedCards.forSubscriptionPayment' })

    const paymentMethods: PaymentMethod[] = useMemo(() => {
        return organizationMetaData?.organization?.meta?.paymentMethods || organization?.meta?.paymentMethods || []
    }, [organizationMetaData, organization])
    
    const paymentMethod: PaymentMethod | null = useMemo(() => {
        return paymentMethods.length > 0 ? paymentMethods[0] : null
    }, [paymentMethods])

    const canManageSubscriptions = role?.canManageSubscriptions

    const openModal = useCallback(() => {
        setIsModalOpen(true)
    }, [])

    const closeModal = useCallback(() => {
        setIsModalOpen(false)
    }, [])

    const handleUnbindClick = useCallback(() => {
        setIsConfirmModalOpen(true)
    }, [])

    const closeConfirmModal = useCallback(() => {
        setIsConfirmModalOpen(false)
    }, [])

    const [updateOrganization] = useUpdateOrganizationPaymentMethodsMutation()

    const handleUnbindConfirm = useCallback(async () => {
        if (!organization || !canManageSubscriptions || !paymentMethod) return

        setIsUnbinding(true)
        try {
            const sender = getClientSideSenderInfo()
            
            const updatedPaymentMethods = paymentMethods.filter(pm => pm.id !== paymentMethod.id)
            
            await updateOrganization({
                variables: {
                    id: organization.id,
                    data: {
                        dv: 1,
                        sender,
                        meta: {
                            ...organization.meta,
                            paymentMethods: updatedPaymentMethods,
                        },
                    },
                },
            })

            await refetchOrganizationMeta()

            setIsConfirmModalOpen(false)
            setIsModalOpen(false)

            notification.success({
                message: <Typography.Text size='large' strong>{NotificationTitle}</Typography.Text>,
                description: NotificationDescription,
            })
        } catch (error) {
            console.error('Failed to unbind card:', error)
        } finally {
            setIsUnbinding(false)
        }
    }, [organization, canManageSubscriptions, paymentMethod, paymentMethods, updateOrganization, refetchOrganizationMeta, NotificationTitle, NotificationDescription])

    const LinkedCardsModal = useMemo(() => (
        <>
            <Modal
                open={isModalOpen}
                onCancel={closeModal}
                title={LinkedCardsTitle}
                footer={null}
            >
                {paymentMethod && (
                    <Card style={{ width: '100%' }}>
                        <Row justify='space-between' align='middle'>
                            <Col>
                                <Space size={8} direction='horizontal'>
                                    <img 
                                        src={CARD_ISSUER_IMAGES[paymentMethod.cardIssuerName] || '/otherCard.svg'} 
                                        alt={paymentMethod.cardIssuerName || 'card'}
                                        width={60}
                                        height={40}
                                        style={{ display: 'block' }}
                                    />
                                    <Space size={4} direction='horizontal'>
                                        <Typography.Text>
                                            {paymentMethod.cardType} ∙ {paymentMethod.cardMask?.slice(-4)}
                                        </Typography.Text>
                                        <Typography.Text type='secondary'>
                                            {ForSubscriptionPaymentMessage}
                                        </Typography.Text>
                                    </Space>
                                </Space>
                            </Col>
                            <Col>
                                <Button
                                    minimal
                                    compact
                                    size='large'
                                    type='primary'
                                    icon={<Trash size='small' />}
                                    onClick={handleUnbindClick}
                                    disabled={!canManageSubscriptions}
                                />
                            </Col>
                        </Row>
                    </Card>
                )}
            </Modal>
            <Modal
                open={isConfirmModalOpen}
                onCancel={closeConfirmModal}
                title={UnbindCardTitle}
                footer={[
                    <Button
                        key='unbind'
                        type='secondary'
                        danger
                        loading={isUnbinding}
                        onClick={handleUnbindConfirm}
                        disabled={!canManageSubscriptions}
                    >
                        {UnbindButtonLabel}
                    </Button>,
                ]}
            >
                <Typography.Paragraph>
                    {UnbindCardMessage}
                </Typography.Paragraph>
            </Modal>
        </>
    ), [isModalOpen, closeModal, LinkedCardsTitle, paymentMethod, ForSubscriptionPaymentMessage, handleUnbindClick, canManageSubscriptions, isConfirmModalOpen, closeConfirmModal, UnbindCardTitle, isUnbinding, handleUnbindConfirm, UnbindButtonLabel, UnbindCardMessage])

    return {
        LinkedCardsModal,
        openModal,
        hasPaymentMethod: !!paymentMethod,
    }
}
