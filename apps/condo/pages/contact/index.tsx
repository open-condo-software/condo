import {
    useGetContactsExistenceQuery,
    GetContactsForTableQuery,
    useUpdateContactsMutation,
    useGetNewsItemsRecipientsCountersQuery,
    useGetAllPropertyCountByOrganizationIdQuery,
    useGetAllPropertyWithoutMapCountByOrganizationIdQuery,
    useGetContactsForTableLazyQuery,
} from '@app/condo/gql'
import {
    ContactWhereInput,
    OrganizationEmployeeRole,
    SortContactsBy,
    ContactExportTaskFormatType,
} from '@app/condo/schema'
import { Col, notification, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import chunk from 'lodash/chunk'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { QuestionCircle, AlertCircle, Download } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import {
    ActionBar,
    ActionBarProps,
    Button,
    Checkbox,
    Space,
    Tooltip,
    Card,
    Typography,
    GetTableData,
    Input,
    TableRef,
    RowSelectionState,
    FilterState,
    SortState,
    TableColumn,
    Table,
    FullTableState,
} from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Loader } from '@condo/domains/common/components/Loader'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { ANALYTICS_RESIDENT_IN_CONTACT_PAGE } from '@condo/domains/common/constants/featureflags'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useTableSearch, UseTableSearchOutputType } from '@condo/domains/common/hooks/useSearch'
import { useTableTranslations } from '@condo/domains/common/hooks/useTableTranslations'
import { PageComponentType } from '@condo/domains/common/types'
import { TableFiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { defaultParseUrlQuery, defaultUpdateUrlQuery } from '@condo/domains/common/utils/tableUrls'
import { ContactsReadPermissionRequired } from '@condo/domains/contact/components/PageAccess'
import { useContactExportToExcelTask } from '@condo/domains/contact/hooks/useContactExportToExcelTask'
import { useImporterFunctions } from '@condo/domains/contact/hooks/useImporterFunctions'
import { useTableColumns } from '@condo/domains/contact/hooks/useTableColumns'
import { useContactsTableFilters } from '@condo/domains/contact/hooks/useTableFilters'
import { CONTACT_PAGE_SIZE } from '@condo/domains/contact/utils/helpers'
import { useNewsItemRecipientsExportToExcelTask } from '@condo/domains/news/hooks/useNewsItemRecipientsExportToExcelTask'


const ADD_CONTACT_ROUTE = '/contact/create'
const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]

const { publicRuntimeConfig: { contactPageResidentAnalytics } } = getConfig()

type ContactBaseSearchQuery = { organization: { id: string } } | { organization: { 'id_in': Array<string> } }

