import {
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
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

import { Col, Input, Row, Table, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { get, debounce } from 'lodash'
import React, { useCallback, useState } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useTableColumns } from '@condo/domains/contact/hooks/useTableColumns'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useOrganization } from '@core/next/organization'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { Button } from '@condo/domains/common/components/Button'
import { SortContactsBy } from '@app/condo/schema'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { DiffOutlined } from '@ant-design/icons'
import { useImporterFunctions } from '@condo/domains/contact/hooks/useImporterFunctions'
import { updateQuery } from '@condo/domains/common/utils/filters.utils'
import { getTableScrollConfig } from '@condo/domains/common/utils/tables.utils'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'

const ADD_CONTACT_ROUTE = '/contact/create/'

export const ContactsPageContent = ({
    tableColumns,
    filtersToQuery,
    filtersApplied,
    setFiltersApplied,
    searchContactsQuery,
    role,
    sortBy,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.contact.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'contact.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'contact.EmptyList.title' })
    const CreateContact = intl.formatMessage({ id: 'AddContact' })
    const ContactsMessage = intl.formatMessage({ id: 'menu.Contacts' })
    const ContactTitle = intl.formatMessage({ id: 'pages.condo.contact.ImportTitle' })

    const router = useRouter()
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)
    const { isSmall } = useLayoutContext()

    const canManageContacts = get(role, 'canManageContacts', false)

    const {
        refetch,
        fetchMore,
        loading,
        count: total,
        objs: contacts,
    } = Contact.useObjects({
        sortBy,
        where: searchContactsQuery,
        skip: (offsetFromQuery * CONTACT_PAGE_SIZE) - CONTACT_PAGE_SIZE,
        first: CONTACT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

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
            }).then(async () => {
                await updateQuery(router, { ...filtersFromQuery, ...nextFilters }, sort, offset)
            })
        }
    }, 400), [loading])

    const [search, handleSearchChange] = useSearch<IFilters>(loading)
    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions()


    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <TablePageContent>
                    {
                        !contacts.length && !filtersFromQuery
                            ? (
                                <EmptyListView
                                    label={EmptyListLabel}
                                    message={EmptyListMessage}
                                    createRoute={ADD_CONTACT_ROUTE}
                                    createLabel={CreateContact}
                                />
                            )
                            : (
                                <Row gutter={[0, 40]} align={'middle'} justify={'start'}>
                                    <Col span={24}>
                                        <Row justify={'start'} gutter={[0, 40]}>
                                            <Col xs={24} lg={6}>
                                                <Input
                                                    placeholder={SearchPlaceholder}
                                                    onChange={(e) => {handleSearchChange(e.target.value)}}
                                                    value={search}
                                                />
                                            </Col>
                                            <Col lg={1} offset={13} hidden={isSmall}>
                                                {
                                                    canManageContacts && (
                                                        <ImportWrapper
                                                            objectsName={ContactsMessage}
                                                            accessCheck={canManageContacts}
                                                            onFinish={refetch}
                                                            columns={columns}
                                                            rowNormalizer={contactNormalizer}
                                                            rowValidator={contactValidator}
                                                            objectCreator={contactCreator}
                                                            domainTranslate={ContactTitle}
                                                            exampleTemplateLink={'/contact-import-example.xlsx'}
                                                        >
                                                            <Button
                                                                type={'sberPrimary'}
                                                                icon={<DiffOutlined />}
                                                                block
                                                                secondary
                                                            />
                                                        </ImportWrapper>
                                                    )
                                                }
                                            </Col>
                                            <Col xs={24} lg={4}>
                                                {
                                                    canManageContacts && (
                                                        <Button
                                                            block={!isSmall}
                                                            key='left'
                                                            type={'sberPrimary'}
                                                            onClick={() => router.push(ADD_CONTACT_ROUTE)}
                                                        >
                                                            {CreateContact}
                                                        </Button>
                                                    )
                                                }
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            bordered
                                            scroll={getTableScrollConfig(isSmall)}
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
                            )
                    }
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const ContactsPage = () => {
    const router = useRouter()
    const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    const sortBy = sortFromQuery.length > 0 ? sortFromQuery : ['createdAt_DESC'] as Array<SortContactsBy>
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)

    const { organization, link } = useOrganization()

    const [filtersApplied, setFiltersApplied] = useState(false)
    const tableColumns = useTableColumns(sortFromQuery, filtersFromQuery, setFiltersApplied)

    const searchContactsQuery = {
        ...filtersToQuery(filtersFromQuery), organization: { id: organization.id },
    }

    return (
        <ContactsPageContent
            tableColumns={tableColumns}
            filtersToQuery={filtersToQuery}
            filtersApplied={filtersApplied}
            setFiltersApplied={setFiltersApplied}
            searchContactsQuery={searchContactsQuery}
            role={link.role}
            sortBy={sortBy}
        />
    )
}

ContactsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'pages.condo.contact.PageTitle' }}/>
ContactsPage.requiredAccess = OrganizationRequired

export default ContactsPage
