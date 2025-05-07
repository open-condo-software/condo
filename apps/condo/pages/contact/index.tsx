import {
    GetContactsForTableQueryHookResult,
    useGetContactsExistenceQuery,
    useGetContactsForTableQuery,
    useUpdateContactsMutation,
} from '@app/condo/gql'
import {
    ContactWhereInput,
    OrganizationEmployeeRole,
    SortContactsBy,
    ContactExportTaskFormatType,
} from '@app/condo/schema'
import { Col, notification, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { ColumnsType } from 'antd/lib/table'
import { get } from 'lodash'
import chunk from 'lodash/chunk'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { QuestionCircle, Search } from '@open-condo/icons'
import { useApolloClient } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, ActionBarProps, Button, Checkbox, Space, Tooltip } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Loader } from '@condo/domains/common/components/Loader'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useTableRowSelection } from '@condo/domains/common/hooks/useTableRowSelection'
import { PageComponentType } from '@condo/domains/common/types'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { ContactsReadPermissionRequired } from '@condo/domains/contact/components/PageAccess'
import { useContactExportToExcelTask } from '@condo/domains/contact/hooks/useContactExportToExcelTask'
import { useImporterFunctions } from '@condo/domains/contact/hooks/useImporterFunctions'
import { useTableColumns } from '@condo/domains/contact/hooks/useTableColumns'
import { useContactsTableFilters } from '@condo/domains/contact/hooks/useTableFilters'
import { CONTACT_PAGE_SIZE, IFilters } from '@condo/domains/contact/utils/helpers'
import { PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'


const ADD_CONTACT_ROUTE = '/contact/create/'
const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]
const SORTABLE_PROPERTIES = ['name', 'unitName', 'phone', 'email', 'role', 'createdAt']

type ContactBaseSearchQuery = { organization: { id: string } } | { organization: { 'id_in': Array<string> } }

type ContactPageContentProps = {
    filterMeta: FiltersMeta<ContactWhereInput>[]
    tableColumns: ColumnsType
    baseSearchQuery: ContactBaseSearchQuery
    role?: Pick<OrganizationEmployeeRole, 'canManageContacts'>
    loading: boolean
}


const useContactImportIsVerifiedCheckbox = () => {
    const intl = useIntl()
    const TooltipTitle = intl.formatMessage({ id: 'import.contact.isVerifiedCheckbox.tooltip.title' })
    const CheckboxTitle = intl.formatMessage({ id: 'import.contact.isVerifiedCheckbox.title' })

    const [isVerified, setIsVerified] = useState<boolean>(true)
    const isVerifiedRef = useRef<boolean>(isVerified)

    const handleImportModalClose = useCallback(() => {
        setIsVerified(true)
    }, [])

    const IsVerifiedCheckbox = useMemo(() => (
        <Checkbox
            onChange={(e) => setIsVerified(e.target.checked)}
            checked={isVerified}
        >
            <Space size={8} align='center'>
                <Typography.Text>{CheckboxTitle}</Typography.Text>
                <Tooltip title={TooltipTitle}>
                    <Space size={8}>
                        <QuestionCircle size='small' />
                    </Space>
                </Tooltip>
            </Space>
        </Checkbox>
    ), [CheckboxTitle, TooltipTitle, isVerified])

    useEffect(() => {
        isVerifiedRef.current = isVerified
    }, [isVerified])

    return {
        isVerifiedRef,
        handleImportModalClose,
        IsVerifiedCheckbox,
    }
}

