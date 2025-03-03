import { Popover, Row, Col } from 'antd'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button, Typography } from '@open-condo/ui'

import { useCreateAppContext } from '@/domains/common/components/CreateAppContext'
import { B2C_LOGO_SIZE } from '@/domains/miniapp/constants/common'
import { mergeApps } from '@/domains/miniapp/utils/merge'

import styles from './RecentAppsPopover.module.css'

import type { AppInfo } from '@/domains/miniapp/utils/merge'
import type { RowProps } from 'antd'

import { useAuth } from '@/lib/auth'
import { useAllAppsQuery } from '@/lib/gql'

const BUTTON_ROW_GUTTER: RowProps['gutter'] = [20, 20]
const APP_ROW_GUTTER: RowProps['gutter'] = [0, 0]
const POPOVER_OVERLAY_STYLES: CSSProperties = { width: 340 }
const FULL_COL_SPAN = 24
const MAX_APPS_SHOWN = 3
const IMG_SIZE = B2C_LOGO_SIZE / 3

type WithOnClose = {
    onClose: () => void
}

const RecentAppCard: React.FC<AppInfo & WithOnClose> = ({ name, type, id, onClose, logo }) => {
    const router = useRouter()
    const handleAppSelect = useCallback(() => {
        const url = `/apps/${type}/${id}`
        router.push(url, url, { locale: router.locale })
        onClose()
    }, [router, id, type, onClose])

    return (
        <Col span={FULL_COL_SPAN} className={styles.recentAppCard} onClick={handleAppSelect}>
            <div className={styles.appLogoContainer}>
                {logo && (
                    <Image src={logo} alt='application logo' width={IMG_SIZE} height={IMG_SIZE} className={styles.appLogo} draggable={false}/>
                )}
            </div>
            <Typography.Paragraph ellipsis>{name}</Typography.Paragraph>
        </Col>
    )
}

const RecentAppsPopoverContent: React.FC<WithOnClose> = ({ onClose }) => {
    const intl = useIntl()
    const CreateAppLabel = intl.formatMessage({ id: 'global.actions.createApp' })
    const RecentlyCreatedTitle = intl.formatMessage({ id: 'global.recentAppsPopover.recentApps.title' })

    const { createApp } = useCreateAppContext()
    const { user } = useAuth()

    const { data } = useAllAppsQuery({
        variables: {
            creator: { id: user?.id },
            first: MAX_APPS_SHOWN,
        },
    })

    const apps = mergeApps(data)

    const handleCreateAppClick = useCallback(() => {
        onClose()
        createApp()
    }, [createApp, onClose])

    return (
        <Row gutter={BUTTON_ROW_GUTTER}>
            {Boolean(apps.length) && (
                <Col span={FULL_COL_SPAN}>
                    <Row gutter={APP_ROW_GUTTER}>
                        <Col span={FULL_COL_SPAN} className={styles.titleCol}>
                            <Typography.Text size='small' type='secondary'>{RecentlyCreatedTitle}</Typography.Text>
                        </Col>
                        {apps.map(app => (
                            <RecentAppCard key={`${app.type}:${app.id}`} {...app} onClose={onClose}/>
                        ))}
                    </Row>
                </Col>
            )}
            <Col span={FULL_COL_SPAN}>
                <Button type='secondary' block onClick={handleCreateAppClick}>{CreateAppLabel}</Button>
            </Col>
        </Row>
    )
}

export const RecentAppsPopover: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false)

    const handleOpenChange = useCallback((newOpen: boolean) => {
        setOpen(newOpen)
    }, [])

    const handleClose = useCallback(() => {
        setOpen(false)
    }, [])

    return (
        <Popover
            open={open}
            onOpenChange={handleOpenChange}
            content={<RecentAppsPopoverContent onClose={handleClose}/>}
            overlayStyle={POPOVER_OVERLAY_STYLES}
            placement='bottom'
        >
            {children}
        </Popover>
    )
}