import { Row, Col, Tabs } from 'antd'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState, useEffect } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Button, Checkbox, ActionBar } from '@open-condo/ui'

import { BankAccountReport } from '@condo/domains/banking/components/BankAccountReport'
import { BankAccountVisibilitySelect } from '@condo/domains/banking/components/BankAccountVisibilitySelect'
import {
    BankCostItemProvider,
    PropertyReportTypes,
    useBankCostItemContext,
} from '@condo/domains/banking/components/BankCostItemContext'
import { SbbolImportModal } from '@condo/domains/banking/components/SbbolImportModal'
import { BANK_INTEGRATION_IDS } from '@condo/domains/banking/constants'
import useBankContractorAccountTable from '@condo/domains/banking/hooks/useBankContractorAccountTable'
import { useBankReportTaskButton } from '@condo/domains/banking/hooks/useBankReportTaskUIInterface'
import { useBankSyncTaskExternalModal } from '@condo/domains/banking/hooks/useBankSyncTaskExternalModal'
import useBankTransactionsTable from '@condo/domains/banking/hooks/useBankTransactionsTable'
import { useCategoryModal } from '@condo/domains/banking/hooks/useCategoryModal'
import { useFileImport } from '@condo/domains/banking/hooks/useFileImport'
import {
    BankAccount,
    BankTransaction,
    BankAccountReport as BankAccountReportClient,
} from '@condo/domains/banking/utils/clientSchema'
import Input from '@condo/domains/common/components/antd/Input'
import { Button as DeprecatedButton } from '@condo/domains/common/components/Button'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { SberIconWithoutLabel } from '@condo/domains/common/components/icons/SberIcon'
import { Loader } from '@condo/domains/common/components/Loader'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useTasks } from '@condo/domains/common/components/tasks/TasksContextProvider'
import { PROPERTY_REPORT_DELETE_ENTITIES, PROPERTY_BANK_ACCOUNT } from '@condo/domains/common/constants/featureflags'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Property } from '@condo/domains/property/utils/clientSchema'

import type {
    Property as PropertyType,
    BankAccount as BankAccountType,
    BankTransaction as BankTransactionType,
    BankContractorAccount as BankContractorAccountType,
    MakeOptional,
    OrganizationEmployeeRole as OrganizationEmployeeRoleType,
} from '@app/condo/schema'
import type { RowProps } from 'antd'
import type { FormatDateOptions } from 'react-intl'


const PROPERTY_REPORT_PAGE_ROW_GUTTER: RowProps['gutter'] = [24, 20]
const PROPERTY_REPORT_PAGE_ROW_TABLE_GUTTER: RowProps['gutter'] = [0, 40]
const EMPTY_ROW_STYLE: React.CSSProperties = { height: 'calc(100% - 90px)' }
const DATE_RANGE_PICKER_STYLE: React.CSSProperties = { width: '100%' }
const DATE_DISPLAY_FORMAT: FormatDateOptions = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
}
const SBBOL_SYNC_CALLBACK_QUERY = 'sbbol-sync-callback'
const EMPTY_IMAGE_PATH = '/dino/searching@2x.png'
const PROCESSING_IMAGE_PATH = '/dino/processing@2x.png'

type BaseBankReportProps = {
    bankAccount: BankAccountType
    organizationId: string
}
type PropertyImportBankTransactionProps = MakeOptional<BaseBankReportProps, 'bankAccount'> & {
    refetchBankAccount: () => void
}
interface IPropertyReportPageContent {
    ({ property }: { property: PropertyType }): React.ReactElement
}
interface IPropertyImportBankTransactions {
    ({ bankAccount, organizationId, refetchBankAccount }: PropertyImportBankTransactionProps): React.ReactElement
}
interface IPropertyReport {
    ({ bankAccount, propertyId, role }: Pick<BaseBankReportProps, 'bankAccount'>
    & { propertyId: string, role?: Pick<OrganizationEmployeeRoleType, 'canManageBankAccountReportTasks' | 'canManageBankAccounts'> }
    ): React.ReactElement
}

