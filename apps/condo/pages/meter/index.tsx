/** @jsx jsx */
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Typography } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Tabs } from '@open-condo/ui'

import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { MultipleFilterContextProvider } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { MeterReadPermissionRequired } from '@condo/domains/meter/components/PageAccess'
import { MetersPageContent } from '@condo/domains/meter/components/TabContent/MeterReading'
import { MeterReportingPeriodPageContent } from '@condo/domains/meter/components/TabContent/MeterReportingPeriod'
import { PropertyMetersPageContent } from '@condo/domains/meter/components/TabContent/PropertyMeterReading'
import { METER_REPORTING_PERIOD_FRONTEND_FEATURE_FLAG } from '@condo/domains/meter/constants/constants'
import { useFilters } from '@condo/domains/meter/hooks/useFilters'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import { MeterPageTypes, METER_PAGE_TYPES } from '@condo/domains/meter/utils/clientSchema'


interface IMeterIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

function MeterPageTypeFromQuery (tabFromQuery) {
    switch (tabFromQuery) {
        case METER_PAGE_TYPES.meter:
            return METER_PAGE_TYPES.meter
        case METER_PAGE_TYPES.propertyMeter:
            return METER_PAGE_TYPES.propertyMeter
        case METER_PAGE_TYPES.reportingPeriod:
            return METER_PAGE_TYPES.reportingPeriod
        default:
            return undefined
    }
}

const StyledPageWrapper = styled(PageWrapper)`
     & .condo-tabs, & .condo-tabs-content, & .condo-tabs-tabpane, & .page-content {
       height: 100%;
     }
`

const MetersPage: IMeterIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.index.PageTitle' })
    const MeterMessage = intl.formatMessage({ id: 'pages.condo.meter.index.meterTab' })
    const PropertyMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.index.propertyMeterTab' })
    const ReportingPeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriodTab' })

    const { organization, link, isLoading } = useOrganization()
    const userOrganizationId = useMemo(() => get(organization, 'id'), [organization])
    const role = get(link, 'role')
    const router = useRouter()

    const { useFlag } = useFeatureFlags()
    const isMeterReportingPeriodEnabled = useFlag(METER_REPORTING_PERIOD_FRONTEND_FEATURE_FLAG)

    const { GlobalHints } = useGlobalHints()

    const [tab, setTab] = useState<MeterPageTypes>(METER_PAGE_TYPES.meter)
    useEffect(() => {
        const tabFromRoute = MeterPageTypeFromQuery(router.query.tab ? router.query.tab : METER_PAGE_TYPES.meter)
        if (tabFromRoute) {
            setTab(tabFromRoute)
            router.replace({ query: { ...router.query, tab: tabFromRoute } })
        }
    }, [])

    const filtersMeta = useFilters(tab)
    const tableColumns = useTableColumns(filtersMeta, tab)
    const baseMeterReadingsQuery = useMemo(() => ({
        meter: { deletedAt: null },
        deletedAt: null,
        organization: { id: userOrganizationId },
    }),
    [userOrganizationId])
    const handleTabChange = useCallback((tab: MeterPageTypes) => {
        setTab(tab)
        router.replace({ query: { ...router.query, tab } })
    }, [tab])

    const canManageMeterReadings = useMemo(() => get(role, 'canManageMeterReadings', false), [role])
    const canManageMeters = useMemo(() => get(role, 'canManageMeters', false), [role])

    const tabItems = useMemo(() => [
        {
            label: MeterMessage,
            key: METER_PAGE_TYPES.meter,
            children: (
                <MetersPageContent
                    filtersMeta={filtersMeta}
                    tableColumns={tableColumns}
                    loading={isLoading}
                    canManageMeterReadings={canManageMeterReadings}
                    baseSearchQuery={baseMeterReadingsQuery}
                />
            ),
        },
        isMeterReportingPeriodEnabled && {
            label: ReportingPeriodMessage,
            key: METER_PAGE_TYPES.reportingPeriod,
            children: (
                <MeterReportingPeriodPageContent
                    filtersMeta={filtersMeta}
                    tableColumns={tableColumns}
                    loading={isLoading}
                    canManageMeters={canManageMeters}
                    userOrganizationId={userOrganizationId}
                />
            ),
        },
        {
            label: PropertyMeterMessage,
            key: METER_PAGE_TYPES.propertyMeter,
            children: (
                <PropertyMetersPageContent
                    filtersMeta={filtersMeta}
                    tableColumns={tableColumns}
                    canManageMeterReadings={canManageMeterReadings}
                    loading={isLoading}
                    baseSearchQuery={baseMeterReadingsQuery}
                />
            ),
        },
    ].filter(Boolean), [MeterMessage, filtersMeta, tableColumns, isLoading, canManageMeterReadings, baseMeterReadingsQuery, isMeterReportingPeriodEnabled, ReportingPeriodMessage, canManageMeters, userOrganizationId, PropertyMeterMessage])

    return (
        <MultipleFilterContextProvider>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <StyledPageWrapper>
                {GlobalHints}
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>}/>
                <Tabs
                    activeKey={tab}
                    onChange={handleTabChange}
                    items={tabItems}
                    destroyInactiveTabPane
                />
            </StyledPageWrapper>
        </MultipleFilterContextProvider>
    )
}

MetersPage.requiredAccess = MeterReadPermissionRequired

export default MetersPage
