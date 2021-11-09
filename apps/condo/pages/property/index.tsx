/** @jsx jsx */
import React, { useEffect, useRef, useState } from 'react'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Col, Radio, Row, Tabs, Typography } from 'antd'
import Head from 'next/head'
import { jsx } from '@emotion/core'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { useOrganization } from '@core/next/organization'

import { GetServerSideProps } from 'next'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import DivisionTable from '@condo/domains/division/components/DivisionsTable'
import BuildingsTable from '@condo/domains/property/components/BuildingsTable'
import { useTableColumns as usePropertiesTableColumns } from '@condo/domains/property/hooks/useTableColumns'
import { useTableFilters as usePropertyTableFilters } from '@condo/domains/property/hooks/useTableFilters'

import PropertiesMap from '@condo/domains/common/components/PropertiesMap'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { Division } from '@condo/domains/division/utils/clientSchema'
import { DivisionWhereInput, OrganizationEmployeeRole, PropertyWhereInput } from '@app/condo/schema'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useTableColumns as useDivisionsTableColumns } from '@condo/domains/division/hooks/useTableColumns'
import { ColumnsType } from 'antd/lib/table'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useTableFilters as useDivisionTableFilters } from '@condo/domains/division/hooks/useTableFilters'


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
    sortPropertiesBy: string[]

    divisionTableColumns: ColumnsType
    searchDivisionsQuery: DivisionWhereInput
    sortDivisionsBy: string[]

    tab?: PropertiesType
}

export function PropertiesContent (props: PropertiesContentProps) {
    const intl = useIntl()
    const router = useRouter()

    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.PageTitle' })
    const ShowMap = intl.formatMessage({ id: 'pages.condo.property.index.ViewModeMap' })
    const ShowTable = intl.formatMessage({ id: 'pages.condo.property.index.ViewModeTable' })
    const BuildingsTabTitle = intl.formatMessage({ id: 'pages.condo.property.index.Buildings.Tab.Title' })
    const DivisionsTabTitle = intl.formatMessage({ id: 'pages.condo.property.index.Divisions.Tab.Title' })

    const [propertiesType, setPropertiesType] = useState<PropertiesType>(props.tab)
    const [viewMode, changeViewMode] = useState('list')

    const initialTab = useRef(props.tab)

    const { role, searchPropertiesQuery, searchDivisionsQuery, propertiesTableColumns,
        divisionTableColumns, sortPropertiesBy, sortDivisionsBy } = props

    useEffect(() => {
        if (!initialTab.current) {
            const queryParams = getQueryParams()
            initialTab.current = propertiesTypes.includes(queryParams.tab) ? queryParams.tab : propertiesTypes[0]
        }
        setPropertiesType(initialTab.current)
        router.push(`/property?tab=${initialTab.current}`)
    }, [])

    const [properties, setShownProperties] = useState<(Property.IPropertyUIState | Division.IDivisionUIState)[]>([])

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 40]} align={'top'} style={{ zIndex: 1, position: 'relative' }}>
                        <Col span={6} >
                            <PageHeader style={{ background: 'transparent' }} title={<Typography.Title>
                                {PageTitleMessage}
                            </Typography.Title>} />
                            {viewMode !== 'map' &&
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
                            }
                        </Col>
                        <Col span={6} push={12} style={{ top: 10 }}>
                            <Radio.Group className={'sberRadioGroup'} value={viewMode} buttonStyle="outline" onChange={e => changeViewMode(e.target.value)}>
                                <Radio.Button value="list">{ShowTable}</Radio.Button>
                                <Radio.Button value="map">{ShowMap}</Radio.Button>
                            </Radio.Group>
                        </Col>
                        {viewMode !== 'map' &&
                            <Col span={24}>
                                {propertiesType === 'buildings' ?
                                    <BuildingsTable
                                        role={role}
                                        searchPropertiesQuery={searchPropertiesQuery}
                                        tableColumns={propertiesTableColumns}
                                        sortBy={sortPropertiesBy}
                                        onSearch={(properties) => setShownProperties(properties)}
                                    /> :
                                    <DivisionTable
                                        role={role}
                                        searchDivisionsQuery={searchDivisionsQuery}
                                        tableColumns={divisionTableColumns}
                                        sortBy={sortDivisionsBy}
                                        onSearch={(properties) => setShownProperties(properties)}
                                    />
                                }
                            </Col>
                        }
                    </Row>
                    {viewMode === 'map' && <PropertiesMap properties={properties} />}
                </PageContent>
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
            sortPropertiesBy={sortersToSortPropertiesBy(sorters)}

            searchDivisionsQuery={searchDivisionsQuery}
            divisionTableColumns={divisionTableColumns}
            sortDivisionsBy={sortersToSortDivisionsBy(sorters)}

            role={role}
            tab={props.tab}
        />
    )
}

PropertiesPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.Property' }} />
PropertiesPage.requiredAccess = OrganizationRequired
