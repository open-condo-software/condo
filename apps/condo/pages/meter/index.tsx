/** @jsx jsx */
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, Row, RowProps, Typography } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Tabs } from '@open-condo/ui'

import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { MultipleFilterContextProvider } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MeterReadPermissionRequired } from '@condo/domains/meter/components/PageAccess'
import { MetersPageContent } from '@condo/domains/meter/components/TabContent/Meter'
import { MeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/MeterReading'
import { MeterReportingPeriodPageContent } from '@condo/domains/meter/components/TabContent/MeterReportingPeriod'
import { PropertyMetersPageContent } from '@condo/domains/meter/components/TabContent/PropertyMeter'
import { PropertyMeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/PropertyMeterReading'
import { METER_REPORTING_PERIOD_FRONTEND_FEATURE_FLAG } from '@condo/domains/meter/constants/constants'
import { useFilters } from '@condo/domains/meter/hooks/useFilters'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import { METER_TAB_TYPES, METER_READINGS_TYPES, MeterReadingsTypes } from '@condo/domains/meter/utils/clientSchema'


interface IMeterIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

export function MeterPageTypeFromQuery (tabFromQuery) {
    switch (tabFromQuery) {
        case METER_TAB_TYPES.meterReading:
            return METER_TAB_TYPES.meterReading
        case METER_TAB_TYPES.meter:
            return METER_TAB_TYPES.meter
        case METER_TAB_TYPES.reportingPeriod:
            return METER_TAB_TYPES.reportingPeriod
        default:
            return undefined
    }
}

const StyledPageWrapper = styled(PageWrapper)`
     & .condo-tabs, & .condo-tabs-content, & .condo-tabs-tabpane, & .page-content {
       height: 100%;
     }
`
const AVAILABLE_TABS = [METER_TAB_TYPES.meterReading, METER_TAB_TYPES.meter, METER_TAB_TYPES.reportingPeriod]
const MEDIUM_VERTICAL_ROW_GUTTER: RowProps['gutter'] = [0, 24]
const HEADER_STYLES: CSSProperties = { padding: 0 }

export const MeterTypeSwitch = ({ value, setValue }) => {
    const intl = useIntl()
    const MeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.index.MeterType.meterReading' })
    const HouseMeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.index.MeterType.houseMeterReading' })
    const { logEvent } = useTracking()

    const handleRadioChange = useCallback(async (event) => {
        const value = event.target.value

        setValue(value)
        logEvent({ eventName: 'MeterTypeFilterTabChange', denyDuplicates: true, eventProperties: { tab: value } })

    }, [logEvent])

    return (
        <RadioGroup optionType='button' value={value} onChange={handleRadioChange}>
            <Radio
                key={METER_READINGS_TYPES.accountMeterReadings}
                value={METER_READINGS_TYPES.accountMeterReadings}
                label={MeterReadingMessage}
            />
            <Radio
                key={METER_READINGS_TYPES.propertyMeterReadings}
                value={METER_READINGS_TYPES.propertyMeterReadings}
                label={HouseMeterReadingMessage}
            />
        </RadioGroup>
    )
}

const MetersPage: IMeterIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.index.PageTitle' })
    const MeterMessage = intl.formatMessage({ id: 'pages.condo.meter.index.meterTab' })
    const MeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.index.meterReadingTab' })
    const PropertyMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.index.propertyMeterTab' })
    const ReportingPeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriodTab' })

    const { organization, link, isLoading } = useOrganization()
    const userOrganizationId = useMemo(() => get(organization, 'id'), [organization])
    const role = get(link, 'role')
    const employeeId = get(link, 'id')
    const router = useRouter()
    const { breakpoints } = useLayoutContext()
    const [readingsType, setReadingsType] = useState<MeterReadingsTypes>(METER_READINGS_TYPES.accountMeterReadings)

    const { useFlag } = useFeatureFlags()
    const isMeterReportingPeriodEnabled = useFlag(METER_REPORTING_PERIOD_FRONTEND_FEATURE_FLAG)

    const { GlobalHints } = useGlobalHints()
    usePreviousSortAndFilters({ paramNamesForPageChange: ['tab'], employeeSpecificKey: employeeId })

    const availableTabs = useMemo(() => {
        return AVAILABLE_TABS.filter((tab) => {
            if (tab === METER_TAB_TYPES.reportingPeriod) return isMeterReportingPeriodEnabled
            return true
        })
    }, [isMeterReportingPeriodEnabled])

    const { tab } = parseQuery(router.query)
    const tabAsMeterPageType = tab ? MeterPageTypeFromQuery(tab) : null
    const activeTab = useMemo(() => availableTabs.includes(tabAsMeterPageType) ? tabAsMeterPageType : get(availableTabs, [0], ''),  [tabAsMeterPageType, availableTabs])

    const changeRouteToActiveTab = useCallback(async (activeTab: string, routerAction: 'replace' | 'push' = 'push') => {
        await updateQuery(router, {
            newParameters: {
                tab: activeTab,
            },
        }, { routerAction, resetOldParameters: true })
    }, [router])

    useEffect(() => {
        if (!activeTab) return
        if (!tab || tab !== activeTab) {
            changeRouteToActiveTab(activeTab, 'replace')
        }
    }, [activeTab, changeRouteToActiveTab, tab])

    useEffect(() => {
        if (readingsType === METER_READINGS_TYPES.propertyMeterReadings && activeTab === METER_TAB_TYPES.reportingPeriod) {
            changeRouteToActiveTab(METER_TAB_TYPES.meterReading, 'replace')
        }
    }, [activeTab, changeRouteToActiveTab, readingsType])

    const filtersMeta = useFilters(tabAsMeterPageType)
    const tableColumns = useTableColumns(filtersMeta, tabAsMeterPageType, readingsType)
    const baseMeterReadingsQuery = useMemo(() => ({
        meter: { deletedAt: null },
        deletedAt: null,
        organization: { id: userOrganizationId },
    }),
    [userOrganizationId])
    const handleTabChange = useCallback(async (activeTab) => {
        await changeRouteToActiveTab(activeTab)
    }, [changeRouteToActiveTab])

    const canManageMeterReadings = useMemo(() => get(role, 'canManageMeterReadings', false), [role])
    const canManageMeters = useMemo(() => get(role, 'canManageMeters', false), [role])

    const tabItems = useMemo(() => [
        {
            label: MeterReadingMessage,
            key: METER_TAB_TYPES.meterReading,
            children: (
                readingsType === METER_READINGS_TYPES.accountMeterReadings ?
                    <MeterReadingsPageContent
                        filtersMeta={filtersMeta}
                        tableColumns={tableColumns}
                        loading={isLoading}
                        canManageMeterReadings={canManageMeterReadings}
                        baseSearchQuery={baseMeterReadingsQuery}
                    /> :
                    <PropertyMeterReadingsPageContent
                        filtersMeta={filtersMeta}
                        tableColumns={tableColumns}
                        loading={isLoading}
                        canManageMeterReadings={canManageMeterReadings}
                        baseSearchQuery={baseMeterReadingsQuery}
                    />
            ),
        },
        {
            label: MeterMessage,
            key: METER_TAB_TYPES.meter,
            children: (
                readingsType === METER_READINGS_TYPES.accountMeterReadings ?
                    <MetersPageContent
                        filtersMeta={filtersMeta}
                        tableColumns={tableColumns}
                        loading={isLoading}
                        canManageMeterReadings={canManageMeterReadings}
                        baseSearchQuery={baseMeterReadingsQuery}
                    /> : 
                    <PropertyMetersPageContent
                        filtersMeta={filtersMeta}
                        tableColumns={tableColumns}
                        canManageMeterReadings={canManageMeterReadings}
                        loading={isLoading}
                        baseSearchQuery={baseMeterReadingsQuery}
                    />
            ),
        },
        isMeterReportingPeriodEnabled && readingsType === METER_READINGS_TYPES.accountMeterReadings && {
            label: ReportingPeriodMessage,
            key: METER_TAB_TYPES.reportingPeriod,
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
    ].filter(Boolean), [MeterMessage, filtersMeta, tableColumns, isLoading, canManageMeterReadings, baseMeterReadingsQuery, isMeterReportingPeriodEnabled, ReportingPeriodMessage, canManageMeters, userOrganizationId, PropertyMeterMessage])

    return (
        <MultipleFilterContextProvider>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <StyledPageWrapper>
                {GlobalHints}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    gap: breakpoints.TABLET_LARGE ? '40px' : '24px',
                }}>
                    <Row justify='space-between' align='middle' gutter={MEDIUM_VERTICAL_ROW_GUTTER}>
                        <Col>
                            <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>} style={HEADER_STYLES}/>
                        </Col>
                        <Col>
                            <MeterTypeSwitch value={readingsType} setValue={setReadingsType}/>
                        </Col>
                    </Row>
                    <Tabs
                        defaultActiveKey={METER_TAB_TYPES.meterReading}
                        activeKey={tab}
                        onChange={handleTabChange}
                        items={tabItems}
                        destroyInactiveTabPane
                    />
                </div>
            </StyledPageWrapper>
        </MultipleFilterContextProvider>
    )
}

MetersPage.requiredAccess = MeterReadPermissionRequired

export default MetersPage
