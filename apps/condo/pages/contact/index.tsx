import { ContactWhereInput, OrganizationEmployeeRole, SortContactsBy } from '@app/condo/schema'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { ColumnsType } from 'antd/lib/table'
import { get } from 'lodash'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { PlusCircle, Search } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Loader } from '@condo/domains/common/components/Loader'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { EXCEL } from '@condo/domains/common/constants/export'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { ContactsReadPermissionRequired } from '@condo/domains/contact/components/PageAccess'
import { useContactExportToExcelTask } from '@condo/domains/contact/hooks/useContactExportToExcelTask'
import { useImporterFunctions } from '@condo/domains/contact/hooks/useImporterFunctions'
import { useTableColumns } from '@condo/domains/contact/hooks/useTableColumns'
import { useContactsTableFilters } from '@condo/domains/contact/hooks/useTableFilters'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { CONTACT_PAGE_SIZE, IFilters } from '@condo/domains/contact/utils/helpers'
import { PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'

const ADD_CONTACT_ROUTE = '/contact/create/'
const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]
const SORTABLE_PROPERTIES = ['name', 'unitName', 'phone', 'email', 'role']

type ContactPageContentProps = {
    filterMeta: FiltersMeta<ContactWhereInput>[],
    tableColumns: ColumnsType,
    baseSearchQuery: ContactWhereInput,
    role: OrganizationEmployeeRole,
    loading: boolean,
}

const ContactTableContent: React.FC<ContactPageContentProps> = (props) => {
    const {
        baseSearchQuery,
        tableColumns,
        filterMeta,
        loading,
        role,
    } = props

    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CreateContact = intl.formatMessage({ id: 'AddContact' })

    const router = useRouter()
    const { user } = useAuth() as { user: { id: string } }
    const { breakpoints } = useLayoutContext()

    const { filters, sorters, offset } = parseQuery(router.query)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMeta, SORTABLE_PROPERTIES)
    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortContactsBy[], [sorters, sortersToSortBy])
    const canManageContacts = get(role, 'canManageContacts', false)
    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const searchContactsQuery = useMemo(() => ({
        ...baseSearchQuery,
        ...filtersToWhere(filters),
    }), [baseSearchQuery, filters, filtersToWhere])

    const {
        refetch,
        loading: contactsLoading,
        count: total,
        objs: contacts,
    } = Contact.useObjects({
        sortBy,
        where: searchContactsQuery,
        skip: (currentPageIndex - 1) * CONTACT_PAGE_SIZE,
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

    const [search, handleSearchChange] = useSearch<IFilters>()
    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions()

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/contact/${record.id}/`)
            },
        }
    }, [])

    return (
        <Row gutter={ROW_VERTICAL_GUTTERS} align='middle' justify='start'>
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
    )
}

const ContactsPageContent: React.FC<ContactPageContentProps> = (props) => {
    const { baseSearchQuery, role, loading } = props

    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'contact.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'contact.EmptyList.manualCreateCard.body.description' })
    const CreateContact = intl.formatMessage({ id: 'AddContact' })

    const { refetch } = Contact.useObjects({ where: baseSearchQuery }, { skip: true })
    const { count, loading: contactsCountLoading } = Contact.useCount({ where: baseSearchQuery })
    const canManageContacts = get(role, 'canManageContacts', false)

    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions()

    if (contactsCountLoading || loading) return <Loader />

    if (count === 0) {
        return (
            <EmptyListContent
                label={EmptyListLabel}
                accessCheck={canManageContacts}
                importLayoutProps={{
                    manualCreateEmoji: EMOJI.MAN,
                    manualCreateDescription: EmptyListManualBodyDescription,
                    importCreateEmoji: EMOJI.FAMILY,
                    importWrapper: {
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
            />
        )
    }

    return <ContactTableContent {...props} />
}

export const ContactPageContentWrapper: React.FC<ContactPageContentProps> = (props) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.contact.PageTitle' })

    const { GlobalHints } = useGlobalHints()

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                {GlobalHints}
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <TablePageContent>
                    <ContactsPageContent {...props}/>
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const ContactsPage = () => {
    const filterMeta = useContactsTableFilters()
    const tableColumns = useTableColumns(filterMeta)
    const { organization, link, isLoading } = useOrganization()
    const userOrganizationId = get(organization, ['id'])
    const role = get(link, 'role')

    const baseSearchQuery = useMemo(() => ({
        organization: { id: userOrganizationId },
    }), [userOrganizationId])

    return (
        <ContactPageContentWrapper
            filterMeta={filterMeta}
            baseSearchQuery={baseSearchQuery}
            tableColumns={tableColumns}
            role={role}
            loading={isLoading}
        />
    )
}

ContactsPage.requiredAccess = ContactsReadPermissionRequired

export default ContactsPage
