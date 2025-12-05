import { useRouter } from 'next/router'
import React from 'react'

import { Lock } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Modal, Typography, Space, Button } from '@open-condo/ui'


const { Title, Paragraph } = Typography

interface SubscriptionAccessModalProps {
    /**
     * Is modal visible
     */
    visible: boolean
    
    /**
     * Callback when modal is closed
     */
    onClose: () => void
    
    /**
     * Type of access issue
     * - 'no-subscription': User has no active subscription
     * - 'feature-locked': User's plan doesn't include this feature
     */
    type: 'no-subscription' | 'feature-locked'
    
    /**
     * Feature name (for feature-locked type)
     */
    featureName?: string
}

/**
 * Modal that shows when user tries to access a page without proper subscription
 */
export const SubscriptionAccessModal: React.FC<SubscriptionAccessModalProps> = ({
    visible,
    onClose,
    type,
    featureName,
}) => {
    const intl = useIntl()
    const router = useRouter()

    const handleGoToSubscription = () => {
        onClose()
        router.push('/subscription')
    }

    const handleClose = () => {
        onClose()
        // Redirect to home or previous page
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push('/')
        }
    }

    const content = type === 'no-subscription' ? {
        title: intl.formatMessage({ id: 'subscription.access.noSubscription.title', defaultMessage: 'Требуется активная подписка' }),
        description: intl.formatMessage({ id: 'subscription.access.noSubscription.description', defaultMessage: 'Для доступа к этой странице необходима активная подписка на один из тарифных планов.' }),
        ctaText: intl.formatMessage({ id: 'subscription.access.viewPlans', defaultMessage: 'Посмотреть тарифы' }),
    } : {
        title: intl.formatMessage({ id: 'subscription.access.featureLocked.title', defaultMessage: 'Функция недоступна' }),
        description: intl.formatMessage(
            { id: 'subscription.access.featureLocked.description', defaultMessage: 'Функция «{feature}» недоступна в вашем текущем тарифном плане.' },
            { feature: featureName }
        ),
        ctaText: intl.formatMessage({ id: 'subscription.access.upgradePlan', defaultMessage: 'Изменить тариф' }),
    }

    return (
        <Modal
            open={visible}
            onCancel={handleClose}
            footer={[
                <Button key='close' type='secondary' onClick={handleClose}>
                    {intl.formatMessage({ id: 'subscription.access.back', defaultMessage: 'Назад' })}
                </Button>,
                <Button key='subscription' type='primary' onClick={handleGoToSubscription}>
                    {content.ctaText}
                </Button>,
            ]}
        >
            <Space direction='vertical' size={16}>
                <div style={{ textAlign: 'center', paddingTop: 24 }}>
                    <Lock size='large' style={{ fontSize: 48, color: '#faad14' }} />
                </div>
                
                <div style={{ textAlign: 'center' }}>
                    <Title level={3}>{content.title}</Title>
                    <Paragraph style={{ fontSize: 16 }}>
                        {content.description}
                    </Paragraph>
                </div>

                <div style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 8,
                    textAlign: 'center',
                }}>
                    <Paragraph type='secondary'>
                        {intl.formatMessage({ id: 'subscription.access.hint', defaultMessage: 'Выберите подходящий тариф, чтобы получить доступ ко всем возможностям системы.' })}
                    </Paragraph>
                </div>
            </Space>
        </Modal>
    )
}
