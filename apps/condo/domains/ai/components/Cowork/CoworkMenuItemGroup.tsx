import classnames from 'classnames'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { ChevronDown, Star, StarFilled } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Tooltip, Typography } from '@open-condo/ui'

import styles from './Cowork.module.css'
import { useSavedChats } from './SavedChatsContext'
import { SavedChat } from './SavedChatsService'


interface ICoworkMenuItemGroupProps {
    title: string
    items: Array<SavedChat>
    emptyMessage?: string
}

const MenuItemGroupItem: React.FC<{ item: SavedChat, onTogglePin: (id: string, pinned: boolean) => void }> = ({ item, onTogglePin }) => {
    const router = useRouter()
    const intl = useIntl()
    const pinChatLabel = intl.formatMessage({ id: 'ai.cowork.pinChat' })
    const unpinChatLabel = intl.formatMessage({ id: 'ai.cowork.unpinChat' })

    const isActive = useMemo(() => {
        const queryChatId = router.query.chatId as string | undefined

        return queryChatId === item.id
    }, [router.query.chatId, item.id])

    const handleClick = useCallback(() => {
        router.push(`/cowork/chat?chatId=${item.id}`)
    }, [router, item.id])

    return (
        <div
            className={classnames(styles.sideMenuItem, { [styles.sideMenuItemActive]: isActive })}
            onClick={handleClick}
        >
            <Typography.Title level={5} ellipsis={{ rows: 2 }} type='secondary'>
                {item.name}
            </Typography.Title>
            <div className={styles.sideMenuItemActions}>
                <Tooltip title={item.pinned ? unpinChatLabel : pinChatLabel}>
                    <Button
                        type='secondary'
                        size='medium'
                        compact
                        minimal
                        icon={item.pinned ? <StarFilled size='small' /> : <Star size='small' />}
                        onClick={(e) => {
                            e.stopPropagation()
                            onTogglePin(item.id, !item.pinned)
                        }}
                    />
                </Tooltip>
            </div>
        </div>
    )
}

export const CoworkMenuItemGroup: React.FC<ICoworkMenuItemGroupProps> = ({ title, items, emptyMessage }) => {
    const [collapsed, setCollapsed] = useState(false)
    const { updateChat } = useSavedChats()

    const handleTogglePin = useCallback((id: string, pinned: boolean) => {
        void updateChat(id, { pinned })
    }, [updateChat])

    if (items.length === 0 && !emptyMessage) {
        return null
    }

    return (
        <div className={styles.sideMenuGroup}>
            <div
                className={styles.sideMenuGroupHeader}
                onClick={() => setCollapsed((v) => !v)}
            >
                <span
                    className={classnames(styles.sideMenuGroupHeaderChevron, {
                        [styles.sideMenuGroupHeaderChevronCollapsed]: collapsed,
                    })}
                >
                    <ChevronDown size='small' />
                </span>
                <Typography.Title type='secondary' level={5}>
                    {title}
                </Typography.Title>
            </div>
            {!collapsed && (
                <div className={styles.sideMenuGroupContent}>
                    {items.length === 0 && emptyMessage && (
                        <div className={styles.sideMenuGroupEmpty}>{emptyMessage}</div>
                    )}
                    {items.map((item) => (
                        <MenuItemGroupItem key={item.id} item={item} onTogglePin={handleTogglePin} />
                    ))}
                </div>
            )}
        </div>
    )
}
