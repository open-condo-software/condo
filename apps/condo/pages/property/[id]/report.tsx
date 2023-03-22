import { Row, Col, Tabs, Space } from 'antd'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Button, Checkbox } from '@open-condo/ui'

import { BankAccountVisibilitySelect } from '@condo/domains/banking/components/BankAccountVisibilitySelect'
import {
    BankCostItemProvider,
    PropertyReportTypes,
    useBankCostItemContext,
} from '@condo/domains/banking/components/BankCostItemContext'
import { SbbolImportModal } from '@condo/domains/banking/components/SbbolImportModal'
import { BANK_INTEGRATION_IDS } from '@condo/domains/banking/constants'
import useBankContractorAccountTable from '@condo/domains/banking/hooks/useBankContractorAccountTable'
import useBankTransactionsTable from '@condo/domains/banking/hooks/useBankTransactionsTable'
import { useCategoryModal } from '@condo/domains/banking/hooks/useCategoryModal'
import { useFileImport } from '@condo/domains/banking/hooks/useFileImport'
import { BankAccount, BankTransaction, BankIntegrationAccountContext } from '@condo/domains/banking/utils/clientSchema'
import ActionBar from '@condo/domains/common/components/ActionBar'
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
import { PROPERTY_REPORT_DELETE_ENTITIES, PROPERTY_BANK_ACCOUNT } from '@condo/domains/common/constants/featureflags'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Property } from '@condo/domains/property/utils/clientSchema'

import type {
    Property as PropertyType,
    BankAccount as BankAccountType,
    BankTransaction as BankTransactionType,
    BankContractorAccount as BankContractorAccountType,
    BankIntegrationAccountContext as BankIntegrationAccountContextType,
    MakeOptional,
} from '@app/condo/schema'
import type { RowProps } from 'antd'

const PROPERTY_REPORT_PAGE_ROW_GUTTER: RowProps['gutter'] = [24, 20]
const PROPERTY_REPORT_PAGE_ROW_TABLE_GUTTER: RowProps['gutter'] = [0, 40]
const EMPTY_ROW_STYLE: React.CSSProperties = { height: 'calc(100% - 90px)' }
const DATE_DISPLAY_FORMAT = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
}
const SBBOL_SYNC_CALLBACK_QUERY = 'sbbol-sync-callback'
const EMPTY_IMAGE_PATH = '/dino/searching@2x.png'
const PROCESSING_IMAGE_PATH = '/dino/processing@2x.png'
const BANK_INTEGRATION_CONTEXT_POLL_INTERVAL = 10000

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
    ({ bankAccount, propertyId }: Pick<BaseBankReportProps, 'bankAccount'> & { propertyId: string }): React.ReactElement
}

// This statuses will use only at MVP version of the app
enum IntegrationContextStatus {
    'InProgress' = 'inProgress',
    'Completed' = 'completed',
    'Failed' = 'failed',
}

/**
 * Collect total BankIntegrationAccountContext sync status from meta field
 * @deprecated
 */