const PropertyImportBankTransactions: IPropertyImportBankTransactions = ({ bankAccount, organizationId, refetchBankAccount }) => {
    const intl = useIntl()
    const ImportBankAccountTitle = intl.formatMessage({ id: 'pages.condo.property.report.importBankTransaction.title' })
    const ImportBankAccountDescription = intl.formatMessage({ id: 'pages.condo.property.report.importBankTransaction.description' })
    const ProcessingTitle = intl.formatMessage({ id: 'pages.condo.property.report.importBankTransaction.processing.title' })
    const ProcessingDescription = intl.formatMessage({ id: 'pages.condo.property.report.importBankTransaction.processing.description' })
    const LoginBySBBOLTitle = intl.formatMessage({ id: 'LoginBySBBOL' })
    const ImportSBBOLTitle = intl.formatMessage({ id: 'pages.condo.property.report.importBankTransaction.importSbbolTitle' })
    const ImportFileTitle = intl.formatMessage({ id: 'pages.condo.property.report.importBankTransaction.importFileTitle' })

    const { query, asPath, push } = useRouter()
    const { id } = query
    const { loading: fileImportLoading, Component: FileImportButton } = useFileImport({
        propertyId: id as string,
        organizationId,
        bankAccount,
    })
    const {
        handleOpen: handleOpenTransactionsModal,
        ModalComponent: ImportTransactionsModal,
    } = useBankSyncTaskExternalModal({ bankAccount, propertyId: get(bankAccount, 'property.id') })
    const { tasks, isInitialLoading: isTasksInitialLoading } = useTasks()

    const bankSyncTasks = useMemo(() => tasks.filter((task) => task.record.__typename === 'BankSyncTask'), [tasks])

    const isProcessing = (bankSyncTasks.length > 0 && !isTasksInitialLoading) || fileImportLoading

    const handleOpenSbbolModal = useCallback(async () => {
        await push(`${asPath}?${SBBOL_SYNC_CALLBACK_QUERY}`)
    }, [asPath, push])

    const externalImportButton = useMemo(() => {
        const fileImportIntegration = get(bankAccount, ['integrationContext', 'integration', 'id']) === BANK_INTEGRATION_IDS['1CClientBankExchange']
        const isBankAccountHasProperty = !!get(bankAccount, 'property.id', false)

        if (isProcessing || (!isNull(bankAccount) && fileImportIntegration)) return null

        if (isBankAccountHasProperty) {
            return (
                <>
                    <Button
                        key='submit'
                        id='sbbol-transactions-import-modal'
                        type='primary'
                        onClick={handleOpenTransactionsModal}
                    >
                        {ImportSBBOLTitle}
                    </Button>
                    {ImportTransactionsModal}
                </>
            )
        }

        return (
            <>
                {isNull(bankAccount) ? (
                    <DeprecatedButton
                        key='submit'
                        type='sberAction'
                        secondary
                        icon={<SberIconWithoutLabel/>}
                        href={`/api/sbbol/auth?useExtendedConfig=true&redirectUrl=${asPath}?${SBBOL_SYNC_CALLBACK_QUERY}`}
                        block
                        disabled={fileImportLoading}
                        className='sbbol-button'
                    >
                        {LoginBySBBOLTitle}
                    </DeprecatedButton>
                ) : (
                    <DeprecatedButton
                        key='submit'
                        type='sberAction'
                        secondary
                        icon={<SberIconWithoutLabel/>}
                        onClick={handleOpenSbbolModal}
                        block
                        disabled={fileImportLoading}
                        className='sbbol-button'
                    >
                        {ImportSBBOLTitle}
                    </DeprecatedButton>
                )
                }
            </>
        )
    }, [bankAccount, isProcessing, asPath, fileImportLoading, LoginBySBBOLTitle, handleOpenSbbolModal,
        ImportSBBOLTitle, handleOpenTransactionsModal, ImportTransactionsModal])

    if (isTasksInitialLoading) return <Loader fill size='large' />

    const hasSuccessCallback = query.hasOwnProperty(SBBOL_SYNC_CALLBACK_QUERY)
    const fileImportIntegration = get(bankAccount, ['integrationContext', 'integration', 'id']) === BANK_INTEGRATION_IDS['1CClientBankExchange']

    return (
        <BasicEmptyListView image={isProcessing ? PROCESSING_IMAGE_PATH : EMPTY_IMAGE_PATH} spaceSize={20}>
            <Typography.Title level={3}>
                {isProcessing ? ProcessingTitle : ImportBankAccountTitle}
            </Typography.Title>
            <Typography.Paragraph>
                {isProcessing ? ProcessingDescription : ImportBankAccountDescription}
            </Typography.Paragraph>
            {!isProcessing && (
                <>
                    {externalImportButton}
                    <FileImportButton type='secondary' {...(!isNull(bankAccount) && { hidden: !fileImportIntegration })}>
                        {ImportFileTitle}
                    </FileImportButton>
                </>
            )}
            {hasSuccessCallback && (
                <SbbolImportModal propertyId={id as string} onComplete={refetchBankAccount} />
            )}
        </BasicEmptyListView>
    )
}

