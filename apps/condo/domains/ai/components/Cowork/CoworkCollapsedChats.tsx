import React, { useCallback, useState } from 'react'

import { History } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Dropdown, Typography } from '@open-condo/ui'
import type { DropdownProps } from '@open-condo/ui'

import { MenuItem } from '@condo/domains/common/components/MenuItem'

import styles from './Cowork.module.css'
import { MenuItemGroupItem } from './CoworkMenuItemGroup'
import { useSavedChats } from './SavedChatsContext'

import type { SavedChat } from './SavedChatsService'
import type { MenuProps } from 'antd'


const buildGroupItems = (title: string, chats: Array<SavedChat>, onTogglePin: (id: string, pinned: boolean) => void, onNavigate: () => void): MenuProps['items'] => {
    if (chats.length === 0) return []

    return [
        {
            key: `group-${title}`,
            type: 'group',
            label: (
                <Typography.Title type='secondary' level={5}>
                    {title}
                </Typography.Title>
            ),
            children: chats.map((chat) => ({
                key: chat.id,
                label: <MenuItemGroupItem item={chat} onTogglePin={onTogglePin} onNavigate={onNavigate} />,
            })),
        },
    ]
}

export const CoworkCollapsedChats: React.FC = () => {
    const intl = useIntl()
    const { pinnedChats, unpinnedChats, updateChat } = useSavedChats()
    const [isOpen, setIsOpen] = useState(false)

    const chatsLabel = intl.formatMessage({ id: 'ai.cowork.chats' })
    const pinnedLabel = intl.formatMessage({ id: 'ai.cowork.pinned' })

    const handleTogglePin = useCallback((id: string, pinned: boolean) => {
        void updateChat(id, { pinned })
    }, [updateChat])

    const handleNavigate = useCallback(() => {
        setIsOpen(false)
    }, [])

    const hasChats = pinnedChats.length > 0 || unpinnedChats.length > 0

    if (!hasChats) {
        return null
    }

    const items: MenuProps['items'] = [
        ...buildGroupItems(pinnedLabel, pinnedChats, handleTogglePin, handleNavigate),
        ...buildGroupItems(chatsLabel, unpinnedChats, handleTogglePin, handleNavigate),
    ]

    const trigger: DropdownProps['trigger'] = ['click']

    return (
        <Dropdown
            menu={{ items }}
            trigger={trigger}
            placement='bottomRight'
            open={isOpen}
            onOpenChange={setIsOpen}
            overlayClassName={styles.collapsedChatsDropdown}
        >
            <div>
                <MenuItem
                    id='collapsed-chats'
                    label={chatsLabel}
                    labelRaw
                    icon={History}
                    isCollapsed
                />
            </div>
        </Dropdown>
    )
}
