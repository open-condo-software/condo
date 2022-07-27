/** @jsx jsx */
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import {
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { Col, Radio, RadioChangeEvent, Row, RowProps, Tabs, Typography } from 'antd'
import Head from 'next/head'
import { jsx } from '@emotion/react'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { useOrganization } from '@core/next/organization'

import { GetServerSideProps } from 'next'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import DivisionTable from '@condo/domains/division/components/DivisionsTable'
import BuildingsTable from '@condo/domains/property/components/BuildingsTable'
import { useTableColumns as usePropertiesTableColumns } from '@condo/domains/property/hooks/useTableColumns'
import { useTableFilters as usePropertyTableFilters } from '@condo/domains/property/hooks/useTableFilters'

import PropertiesMap from '@condo/domains/common/components/PropertiesMap'
import {
    DivisionWhereInput,
    OrganizationEmployeeRole,
    PropertyWhereInput,
    Property as PropertyType,
    Division as DivisionType,
    SortPropertiesBy,
} from '@app/condo/schema'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useTableColumns as useDivisionsTableColumns } from '@condo/domains/division/hooks/useTableColumns'
import { ColumnsType } from 'antd/lib/table'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useTableFilters as useDivisionTableFilters } from '@condo/domains/division/hooks/useTableFilters'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'


type PropertiesType = 'buildings' | 'divisions'
const propertiesTypes: PropertiesType[] = ['buildings', 'divisions']

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    if (propertiesTypes.includes(query.tab as PropertiesType)) {
        return {
            props: {
                tab: query.tab,
            },
        }
    }
    return {
        props: {},
    }
}

type PropertiesContentProps = {
    role: OrganizationEmployeeRole
    searchPropertiesQuery: PropertyWhereInput
    propertiesTableColumns: ColumnsType
    sortPropertiesBy: SortPropertiesBy[]
    divisionTableColumns: ColumnsType
    searchDivisionsQuery: DivisionWhereInput
    sortDivisionsBy: string[]
    tab?: PropertiesType
    loading?: boolean
}

const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const RADIO_GROUP_STYLE: CSSProperties = { display: 'flex', justifyContent: 'flex-end' }

