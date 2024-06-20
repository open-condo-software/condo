/** @jsx jsx */
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Tabs, Typography } from '@open-condo/ui'

import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { MultipleFilterContextProvider } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MeterReadPermissionRequired } from '@condo/domains/meter/components/PageAccess'
import { MetersPageContent } from '@condo/domains/meter/components/TabContent/Meter'
import { MeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/MeterReading'
import { MeterReportingPeriodPageContent } from '@condo/domains/meter/components/TabContent/MeterReportingPeriod'
import { PropertyMetersPageContent } from '@condo/domains/meter/components/TabContent/PropertyMeter'
import { PropertyMeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/PropertyMeterReading'
import { useMeterFilters } from '@condo/domains/meter/hooks/useMeterFilters'
import { useMeterReadingFilters } from '@condo/domains/meter/hooks/useMeterReadingFilters'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import { METER_TAB_TYPES, METER_TYPES, MeterTypes } from '@condo/domains/meter/utils/clientSchema'


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


type MeterTypeSwitchProps = {
    defaultValue: MeterTypes
}

export const MeterTypeSwitch = ({ defaultValue }: MeterTypeSwitchProps): JSX.Element => {
    const intl = useIntl()
    const MeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.index.MeterType.meterReading' })
    const HouseMeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.index.MeterType.houseMeterReading' })
    const { logEvent } = useTracking()

    const router = useRouter()
    const type  = get(router.query, 'type', METER_TYPES.unit) as string

    const isMetersSelected = type === METER_TYPES.unit
    const isPropertyMetersSelected = !isMetersSelected && type === METER_TYPES.property

    const [value, setValue] = useState<MeterTypes>(METER_TYPES.unit)
    useEffect(() => {
        if (isMetersSelected) {
            setValue(METER_TYPES.unit)
        } else if (isPropertyMetersSelected) {
            setValue(METER_TYPES.property)
        }
    }, [isMetersSelected, isPropertyMetersSelected, setValue])


    const handleRadioChange = useCallback(async (event) => {
        const value = event.target.value
        setValue(value)
        logEvent({ eventName: 'MeterTypeChange', denyDuplicates: true, eventProperties: { type: value } })
        router.replace({ query: { ...router.query, type: value } })
    }, [logEvent])

    return (
        <RadioGroup optionType='button' value={value} onChange={handleRadioChange} defaultValue={defaultValue}>
            <Radio
                key={METER_TYPES.unit}
                value={METER_TYPES.unit}
                label={MeterReadingMessage}
            />
            <Radio
                key={METER_TYPES.property}
                value={METER_TYPES.property}
                label={HouseMeterReadingMessage}
            />
        </RadioGroup>
    )
}

const PAGE_DIV_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column',  height: '100%' }

const MetersPage: IMeterIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.index.PageTitle' })
    const MeterMessage = intl.formatMessage({ id: 'pages.condo.meter.index.meterTab' })
    const MeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.index.meterReadingTab' })
    const ReportingPeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriodTab' })

    const { organization, link, isLoading } = useOrganization()
    const userOrganizationId = useMemo(() => get(organization, 'id'), [organization])
    const role = get(link, 'role')
    const employeeId = get(link, 'id')
    const router = useRouter()
    const { breakpoints } = useLayoutContext()

    const { GlobalHints } = useGlobalHints()
    usePreviousSortAndFilters({ paramNamesForPageChange: ['tab', 'type'], employeeSpecificKey: employeeId })

    const { tab } = parseQuery(router.query)
    const type = get(router.query, 'type', METER_TYPES.unit) as string

    const tabAsMeterPageType = tab ? MeterPageTypeFromQuery(tab) : null
    
    const activeTab = useMemo(() => AVAILABLE_TABS.includes(tabAsMeterPageType) ? tabAsMeterPageType : get(AVAILABLE_TABS, [0], ''),  [tabAsMeterPageType])
    const activeType = useMemo(() => type ? type : METER_TYPES.unit,  [type])

    const changeRouteToActiveTab = useCallback(async (activeTab: string) => {
        router.replace({ query: { ...router.query, tab: activeTab } })
    }, [router])

    const changeRouteToActiveType = useCallback(async (activeType: string) => {
        router.replace({ query: { ...router.query, type: activeType } })
    }, [router])


    useEffect(() => {
        if (!activeTab) return
        if (!tab || tab !== activeTab) {
            changeRouteToActiveTab(activeTab)
        }
    }, [activeTab, changeRouteToActiveTab, tab])

    useEffect(() => {
        if (!activeType) return
        if (!type || type !== activeType) {
            changeRouteToActiveType(activeType)
        }
    }, [activeType, changeRouteToActiveType, type])

    useEffect(() => {
        if (activeType === METER_TYPES.property && activeTab === METER_TAB_TYPES.reportingPeriod) {
            changeRouteToActiveTab(METER_TAB_TYPES.meterReading)
        }
    }, [activeTab, activeType, changeRouteToActiveTab])

    const filtersForMetersMeta = useMeterFilters(tabAsMeterPageType)
    const tableColumnsForMeters = useTableColumns(filtersForMetersMeta, tabAsMeterPageType, activeType as MeterTypes)

    const filtersForMeterReadingsMeta = useMeterReadingFilters()
    const tableColumnsForMeterReadings = useTableColumns(filtersForMeterReadingsMeta, tabAsMeterPageType, activeType as MeterTypes)

    const baseMetersQuery = useMemo(() => ({
        deletedAt: null,
        organization: { id: userOrganizationId },
    }), [userOrganizationId])
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
                activeType === METER_TYPES.unit ?
                    <MeterReadingsPageContent
                        filtersMeta={filtersForMeterReadingsMeta}
                        loading={isLoading}
                        canManageMeterReadings={canManageMeterReadings}
                        baseSearchQuery={baseMeterReadingsQuery}
                    /> :
                    <PropertyMeterReadingsPageContent
                        filtersMeta={filtersForMeterReadingsMeta}
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
                activeType === METER_TYPES.unit ?
                    <MetersPageContent
                        filtersMeta={filtersForMetersMeta}
                        tableColumns={tableColumnsForMeters}
                        loading={isLoading}
                        canManageMeters={canManageMeters}
                        baseSearchQuery={baseMetersQuery}
                    /> : 
                    <PropertyMetersPageContent
                        filtersMeta={filtersForMetersMeta}
                        tableColumns={tableColumnsForMeters}
                        canManageMeters={canManageMeters}
                        loading={isLoading}
                        baseSearchQuery={baseMetersQuery}
                    />
            ),
        },
        activeType === METER_TYPES.unit && {
            label: ReportingPeriodMessage,
            key: METER_TAB_TYPES.reportingPeriod,
            children: (
                <MeterReportingPeriodPageContent
                    filtersMeta={filtersForMeterReadingsMeta}
                    tableColumns={tableColumnsForMeterReadings}
                    loading={isLoading}
                    canManageMeters={canManageMeters}
                    userOrganizationId={userOrganizationId}
                />
            ),
        },
    ].filter(Boolean), [MeterReadingMessage, activeType, filtersForMeterReadingsMeta, isLoading, canManageMeterReadings, baseMeterReadingsQuery, MeterMessage, filtersForMetersMeta, tableColumnsForMeters, canManageMeters, baseMetersQuery, ReportingPeriodMessage, tableColumnsForMeterReadings, userOrganizationId])

    return (
        <MultipleFilterContextProvider>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <StyledPageWrapper>
                {GlobalHints}
                <div style={{ ...PAGE_DIV_STYLE, gap: breakpoints.TABLET_LARGE ? '40px' : '24px' }}>
                    <Row justify='space-between' align='middle' gutter={MEDIUM_VERTICAL_ROW_GUTTER}>
                        <Col>
                            <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>} style={HEADER_STYLES}/>
                        </Col>
                        <Col>
                            <MeterTypeSwitch defaultValue={METER_TYPES.unit}/>
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