type DefaultActionBarProps = {
    searchContactsQuery: ContactWhereInput
    sortBy: SortContactsBy[]
    refetch: GetContactsForTableQueryHookResult['refetch']
}
const DefaultActionBar: React.FC<DefaultActionBarProps> = ({ searchContactsQuery, refetch, sortBy }) => {
    const intl = useIntl()
    const CreateContact = intl.formatMessage({ id: 'AddContact' })

    const router = useRouter()
    const { user } = useAuth() as { user: { id: string } }
    const { breakpoints } = useLayoutContext()

    const { isVerifiedRef, handleImportModalClose, IsVerifiedCheckbox } = useContactImportIsVerifiedCheckbox()
    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions({ isVerifiedRef })

    const { ExportButton } = useContactExportToExcelTask({
        where: searchContactsQuery,
        sortBy,
        format: ContactExportTaskFormatType.Excel,
        user,
        timeZone: intl.formatters.getDateTimeFormat().resolvedOptions().timeZone,
        locale: intl.locale,
    })

    return (
        <Col span={24}>
            <ActionBar
                actions={[
                    <>
                        <Button
                            block={breakpoints.TABLET_LARGE}
                            key='left'
                            type='primary'
                            onClick={() => router.push(ADD_CONTACT_ROUTE)}
                        >
                            {CreateContact}
                        </Button>
                        <ImportWrapper
                            key='import'
                            accessCheck={true}
                            onFinish={refetch}
                            columns={columns}
                            rowNormalizer={contactNormalizer}
                            rowValidator={contactValidator}
                            objectCreator={contactCreator}
                            domainName='contact'
                            extraModalContent={{
                                'example': IsVerifiedCheckbox,
                            }}
                            handleClose={handleImportModalClose}
                        />
                    </>,
                    <ExportButton key='export' />,
                ]}
            />
        </Col>
    )
}

