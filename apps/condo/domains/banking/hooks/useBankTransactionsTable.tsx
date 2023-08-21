import { SortBankTransactionsBy } from '@app/condo/schema'
import { Row, Col, Skeleton } from 'antd'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useMutation } from '@open-condo/next/apollo'

import { useBankCostItemContext } from '@condo/domains/banking/components/BankCostItemContext'
import CategoryProgress from '@condo/domains/banking/components/CategoryProgress'
import { BANKING_TABLE_PAGE_SIZE } from '@condo/domains/banking/constants'
import { BankTransaction as BankTransactionGQL } from '@condo/domains/banking/gql'
import { useTableColumns } from '@condo/domains/banking/hooks/useTableColumns'
import { useBankTransactionTableFilters } from '@condo/domains/banking/hooks/useTableFilters'
import { BankTransaction } from '@condo/domains/banking/utils/clientSchema'
import { Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { parseQuery, getPageIndexFromOffset } from '@condo/domains/common/utils/tables.utils'

import type {
    BankAccount,
    BankTransaction as BankTransactionType,
    MutationUpdateBankTransactionsArgs,
} from '@app/condo/schema'
import type { PropertyReportTypes } from '@condo/domains/banking/components/BankCostItemContext'
import type { RowProps } from 'antd'
import type { TableRowSelection } from 'antd/lib/table/interface'

const TABLE_ROW_GUTTER: RowProps['gutter'] = [40, 40]

export interface BaseMutationArgs<T> {
    variables: T
}

export type UpdateSelectedTransactions = (args: BaseMutationArgs<MutationUpdateBankTransactionsArgs>) => Promise<unknown>

interface IUseBankContractorAccountTable {
    ({ bankAccount, type, categoryNotSet }: {
        bankAccount: BankAccount,
        type: PropertyReportTypes,
        categoryNotSet: boolean
    }): {
        Component: React.FC,
        loading: boolean,
        selectedRows: Array<BankTransactionType>,
        clearSelection: () => void,
        updateSelected: UpdateSelectedTransactions
    }
}

const useBankTransactionsTable: IUseBankContractorAccountTable = (props) => {
    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const queryMeta = useBankTransactionTableFilters()
    const { filtersToWhere } = useQueryMappers(queryMeta, [])
    const { bankCostItems, loading: bankCostItemsLoading, setSelectedItem } = useBankCostItemContext()

    const { bankAccount, type, categoryNotSet } = props

    const nullCategoryFilter = categoryNotSet
        ? { AND: [{ costItem_is_null: true }, { contractorAccount: { costItem_is_null: true } }] }
        : {}
    const pageIndex = getPageIndexFromOffset(offset, BANKING_TABLE_PAGE_SIZE)

    const { objs: bankTransactions, loading, refetch, count: totalRows } = BankTransaction.useObjects({
        where: {
            account: { id: bankAccount.id },
            isOutcome: type === 'withdrawal',
            ...nullCategoryFilter,
            ...filtersToWhere(filters),
        },
        first: BANKING_TABLE_PAGE_SIZE,
        skip: (pageIndex - 1) * BANKING_TABLE_PAGE_SIZE,
        sortBy: [SortBankTransactionsBy.DateDesc],
    })
    const {
        count: emptyCostItemsCount,
        loading: emptyCostItemsLoading,
        refetch: refetchEmptyCostItems,
    } = BankTransaction.useCount({
        where: {
            account: { id: bankAccount.id },
            isOutcome: type === 'withdrawal',
            AND: [
                { contractorAccount: { costItem_is_null: true } },
                { costItem_is_null: true },
            ],
        },
    }, { fetchPolicy: 'cache-first' })
    const [updateSelected, { loading: updateLoading }] = useMutation(BankTransactionGQL.UPDATE_OBJS_MUTATION, {
        onCompleted: () => {
            setSelectedRows([])
            refetch()
            refetchEmptyCostItems()
        },
    })
    const [bankTransactionTableColumns] = useTableColumns(type)

    const [selectedRows, setSelectedRows] = useState([])

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
                type !== 'income' && setSelectedItem(row)
            },
        }
    }, [setSelectedItem, type])
    const handleSelectAll = useCallback((checked) => {
        if (checked) {
            setSelectedRows(bankTransactions)
        } else {
            setSelectedRows([])
        }
    }, [bankTransactions])
    const clearSelection = () => {
        setSelectedRows([])
    }

    const rowSelection: TableRowSelection<BankTransactionType> = useMemo(() => type !== 'income' ? ({
        type: 'checkbox',
        onSelect: handleSelectRow,
        onSelectAll: handleSelectAll,
        selectedRowKeys: selectedRows.map(row => row.id),
    }) : null, [handleSelectRow, handleSelectAll, selectedRows, type])
    const dataSource = useMemo(() => {
        return bankTransactions.map(({ ...transaction }) => {
            const costItem = bankCostItems.find(costItem => {
                if (isNull(transaction.costItem) && !isNull(transaction.contractorAccount)) {
                    return costItem.id === get(transaction, 'contractorAccount.costItem.id')
                }

                return costItem.id === get(transaction, 'costItem.id')
            })

            if (costItem) {
                transaction.costItem = costItem
            }

            return transaction
        })
    }, [bankCostItems, bankTransactions])
    const progressRow = useMemo(() => {
        if (type === 'income') return null

        if (loading || emptyCostItemsLoading) {
            return (
                <Col span={24}>
                    <Skeleton paragraph={{ rows: 1 }} />
                </Col>
            )
        }

        return <CategoryProgress totalRows={totalRows} entity={type} emptyRows={emptyCostItemsCount} />
    }, [type, loading, emptyCostItemsLoading, totalRows, emptyCostItemsCount])

    const isLoading = loading || bankCostItemsLoading || updateLoading

    const Component = useMemo(() => {
        return () => (
            <Row gutter={TABLE_ROW_GUTTER}>
                {progressRow}
                <Col span={24}>
                    <Table
                        loading={isLoading}
                        dataSource={dataSource}
                        columns={bankTransactionTableColumns}
                        rowSelection={rowSelection}
                        onRow={handleRowClick}
                        pageSize={BANKING_TABLE_PAGE_SIZE}
                        totalRows={totalRows}
                    />
                </Col>
            </Row>
        )
    }, [isLoading, dataSource, bankTransactionTableColumns, progressRow, handleRowClick, rowSelection, totalRows])

    return { Component, loading: isLoading, selectedRows, clearSelection, updateSelected }
}

export default useBankTransactionsTable
