import React from 'react'

import { Lock } from '@open-condo/icons'
import { Modal, Typography, Space, Button } from '@open-condo/ui'


const { Title, Paragraph } = Typography

interface UpgradeModalProps {
    /**
     * Is modal visible
     */
    visible: boolean
    
    /**
     * Callback when modal is closed
     */
    onClose: () => void
    
    /**
     * Feature that is blocked
     */
    feature: any
    
    /**
     * Localized feature name
     */
    featureName: string
    
    /**
     * Localized feature description
     */
    featureDescription?: string
    
    /**
     * Localized CTA button text
     */
    ctaText?: string
    
    /**
     * Callback when user clicks upgrade button
     */
    onUpgrade?: () => void
}

/**
 * Modal that shows when user tries to access a blocked feature
 * Displays information about the feature and upgrade options
 */
export const UpgradeModal: React.FC<UpgradeModalProps> = ({
    visible,
    onClose,
    feature,
    featureName,
    featureDescription,
    ctaText = 'Связаться с поддержкой',
    onUpgrade,
}) => {
    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade()
        } else {
            // Default behavior: redirect to subscription page
            window.location.href = '/subscription'
        }
    }

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={[
                <Button type='primary' key='cancel' onClick={onClose}>
                    Закрыть
                </Button>,
                <Button key='upgrade' type='primary' onClick={handleUpgrade}>
                    {ctaText}
                </Button>,
            ]}
        >
            <Space direction='vertical' size={16}>
                <div style={{ textAlign: 'center', paddingTop: 24 }}>
                    <Lock color='#faad14' />
                </div>
                
                <div style={{ textAlign: 'center' }}>
                    <Title level={3}>Функция недоступна</Title>
                    <Paragraph>
                        <strong>{featureName}</strong> недоступна в вашем текущем тарифе.
                    </Paragraph>
                    {featureDescription && (
                        <Paragraph type='secondary'>
                            {featureDescription}
                        </Paragraph>
                    )}
                </div>

                <div style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 8,
                    textAlign: 'center',
                }}>
                    <Paragraph>
                        Обновите тариф, чтобы получить доступ к этой функции и другим возможностям.
                    </Paragraph>
                </div>
            </Space>
        </Modal>
    )
}