const PropertyReport: IPropertyReport = ({ bankAccount, propertyId, role }) => {
    const intl = useIntl()
    const IncomeTitle = intl.formatMessage({ id: 'global.income' }, { isSingular: false })
    const WithdrawalTitle = intl.formatMessage({ id: 'global.withdrawal' }, { isSingular: false })
    const ContractorTitle = intl.formatMessage({ id: 'global.contractor' }, { isSingular: false })
    const SearchPlaceholderTitle = intl.formatMessage({ id: 'filters.FullSearch' })
    const CategoryCheckboxTitle = intl.formatMessage({ id: 'pages.banking.categoryNotSet' })
    const UploadFileTitle = intl.formatMessage({ id: 'pages.banking.uploadTransactionsFile' })
    const EditTitle = intl.formatMessage({ id: 'Edit' })
    const CancelSelectionTitle = intl.formatMessage({ id: 'global.cancelSelection' })
    const DeleteTitle = intl.formatMessage({ id: 'Delete' })
    const SyncSbbolTransactions = intl.formatMessage({ id: 'pages.banking.report.sbbolSyncTitle' })

    // Local state
    const [tab, setTab] = useState<PropertyReportTypes>('income')
    const [categoryNotSet, setCategoryNotSet] = useState(false)

    // Hooks
    const { user } = useAuth()
    const router = useRouter()
    const { selectedItem } = useBankCostItemContext()
    const {
        Component: BankTransactionsTable,
        selectedRows: selectedBankTransactions,
        clearSelection: clearBankTransactionSelection,
        updateSelected: updateBankTransactions,
    } = useBankTransactionsTable({ bankAccount, type: tab, categoryNotSet })
    const {
        Component: BankContractorAccountTable,
        selectedRows: selectedContractorAccounts,
        clearSelection: clearBankContractorSelection,
        updateSelected: updateBankContractors,
    } = useBankContractorAccountTable({ bankAccount, categoryNotSet })
    const [search, changeSearch] = useSearch<{ search?: string }>()
    const [dateRange, setDateRange] = useDateRangeSearch('date')
    const { CategoryModal, setOpen } = useCategoryModal({
        bankTransactions: selectedItem ? [selectedItem] as [BankTransactionType] : selectedBankTransactions,
        bankContractorAccounts: selectedItem ? [selectedItem] as [BankContractorAccountType] : selectedContractorAccounts,
        type: tab,
        updateSelected: tab === 'contractor' ? updateBankContractors : updateBankTransactions,
    })
    const { useFlag } = useFeatureFlags()
    const { Component: FileImportButton } = useFileImport({
        propertyId,
        bankAccount,
        organizationId: get(bankAccount, 'organization.id'),
    })
    const {
        handleOpen: handleOpenSbbolImportModal,
        ModalComponent: SbbolImportModal,
    } = useBankSyncTaskExternalModal({ propertyId, bankAccount })

    const { BankReportTaskButton } = useBankReportTaskButton({
        bankAccount, userId: user?.id || null, organizationId: bankAccount.organization.id, type: 'secondary',
    })

    // Handlers
    const handleSearchChange = useCallback((e) => {
        changeSearch(e.target.value)
    }, [changeSearch])
    const handleCategoryFilterChange = useCallback(() => {
        setCategoryNotSet(!categoryNotSet)
    }, [categoryNotSet])
    const handleClearSelection = useCallback(() => {
        if (selectedBankTransactions.length) {
            clearBankTransactionSelection()
        }
        if (selectedContractorAccounts.length) {
            clearBankContractorSelection()
        }
    }, [selectedContractorAccounts, selectedBankTransactions, clearBankTransactionSelection, clearBankContractorSelection])
    const handleTabChange = useCallback(async (tab: PropertyReportTypes) => {
        handleClearSelection()
        if (router.query.offset) {
            await router.push({
                pathname: router.pathname,
                query: { ...router.query, offset: 0 },
            }, undefined, { shallow: true })
        }
        setTab(tab)
    }, [handleClearSelection, router])
    const handleEditSelectedRows = useCallback(() => {
        setOpen(true)
    }, [setOpen])
    const handleDeleteSelected = useCallback(async () => {
        const bankListPayload = tab === 'contractor' ? selectedContractorAccounts : selectedBankTransactions

        if (bankListPayload.length) {
            const sender = getClientSideSenderInfo()
            const updateAction = tab === 'contractor' ? updateBankContractors : updateBankTransactions
            await updateAction({
                variables: {
                    data: bankListPayload.map(item => {
                        return {
                            id: item.id,
                            data: {
                                dv: 1,
                                sender,
                                deletedAt: new Date().toDateString(),
                            },
                        }
                    }),
                },
            })
        }
    }, [tab, selectedBankTransactions, updateBankTransactions, selectedContractorAccounts, updateBankContractors])

    // Local render variables
    const tabContent = useMemo(() => {
        switch (tab) {
            case 'income':
            case 'withdrawal':
                return <BankTransactionsTable />
            case 'contractor':
                return <BankContractorAccountTable />
        }
    }, [tab, BankContractorAccountTable, BankTransactionsTable])

    const totalSelectedItems = selectedBankTransactions.length || selectedContractorAccounts.length
    const deleteModalTitle = selectedBankTransactions.length
        ? intl.formatMessage({ id: 'pages.banking.removeModal.transaction.title' }, { count: selectedBankTransactions.length })
        : intl.formatMessage({ id: 'pages.banking.removeModal.contractor.title' }, { count: selectedContractorAccounts.length })
    const deleteModalDescription = selectedBankTransactions.length
        ? intl.formatMessage({ id: 'pages.banking.removeModal.transaction.description' }, { count: selectedBankTransactions.length })
        : intl.formatMessage({ id: 'pages.banking.removeModal.contractor.description' }, { count: selectedContractorAccounts.length })
    const itemsSelectedTitle = intl.formatMessage({ id: 'pages.banking.report.itemsSelected' }, { count: totalSelectedItems })
    const fileImportIntegration = get(bankAccount, ['integrationContext', 'integration', 'id']) === BANK_INTEGRATION_IDS['1CClientBankExchange']
    const reportDeleteEntities = useFlag(PROPERTY_REPORT_DELETE_ENTITIES)
    const canManageBankAccountReportTasks = get(role, 'canManageBankAccountReportTasks', false)
    const canManageBankAccounts = get(role, 'canManageBankAccounts', false)

    return (
        <>
            <Row gutter={PROPERTY_REPORT_PAGE_ROW_TABLE_GUTTER}>
                <Col span={24}>
                    <Tabs activeKey={tab} onChange={handleTabChange}>
                        <Tabs.TabPane tab={IncomeTitle} key='income' />
                        <Tabs.TabPane tab={WithdrawalTitle} key='withdrawal' />
                        <Tabs.TabPane tab={ContractorTitle} key='contractor' />
                    </Tabs>
                </Col>
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row gutter={PROPERTY_REPORT_PAGE_ROW_GUTTER} align='middle'>
                            <Col xl={8} md={12} sm={24} xs={24}>
                                <Input
                                    placeholder={SearchPlaceholderTitle}
                                    value={search}
                                    onChange={handleSearchChange}
                                    allowClear
                                    width='100%'
                                />
                            </Col>
                            {tab !== 'contractor' && (
                                <Col xl={8} md={12} sm={24} xs={24}>
                                    <DateRangePicker
                                        value={dateRange}
                                        onChange={setDateRange}
                                        style={DATE_RANGE_PICKER_STYLE}
                                    />
                                </Col>
                            )}
                            {tab !== 'income' && (
                                <Col>
                                    <Checkbox
                                        label={CategoryCheckboxTitle}
                                        checked={categoryNotSet}
                                        onChange={handleCategoryFilterChange}
                                    />
                                </Col>
                            )}
                        </Row>
                    </TableFiltersContainer>
                </Col>
                <Col span={24}>
                    {tabContent}
                    {CategoryModal}
                </Col>
                {!fileImportIntegration && SbbolImportModal}
            </Row>
            <ActionBar
                message={totalSelectedItems ? itemsSelectedTitle : null}
                actions={totalSelectedItems ? [
                    <Button
                        key='edit'
                        type='primary'
                        onClick={handleEditSelectedRows}
                    >
                        {EditTitle}
                    </Button>,
                    reportDeleteEntities && (
                        <DeleteButtonWithConfirmModal
                            key='delete'
                            title={deleteModalTitle}
                            message={deleteModalDescription}
                            okButtonLabel={DeleteTitle}
                            buttonContent={DeleteTitle}
                            action={handleDeleteSelected}
                            showCancelButton
                        />
                    ),
                    <Button
                        key='cancel'
                        type='secondary'
                        onClick={handleClearSelection}
                    >
                        {CancelSelectionTitle}
                    </Button>,
                ] : [
                    <FileImportButton
                        key='import'
                        hidden={!fileImportIntegration}
                        type='primary'
                    >
                        {UploadFileTitle}
                    </FileImportButton>,
                    (canManageBankAccounts && !fileImportIntegration) && (
                        <Button type='primary' key='import-sbbol' onClick={handleOpenSbbolImportModal}>
                            {SyncSbbolTransactions}
                        </Button>
                    ),
                    canManageBankAccountReportTasks && (
                        <BankReportTaskButton key='reportTask' />
                    ),
                ]}
            />
        </>
    )
}

