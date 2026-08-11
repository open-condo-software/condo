import Router from 'next/router'
import React from 'react'

import BaseLayout from '@condo/domains/common/components/containers/BaseLayout'

import { SavedChatsProvider } from './SavedChatsContext'

import { TopMenuItems, type ITopMenuItemsProps } from '@condo/domains/common/components/containers/BaseLayout/components/TopMenuItems'

import { PlusCircle, Rocket, Settings, Smartphone } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'

import { MenuItem } from '@condo/domains/common/components/MenuItem'

import styles from './Cowork.module.css'
import { CoworkMenuItemGroup } from './CoworkMenuItemGroup'
import { useSavedChats } from './SavedChatsContext'

import { Typography } from '@open-condo/ui'


const MAIN_MENU_ITEMS = [
    {
        path: '/cowork/chat',
        key: 'chat',
        id: 'chat',
        label: 'ai.cowork.newChat',
        icon: PlusCircle,
    },
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
    const { pinnedChats, unpinnedChats } = useSavedChats()

    const pinnedLabel = intl.formatMessage({ id: 'ai.cowork.pinned' })
    const chatsLabel = intl.formatMessage({ id: 'ai.cowork.chats' })

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
    return (
        <>
            {MAIN_MENU_ITEMS.map((item) => (
                <MenuItem
                    id={item.id}
                    key={`menu-item-${item.key}`}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                />
            ))}
            <MenuItem
                id='settings'
                key='menu-item-settings'
                path='/cowork/settings'
                icon={Settings}
                label='ai.cowork.settings'
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
    const label = intl.formatMessage({ id: 'ai.cowork.title' })

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
