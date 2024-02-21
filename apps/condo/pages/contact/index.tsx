import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { get } from 'lodash'
import isEmpty from 'lodash/isEmpty'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { PlusCircle, Search } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EXCEL } from '@condo/domains/common/constants/export'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { ContactsReadPermissionRequired } from '@condo/domains/contact/components/PageAccess'
import { useContactExportToExcelTask } from '@condo/domains/contact/hooks/useContactExportToExcelTask'
import { useImporterFunctions } from '@condo/domains/contact/hooks/useImporterFunctions'
import { useTableColumns } from '@condo/domains/contact/hooks/useTableColumns'
import { useContactsTableFilters } from '@condo/domains/contact/hooks/useTableFilters'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { CONTACT_PAGE_SIZE, getPageIndexFromQuery, IFilters } from '@condo/domains/contact/utils/helpers'


const ADD_CONTACT_ROUTE = '/contact/create/'
const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]

export const ContactsPageContent = ({
    tableColumns,
    searchContactsQuery,
    role,
    sortBy,
    loading,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.contact.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'contact.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'contact.EmptyList.manualCreateCard.body.description' })
    const CreateContact = intl.formatMessage({ id: 'AddContact' })

    const { user } = useAuth() as { user: { id: string } }
    const router = useRouter()
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)
    const { breakpoints } = useLayoutContext()
    const { GlobalHints } = useGlobalHints()

    const canManageContacts = get(role, 'canManageContacts', false)

    const {
        refetch,
        loading: contactsLoading,
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
    const { ExportButton } = useContactExportToExcelTask({
        where: searchContactsQuery,
        sortBy,
        format: EXCEL,
        user,
        timeZone: intl.formatters.getDateTimeFormat().resolvedOptions().timeZone,
        locale: intl.locale,
    })

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/contact/${record.id}/`)
            },
        }
    }, [])

    const [search, handleSearchChange] = useSearch<IFilters>()
    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions()
    const isNoContactsData = isEmpty(contacts) && isEmpty(filtersFromQuery) && !contactsLoading && !loading
    const EMPTY_LIST_VIEW_CONTAINER_STYLE = { display: isNoContactsData ? 'flex' : 'none' }

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                {GlobalHints}
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <TablePageContent>
                    <EmptyListView
                        label={EmptyListLabel}
                        accessCheck={canManageContacts}
                        importLayoutProps={{
                            manualCreateEmoji: '👱‍',
                            manualCreateDescription: EmptyListManualBodyDescription,
                            importCreateEmoji: '👪️',
                            importWrapper: {
                                accessCheck: canManageContacts,
                                onFinish: refetch,
                                columns: columns,
                                rowNormalizer: contactNormalizer,
                                rowValidator: contactValidator,
                                objectCreator: contactCreator,
                                domainName: 'contact',
                            },
                        }}
                        createRoute={ADD_CONTACT_ROUTE}
                        createLabel={CreateContact}
                        containerStyle={EMPTY_LIST_VIEW_CONTAINER_STYLE}
                    />
                    <Row gutter={ROW_VERTICAL_GUTTERS} align='middle' justify='start' hidden={isNoContactsData}>
                        <Col span={24}>
                            <TableFiltersContainer>
                                <Input
                                    placeholder={SearchPlaceholder}
                                    onChange={(e) => {
                                        handleSearchChange(e.target.value)
                                    }}
                                    value={search}
                                    allowClear
                                    suffix={<Search size='medium' color={colors.gray[7]} />}
                                />
                            </TableFiltersContainer>
                        </Col>
                        <Col span={24}>
                            <Table
                                totalRows={total}
                                loading={contactsLoading || loading}
                                dataSource={contacts}
                                columns={tableColumns}
                                onRow={handleRowAction}
                                pageSize={CONTACT_PAGE_SIZE}
                            />
                        </Col>
                        {
                            canManageContacts && (
                                <Col span={24}>
                                    <ActionBar
                                        actions={[
                                            canManageContacts && (
                                                <>
                                                    <Button
                                                        block={breakpoints.TABLET_LARGE}
                                                        key='left'
                                                        type='primary'
                                                        onClick={() => router.push(ADD_CONTACT_ROUTE)}
                                                        icon={<PlusCircle size='medium'/>}
                                                    >
                                                        {CreateContact}
                                                    </Button>
                                                    <ImportWrapper
                                                        key='import'
                                                        accessCheck={canManageContacts}
                                                        onFinish={refetch}
                                                        columns={columns}
                                                        rowNormalizer={contactNormalizer}
                                                        rowValidator={contactValidator}
                                                        objectCreator={contactCreator}
                                                        domainName='contact'
                                                    />
                                                </>
                                            ),
                                            <ExportButton key='export' />,
                                        ]}
                                    />
                                </Col>
                            )
                        }
                    </Row>
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const SORTABLE_PROPERTIES = ['name', 'unitName', 'phone', 'email', 'role']

const ContactsPage = () => {
    const router = useRouter()
    const filterMetas = useContactsTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const tableColumns = useTableColumns(filterMetas)
    const { organization, link, isLoading } = useOrganization()
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
            loading={isLoading}
        />
    )
}

ContactsPage.requiredAccess = ContactsReadPermissionRequired

export default ContactsPage
