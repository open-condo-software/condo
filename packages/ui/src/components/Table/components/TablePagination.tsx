import { Table } from '@tanstack/react-table'
import Pagination from 'antd/lib/pagination'
import React from 'react'

type TablePaginationProps<TData> = Readonly<{
    table: Table<TData>
}>

// TODO: Now we scroll to top of window. Need to scroll to top of table
const scrollToTableTop = () => {
    window.scrollTo({ top: 0 })
}

export function TablePagination<TData> ({ table }: TablePaginationProps<TData>) {
    const {
        getPageCount,
        getState,
        setPageIndex,
    } = table

    const { pagination: { pageIndex, pageSize } } = getState()
    const totalPages = getPageCount()
    const totalCount = pageSize * totalPages
    const currentPage = pageIndex + 1
    const isDisabled = totalPages <= 1

    const handlePageChange = (newPage: number) => {
        const newPageIndex = newPage - 1

        if (newPageIndex === pageIndex) {
            return
        }

        scrollToTableTop()
        setPageIndex(newPageIndex)
    }

    return (
        <Pagination
            className='condo-table-pagination'
            prefixCls='condo'
            current={currentPage}
            total={totalCount}
            pageSize={pageSize}
            size='small'
            hideOnSinglePage
            showSizeChanger={false}
            disabled={isDisabled}
            onChange={handlePageChange}
        />
    )
}