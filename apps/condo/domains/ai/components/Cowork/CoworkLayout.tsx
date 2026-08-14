import Router, { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { PlusCircle, Rocket, Settings, Smartphone } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import BaseLayout from '@condo/domains/common/components/containers/BaseLayout'
import { TopMenuItems, type ITopMenuItemsProps } from '@condo/domains/common/components/containers/BaseLayout/components/TopMenuItems'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Logo as DefaultLogo } from '@condo/domains/common/components/Logo'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './Cowork.module.css'
import { CoworkCollapsedChats } from './CoworkCollapsedChats'
import { CoworkMenuItemGroup } from './CoworkMenuItemGroup'
import { SavedChatsProvider, useSavedChats } from './SavedChatsContext'


const AI_SESSION_STORAGE_KEY = 'condo-ai-chat-session-id'
const AI_CHAT_HISTORY_STORAGE_KEY = 'condo-ai-chat-history'
const sessionStorageManager = new LocalStorageManager<Record<string, string>>()
const historyStorageManager = new LocalStorageManager<Record<string, { history: Array<{ role: string }>, organizationId: string }>>()


const MAIN_MENU_ITEMS = [
    {
        path: '/cowork/miniapps',
        key: 'miniapps',
        id: 'miniapps',
        label: 'ai.cowork.myMiniapps',
        icon: Smartphone,
    },
    {
        path: '/cowork/skills',
        key: 'skills',
        id: 'skills',
        label: 'ai.cowork.skills',
        icon: Rocket,
    },
]

const ChatsSection: React.FC = () => {
    const intl = useIntl()
    const { isCollapsed } = useLayoutContext()
    const { pinnedChats, unpinnedChats } = useSavedChats()

    const pinnedLabel = intl.formatMessage({ id: 'ai.cowork.pinned' })
    const chatsLabel = intl.formatMessage({ id: 'ai.cowork.chats' })

    if (isCollapsed) {
        return <CoworkCollapsedChats />
    }

    const hasChats = pinnedChats.length > 0 || unpinnedChats.length > 0

    if (!hasChats) {
        return null
    }

    return (
        <div className={styles.sideMenuChatsSection}>
            <CoworkMenuItemGroup title={pinnedLabel} items={pinnedChats} />
            <CoworkMenuItemGroup title={chatsLabel} items={unpinnedChats} />
        </div>
    )
}

const CoworkSideMenu: React.FC = () => {
    const { isCollapsed } = useLayoutContext()
    const intl = useIntl()
    const { organization } = useOrganization()
    const { chats, createChat } = useSavedChats()
    const router = useRouter()

    const newChatLabel = intl.formatMessage({ id: 'ai.cowork.newChat' })

    const handleNewChat = useCallback(async () => {
        // If the current chat is empty (no user messages), don't create a new one — just stay on it
        const queryChatId = router.query.chatId as string | undefined
        const orgId = organization?.id
        const currentChatId = queryChatId
            ?? (orgId ? (sessionStorageManager.getItem(AI_SESSION_STORAGE_KEY) || {})[orgId] : undefined)

        if (currentChatId && chats.some((c) => c.id === currentChatId)) {
            const savedHistory = historyStorageManager.getItem(AI_CHAT_HISTORY_STORAGE_KEY) || {}
            const sessionData = savedHistory[currentChatId]
            const hasUserMessages = Boolean(sessionData?.history?.some((msg) => msg.role === 'user'))
            if (!hasUserMessages) {
                void Router.push(`/cowork/chat?chatId=${currentChatId}`)
                return
            }
        }

        const newChat = await createChat(newChatLabel)
        void Router.push(`/cowork/chat?chatId=${newChat.id}`)
    }, [router.query.chatId, organization, chats, createChat, newChatLabel])

    return (
        <>
            <MenuItem
                id='new-chat'
                key='menu-item-new-chat'
                icon={PlusCircle}
                label='ai.cowork.newChat'
                isCollapsed={isCollapsed}
                onClick={handleNewChat}
            />
            {MAIN_MENU_ITEMS.map((item) => (
                <MenuItem
                    id={item.id}
                    key={`menu-item-${item.key}`}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                    isCollapsed={isCollapsed}
                />
            ))}
            <MenuItem
                id='settings'
                key='menu-item-settings'
                path='/cowork/settings'
                icon={Settings}
                label='ai.cowork.settings'
                isCollapsed={isCollapsed}
            />
            <ChatsSection />
        </>
    )
}


const CoworkTopMenuItems: React.FC<ITopMenuItemsProps> = (props) => (
    <TopMenuItems {...props} hideNotifications hideAIButton />
)

const Logo: React.FC = () => {
    const intl = useIntl()
    const { isCollapsed } = useLayoutContext()
    const label = intl.formatMessage({ id: 'ai.cowork.title' })

    if (isCollapsed) {
        return (
            <div className={styles.sideMenuLogo}>
                <DefaultLogo minified/>
            </div>
        )
    }

    return (
        <div className={styles.sideMenuLogo}>
            <Typography.Title level={2} type='primary'>
                {label}
            </Typography.Title>
        </div>
    )
}


export const CoworkLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <SavedChatsProvider>
            <BaseLayout
                TopMenuItems={CoworkTopMenuItems}
                menuDataRender={() => []}
                logoLocation='/cowork'
                logo={<Logo/>}
                onLogoClick={() => void Router.push('/cowork')}
                headerAction={null}
                menuData={<CoworkSideMenu/>}
                residentActions={false}
            >
                {children}
            </BaseLayout>
        </SavedChatsProvider>
    )
}
