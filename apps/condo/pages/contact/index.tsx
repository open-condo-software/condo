import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import {
    filtersToQuery,
    getPageIndexFromQuery,
    getSortStringFromQuery,
    CONTACT_PAGE_SIZE,
    sorterToQuery, queryToSorter,
} from '@condo/domains/contact/utils/helpers'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { IFilters } from '@condo/domains/contact/utils/helpers'
import { useIntl } from '@core/next/intl'

import { Col, Input, Row, Space, Table, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import { pickBy, get, debounce } from 'lodash'
import React, { useCallback, useRef, useState } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useTableColumns } from '@condo/domains/contact/hooks/useTableColumns'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useOrganization } from '@core/next/organization'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { Button } from '@condo/domains/common/components/Button'
import { SortContactsBy } from '../../schema'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { DiffOutlined } from '@ant-design/icons'
import { useImporterFunctions } from '@condo/domains/contact/hooks/useImporterFunctions'
import { TableRow } from '../../domains/common/utils/importer'

const ADD_CONTACT_ROUTE = '/contact/create/'

const ContactPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.contact.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'contact.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'contact.EmptyList.title' })
    const CreateContact = intl.formatMessage({ id: 'AddContact' })
    const ContactsMessage = intl.formatMessage({ id: 'menu.Contacts' })

    const router = useRouter()
    const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const {
        refetch,
        fetchMore,
        loading,
        count: total,
        objs: contacts,
    } = Contact.useObjects({
        sortBy: sortFromQuery.length > 0 ? sortFromQuery : ['createdAt_DESC'] as Array<SortContactsBy>,
        where: { ...filtersToQuery(filtersFromQuery), organization: { id: userOrganizationId } },
        skip: (offsetFromQuery * CONTACT_PAGE_SIZE) - CONTACT_PAGE_SIZE,
        first: CONTACT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const [filtersApplied, setFiltersApplied] = useState(false)
    const tableColumns = useTableColumns(sortFromQuery, filtersFromQuery, setFiltersApplied)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/contact/${record.id}/`)
            },
        }
    }, [])

    const handleTableChange = useCallback(debounce((...tableChangeArguments) => {
        const [nextPagination, nextFilters, nextSorter] = tableChangeArguments
        const { current, pageSize } = nextPagination
        const offset = filtersApplied ? 0 : current * pageSize - pageSize
        const sort = sorterToQuery(nextSorter)
        const filters = filtersToQuery(nextFilters)
        setFiltersApplied(false)

        if (!loading) {
            fetchMore({
                // @ts-ignore
                sortBy: sort,
                where: filters,
                skip: offset,
                first: CONTACT_PAGE_SIZE,
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
    const canManageContacts = get(userOrganization, ['link', 'role', 'canManageContacts'], false)
    const failedRows = useRef([])
    const addFailedRow = (row: TableRow, cells: Array<number>) => {
        failedRows.current.push({ row, cells })
    }
    const clearFailedRows = () => {
        failedRows.current.splice(0, failedRows.current.length)
    }
    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions(addFailedRow)
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
                            !contacts.length && !filtersFromQuery
                                ? <EmptyListView
                                    label={EmptyListLabel}
                                    message={EmptyListMessage}
                                    createRoute={ADD_CONTACT_ROUTE}
                                    createLabel={CreateContact} />
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
                                            <Space size={16}>
                                                <ImportWrapper
                                                    objectsName={ContactsMessage}
                                                    accessCheck={canManageContacts}
                                                    onFinish={refetch}
                                                    columns={columns}
                                                    rowNormalizer={contactNormalizer}
                                                    rowValidator={contactValidator}
                                                    objectCreator={contactCreator}
                                                    errors={{ errorsContainer: failedRows.current, clearErrorsContainer: clearFailedRows }}
                                                >
                                                    <Button
                                                        type={'sberPrimary'}
                                                        icon={<DiffOutlined />}
                                                        secondary
                                                    />
                                                </ImportWrapper>
                                                <Button
                                                    key='left'
                                                    type={'sberPrimary'}
                                                    onClick={() => router.push(ADD_CONTACT_ROUTE)}
                                                >
                                                    {CreateContact}
                                                </Button>
                                            </Space>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            bordered
                                            tableLayout={'fixed'}
                                            loading={loading}
                                            dataSource={contacts}
                                            columns={tableColumns}
                                            rowKey={record =>  record.id}
                                            onRow={handleRowAction}
                                            onChange={handleTableChange}
                                            pagination={{
                                                showSizeChanger: false,
                                                total,
                                                current: offsetFromQuery,
                                                pageSize: CONTACT_PAGE_SIZE,
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

ContactPage.headerAction = <TitleHeaderAction descriptor={{ id: 'pages.condo.contact.PageTitle' }}/>

export default ContactPage