type ActionBarWithSelectedItemsProps = {
    selectedKeys: string[]
    clearSelection: () => void
    refetch: GetContactsForTableQueryHookResult['refetch']
}
const ActionBarWithSelectedItems: React.FC<ActionBarWithSelectedItemsProps> = ({ refetch, selectedKeys, clearSelection }) => {
    const intl = useIntl()
    const CancelSelectionMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const ConfirmDeleteManyContactsTitle = intl.formatMessage({ id: 'contact.ConfirmDeleteManyTitle' })
    const ConfirmDeleteManyContactsMessage = intl.formatMessage({ id: 'contact.ConfirmDeleteMessage' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })
    const DoneMsg = intl.formatMessage({ id: 'OperationCompleted' })
    const VerifyMessage = intl.formatMessage({ id: 'contact.Verify' })

    const router = useRouter()
    const client = useApolloClient()

    const SelectedItemsMessage = useMemo(() => intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedKeys.length }), [intl, selectedKeys])

    const [updateContactsMutation] = useUpdateContactsMutation({
        onCompleted: async () => {
            clearSelection()
            await refetch()
        },
    })

    const updateSelectedContactsByChunks = useCallback(async (payload) => {
        if (!selectedKeys.length) return

        const itemsToDeleteByChunks = chunk(selectedKeys.map((key) => ({
            id: key,
            data: {
                dv: 1,
                sender: getClientSideSenderInfo(),
                ...payload,
            },
        })), 30)

        for (const itemsToDelete of itemsToDeleteByChunks) {
            await updateContactsMutation({
                variables: {
                    data: itemsToDelete,
                },
            })
        }

        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allContacts' })
        client.cache.gc()
    }, [client.cache, selectedKeys, updateContactsMutation])

    const handleDeleteButtonClick = useCallback(async () => {
        const now = new Date().toISOString()
        await updateSelectedContactsByChunks({ deletedAt: now })
        await updateQuery(router, {
            newParameters: {
                offset: 0,
            },
        }, { routerAction: 'replace', resetOldParameters: false })
    }, [router, updateSelectedContactsByChunks])

    const handleVerifyButtonClick = useCallback(async () => {
        await updateSelectedContactsByChunks({ isVerified: true })
        notification.success({ message: DoneMsg })
    }, [DoneMsg, updateSelectedContactsByChunks])

    const selectedContactsActionBarButtons: ActionBarProps['actions'] = useMemo(() => [
        <DeleteButtonWithConfirmModal
            key='deleteSelectedContacts'
            title={ConfirmDeleteManyContactsTitle}
            message={ConfirmDeleteManyContactsMessage}
            okButtonLabel={DeleteMessage}
            action={handleDeleteButtonClick}
            buttonContent={DeleteMessage}
            cancelMessage={DontDeleteMessage}
            showCancelButton
            cancelButtonType='primary'
        />,
        <Button
            key='verifySelectedContacts'
            type='secondary'
            onClick={handleVerifyButtonClick}
        >
            {VerifyMessage}
        </Button>,
        <Button
            key='cancelContactsSelection'
            type='secondary'
            onClick={clearSelection}
        >
            {CancelSelectionMessage}
        </Button>,
    ], [
        ConfirmDeleteManyContactsTitle, ConfirmDeleteManyContactsMessage, DeleteMessage, handleDeleteButtonClick,
        DontDeleteMessage, handleVerifyButtonClick, clearSelection, CancelSelectionMessage, VerifyMessage,
    ])

    return (
        <Col span={24}>
            <ActionBar
                message={SelectedItemsMessage}
                actions={selectedContactsActionBarButtons}
            />
        </Col>
    )
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

    const router = useRouter()

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
        data: contactsData,
    } = useGetContactsForTableQuery({
        variables: {
            sortBy,
            where: searchContactsQuery,
            skip: (currentPageIndex - 1) * CONTACT_PAGE_SIZE,
            first: CONTACT_PAGE_SIZE,
        },
        fetchPolicy: 'network-only',
    })
    const contacts = contactsData?.contacts?.filter(Boolean)
    const total = contactsData?.meta?.count

    const { selectedKeys, clearSelection, rowSelection } = useTableRowSelection<typeof contacts[number]>({ items: contacts })
    const [search, handleSearchChange] = useSearch<IFilters>()

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/contact/${record.id}/`)
            },
        }
    }, [router])

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
                    rowSelection={canManageContacts && rowSelection}
                />
            </Col>
            {
                canManageContacts && (
                    selectedKeys.length > 0 ? (
                        <ActionBarWithSelectedItems
                            selectedKeys={selectedKeys}
                            clearSelection={clearSelection}
                            refetch={refetch}
                        />
                    ) : (
                        <DefaultActionBar
                            searchContactsQuery={searchContactsQuery}
                            sortBy={sortBy}
                            refetch={refetch}
                        />
                    )
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

    const {
        data: contactsExistenceData,
        loading: contactsExistenceDataLoading,
        refetch,
    } = useGetContactsExistenceQuery({
        variables: {
            where: baseSearchQuery,
        },
        fetchPolicy: 'network-only',
    })
    const contacts = contactsExistenceData?.contacts?.filter(Boolean) || []
    const canManageContacts = role?.canManageContacts

    const { isVerifiedRef, handleImportModalClose, IsVerifiedCheckbox } = useContactImportIsVerifiedCheckbox()
    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions({ isVerifiedRef })

    if (contactsExistenceDataLoading || loading) return <Loader />

    if (contacts.length === 0) {
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
                        extraModalContent: {
                            'example': IsVerifiedCheckbox,
                        },
                        handleClose: handleImportModalClose,
                    },
                }}
                createRoute={ADD_CONTACT_ROUTE}
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

const ContactsPage: PageComponentType = () => {
    const filterMeta = useContactsTableFilters()
    const tableColumns = useTableColumns(filterMeta)
    const { organization, role, employee, isLoading } = useOrganization()
    const userOrganizationId = get(organization, ['id'])
    const employeeId = get(employee, 'id')

    const baseSearchQuery: ContactBaseSearchQuery = useMemo(() => ({
        organization: { id: userOrganizationId },
    }), [userOrganizationId])

    usePreviousSortAndFilters({ employeeSpecificKey: employeeId })

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
