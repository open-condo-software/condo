import React from 'react'

import { AlertCircle } from '@open-condo/icons'
import { Space, Tooltip, Typography } from '@open-condo/ui'

import { INoOrganizationToolTipWrapper } from '@condo/domains/onboarding/hooks/useNoOrganizationToolTip'

interface LockedMenuItemDecoratorProps {
    featureName: string
    upgradeMessage?: string
}

/**
 * Decorator for locked menu items that shows a crown icon and tooltip
 * explaining that the feature requires a subscription upgrade
 */
export const useLockedMenuItemDecorator = (
    featureName: string,
    upgradeMessage?: string
): ((params: INoOrganizationToolTipWrapper) => JSX.Element) => {
    const defaultMessage = upgradeMessage || `Функция "${featureName}" доступна в расширенном тарифе`

    return ({ element, placement = 'right' }: INoOrganizationToolTipWrapper) => {
        return (
            <Tooltip
                title={
                    <Space direction='vertical' size={4}>
                        <Typography.Paragraph size='medium' type='secondary'>
                            {defaultMessage}
                        </Typography.Paragraph>
                        <Typography.Paragraph size='small' type='secondary'>
                            Перейдите в раздел "Подписка" для обновления тарифа
                        </Typography.Paragraph>
                    </Space>
                }
                placement={placement}
            >
                <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                    {element}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: '16px',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }}
                    >
                        <AlertCircle size='small' color='#faad14' />
                    </div>
                </div>
            </Tooltip>
        )
    }
}