function getIntegrationsSyncStatus (integrationContexts: Array<BankIntegrationAccountContextType>, status: IntegrationContextStatus) {
    return integrationContexts.some(context => get(context, 'meta.syncTransactionsTaskStatus') === status)
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
    const SyncSuccessTitle = intl.formatMessage({ id: 'pages.banking.report.syncSuccess.title' })

    const [isCompleted, setIsCompleted] = useState(false)
    const isProcessing = useRef(false)

    const { query, asPath, push } = useRouter()
    const { id } = query
    const { loading: fileImportLoading, Component: FileImportButton } = useFileImport({
        propertyId: id as string,
        organizationId,
        bankAccount,
    })

    // If current property already connected to the BankAccount -> query only it's context.
    // Otherwise -> query by current organization
    // Not null bankAccount prop means that current property already had a report without imported transactions
    const { objs: bankIntegrationContexts, loading, stopPolling } = BankIntegrationAccountContext.useObjects({
        where: get(bankAccount, 'integrationContext.id', false)
            ? { id: get(bankAccount, 'integrationContext.id') }
            : { organization: { id: organizationId } },
    }, { pollInterval: BANK_INTEGRATION_CONTEXT_POLL_INTERVAL })

    // Fetch transactions sync status. If it not equals to processing -> stop poll results
    useEffect(() => {
        if (fileImportLoading) {
            if (!isProcessing.current) {
                stopPolling()
                isProcessing.current = true
            }
        } else if (!loading) {
            isProcessing.current = getIntegrationsSyncStatus(bankIntegrationContexts, IntegrationContextStatus.InProgress)

            if (!isProcessing.current) {
                stopPolling()
                setIsCompleted(getIntegrationsSyncStatus(bankIntegrationContexts, IntegrationContextStatus.Completed))
            }
        }
    }, [bankIntegrationContexts, loading, stopPolling, SyncSuccessTitle, intl, id, fileImportLoading])

    const handleOpenSbbolModal = useCallback(async () => {
        await push(`${asPath}?${SBBOL_SYNC_CALLBACK_QUERY}`)
    }, [asPath, push])

    if (loading) {
        return <Loader fill size='large' />
    }

    const hasSuccessCallback = query.hasOwnProperty(SBBOL_SYNC_CALLBACK_QUERY)
    const hasSyncedData = isNull(bankAccount) && isCompleted
    const fileImportIntegration = get(bankAccount, ['integrationContext', 'integration', 'id']) === BANK_INTEGRATION_IDS['1CClientBankExchange']

    return (
        <BasicEmptyListView image={isProcessing.current ? PROCESSING_IMAGE_PATH : EMPTY_IMAGE_PATH} spaceSize={20}>
            <Typography.Title level={3}>
                {isProcessing.current ? ProcessingTitle : ImportBankAccountTitle}
            </Typography.Title>
            <Typography.Paragraph>
                {isProcessing.current ? ProcessingDescription : ImportBankAccountDescription}
            </Typography.Paragraph>
            {!isProcessing.current && (
                <>
                    {hasSyncedData
                        ? (
                            <DeprecatedButton
                                key='submit'
                                type='sberAction'
                                secondary
                                icon={<SberIconWithoutLabel/>}
                                onClick={handleOpenSbbolModal}
                                block
                                {...(!isNull(bankAccount) && { hidden: fileImportIntegration })}
                                disabled={fileImportLoading}
                            >
                                {ImportSBBOLTitle}
                            </DeprecatedButton>
                        )
                        : (
                            <DeprecatedButton
                                key='submit'
                                type='sberAction'
                                secondary
                                icon={<SberIconWithoutLabel/>}
                                href={`/api/sbbol/auth?redirectUrl=${asPath}?${SBBOL_SYNC_CALLBACK_QUERY}`}
                                block
                                {...(!isNull(bankAccount) && { hidden: fileImportIntegration })}
                                disabled={fileImportLoading}
                            >
                                {LoginBySBBOLTitle}
                            </DeprecatedButton>
                        )
                    }
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

const PropertyReport: IPropertyReport = ({ bankAccount, propertyId }) => {
    const intl = useIntl()
    const IncomeTitle = intl.formatMessage({ id: 'global.income' }, { isSingular: false })
    const WithdrawalTitle = intl.formatMessage({ id: 'global.withdrawal' }, { isSingular: false })
    const ContractorTitle = intl.formatMessage({ id: 'global.contractor' }, { isSingular: false })
    const SearchPlaceholderTitle = intl.formatMessage({ id: 'filters.FullSearch' })
    const CategoryCheckboxTitle = intl.formatMessage({ id: 'pages.banking.categoryNotSet' })
    const UploadFileTitle = intl.formatMessage({ id: 'pages.banking.uploadTransactionsFile' })
    const EditTitle = intl.formatMessage({ id: 'Edit' })
    const CancelSelectionTitle = intl.formatMessage({ id: 'pages.condo.ticket.index.CancelSelectedTicket' })
    const DeleteTitle = intl.formatMessage({ id: 'Delete' })

    // Local state
    const [tab, setTab] = useState<PropertyReportTypes>('income')
    const [categoryNotSet, setCategoryNotSet] = useState(false)

    // Hooks
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
    const handleTabChange = useCallback((tab: PropertyReportTypes) => {
        handleClearSelection()
        setTab(tab)
    }, [handleClearSelection])
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
                            <Col span={6}>
                                <Input
                                    placeholder={SearchPlaceholderTitle}
                                    value={search}
                                    onChange={handleSearchChange}
                                />
                            </Col>
                            {tab !== 'contractor' && (
                                <Col span={6}>
                                    <DateRangePicker
                                        value={dateRange}
                                        onChange={setDateRange}
                                    />
                                </Col>
                            )}
                            <Col>
                                <Checkbox
                                    label={CategoryCheckboxTitle}
                                    checked={categoryNotSet}
                                    onChange={handleCategoryFilterChange}
                                />
                            </Col>
                        </Row>
                    </TableFiltersContainer>
                </Col>
                <Col span={24}>
                    {tabContent}
                    <CategoryModal />
                </Col>
            </Row>
            <ActionBar hidden={!totalSelectedItems && !fileImportIntegration}>
                <Space size={12}>
                    {
                        totalSelectedItems
                            ? (
                                <>
                                    <Typography.Title level={5}>{itemsSelectedTitle}</Typography.Title>
                                    <Button
                                        type='primary'
                                        onClick={handleEditSelectedRows}
                                    >
                                        {EditTitle}
                                    </Button>
                                    {reportDeleteEntities && (
                                        <DeleteButtonWithConfirmModal
                                            title={deleteModalTitle}
                                            message={deleteModalDescription}
                                            okButtonLabel={DeleteTitle}
                                            buttonContent={DeleteTitle}
                                            action={handleDeleteSelected}
                                            showCancelButton
                                        />
                                    )}
                                    <Button
                                        type='secondary'
                                        onClick={handleClearSelection}
                                    >
                                        {CancelSelectionTitle}
                                    </Button>
                                </>
                            )
                            : (
                                <FileImportButton
                                    hidden={!fileImportIntegration}
                                    type='primary'
                                >
                                    {UploadFileTitle}
                                </FileImportButton>
                            )
                    }

                </Space>
            </ActionBar>
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

    const isBankAccountLoading = loading || isCountLoading

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
                                                        { updatedAt: intl.formatDate(get(bankAccount, 'meta.amountAt', bankAccount.updatedAt), DATE_DISPLAY_FORMAT) }
                                                    )
                                                }
                                            </Typography.Paragraph>
                                        </>
                                    )}
                                </Col>
                                {hasBankAccount && (
                                    <Col>
                                        <BankAccountVisibilitySelect bankAccount={bankAccount} />
                                    </Col>
                                )}
                            </Row>
                        </Col>
                    </Row>
                </Col>
                {hasBankAccount && (
                    <Col span={24}>
                        <PropertyReport bankAccount={bankAccount} propertyId={property.id} />
                    </Col>
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

const PropertyReportPage = (): React.ReactElement => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.property.report.pageImportTitle' })
    const ServerErrorTitle = intl.formatMessage({ id: 'ServerError' })

    const { query: { id }, push, asPath } = useRouter()

    const { useFlag } = useFeatureFlags()
    const reportPageEnabled = useFlag(PROPERTY_BANK_ACCOUNT)

    const { loading, obj: property, error } = Property.useObject(
        { where: { id: id as string } },
        { fetchPolicy: 'cache-first' }
    )

    useEffect(() => {
        if (!reportPageEnabled) {
            push(asPath.replace('report', ''))
        }
    }, [reportPageEnabled, push, asPath])

    if (error || loading) {
        return <LoadingOrErrorPage
            title={PageTitle}
            loading={loading}
            error={error ? ServerErrorTitle : null}
        />
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
