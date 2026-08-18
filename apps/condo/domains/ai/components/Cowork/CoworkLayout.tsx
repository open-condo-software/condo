import Router from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { ChevronDown, ChevronUp, PlusCircle, Rocket, Settings, Smartphone, Star, Subtitles } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'

import BaseLayout from '@condo/domains/common/components/containers/BaseLayout'
import { TopMenuItems, type ITopMenuItemsProps } from '@condo/domains/common/components/containers/BaseLayout/components/TopMenuItems'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { UI_AI_COWORK, UI_AI_COWORK_SETTINGS, UI_AI_COWORK_SKILLS } from '@condo/domains/common/constants/featureflags'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './Cowork.module.css'
import { LogoCowork } from './LogoCowork'
import { AiAssistantsChatStorageProvider, useAiAssistantsChatStorage } from './SavedChatsContext'


const CHAT_SECTION_OPEN_KEY = 'condo-ai-cowork-chat-section-open'
const sectionOpenManager = new LocalStorageManager<Record<string, boolean>>()

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
    const { useFlag } = useFeatureFlags()
    const skillsEnabled = useFlag(UI_AI_COWORK_SKILLS)
    const settingsEnabled = useFlag(UI_AI_COWORK_SETTINGS)
    const { chats } = useAiAssistantsChatStorage()

    const chatsLabel = intl.formatMessage({ id: 'ai.cowork.chats' })

    const stored = sectionOpenManager.getItem(CHAT_SECTION_OPEN_KEY) || {}
    const [chatsOpen, setChatsOpen] = useState(stored.chats !== false)

    const toggleChats = useCallback(() => {
        setChatsOpen((v) => {
            const next = !v
            const cur = sectionOpenManager.getItem(CHAT_SECTION_OPEN_KEY) || {}
            sectionOpenManager.setItem(CHAT_SECTION_OPEN_KEY, { ...cur, chats: next })
            return next
        })
    }, [])

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
            {MAIN_MENU_ITEMS
                .filter((item) => item.key !== 'skills' || skillsEnabled)
                .map((item) => (
                    <MenuItem
                        id={item.id}
                        key={`menu-item-${item.key}`}
                        path={item.path}
                        icon={item.icon}
                        label={item.label}
                        isCollapsed={isCollapsed}
                    />
                ))}
            {settingsEnabled && (
                <MenuItem
                    id='settings'
                    key='menu-item-settings'
                    path='/cowork/settings'
                    icon={Settings}
                    label='ai.cowork.settings'
                    isCollapsed={isCollapsed}
                />
            )}
            {chats.length > 0 && (
                <>
                    <div className={styles.sideMenuDivider} />
                    <MenuItem
                        id='chats'
                        key='menu-item-chats'
                        icon={Subtitles}
                        label={makeSectionLabel(chatsLabel, chatsOpen, isCollapsed)}
                        labelRaw
                        isCollapsed={isCollapsed}
                        menuItemWrapperProps={{ className: styles['section-menu-item'] }}
                        onClick={isCollapsed ? toggleCollapsed : toggleChats}
                    />
                    <div className={styles.chatList} style={{ display: chatsOpen && !isCollapsed ? 'block' : 'none' }}>
                        {chats.map((chat) => (
                            <MenuItem
                                id={`chat-${chat.id}`}
                                key={`chat-${chat.id}`}
                                path={`/cowork/chat?chatId=${chat.id}`}
                                label={chat.name}
                                labelRaw
                                isCollapsed={isCollapsed}
                                icon={chat.pinned ? Star : FakeIcon}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}


const CoworkTopMenuItems: React.FC<ITopMenuItemsProps> = (props) => (
    <TopMenuItems {...props} hideAIButton hideCoworkMenuLink />
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
    const { useFlag } = useFeatureFlags()
    const coworkEnabled = useFlag(UI_AI_COWORK)

    useEffect(() => {
        if (!coworkEnabled) void Router.replace('/')
    }, [coworkEnabled])

    if (!coworkEnabled) return null

    return (
        <AiAssistantsChatStorageProvider>
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
        </AiAssistantsChatStorageProvider>
    )
}
