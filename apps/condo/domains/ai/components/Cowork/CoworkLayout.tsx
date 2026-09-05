import Router from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { ChevronDown, ChevronUp, PlusCircle, Rocket, Services, Settings, Star, Subtitles } from '@open-condo/icons'
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


const CoworkSideMenu: React.FC = () => {
    const { isCollapsed, toggleCollapsed } = useLayoutContext()
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const skillsEnabled = useFlag(UI_AI_COWORK_SKILLS)
    const settingsEnabled = useFlag(UI_AI_COWORK_SETTINGS)
    const { chats } = useAiAssistantsChatStorage()

    const pinnedChatsLabel = intl.formatMessage({ id: 'ai.cowork.pinnedChats' })
    const chatsLabel = intl.formatMessage({ id: 'ai.cowork.chats' })

    const stored = sectionOpenManager.getItem(CHAT_SECTION_OPEN_KEY) || {}
    const [pinnedOpen, setPinnedOpen] = useState(stored.pinned !== false)
    const [chatsOpen, setChatsOpen] = useState(stored.chats !== false)

    const togglePinned = useCallback(() => {
        setPinnedOpen((v) => {
            const next = !v
            const cur = sectionOpenManager.getItem(CHAT_SECTION_OPEN_KEY) || {}
            sectionOpenManager.setItem(CHAT_SECTION_OPEN_KEY, { ...cur, pinned: next })
            return next
        })
    }, [])

    const toggleChats = useCallback(() => {
        setChatsOpen((v) => {
            const next = !v
            const cur = sectionOpenManager.getItem(CHAT_SECTION_OPEN_KEY) || {}
            sectionOpenManager.setItem(CHAT_SECTION_OPEN_KEY, { ...cur, chats: next })
            return next
        })
    }, [])

    const pinnedChats = useMemo(() => chats.filter((c) => c.pinned), [chats])
    const regularChats = useMemo(() => chats.filter((c) => !c.pinned), [chats])

    return (
        <div className={styles.sideMenuScroll}>
            <MenuItem
                id='new-chat'
                key='menu-item-new-chat'
                icon={PlusCircle}
                label='ai.cowork.newChat'
                isCollapsed={isCollapsed}
                onClick={() => void Router.push('/ai-engineer/chat')}
            />
            {pinnedChats.length > 0 && (
                <>
                    <MenuItem
                        id='pinned-chats'
                        key='menu-item-pinned-chats'
                        icon={Star}
                        label={makeSectionLabel(pinnedChatsLabel, pinnedOpen, isCollapsed)}
                        labelRaw
                        isCollapsed={isCollapsed}
                        menuItemWrapperProps={{ className: styles['section-menu-item'] }}
                        onClick={isCollapsed ? toggleCollapsed : togglePinned}
                    />
                    <div className={styles.chatList} style={{ display: pinnedOpen && !isCollapsed ? 'block' : 'none' }}>
                        {pinnedChats.map((chat) => (
                            <MenuItem
                                id={`chat-${chat.id}`}
                                key={`chat-${chat.id}`}
                                path={`/ai-engineer/chat?chatId=${chat.id}`}
                                label={chat.name}
                                labelRaw
                                tooltip={chat.name}
                                isCollapsed={isCollapsed}
                                icon={FakeIcon}
                            />
                        ))}
                    </div>
                </>
            )}
            {regularChats.length > 0 && (
                <>
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
                        {regularChats.map((chat) => (
                            <MenuItem
                                id={`chat-${chat.id}`}
                                key={`chat-${chat.id}`}
                                path={`/ai-engineer/chat?chatId=${chat.id}`}
                                label={chat.name}
                                labelRaw
                                tooltip={chat.name}
                                isCollapsed={isCollapsed}
                                icon={FakeIcon}
                            />
                        ))}
                    </div>
                </>
            )}
            {skillsEnabled && (
                <MenuItem
                    id='skills'
                    key='menu-item-skills'
                    path='/ai-engineer/skills'
                    icon={Rocket}
                    label='ai.cowork.skills'
                    isCollapsed={isCollapsed}
                />
            )}
            {settingsEnabled && (
                <MenuItem
                    id='settings'
                    key='menu-item-settings'
                    path='/ai-engineer/settings'
                    icon={Settings}
                    label='ai.cowork.settings'
                    isCollapsed={isCollapsed}
                />
            )}
            <MenuItem
                id='miniapps'
                key='menu-item-miniapps'
                path='/ai-engineer/miniapps'
                icon={Services}
                label='ai.cowork.myMiniapps'
                isCollapsed={isCollapsed}
            />
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
                logoLocation='/ai-engineer'
                logo={<Logo/>}
                onLogoClick={() => void Router.push('/ai-engineer')}
                headerAction={null}
                menuData={<CoworkSideMenu/>}
                residentActions={false}
            >
                {children}
            </BaseLayout>
        </AiAssistantsChatStorageProvider>
    )
}
