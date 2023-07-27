import { ItemType as MenuItemType } from 'antd/lib/menu/hooks/useItems'
import React, { useMemo } from 'react'

import { sendAnalyticsClickEvent } from '../../_utils/analytics'
import { Space } from '../../Space'
import { Typography } from '../../Typography'
import { DROPDOWN_CLASS_PREFIX } from '../dropdown'
import { ItemType } from '../dropdownButton'


type UseItems = (items: Array<ItemType>, triggerId?: string) => Array<MenuItemType>

const convertItems = (items: Array<ItemType>, triggerId?: string): Array<MenuItemType> => {
    if (items.length < 1) return []

    const resultItems: Array<MenuItemType> = []

    for (let index = 0; index < items.length; index++) {
        const item = items[index]

        if (!item) continue

        const { key, description, disabled, onClick, label, icon, id } = item
        const mergedKey = key || index

        const isItemWithIcon = Boolean(item.icon)
        const isItemWithDescription = Boolean(item.description)

        const withDividerAfterItem = index + 1 < items.length

        const mergedItem: MenuItemType = {
            key: mergedKey,
            disabled,
            onClick: (...args) => {
                const stringContent = label

                if (stringContent) {
                    sendAnalyticsClickEvent('Dropdown', {
                        optionValue: stringContent, id: triggerId, optionId: id,
                    })
                }

                if (onClick) {
                    onClick(...args)
                }
            },
        }

        if (isItemWithIcon) {
            mergedItem.label = (
                <Space size={12} direction='horizontal' align='start'>
                    <span className={`${DROPDOWN_CLASS_PREFIX}-item-icon`}>{icon}</span>
                    <Typography.Title level={5}>
                        {label}
                    </Typography.Title>
                </Space>
            )
        } else {
            mergedItem.label = (
                <Space size={4} direction='vertical'>
                    <Typography.Title level={5}>
                        {label}
                    </Typography.Title>
                    {
                        isItemWithDescription && (
                            <Typography.Paragraph type='secondary' size='medium'>
                                {description}
                            </Typography.Paragraph>
                        )
                    }
                </Space>
            )
        }

        resultItems.push(mergedItem)

        if (withDividerAfterItem) {
            resultItems.push({ type: 'divider' })
        }
    }

    return resultItems
}

export const useItems: UseItems = (items, triggerId) => {
    return useMemo(() => {
        if (!items || items.length < 1) return []

        return convertItems(items, triggerId)
    }, [items, triggerId])
}
