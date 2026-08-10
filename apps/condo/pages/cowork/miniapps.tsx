import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { B2BAppContextStatusType } from '@app/condo/schema'
import { ExternalLink } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Typography } from '@open-condo/ui'

import { CoworkLayout, CoworkSidebar } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { PageComponentType } from '@condo/domains/common/types'
import { B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const CoworkMiniappsPage: PageComponentType = () => {
    const intl = useIntl()
    const router = useRouter()
    const { organization } = useOrganization()

    const titleLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.title' })
    const emptyLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.empty' })
    const emptyDescriptionLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.emptyDescription' })
    const browseAppsLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.browseApps' })
    const openLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.open' })
    const loadingLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.loading' })

    const organizationId = useMemo(() => organization?.id, [organization])

    const {
        objs: contexts,
        loading,
        error,
    } = B2BAppContext.useObjects({
        where: {
            organization: { id: organizationId },
            status: B2BAppContextStatusType.Finished,
            deletedAt: null,
        },
    }, {
        skip: !organizationId,
    })

    const apps = useMemo(() => {
        if (!contexts) return []
        return contexts
            .filter((ctx) => ctx && ctx.app && ctx.app.appUrl)
            .map((ctx) => ({
                id: ctx.app.id,
                name: ctx.app.name,
                appUrl: ctx.app.appUrl,
                icon: ctx.app.icon,
            }))
    }, [contexts])

    const handleOpenApp = (appId: string) => {
        router.push(`/miniapps/${appId}`)
    }

    const handleBrowseApps = () => {
        router.push('/miniapps')
    }

    const renderContent = () => {
        if (loading) {
            return <div className={coworkStyles.miniappsLoading}>{loadingLabel}</div>
        }

        if (error) {
            return <div className={coworkStyles.miniappsLoading}>{error.message}</div>
        }

        if (apps.length === 0) {
            return (
                <div className={coworkStyles.miniappsEmpty}>
                    <div className={coworkStyles.miniappsEmptyTitle}>{emptyLabel}</div>
                    <div className={coworkStyles.miniappsEmptyDescription}>{emptyDescriptionLabel}</div>
                    <Button
                        type='primary'
                        size='medium'
                        onClick={handleBrowseApps}
                        icon={<ExternalLink size='small' />}
                    >
                        {browseAppsLabel}
                    </Button>
                </div>
            )
        }

        return (
            <div className={coworkStyles.miniappsGrid}>
                {apps.map((app) => (
                    <div key={app.id} className={coworkStyles.miniappCard}>
                        <div className={coworkStyles.miniappCardHeader}>
                            <div className={coworkStyles.miniappCardIcon}>
                                <div className={coworkStyles.miniappCardIconFallback}>
                                    {get(app, 'name', '?').charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className={coworkStyles.miniappCardName}>{app.name}</div>
                        </div>
                        <div className={coworkStyles.miniappCardFooter}>
                            <Button
                                type='secondary'
                                size='medium'
                                onClick={() => handleOpenApp(app.id)}
                            >
                                {openLabel}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className={coworkStyles.coworkBody}>
            <CoworkSidebar
                highlightNavItem='miniapps'
            />
            <div className={coworkStyles.mainArea}>
                <div className={coworkStyles.miniappsContent}>
                    <div className={coworkStyles.miniappsHeader}>
                        <Typography.Title level={2}>{titleLabel}</Typography.Title>
                        <Button
                            type='secondary'
                            size='medium'
                            onClick={handleBrowseApps}
                            icon={<ExternalLink size='small' />}
                        >
                            {browseAppsLabel}
                        </Button>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}

CoworkMiniappsPage.requiredAccess = OrganizationRequired
CoworkMiniappsPage.container = CoworkLayout

export default CoworkMiniappsPage
