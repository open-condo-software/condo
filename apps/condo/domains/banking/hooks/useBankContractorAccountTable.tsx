import { SortBankContractorAccountsBy } from '@app/condo/schema'
import { Col, Row, Skeleton } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useMutation } from '@open-condo/next/apollo'

import { useBankCostItemContext } from '@condo/domains/banking/components/BankCostItemContext'
import CategoryProgress from '@condo/domains/banking/components/CategoryProgress'
import { BANKING_TABLE_PAGE_SIZE } from '@condo/domains/banking/constants'
import { BankContractorAccount as BankContractorAccountGQL } from '@condo/domains/banking/gql'
import { useTableColumns } from '@condo/domains/banking/hooks/useTableColumns'
import { useBankContractorAccountTableFilters } from '@condo/domains/banking/hooks/useTableFilters'
import { BankContractorAccount } from '@condo/domains/banking/utils/clientSchema'
import { Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { parseQuery, getPageIndexFromOffset } from '@condo/domains/common/utils/tables.utils'

import { BaseMutationArgs } from './useBankTransactionsTable'

import type {
    BankContractorAccount as BankContractorAccountType,
    MutationUpdateBankContractorAccountsArgs,
    BankAccount,
} from '@app/condo/schema'
import type { RowProps } from 'antd'
import type { TableRowSelection } from 'antd/lib/table/interface'

const TABLE_ROW_GUTTER: RowProps['gutter'] = [40, 40]

export type UpdateSelectedContractors = (args: BaseMutationArgs<MutationUpdateBankContractorAccountsArgs>) => Promise<unknown>

interface IUseBankContractorAccountTable {
    ({ bankAccount, categoryNotSet }: {
        categoryNotSet: boolean,
        bankAccount: BankAccount
    }): {
        Component: React.FC,
        loading: boolean,
        selectedRows: Array<BankContractorAccountType>,
        clearSelection: () => void,
        updateSelected: UpdateSelectedContractors
    }
}

const useBankContractorAccountTable: IUseBankContractorAccountTable = ({ categoryNotSet, bankAccount }) => {
    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const queryMeta = useBankContractorAccountTableFilters()
    const { filtersToWhere } = useQueryMappers(queryMeta, [])
    const pageIndex = getPageIndexFromOffset(offset, BANKING_TABLE_PAGE_SIZE)
    const nullCategoryFilter = categoryNotSet ? { costItem_is_null: true } : {}

    const { objs: bankContractorAccounts, loading, refetch, count: totalRows } = BankContractorAccount.useObjects({
        where: {
            organization: { id: bankAccount.organization.id },
            ...nullCategoryFilter,
            ...filtersToWhere(filters),
        },
        first: BANKING_TABLE_PAGE_SIZE,
        skip: (pageIndex - 1) * BANKING_TABLE_PAGE_SIZE,
        sortBy: [SortBankContractorAccountsBy.CreatedAtDesc],
    })
    const {
        count: emptyCostItemsCount,
        loading: emptyCostItemsLoading,
        refetch: refetchEmptyCostItems,
    } = BankContractorAccount.useCount({
        where: {
            organization: { id: bankAccount.organization.id },
            costItem_is_null: true,
        },
    }, { fetchPolicy: 'cache-first' })
    const [updateSelected, { loading: updateLoading }] = useMutation(BankContractorAccountGQL.UPDATE_OBJS_MUTATION, {
        onCompleted: () => {
            setSelectedRows([])
            refetch()
            refetchEmptyCostItems()
        },
    })
    const [, bankContractorAccountTableColumns] = useTableColumns()
    const { bankCostItems, loading: bankCostItemsLoading, setSelectedItem } = useBankCostItemContext()

    const [selectedRows, setSelectedRows] = useState<Array<BankContractorAccountType>>([])
    const progressLoading = loading || emptyCostItemsLoading
    const isLoading = loading || bankCostItemsLoading || updateLoading

    const handleSelectRow = useCallback((record, checked) => {
        const selectedKey = record.id
        if (checked) {
            setSelectedRows([...selectedRows, record])
        } else {
            setSelectedRows(selectedRows.filter(({ id }) => id !== selectedKey))
        }
    }, [selectedRows])
    const handleRowClick = useCallback((row) => {
        return {
            onClick: () => {
                setSelectedItem(row)
            },
        }
    }, [setSelectedItem])
    const handleSelectAll = useCallback((checked) => {
        if (checked) {
            setSelectedRows(bankContractorAccounts)
        } else {
            setSelectedRows([])
        }
    }, [bankContractorAccounts])
    const clearSelection = () => {
        setSelectedRows([])
    }

    const rowSelection: TableRowSelection<BankContractorAccountType> = useMemo(() => ({
        type: 'checkbox',
        onSelect: handleSelectRow,
        onSelectAll: handleSelectAll,
        selectedRowKeys: selectedRows.map(row => row.id),
    }), [handleSelectRow, handleSelectAll, selectedRows])
    const dataSource = useMemo(() => {
        return bankContractorAccounts.map(({ ...bankContractor }) => {
            const costItem = bankCostItems.find(costItem => costItem.id === get(bankContractor, 'costItem.id'))

            if (costItem) {
                bankContractor.costItem = costItem
            }

            return bankContractor
        })
    }, [bankContractorAccounts, bankCostItems])

    const Component = useMemo(() => {
        return () => (
            <Row gutter={TABLE_ROW_GUTTER}>
                {progressLoading
                    ? (
                        <Col span={24}>
                            <Skeleton paragraph={{ rows: 1 }} />
                        </Col>
                    )
                    : <CategoryProgress totalRows={totalRows} entity='contractor' emptyRows={emptyCostItemsCount} />
                }

                <Col span={24}>
                    <Table
                        loading={isLoading}
                        dataSource={dataSource}
                        columns={bankContractorAccountTableColumns}
                        rowSelection={rowSelection}
                        onRow={handleRowClick}
                        pageSize={BANKING_TABLE_PAGE_SIZE}
                        totalRows={totalRows}
                    />
                </Col>
            </Row>
        )
    }, [dataSource, rowSelection, isLoading, progressLoading, bankContractorAccountTableColumns,
        handleRowClick, totalRows, emptyCostItemsCount])

    return { Component, loading: isLoading, selectedRows, clearSelection, updateSelected }
}

export default useBankContractorAccountTable
