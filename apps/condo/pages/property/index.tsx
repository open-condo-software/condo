/** @jsx jsx */
import React, { useRef, useState } from 'react'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Typography, Radio, Row, Col, Tabs } from 'antd'
import Head from 'next/head'
import { jsx } from '@emotion/core'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'


import { GetServerSideProps } from 'next'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import DivisionTable from '@condo/domains/division/components/DivisionsTable'
import BuildingsTable from '@condo/domains/property/components/BuildingsTable'

import PropertiesMap from '@condo/domains/common/components/PropertiesMap'
import { Property } from '../../domains/property/utils/clientSchema'
import { useEffect } from 'react'

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

type PropertiesPageProps = {
    tab?: string
}

export default function PropertiesPage (props: PropertiesPageProps) {
    const intl = useIntl()
    const router = useRouter()

    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.PageTitle' })
    const ShowMap = intl.formatMessage({ id: 'pages.condo.property.index.ViewModeMap' })
    const ShowTable = intl.formatMessage({ id: 'pages.condo.property.index.ViewModeTable' })
    const BuildingsTabTitle = intl.formatMessage({ id: 'pages.condo.property.index.Buildings.Tab.Title' })
    const DivisionsTabTitle = intl.formatMessage({ id: 'pages.condo.property.index.Divisions.Tab.Title' })

    const [propertiesType, setPropertiesType] = useState<PropertiesType>('buildings')
    const [viewMode, changeViewMode] = useState('list')

    const initialTab = useRef(props.tab)
    useEffect(() => {
        if (!initialTab.current) {
            const queryParams = getQueryParams()
            initialTab.current = propertiesTypes.includes(queryParams.tab) ? queryParams.tab : propertiesTypes[0]
            router.push(`/property?tab=${initialTab.current}`)
        }
    })


    const [properties, setShownProperties] = useState<Property.IPropertyUIState[]>([])

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
                        <Col span={6} push={12} align={'right'} style={{ top: 10 }}>
                            <Radio.Group className={'sberRadioGroup'} value={viewMode} buttonStyle="outline" onChange={e => changeViewMode(e.target.value)}>
                                <Radio.Button value="list">{ShowTable}</Radio.Button>
                                <Radio.Button value="map">{ShowMap}</Radio.Button>
                            </Radio.Group>
                        </Col>
                        {viewMode !== 'map' &&
                            <Col span={24}>
                                {propertiesType === 'buildings' ?
                                    <BuildingsTable onSearch={(properties) => setShownProperties(properties)} /> :
                                    <DivisionTable onSearch={(properties) => setShownProperties(properties)} />
                                }
                            </Col>
                        }
                    </Row>
                    <>
                        {
                            viewMode === 'map' ? (
                                <PropertiesMap
                                    propertiesToRender={properties}
                                />
                            ) : null
                        }
                    </>
                </PageContent>
            </PageWrapper>
        </>
    )
}

PropertiesPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.Property' }} />
PropertiesPage.requiredAccess = OrganizationRequired
