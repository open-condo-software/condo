import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import {
    filtersToQuery,
    getPageIndexFromQuery,
    getSortStringFromQuery,
    CITIZEN_PAGE_SIZE,
    sorterToQuery, queryToSorter,
} from '@condo/domains/contact/utils/helpers'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { IFilters } from '@condo/domains/contact/utils/helpers'
import { useIntl } from '@core/next/intl'

import { Col, Input, Row, Space, Table, Typography, Dropdown, Menu, Tooltip } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import { pickBy, get, debounce } from 'lodash'
import React, { useCallback } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useTableColumns } from '@condo/domains/contact/hooks/useTableColumns'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useOrganization } from '@core/next/organization'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { Button } from '../../domains/common/components/Button'
import { SortContactsBy } from '../../schema'
const ADD_CITIZEN_ROUTE = '/citizen/create/'

const CitizensPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.citizen.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'citizen.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'citizen.EmptyList.title' })
    const CreateCitizen = intl.formatMessage({ id: 'AddCitizen' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const AddItemUsingFormLabel = intl.formatMessage({ id: 'AddItemUsingForm' })
    const AddItemUsingUploadLabel = intl.formatMessage({ id: 'AddItemUsingFileUpload' })

    const router = useRouter()
    const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const {
        fetchMore,
        loading,
        count: total,
        objs: citizens,
    } = Contact.useObjects({
        sortBy: sortFromQuery.length > 0 ? sortFromQuery : ['createdAt_DESC'] as Array<SortContactsBy>,
        where: { ...filtersToQuery(filtersFromQuery), organization: { id: userOrganizationId } },
        skip: (offsetFromQuery * CITIZEN_PAGE_SIZE) - CITIZEN_PAGE_SIZE,
        first: CITIZEN_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const tableColumns = useTableColumns(sortFromQuery, filtersFromQuery)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/citizen/${record.id}/`)
            },
        }
    }, [])

    const handleTableChange = useCallback(debounce((...tableChangeArguments) => {
        const [nextPagination, nextFilters, nextSorter] = tableChangeArguments

        const { current, pageSize } = nextPagination
        const offset = current * pageSize - pageSize
        const sort = sorterToQuery(nextSorter)
        const filters = filtersToQuery(nextFilters)

        if (!loading) {
            fetchMore({
                // @ts-ignore
                sortBy: sort,
                where: filters,
                skip: offset,
                first: CITIZEN_PAGE_SIZE,
            }).then(() => {
                const query = qs.stringify(
                    { ...router.query, sort, offset, filters: JSON.stringify(pickBy({ ...filtersFromQuery, ...nextFilters })) },
                    { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
                )

                router.push(router.route + query)
            })
        }
    }, 400), [loading])

    const [search, handleSearchChange] = useSearch<IFilters>(loading)

    const handleAddCitizen = () => router.push(ADD_CITIZEN_ROUTE)

    const dropDownMenu = (
        <Menu>
            <Menu.Item key="1" onClick={handleAddCitizen}>
                {AddItemUsingFormLabel}
            </Menu.Item>
            <Menu.Item key="2">
                <Tooltip title={NotImplementedYetMessage}>
                    {AddItemUsingUploadLabel}
                </Tooltip>
            </Menu.Item>
        </Menu>
    )
    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <OrganizationRequired>
                    <PageContent>
                        {
                            !citizens.length && !filtersFromQuery
                                ? <EmptyListView
                                    label={EmptyListLabel}
                                    message={EmptyListMessage}
                                    createRoute={ADD_CITIZEN_ROUTE}
                                    createLabel={CreateCitizen} />
                                : <Row gutter={[0, 40]} align={'middle'}>
                                    <Col span={24}>
                                        <Row justify={'space-between'}>
                                            <Col span={6}>
                                                <Input
                                                    placeholder={SearchPlaceholder}
                                                    onChange={(e) => {handleSearchChange(e.target.value)}}
                                                    value={search}
                                                />
                                            </Col>
                                            <Dropdown.Button
                                                overlay={dropDownMenu}
                                                buttonsRender={() => [
                                                    <Button
                                                        key='left'
                                                        type={'sberPrimary'}
                                                        style={{ borderRight: '1px solid white' }}
                                                        onClick={() => router.push(ADD_CITIZEN_ROUTE)}
                                                    >
                                                        {CreateCitizen}
                                                    </Button>,
                                                    <Button
                                                        key='right'
                                                        type={'sberPrimary'}
                                                        style={{ borderLeft: '1px solid white', lineHeight: '150%' }}
                                                        icon={<EllipsisOutlined />}/>,
                                                ]}/>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            bordered
                                            tableLayout={'fixed'}
                                            loading={loading}
                                            dataSource={citizens}
                                            columns={tableColumns}
                                            rowKey={record =>  record.id}
                                            onRow={handleRowAction}
                                            onChange={handleTableChange}
                                            pagination={{
                                                total,
                                                current: offsetFromQuery,
                                                pageSize: CITIZEN_PAGE_SIZE,
                                                position: ['bottomLeft'],
                                            }}
                                        />
                                    </Col>
                                </Row>
                        }
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()
    const BackButtonLabel = intl.formatMessage({ id: 'pages.condo.citizen.PageTitle' })

    return (
        <Space>
            <Typography.Text style={{ fontSize: '12px' }}>
                {BackButtonLabel}
            </Typography.Text>
        </Space>
    )
}

CitizensPage.headerAction = <HeaderAction/>

export default CitizensPage