type ContactPageContentProps = {
    baseSearchQuery: ContactBaseSearchQuery
    filterMeta: TableFiltersMeta<ContactWhereInput>[]
    tableColumns: TableColumn<GetContactsForTableQuery['contacts'][number]>[]
    tableRef: React.RefObject<TableRef | null>
    role?: Pick<OrganizationEmployeeRole, 'canManageContacts'>
    loading?: boolean
    searchHookResult: UseTableSearchOutputType
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
    getContactsWhere: (filterState: FilterState, globalFilter: string | undefined) => ContactWhereInput
    getContactsSortBy: (sortState: SortState) => SortContactsBy[]
    tableRef: RefObject<TableRef | null>
}
const DefaultActionBar: React.FC<DefaultActionBarProps> = ({ getContactsWhere, tableRef, getContactsSortBy }) => {
    const intl = useIntl()
    const CreateContact = intl.formatMessage({ id: 'AddContact' })

    const router = useRouter()
    const { user } = useAuth() as { user: { id: string } }
    const { breakpoints } = useLayoutContext()

    const { isVerifiedRef, handleImportModalClose, IsVerifiedCheckbox } = useContactImportIsVerifiedCheckbox()
    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions({ isVerifiedRef })

    const { ExportButton } = useContactExportToExcelTask({
        where: getContactsWhere(tableRef.current?.api?.getFilterState(), tableRef.current?.api?.getGlobalFilter()),
        sortBy: getContactsSortBy(tableRef.current?.api?.getSorting()),
        format: ContactExportTaskFormatType.Excel,
        user,
        timeZone: intl.formatters.getDateTimeFormat().resolvedOptions().timeZone,
        locale: intl.locale,
    })

    const handleOnFinish = useCallback(() => {
        if (tableRef.current) {
            tableRef.current.api.refetchData()
        }
    }, [tableRef])

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
                            onFinish={handleOnFinish}
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
    tableRef: RefObject<TableRef | null>
    selectedRowsCount: number
}
const ActionBarWithSelectedItems: React.FC<ActionBarWithSelectedItemsProps> = ({ tableRef, selectedRowsCount }) => {
    const intl = useIntl()
    const CancelSelectionMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const ConfirmDeleteManyContactsTitle = intl.formatMessage({ id: 'contact.ConfirmDeleteManyTitle' })
    const ConfirmDeleteManyContactsMessage = intl.formatMessage({ id: 'contact.ConfirmDeleteMessage' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })
    const DoneMsg = intl.formatMessage({ id: 'OperationCompleted' })
    const VerifyMessage = intl.formatMessage({ id: 'contact.Verify' })

    const SelectedItemsMessage = useMemo(() => intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedRowsCount }), [intl, selectedRowsCount])

    const [updateContactsMutation] = useUpdateContactsMutation({
        onCompleted: async () => {
        },
    })

    const updateSelectedContactsByChunks = useCallback(async (payload) => {
        if (!selectedRowsCount || !tableRef.current?.api) return

        const itemsToDeleteByChunks = chunk(tableRef.current.api.getRowSelection().map((key) => ({
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

        tableRef.current.api.resetRowSelection()
        await tableRef.current.api.refetchData()
    }, [selectedRowsCount, tableRef, updateContactsMutation])

    const handleDeleteButtonClick = useCallback(async () => {
        const now = new Date().toISOString()
        await updateSelectedContactsByChunks({ deletedAt: now })
        tableRef.current?.api?.setPagination({ startRow: 0, endRow: CONTACT_PAGE_SIZE })
    }, [tableRef, updateSelectedContactsByChunks])

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
            onClick={() => tableRef.current?.api?.resetRowSelection()}
        >
            {CancelSelectionMessage}
        </Button>,
    ], [
        ConfirmDeleteManyContactsTitle, ConfirmDeleteManyContactsMessage, DeleteMessage, handleDeleteButtonClick,
        DontDeleteMessage, handleVerifyButtonClick, tableRef, CancelSelectionMessage, VerifyMessage,
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

const allOrganizationScope = [{
    property: null,
    unitName: null,
    unitType: null,
}]

const ResidentAnalyticsContent: React.FC = () => {

    const intl = useIntl()
    const MoreDetails = intl.formatMessage({ id: 'InMoreDetail' })

    const { organization } = useOrganization()
    const { user } = useAuth()

    const organizationId = useMemo(() => organization?.id || null, [organization])

    const { persistor } = useCachePersistor()

    const { useFlag } = useFeatureFlags()
    const isAnalyticsResidentInContactPageEnabled = useFlag(ANALYTICS_RESIDENT_IN_CONTACT_PAGE)

    const residentAnalyticsData = useMemo(() => contactPageResidentAnalytics?.[intl?.locale], [intl])
    const residentAnalyticsLinks = useMemo(() => residentAnalyticsData?.links ?? {}, [residentAnalyticsData])
    const residentAnalyticsTexts = useMemo(() => residentAnalyticsData?.texts ?? {}, [residentAnalyticsData])

    const { data: propertyInOrganizationCount } = useGetAllPropertyCountByOrganizationIdQuery({
        variables: {
            organizationId: organizationId,
        },
        skip: !isAnalyticsResidentInContactPageEnabled || !persistor || !organizationId || !residentAnalyticsData,
    })
    const propertyCount = useMemo(() => propertyInOrganizationCount?._allPropertiesMeta?.count, [propertyInOrganizationCount])

    const { data: propertyWithoutMapInOrganizationCount } = useGetAllPropertyWithoutMapCountByOrganizationIdQuery({
        variables: {
            organizationId: organizationId,
        },
        skip: !isAnalyticsResidentInContactPageEnabled || !persistor || !organizationId || !residentAnalyticsData,
    })
    const propertyWithoutMapCount = useMemo(() => propertyWithoutMapInOrganizationCount?._allPropertiesMeta?.count, [propertyWithoutMapInOrganizationCount])

    const { NewsItemRecipientsExportToXlsxButton } = useNewsItemRecipientsExportToExcelTask({
        organization,
        user,
        scopes: allOrganizationScope,
        icon: <Download size='medium' />,
    })

    const { data: counts } = useGetNewsItemsRecipientsCountersQuery({
        variables: {
            data: {
                dv: 1,
                sender: getClientSideSenderInfo(),
                organization: { id: organizationId },
                newsItemScopes: allOrganizationScope,
            },
        },
        skip: !isAnalyticsResidentInContactPageEnabled || !persistor || !organizationId || !allOrganizationScope || !residentAnalyticsData,
    })
    const residentCount = useMemo(() => counts?.result?.receiversCount, [counts])

    return (
        <Col span={24}>
            {
                isAnalyticsResidentInContactPageEnabled && counts && propertyWithoutMapInOrganizationCount && 
                    <Card width='100%'>
                        <Row justify='space-between'>
                            {
                                propertyWithoutMapCount === propertyCount ?
                                    <Typography.Text size='large'>
                                        {residentAnalyticsTexts?.seeAnalytics}{', '}
                                        <Typography.Link size='large' href={residentAnalyticsLinks?.properties} target='_blank'>
                                            {residentAnalyticsTexts?.createMap}
                                        </Typography.Link>
                                    </Typography.Text>
                                    :
                                    <Space align='center' size={16}>
                                        <Space align='center' size={8}>
                                            <Typography.Text size='large'>
                                                {residentAnalyticsTexts?.countUnits}{', '}
                                                <Typography.Text size='large' type='secondary'>
                                                    {residentAnalyticsTexts?.residentHasMobileApp}&nbsp;-&nbsp;
                                                </Typography.Text>
                                                {residentCount}
                                            </Typography.Text>
                                            <Tooltip title={<Typography.Text size='small'>{residentAnalyticsTexts?.calculateUnitsWhereIsResident}{' '}
                                                <Typography.Link size='small' href={residentAnalyticsLinks?.moreDetails} target='_blank'>
                                                    {MoreDetails}
                                                </Typography.Link>
                                            </Typography.Text>}>
                                                <Space size={8}>
                                                    <AlertCircle size='small' color={colors.gray[7]}/>
                                                </Space>
                                            </Tooltip>
                                        </Space>
                                        <NewsItemRecipientsExportToXlsxButton/>
                                    </Space>
                            }
                            <Typography.Link size='large' href={residentAnalyticsLinks?.tourGuide} target='_blank'>{residentAnalyticsTexts?.guideForIntroduceMobileApp}</Typography.Link>
                        </Row>
                    </Card>
            }
        </Col>
    )
}

const ContactTableContent: React.FC<ContactPageContentProps> = ({
    baseSearchQuery,
    filterMeta,
    role,
    tableRef,
    tableColumns,
    searchHookResult,
}) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })

    const router = useRouter()
    const [selectedRowsCount, setSelectedRowsCount] = useState(0)
    const [search, handleSearchChange, setSearch] = searchHookResult
    
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMeta, null)
    const canManageContacts = role?.canManageContacts ?? false

    const [fetchContacts] = useGetContactsForTableLazyQuery()
    const initialTableState = useMemo(() => defaultParseUrlQuery(router.query, CONTACT_PAGE_SIZE), [router.query])
    const updateUrlQuery = useCallback((params: FullTableState) => defaultUpdateUrlQuery(router, params), [router])

    useEffect(() => {
        const handleRouteChangeComplete = (url: string, { shallow }: { shallow: boolean }) => {
            const query = url.split('?')[1]
            // NOTE: We need to reset table state only if we full routing to the page without query, not just a shallow change
            if (!query && !shallow && tableRef.current) {
                tableRef.current.api?.setFullTableState({
                    filterState: {},
                    sortState: [],
                    startRow: 0,
                    endRow: CONTACT_PAGE_SIZE,
                    globalFilter: '',
                    rowSelectionState: [],
                })
                handleSearchChange('')
                setSelectedRowsCount(0)
            }
        }
        
        router.events.on('routeChangeComplete', handleRouteChangeComplete)
        
        return () => {
            router.events.off('routeChangeComplete', handleRouteChangeComplete)
        }
    }, [router.events, tableRef, handleSearchChange])

    useEffect(() => {
        if (tableRef.current) {
            tableRef.current.api?.refetchData()
        }
    }, [baseSearchQuery, tableRef])

    const getContactsWhere = useCallback((filterState: FilterState, globalFilter: string | undefined) => {
        const hasFilters = filterState && Object.keys(filterState).length > 0
        const hasGlobalFilter = globalFilter && globalFilter.trim() !== ''

        if (!hasFilters && !hasGlobalFilter) {
            return baseSearchQuery
        }

        const queryFilters = { ...filterState }
        if (hasGlobalFilter) {
            queryFilters.search = globalFilter
        }

        return {
            ...baseSearchQuery,
            ...filtersToWhere(queryFilters),
        }
    }, [baseSearchQuery, filtersToWhere])

    const getContactsSortBy = useCallback((sortState: SortState) => {
        if (!sortState) {
            return sortersToSortBy([]) as SortContactsBy[]
        }

        return sortersToSortBy(sortState) as SortContactsBy[]
    }, [sortersToSortBy])

    const dataSource: GetTableData<GetContactsForTableQuery['contacts'][number]> = useCallback(async ({ 
        filterState, 
        sortState, 
        startRow, 
        endRow, 
        globalFilter,
    }) => {
        const sortBy = getContactsSortBy(sortState)
        const where = {
            ...baseSearchQuery,
            ...filtersToWhere({ ...filterState, search: globalFilter }),
        }
        const skip = startRow
        const first = endRow - startRow

        const payload = {
            sortBy,
            where,
            first,
            skip,
        }

        const { data: { contacts, meta: { count } } } = await fetchContacts({
            variables: payload,
            fetchPolicy: 'network-only',
        })
        
        return { rowData: contacts?.filter(Boolean) ?? [], rowCount: count }
    }, [fetchContacts, filtersToWhere, baseSearchQuery, getContactsSortBy])

    const menuLabels = useTableTranslations()

    const handleRowAction = useCallback((record: GetContactsForTableQuery['contacts'][number]) => {
        router.push(`/contact/${record.id}`)
    }, [router])

    const rowSelectionOptions = useMemo(() => ({ 
        enableRowSelection: canManageContacts,
        onRowSelectionChange: (rowSelectionState: RowSelectionState) => {
            setSelectedRowsCount(Object.keys(rowSelectionState).length)
        },
    }), [canManageContacts])

    const getRowId = useCallback((row: GetContactsForTableQuery['contacts'][number]) => row.id, [])

    const onTableReady = useCallback((tableRef: TableRef) => {
        setSearch(String(tableRef.api.getGlobalFilter() || ''))
        setSelectedRowsCount(tableRef.api.getRowSelection().length)
    }, [setSearch])

    return (
        <Row gutter={ROW_VERTICAL_GUTTERS} align='middle' justify='start'>
            <ResidentAnalyticsContent />
            <Col span={24}>
                <TableFiltersContainer>
                    <Input
                        placeholder={SearchPlaceholder}
                        onChange={(e) => {
                            handleSearchChange(e.target.value)
                        }}
                        value={search}
                        allowClear
                    />
                </TableFiltersContainer>
            </Col>
            <Col span={24}>
                <Table<GetContactsForTableQuery['contacts'][number]>
                    id='contacts-table'
                    dataSource={dataSource}
                    columns={tableColumns}
                    onRowClick={handleRowAction}
                    pageSize={CONTACT_PAGE_SIZE}
                    onTableStateChange={updateUrlQuery}
                    initialTableState={initialTableState}
                    columnLabels={menuLabels}
                    rowSelectionOptions={rowSelectionOptions}
                    getRowId={getRowId}
                    onTableReady={onTableReady}
                    ref={tableRef}
                />
            </Col>
            {
                canManageContacts && (
                    selectedRowsCount > 0 ? (
                        <ActionBarWithSelectedItems
                            tableRef={tableRef}
                            selectedRowsCount={selectedRowsCount}
                        />
                    ) : (
                        <DefaultActionBar
                            getContactsWhere={getContactsWhere}
                            getContactsSortBy={getContactsSortBy}
                            tableRef={tableRef}
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
        data: contactExistenceData,
        loading: contactExistenceDataLoading,
        refetch: contactExistenceRefetch,
    } = useGetContactsExistenceQuery({
        variables: {
            where: {
                ...baseSearchQuery,
            },
        },
        skip: loading,
    })
    const contactExistenceCount = contactExistenceData?.count?.count || 0
    const canManageContacts = role?.canManageContacts

    const { isVerifiedRef, handleImportModalClose, IsVerifiedCheckbox } = useContactImportIsVerifiedCheckbox()
    const [columns, contactNormalizer, contactValidator, contactCreator] = useImporterFunctions({ isVerifiedRef })

    if (contactExistenceDataLoading || loading) return <Loader />

    if (contactExistenceCount === 0) {
        return (
            <EmptyListContent
                label={EmptyListLabel}
                accessCheck={canManageContacts}
                importLayoutProps={{
                    manualCreateEmoji: EMOJI.MAN,
                    manualCreateDescription: EmptyListManualBodyDescription,
                    importCreateEmoji: EMOJI.FAMILY,
                    importWrapper: {
                        onFinish: contactExistenceRefetch,
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

    return <ContactTableContent {...props}/>
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
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>}/>
                <TablePageContent>
                    <ContactsPageContent {...props}/>
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const ContactsPage: PageComponentType = () => {
    const filterMeta = useContactsTableFilters()
    const { organization, role, isLoading } = useOrganization()
    const userOrganizationId = useMemo(() => organization?.id, [organization?.id])

    const tableRef = useRef<TableRef | null>(null)
    const searchHookResult = useTableSearch(tableRef)
    const tableColumns = useTableColumns(filterMeta)

    const baseSearchQuery: ContactBaseSearchQuery = useMemo(() => ({
        organization: { id: userOrganizationId },
    }), [userOrganizationId])

    return (
        <ContactPageContentWrapper
            baseSearchQuery={baseSearchQuery}
            role={role}
            loading={isLoading}
            filterMeta={filterMeta}
            tableColumns={tableColumns}
            tableRef={tableRef}
            searchHookResult={searchHookResult}
        />
    )
}

ContactsPage.requiredAccess = ContactsReadPermissionRequired

export default ContactsPage
