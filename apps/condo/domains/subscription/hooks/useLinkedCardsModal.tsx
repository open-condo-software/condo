import { useGetOrganizationSubscriptionContextsWithPaymentMethodsQuery, useUpdateSubscriptionContextPaymentMethodMutation } from '@app/condo/gql'
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

type PaymentMethod = {
    id: string
    bindingId: string
    cardMask: string
    paymentSystem: string
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
    onCardUnbound?: () => void | Promise<void>
}

export const useLinkedCardsModal = ({ activePaymentMethodId, onCardUnbound }: UseLinkedCardsModalProps = {}) => {
    const intl = useIntl()
    const { organization, role } = useOrganization()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [isUnbinding, setIsUnbinding] = useState(false)
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

    const { data: subscriptionContextsData, refetch: refetchSubscriptionContexts } = useGetOrganizationSubscriptionContextsWithPaymentMethodsQuery({
        variables: { organizationId: organization?.id || '' },
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
        if (!subscriptionContextsData?.subscriptionContexts) return []

        const uniquePaymentMethods = new Map<string, PaymentMethod>()

        subscriptionContextsData.subscriptionContexts.forEach(context => {
            const paymentMethod = context.frozenPaymentInfo?.paymentMethod
            if (!paymentMethod || !paymentMethod.bindingId) return

            if (!uniquePaymentMethods.has(paymentMethod.bindingId)) {
                uniquePaymentMethods.set(paymentMethod.bindingId, {
                    id: paymentMethod.bindingId,
                    bindingId: paymentMethod.bindingId,
                    cardMask: paymentMethod.cardNumber || '',
                    paymentSystem: paymentMethod.paymentSystem || '',
                    title: `${paymentMethod.paymentSystem || ''} ${paymentMethod.cardNumber?.slice(-4) || ''}`,
                    cardIssuerCountry: paymentMethod.bankCountryCode || undefined,
                    cardIssuerName: paymentMethod.bankName || undefined,
                })
            }
        })

        return Array.from(uniquePaymentMethods.values())
    }, [subscriptionContextsData])

    const canManageSubscriptions = role?.canManageSubscriptions

    const handleImageError = useCallback((bindingId: string) => {
        setImageErrors(prev => ({ ...prev, [bindingId]: true }))
    }, [])

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

    const [updateSubscriptionContextPaymentMethod] = useUpdateSubscriptionContextPaymentMethodMutation()

    const handleUnbindConfirm = useCallback(async () => {
        if (!organization || !canManageSubscriptions || !selectedCardId) return

        setIsUnbinding(true)
        try {
            const sender = getClientSideSenderInfo()

            const contextsToUnbind = subscriptionContextsData?.subscriptionContexts?.filter(
                context => context.frozenPaymentInfo?.paymentMethod?.bindingId === selectedCardId
            ) || []

            for (const context of contextsToUnbind) {
                await updateSubscriptionContextPaymentMethod({
                    variables: {
                        data: {
                            dv: 1,
                            sender,
                            subscriptionContext: { id: context.id },
                            bindingId: null,
                        },
                    },
                })
            }

            await refetchSubscriptionContexts()

            if (onCardUnbound) {
                await onCardUnbound()
            }

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
    }, [organization, canManageSubscriptions, selectedCardId, subscriptionContextsData, updateSubscriptionContextPaymentMethod, refetchSubscriptionContexts, onCardUnbound, NotificationTitle, NotificationDescription, ErrorNotificationTitle, ErrorNotificationDescription])

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
                        const isActiveCard = paymentMethod.bindingId === activePaymentMethodId
                        return (
                            <Card key={paymentMethod.bindingId} width='100%'>
                                <Row justify='space-between' align='middle'>
                                    <Col>
                                        <Space size={8} direction='horizontal'>
                                            <img
                                                src={imageErrors[paymentMethod.bindingId] ? '/otherCard.svg' : getCardIssuerImageUrl(paymentMethod.cardIssuerName)}
                                                alt={paymentMethod.cardIssuerName || 'card'}
                                                width={60}
                                                height={40}
                                                style={{ display: 'block' }}
                                                onError={() => handleImageError(paymentMethod.bindingId)}
                                            />
                                            <Space size={4} direction='horizontal'>
                                                <Typography.Text>
                                                    {getCardTypeTranslation(paymentMethod.paymentSystem)} ∙ {paymentMethod.cardMask?.slice(-4)}
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
                                            onClick={() => handleUnbindClick(paymentMethod.bindingId)}
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
