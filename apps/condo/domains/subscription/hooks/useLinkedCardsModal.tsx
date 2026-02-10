import { useGetOrganizationMetaQuery, useUpdateOrganizationPaymentMethodsMutation } from '@app/condo/gql'
import { notification, Row, Col } from 'antd'
import getConfig from 'next/config'
import { useCallback, useMemo, useState } from 'react'

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

const getCardIssuerImageUrl = (cardIssuerName?: string): string => {
    if (!cardIssuerName) return '/otherCard.svg'
    
    const lowerIssuerName = cardIssuerName.toLowerCase()
    const matchingKey = Object.keys(CARD_ISSUER_IMAGES).find(key => 
        lowerIssuerName.includes(key.toLowerCase())
    )
    
    return matchingKey ? CARD_ISSUER_IMAGES[matchingKey] : '/otherCard.svg'
}

type UseLinkedCardsModalProps = {
    activePaymentMethodId?: string | null
}

export const useLinkedCardsModal = ({ activePaymentMethodId }: UseLinkedCardsModalProps = {}) => {
    const intl = useIntl()
    const { organization, role } = useOrganization()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [isUnbinding, setIsUnbinding] = useState(false)
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

    const { data: organizationMetaData, refetch: refetchOrganizationMeta } = useGetOrganizationMetaQuery({
        variables: { id: organization?.id || '' },
        skip: !organization?.id,
    })

    const LinkedCardsTitle = intl.formatMessage({ id: 'subscription.linkedCards.title' })
    const UnbindCardTitle = intl.formatMessage({ id: 'subscription.linkedCards.unbind.title' })
    const UnbindCardMessage = intl.formatMessage({ id: 'subscription.linkedCards.unbind.message' })
    const UnbindButtonLabel = intl.formatMessage({ id: 'subscription.linkedCards.unbind.action' })
    const NotificationTitle = intl.formatMessage({ id: 'subscription.linkedCards.unbind.notification.title' })
    const NotificationDescription = intl.formatMessage({ id: 'subscription.linkedCards.unbind.notification.description' })
    const ErrorNotificationTitle = intl.formatMessage({ id: 'subscription.linkedCards.unbind.error.title' })
    const ErrorNotificationDescription = intl.formatMessage({ id: 'subscription.linkedCards.unbind.error.description' })
    const ForSubscriptionPaymentMessage = intl.formatMessage({ id: 'subscription.linkedCards.forSubscriptionPayment' })

    const getCardTypeTranslation = useCallback((cardType?: string): string => {
        if (!cardType) return ''
        
        const upperCardType = cardType.toUpperCase()
        const translationKey = `subscription.linkedCards.cardType.${upperCardType}`
        
        try {
            return intl.formatMessage({ id: translationKey as FormatjsIntl.Message['ids'] })
        } catch {
            return upperCardType
        }
    }, [intl])

    const paymentMethods: PaymentMethod[] = useMemo(() => {
        return organizationMetaData?.organization?.meta?.paymentMethods || organization?.meta?.paymentMethods || []
    }, [organizationMetaData, organization])

    const canManageSubscriptions = role?.canManageSubscriptions

    const openModal = useCallback(() => {
        setIsModalOpen(true)
    }, [])

    const closeModal = useCallback(() => {
        setIsModalOpen(false)
    }, [])

    const handleUnbindClick = useCallback((cardId: string) => {
        setSelectedCardId(cardId)
        setIsConfirmModalOpen(true)
    }, [])

    const closeConfirmModal = useCallback(() => {
        setIsConfirmModalOpen(false)
        setSelectedCardId(null)
    }, [])

    const [updateOrganization] = useUpdateOrganizationPaymentMethodsMutation()

    const handleUnbindConfirm = useCallback(async () => {
        if (!organization || !canManageSubscriptions || !selectedCardId) return

        setIsUnbinding(true)
        try {
            const sender = getClientSideSenderInfo()
            
            const updatedPaymentMethods = paymentMethods.filter(pm => pm.id !== selectedCardId)
            
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
            setSelectedCardId(null)

            notification.success({
                message: <Typography.Text size='large' strong>{NotificationTitle}</Typography.Text>,
                description: NotificationDescription,
            })
        } catch (error) {
            console.error('Failed to unbind card:', error)
            notification.error({
                message: <Typography.Text size='large' strong>{ErrorNotificationTitle}</Typography.Text>,
                description: ErrorNotificationDescription,
            })
        } finally {
            setIsUnbinding(false)
        }
    }, [organization, canManageSubscriptions, selectedCardId, paymentMethods, updateOrganization, refetchOrganizationMeta, NotificationTitle, NotificationDescription, ErrorNotificationTitle, ErrorNotificationDescription])

    const LinkedCardsModal = useMemo(() => (
        <>
            <Modal
                open={isModalOpen}
                onCancel={closeModal}
                title={LinkedCardsTitle}
                footer={null}
            >
                <Space size={12} direction='vertical' width='100%'>
                    {paymentMethods.map((paymentMethod) => {
                        const isActiveCard = paymentMethod.id === activePaymentMethodId
                        return (
                            <Card key={paymentMethod.id} width='100%'>
                                <Row justify='space-between' align='middle'>
                                    <Col>
                                        <Space size={8} direction='horizontal'>
                                            <img 
                                                src={imageErrors[paymentMethod.id] ? '/otherCard.svg' : getCardIssuerImageUrl(paymentMethod.cardIssuerName)} 
                                                alt={paymentMethod.cardIssuerName || 'card'}
                                                width={60}
                                                height={40}
                                                style={{ display: 'block' }}
                                                onError={() => setImageErrors(prev => ({ ...prev, [paymentMethod.id]: true }))}
                                            />
                                            <Space size={4} direction='horizontal'>
                                                <Typography.Text>
                                                    {getCardTypeTranslation(paymentMethod.cardType)} ∙ {paymentMethod.cardMask?.slice(-4)}
                                                </Typography.Text>
                                                {isActiveCard && (
                                                    <Typography.Text type='secondary'>
                                                        {ForSubscriptionPaymentMessage}
                                                    </Typography.Text>
                                                )}
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
                                            onClick={() => handleUnbindClick(paymentMethod.id)}
                                            disabled={!canManageSubscriptions}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        )
                    })}
                </Space>
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
    ), [isModalOpen, closeModal, LinkedCardsTitle, paymentMethods, activePaymentMethodId, imageErrors, getCardTypeTranslation, ForSubscriptionPaymentMessage, handleUnbindClick, canManageSubscriptions, isConfirmModalOpen, closeConfirmModal, UnbindCardTitle, isUnbinding, handleUnbindConfirm, UnbindButtonLabel, UnbindCardMessage])

    return {
        LinkedCardsModal,
        openModal,
        hasPaymentMethod: paymentMethods.length > 0,
    }
}