export const PropertiesContent: React.FC<PropertiesContentProps> = (props) => {
    const intl = useIntl()
    const router = useRouter()

    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.PageTitle' })
    const ShowMap = intl.formatMessage({ id: 'pages.condo.property.index.ViewModeMap' })
    const ShowTable = intl.formatMessage({ id: 'pages.condo.property.index.ViewModeTable' })
    const BuildingsTabTitle = intl.formatMessage({ id: 'pages.condo.property.index.Buildings.Tab.Title' })
    const DivisionsTabTitle = intl.formatMessage({ id: 'pages.condo.property.index.Divisions.Tab.Title' })

    const [propertiesType, setPropertiesType] = useState<PropertiesType>(props.tab)
    const [viewMode, changeViewMode] = useState('list')
    const { isSmall } = useLayoutContext()

    const initialTab = useRef(props.tab)

    const { role, searchPropertiesQuery, searchDivisionsQuery, propertiesTableColumns,
        divisionTableColumns, sortPropertiesBy, sortDivisionsBy, loading } = props

    const handleViewModeChange = useCallback((e) => changeViewMode(e.target.value), [])

    useEffect(() => {
        if (!initialTab.current) {
            const queryParams = getQueryParams()
            initialTab.current = propertiesTypes.includes(queryParams.tab) ? queryParams.tab : propertiesTypes[0]
        }
        setPropertiesType(initialTab.current)
        router.push(`/property?tab=${initialTab.current}`)
    }, [])

    const [properties, setShownProperties] = useState<(PropertyType | DivisionType)[]>([])

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <TablePageContent>
                    <Row gutter={PAGE_ROW_GUTTER} align='top' justify='space-between'>
                        <Col lg={12} xs={24}>
                            <Typography.Title>
                                {PageTitleMessage}
                            </Typography.Title>
                        </Col>
                        <Col lg={8} offset={isSmall ? 0 : 4} xs={24}>
                            <Radio.Group
                                className='sberRadioGroup'
                                style={RADIO_GROUP_STYLE}
                                value={viewMode}
                                buttonStyle='outline'
                                onChange={handleViewModeChange}
                            >
                                <Radio.Button value='list'>{ShowTable}</Radio.Button>
                                <Radio.Button value='map'>{ShowMap}</Radio.Button>
                            </Radio.Group>
                        </Col>
                        {
                            viewMode !== 'map' && (
                                <Col xs={24}>
                                    <Tabs
                                        defaultActiveKey={initialTab.current}
                                        onChange={(key: PropertiesType) => {
                                            setPropertiesType(key)
                                            router.push(`/property?tab=${key}`)
                                        }}>
                                        <Tabs.TabPane
                                            key="buildings"
                                            tab={BuildingsTabTitle}
                                        />
                                        <Tabs.TabPane
                                            key="divisions"
                                            tab={DivisionsTabTitle}
                                        />
                                    </Tabs>
                                </Col>
                            )
                        }
                        {
                            viewMode !== 'map' && (
                                <Col span={24}>
                                    {
                                        propertiesType === 'buildings'
                                            ? (
                                                <BuildingsTable
                                                    role={role}
                                                    searchPropertiesQuery={searchPropertiesQuery}
                                                    tableColumns={propertiesTableColumns}
                                                    sortBy={sortPropertiesBy}
                                                    onSearch={(properties) => setShownProperties(properties)}
                                                    loading={loading}
                                                />
                                            )
                                            : (
                                                <DivisionTable
                                                    role={role}
                                                    searchDivisionsQuery={searchDivisionsQuery}
                                                    tableColumns={divisionTableColumns}
                                                    sortBy={sortDivisionsBy}
                                                    onSearch={(properties) => setShownProperties(properties)}
                                                    loading={loading}
                                                />
                                            )
                                    }
                                </Col>
                            )
                        }
                    </Row>
                    {viewMode === 'map' && <PropertiesMap properties={properties} />}
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

type PropertiesPageProps = {
    tab?: PropertiesType
}

export default function PropertiesPage (props: PropertiesPageProps) {
    const { organization, link: { role } } = useOrganization()

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const propertyFilterMetas = usePropertyTableFilters()
    const propertiesTableColumns = usePropertiesTableColumns(propertyFilterMetas)

    const {
        filtersToWhere: filtersToPropertiesWhere,
        sortersToSortBy: sortersToSortPropertiesBy,
    } = useQueryMappers<PropertyWhereInput>(propertyFilterMetas, ['address'])

    const searchPropertiesQuery = {
        ...filtersToPropertiesWhere(filters),
        organization: { id: organization.id, deletedAt: null },
        deletedAt: null,
    }

    const divisionFilterMetas = useDivisionTableFilters()
    const divisionTableColumns = useDivisionsTableColumns(divisionFilterMetas)

    const {
        filtersToWhere: filtersToDivisionsWhere,
        sortersToSortBy: sortersToSortDivisionsBy,
    } = useQueryMappers<DivisionWhereInput>(divisionFilterMetas, ['name'])

    const searchDivisionsQuery = {
        ...filtersToDivisionsWhere(filters),
        organization: { id: organization.id, deletedAt: null },
        deletedAt: null,
    }

    return (
        <PropertiesContent
            searchPropertiesQuery={searchPropertiesQuery}
            propertiesTableColumns={propertiesTableColumns}
            sortPropertiesBy={sortersToSortPropertiesBy(sorters) as SortPropertiesBy[]}

            searchDivisionsQuery={searchDivisionsQuery}
            divisionTableColumns={divisionTableColumns}
            sortDivisionsBy={sortersToSortDivisionsBy(sorters)}

            role={role}
            tab={props.tab}
        />
    )
}

PropertiesPage.requiredAccess = OrganizationRequired
