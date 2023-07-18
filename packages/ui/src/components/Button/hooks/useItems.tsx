import { ItemType as MenuItemType } from 'antd/lib/menu/hooks/useItems'
import React, { useMemo } from 'react'

import { sendAnalyticsClickEvent } from '../../_utils/analytics'
import { Space } from '../../Space'
import { Typography } from '../../Typography'
import { DropdownButtonProps, ItemType } from '../dropdownButton'


const DROPDOWN_CLASS_PREFIX = 'condo-dropdown'


type UseItems = (items: Array<ItemType>, type: DropdownButtonProps['type']) => Array<MenuItemType>

const convertItems = (items: Array<ItemType>, type: DropdownButtonProps['type']): Array<MenuItemType> => {
    if (items.length < 1) return []

    const resultItems: Array<MenuItemType> = []

    for (let index = 0; index < items.length; index++) {
        const item = items[index]

        if (!item) continue

        const { key, description, disabled, onClick, label, icon, id } = item
        const mergedKey = key || index

        const isItemWithIcon = item.icon
        const isItemWithDescription = item.description

        const withDividerAfterItem = index + 1 < items.length

        const mergedItem: MenuItemType = {
            key: mergedKey,
            disabled,
            onClick: (...args) => {
                const stringContent = label

                if (stringContent) {
                    sendAnalyticsClickEvent('Button', { value: stringContent, type, id })
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

export const useItems: UseItems = (items, type) => {
    return useMemo(() => {
        if (!items || items.length < 1) return []

        return convertItems(items, type)
    }, [items, type])
}
