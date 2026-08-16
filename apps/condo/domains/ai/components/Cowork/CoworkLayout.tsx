import Router from 'next/router'
import React, { useCallback, useState } from 'react'

import { ChevronDown, ChevronUp, PlusCircle, Rocket, Settings, Smartphone, Star, Subtitles } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'

import BaseLayout from '@condo/domains/common/components/containers/BaseLayout'
import { TopMenuItems, type ITopMenuItemsProps } from '@condo/domains/common/components/containers/BaseLayout/components/TopMenuItems'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './Cowork.module.css'
import { LogoCowork } from './LogoCowork'
import { SavedChatsProvider, useSavedChats } from './SavedChatsContext'


const CHAT_SECTIONS_OPEN_KEY = 'condo-ai-cowork-chat-sections-open'
const sectionsOpenManager = new LocalStorageManager<Record<string, boolean>>()

const FakeIcon: React.FC = () => <span style={{ display: 'inline-block', width: 20, height: 20, flexShrink: 0 }} />

// Builds a label node that places the chevron after the text, reflecting open/closed state.
// When the sidebar is collapsed there is no label, so no chevron is needed.
const makeSectionLabel = (text: string, open: boolean, collapsed: boolean) => {
    if (collapsed) return text
    const Chevron = open ? ChevronUp : ChevronDown
    return (
        <span className={styles.sectionLabel}>
            <span>{text}</span>
            <Chevron size='small' />
        </span>
    )
}


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


const CoworkSideMenu: React.FC = () => {
    const { isCollapsed, toggleCollapsed } = useLayoutContext()
    const intl = useIntl()
    const { pinnedChats, unpinnedChats } = useSavedChats()

    const pinnedLabel = intl.formatMessage({ id: 'ai.cowork.pinned' })
    const chatsLabel = intl.formatMessage({ id: 'ai.cowork.chats' })

    const stored = sectionsOpenManager.getItem(CHAT_SECTIONS_OPEN_KEY) || {}
    const [pinnedOpen, setPinnedOpen] = useState(stored.pinned !== false)
    const [chatsOpen, setChatsOpen] = useState(stored.chats !== false)

    const toggleSection = useCallback((key: 'pinned' | 'chats', setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter((v) => {
            const next = !v
            const cur = sectionsOpenManager.getItem(CHAT_SECTIONS_OPEN_KEY) || {}
            sectionsOpenManager.setItem(CHAT_SECTIONS_OPEN_KEY, { ...cur, [key]: next })
            return next
        })
    }, [])

    const renderChatList = (sectionChats: Array<{ id: string, name: string }>) => (
        <>
            {sectionChats.map((chat) => (
                <MenuItem
                    id={`chat-${chat.id}`}
                    key={`chat-${chat.id}`}
                    path={`/cowork/chat?chatId=${chat.id}`}
                    label={chat.name}
                    labelRaw
                    isCollapsed={isCollapsed}
                    icon={FakeIcon}
                />
            ))}
        </>
    )

    return (
        <div className={styles.sideMenuScroll}>
            <MenuItem
                id='new-chat'
                key='menu-item-new-chat'
                icon={PlusCircle}
                label='ai.cowork.newChat'
                isCollapsed={isCollapsed}
                onClick={() => void Router.push('/cowork/chat')}
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
            {(pinnedChats.length > 0 || unpinnedChats.length > 0) && (
                <div className={styles.sideMenuDivider} />
            )}
            {pinnedChats.length > 0 && (
                <>
                    <MenuItem
                        id='pinned-chats'
                        key='menu-item-pinned-chats'
                        icon={Star}
                        label={makeSectionLabel(pinnedLabel, pinnedOpen, isCollapsed)}
                        labelRaw
                        isCollapsed={isCollapsed}
                        menuItemWrapperProps={{ className: styles.sectionMenuItem }}
                        onClick={isCollapsed ? toggleCollapsed : () => toggleSection('pinned', setPinnedOpen)}
                    />
                    {pinnedOpen && !isCollapsed && renderChatList(pinnedChats)}
                </>
            )}
            {unpinnedChats.length > 0 && (
                <>
                    <MenuItem
                        id='chats'
                        key='menu-item-chats'
                        icon={Subtitles}
                        label={makeSectionLabel(chatsLabel, chatsOpen, isCollapsed)}
                        labelRaw
                        isCollapsed={isCollapsed}
                        menuItemWrapperProps={{ className: styles.sectionMenuItem }}
                        onClick={isCollapsed ? toggleCollapsed : () => toggleSection('chats', setChatsOpen)}
                    />
                    {chatsOpen && !isCollapsed && renderChatList(unpinnedChats)}
                </>
            )}
        </div>
    )
}


const CoworkTopMenuItems: React.FC<ITopMenuItemsProps> = (props) => (
    <TopMenuItems {...props} hideNotifications hideAIButton />
)

const Logo: React.FC = () => {
    const intl = useIntl()
    const { isCollapsed } = useLayoutContext()
    const label = intl.formatMessage({ id: 'ai.cowork.title' })

    return (
        <div className={styles.sideMenuLogo}>
            <LogoCowork minified={isCollapsed} title={label}/>
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
