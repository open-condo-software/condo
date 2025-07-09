import styled from '@emotion/styled'
import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, RadioGroup, Tabs, Typography } from '@open-condo/ui'

import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { MultipleFilterContextProvider } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { usePreviousQueryParams } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { PageComponentType } from '@condo/domains/common/types'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MeterReadPermissionRequired } from '@condo/domains/meter/components/PageAccess'
import { MetersPageContent } from '@condo/domains/meter/components/TabContent/Meter'
import { MeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/MeterReading'
import { MeterReportingPeriodPageContent } from '@condo/domains/meter/components/TabContent/MeterReportingPeriod'
import { PropertyMetersPageContent } from '@condo/domains/meter/components/TabContent/PropertyMeter'
import { PropertyMeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/PropertyMeterReading'
import { useMeterFilters } from '@condo/domains/meter/hooks/useMeterFilters'
import { useMeterReadingFilters } from '@condo/domains/meter/hooks/useMeterReadingFilters'
import { METER_TAB_TYPES, METER_TYPES, MeterPageTypes, MeterTypes } from '@condo/domains/meter/utils/clientSchema'


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
const HEADER_STYLES: CSSProperties = { padding: '0 !important' }


type MeterTypeSwitchProps = {
    defaultValue: MeterTypes
    activeTab: MeterPageTypes
}

export const MeterTypeSwitch = ({ defaultValue, activeTab }: MeterTypeSwitchProps): JSX.Element => {
    const intl = useIntl()
    const MeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.index.MeterType.meterReading' })
    const HouseMeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.index.MeterType.houseMeterReading' })

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
        updateQuery(
            router,
            { newParameters: { type: value, tab: activeTab } },
            { resetOldParameters: true, routerAction: 'replace', shallow: true }
        )
    }, [activeTab, router])

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

const MetersPage: PageComponentType = () => {
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
    usePreviousQueryParams({ paramNamesForPageChange: ['tab', 'type'], trackedParamNames: ['sort', 'filters', 'isShowActiveMeters', 'isShowArchivedMeters'], employeeSpecificKey: employeeId })

    const { tab } = parseQuery(router.query)
    const type = Array.isArray(get(router.query, 'type')) ? undefined : get(router.query, 'type') as string

    const tabAsMeterPageType = tab ? MeterPageTypeFromQuery(tab) : null

    const activeTab = useMemo(() => AVAILABLE_TABS.includes(tabAsMeterPageType) ? tabAsMeterPageType : get(AVAILABLE_TABS, [0]),  [tabAsMeterPageType])
    const activeType = useMemo(() => type in METER_TYPES ? type : METER_TYPES.unit, [type])

    const changeRouteToActiveParams = useCallback(async (newParameters) => {
        await updateQuery(router, { newParameters }, { resetOldParameters: true, routerAction: 'replace', shallow: true } )
    }, [router])


    useEffect(() => {
        if (!activeType && !activeTab) return
        if ((!type || type !== activeType) || (!tab || tab !== activeTab)) {
            changeRouteToActiveParams({ type: activeType, tab: activeTab })
        }

    }, [activeTab, activeType, changeRouteToActiveParams, tab, type])

    useEffect(() => {
        if (activeType === METER_TYPES.property && activeTab === METER_TAB_TYPES.reportingPeriod) {
            changeRouteToActiveParams({ tab: METER_TAB_TYPES.meterReading, type: activeType })
        }
    }, [activeTab, activeType, changeRouteToActiveParams])

    const filtersForMetersMeta = useMeterFilters(activeType as MeterTypes)
    const filtersForMeterReadingsMeta = useMeterReadingFilters(activeType as MeterTypes)

    const baseMetersQuery = useMemo(() => ({
        deletedAt: null,
        property: { deletedAt: null },
        organization: { id: userOrganizationId },
    }), [userOrganizationId])
    const baseMeterReadingsQuery = useMemo(() => ({
        meter: { deletedAt: null, property: { deletedAt: null } },
        deletedAt: null,
        organization: { id: userOrganizationId },
    }),
    [userOrganizationId])

    const handleTabChange = useCallback(async (activeTab) => {
        await changeRouteToActiveParams({ tab: activeTab, type: activeType })
    }, [activeType, changeRouteToActiveParams])

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
                        loading={isLoading}
                        canManageMeters={canManageMeters}
                        baseSearchQuery={baseMetersQuery}
                    /> : 
                    <PropertyMetersPageContent
                        filtersMeta={filtersForMetersMeta}
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
                    loading={isLoading}
                    canManageMeters={canManageMeters}
                    userOrganizationId={userOrganizationId}
                />
            ),
        },
    ].filter(Boolean), [MeterReadingMessage, activeType, filtersForMeterReadingsMeta, isLoading, canManageMeterReadings, baseMeterReadingsQuery, MeterMessage, filtersForMetersMeta, canManageMeters, baseMetersQuery, ReportingPeriodMessage, userOrganizationId])

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
                            <MeterTypeSwitch defaultValue={METER_TYPES.unit} activeTab={activeTab}/>
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