const PropertyReportPageContent: IPropertyReportPageContent = ({ property }) => {
    const intl = useIntl()
    const PageImportTitle = intl.formatMessage({ id: 'pages.condo.property.report.pageImportTitle' })
    const PageReportTitle = intl.formatMessage({ id: 'pages.condo.property.report.pageReportTitle' })

    const { link } = useOrganization()
    const { loading, obj: bankAccount, refetch } = BankAccount.useObject({
        where: {
            property: { id: property.id },
            organization: { id: link.organization.id },
        },
    })
    const { count, loading: isCountLoading } = BankTransaction.useCount({
        where: { account: { id: get(bankAccount, 'id') } },
    })
    const {
        objs: bankAccountReports,
        loading: bankAccountReportsLoading,
        refetch: refetchBankAccountReports,
    } = BankAccountReportClient.useObjects({
        where: { account: { id: get(bankAccount, 'id') }, organization: { id: link.organization.id }, isLatest: true },
    })

    const isBankAccountLoading = loading || isCountLoading || (isNull(bankAccountReports) && bankAccountReportsLoading)

    const hasBankAccount = !isBankAccountLoading && !isNull(bankAccount) && count > 0

    if (isBankAccountLoading) {
        return (<Loader fill />)
    }

    return (
        <>
            <Row gutter={hasBankAccount ? [0, 40] : 0}>
                <Col span={24}>
                    <Row gutter={PROPERTY_REPORT_PAGE_ROW_GUTTER}>
                        <Col span={24}>
                            <Typography.Title>{hasBankAccount ? PageReportTitle : PageImportTitle}</Typography.Title>

                        </Col>
                        <Col span={24}>
                            <Row justify='space-between' gutter={PROPERTY_REPORT_PAGE_ROW_GUTTER}>
                                <Col>
                                    <Typography.Text>
                                        {property.address}
                                    </Typography.Text>
                                    {hasBankAccount && (
                                        <>
                                &nbsp;
                                            <Typography.Text type='secondary'>
                                                {intl.formatMessage(
                                                    { id: 'pages.condo.property.report.pageReportDescription' },
                                                    { bankAccountNumber: bankAccount.number }
                                                )}
                                            </Typography.Text>
                                            <Typography.Paragraph type='warning'>
                                                {
                                                    intl.formatMessage(
                                                        { id: 'pages.condo.property.report.dataUpdatedTitle' },
                                                        { updatedAt: intl.formatDate(get(bankAccount, 'integrationContext.meta.amountAt', bankAccount.updatedAt), DATE_DISPLAY_FORMAT) }
                                                    )
                                                }
                                            </Typography.Paragraph>
                                        </>
                                    )}
                                </Col>
                                {hasBankAccount && (
                                    <Col>
                                        <BankAccountVisibilitySelect bankAccountReports={bankAccountReports} refetch={refetchBankAccountReports} />
                                    </Col>
                                )}
                            </Row>
                        </Col>
                    </Row>
                </Col>
                {hasBankAccount && (
                    <>
                        <Col span={24}>
                            <BankAccountReport
                                bankAccountReports={bankAccountReports}
                                bankAccount={bankAccount}
                                role={get(link, 'role')}
                            />
                        </Col>
                        <Col span={24}>
                            <PropertyReport bankAccount={bankAccount} propertyId={property.id} role={get(link, 'role')} />
                        </Col>
                    </>
                )}
            </Row>
            {!hasBankAccount && (
                <Row align='middle' justify='center' style={EMPTY_ROW_STYLE}>
                    <Col span={24}>
                        <PropertyImportBankTransactions
                            bankAccount={bankAccount}
                            organizationId={link.organization.id}
                            refetchBankAccount={refetch}
                        />
                    </Col>
                </Row>
            )}
        </>
    )
}

const PropertyReportPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.property.report.pageImportTitle' })
    const ServerErrorTitle = intl.formatMessage({ id: 'ServerError' })
    const PropertyNotFoundTitle = intl.formatMessage({ id: 'pages.condo.property.id.NotFound.PageTitle' })
    const PropertyNotFoundMessage = intl.formatMessage({ id: 'pages.condo.property.id.NotFound.Message' })

    const { query: { id }, push, asPath } = useRouter()
    const { organization } = useOrganization()

    const { useFlag } = useFeatureFlags()
    const reportPageEnabled = useFlag(PROPERTY_BANK_ACCOUNT)

    const { loading, obj: property, error } = Property.useObject(
        { where: { id: id as string, organization: { id: organization.id } } },
        { fetchPolicy: 'cache-first' }
    )

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (!reportPageEnabled) {
                push(asPath.split('/report')[0])
            }
        }
    }, [reportPageEnabled, push, asPath])

    if (error || loading) {
        return (
            <LoadingOrErrorPage
                title={PageTitle}
                loading={loading}
                error={error ? ServerErrorTitle : null}
            />
        )
    }

    if (!property) {
        return (
            <LoadingOrErrorPage
                title={PropertyNotFoundTitle}
                loading={false}
                error={PropertyNotFoundMessage}
            />
        )
    }

    return (
        <>
            <Head><title>{PageTitle}</title></Head>
            <PageWrapper>
                <BankCostItemProvider>
                    <TablePageContent>
                        <PropertyReportPageContent property={property} />
                    </TablePageContent>
                </BankCostItemProvider>
            </PageWrapper>
        </>
    )
}

PropertyReportPage.requiredAccess = OrganizationRequired

export default PropertyReportPage
