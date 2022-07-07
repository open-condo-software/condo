import { DiffOutlined } from '@ant-design/icons'
import { EXPORT_CONTACTS_TO_EXCEL } from '@app/condo/domains/contact/gql'
import { Button } from '@condo/domains/common/components/Button'

import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { getTableScrollConfig, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useImporterFunctions } from '@condo/domains/contact/hooks/useImporterFunctions'
import { useTableColumns } from '@condo/domains/contact/hooks/useTableColumns'
import { useContactsTableFilters } from '@condo/domains/contact/hooks/useTableFilters'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { CONTACT_PAGE_SIZE, getPageIndexFromQuery, IFilters } from '@condo/domains/contact/utils/helpers'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Col, Row, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import { Gutter } from 'antd/es/grid/row'
import { get } from 'lodash'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { DEFAULT_RECORDS_LIMIT_FOR_IMPORT, EXTENDED_RECORDS_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/import'
import isEmpty from 'lodash/isEmpty'

const ADD_CONTACT_ROUTE = '/contact/create/'
const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]
const ROW_HORIZONTAL_GUTTERS: [Gutter, Gutter] = [10, 0]

export const ContactsPageContent = ({
    tableColumns,
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
        loading,
        count: total,
        objs: contacts,
    } = Contact.useNewObjects({
        sortBy,
        where: searchContactsQuery,
        // skip: (offsetFromQuery * CONTACT_PAGE_SIZE) - CONTACT_PAGE_SIZE,
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

    const [search, handleSearchChange] = useSearch<IFilters>(loading)
    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions()
    const isNoContactsData = isEmpty(contacts) && isEmpty(filtersFromQuery) && !loading

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <TablePageContent>
                    <EmptyListView
                        label={EmptyListLabel}
                        message={EmptyListMessage}
                        button={(
                            <ImportWrapper
                                objectsName={ContactsMessage}
                                accessCheck={canManageContacts}
                                onFinish={refetch}
                                columns={columns}
                                maxTableLength={hasFeature('bigger_limit_for_import') ?
                                    EXTENDED_RECORDS_LIMIT_FOR_IMPORT :
                                    DEFAULT_RECORDS_LIMIT_FOR_IMPORT
                                }
                                rowNormalizer={contactNormalizer}
                                rowValidator={contactValidator}
                                objectCreator={contactCreator}
                                domainTranslate={ContactTitle}
                                exampleTemplateLink={'/contact-import-example.xlsx'}
                            >
                                <Button
                                    type={'sberPrimary'}
                                    icon={<DiffOutlined/>}
                                    block
                                    secondary
                                />
                            </ImportWrapper>
                        )}
                        createRoute={ADD_CONTACT_ROUTE}
                        createLabel={CreateContact}
                        containerStyle={{ display: isNoContactsData ? 'flex' : 'none' }}
                    />
                    <Row gutter={ROW_VERTICAL_GUTTERS} align={'middle'} justify={'start'} hidden={isNoContactsData}>
                        <Col span={24}>
                            <TableFiltersContainer>
                                <Row justify={'space-between'} gutter={ROW_VERTICAL_GUTTERS}>
                                    <Col xs={24} lg={6}>
                                        <Input
                                            placeholder={SearchPlaceholder}
                                            onChange={(e) => {
                                                handleSearchChange(e.target.value)
                                            }}
                                            value={search}
                                            allowClear
                                        />
                                    </Col>
                                    <Col>
                                        <Row
                                            gutter={ROW_HORIZONTAL_GUTTERS}
                                            align={'middle'}
                                            justify={'center'}
                                        >
                                            <Col hidden={isSmall}>
                                                {
                                                    canManageContacts && (
                                                        <ImportWrapper
                                                            objectsName={ContactsMessage}
                                                            accessCheck={canManageContacts}
                                                            onFinish={refetch}
                                                            columns={columns}
                                                            maxTableLength={hasFeature('bigger_limit_for_import') ?
                                                                EXTENDED_RECORDS_LIMIT_FOR_IMPORT :
                                                                DEFAULT_RECORDS_LIMIT_FOR_IMPORT
                                                            }
                                                            rowNormalizer={contactNormalizer}
                                                            rowValidator={contactValidator}
                                                            objectCreator={contactCreator}
                                                            domainTranslate={ContactTitle}
                                                            exampleTemplateLink={'/contact-import-example.xlsx'}
                                                        >
                                                            <Button
                                                                type={'sberPrimary'}
                                                                icon={<DiffOutlined/>}
                                                                block
                                                                secondary
                                                            />
                                                        </ImportWrapper>
                                                    )
                                                }
                                            </Col>
                                            <Col>
                                                {
                                                    canManageContacts && (
                                                        <Button
                                                            block={!isSmall}
                                                            key="left"
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
                                </Row>
                            </TableFiltersContainer>
                        </Col>
                        <Col span={24}>
                            <Table
                                scroll={getTableScrollConfig(isSmall)}
                                totalRows={total}
                                loading={loading}
                                dataSource={contacts}
                                columns={tableColumns}
                                onRow={handleRowAction}
                                pageSize={CONTACT_PAGE_SIZE}
                            />
                        </Col>
                        <ExportToExcelActionBar
                            hidden={isSmall}
                            searchObjectsQuery={searchContactsQuery}
                            sortBy={sortBy}
                            exportToExcelQuery={EXPORT_CONTACTS_TO_EXCEL}
                            useTimeZone={false}
                        />
                    </Row>
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const SORTABLE_PROPERTIES = ['name', 'unitName', 'phone', 'email']

const ContactsPage = () => {
    const router = useRouter()
    const filterMetas = useContactsTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const tableColumns = useTableColumns(filterMetas)
    const { organization, link } = useOrganization()
    const userOrganizationId = get(organization, ['id'])
    const role = get(link, 'role')
    const { filters, sorters } = parseQuery(router.query)
    const searchContactsQuery = {
        ...filtersToWhere(filters), organization: { id: userOrganizationId },
    }

    return (
        <ContactsPageContent
            tableColumns={tableColumns}
            searchContactsQuery={searchContactsQuery}
            sortBy={sortersToSortBy(sorters)}
            role={role}
        />
    )
}

ContactsPage.requiredAccess = OrganizationRequired

export default ContactsPage
