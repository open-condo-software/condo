import { Table } from '@tanstack/react-table'
import React, { useMemo } from 'react'

import { ChevronLeft, ChevronRight } from '@open-condo/icons'

type PageJumpToken = 'prev5' | 'next5'
type PageItem = number | PageJumpToken
type PageItems = PageItem[]

const PAGINATION_CONSTANTS = {
    MAX_VISIBLE_PAGES: 7,
    PAGES_JUMP: 5,
    FIRST_PAGE: 1,
    PAGINATION_THRESHOLD: 4,
} as const

const scrollToTableTop = () => {
    window.scrollTo({ top: 0 })
}

const addRange = (pages: PageItems, start: number, end: number): void => {
    for (let i = start; i <= end; i++) {
        pages.push(i)
    }
}

const generateSimplePagination = (totalPages: number): PageItems => {
    return Array.from({ length: totalPages }, (_, i) => i + PAGINATION_CONSTANTS.FIRST_PAGE)
}

const generateComplexPagination = (currentPage: number, totalPages: number): PageItems => {
    const pages: PageItems = [PAGINATION_CONSTANTS.FIRST_PAGE]
    
    const isNearStart = currentPage <= PAGINATION_CONSTANTS.PAGINATION_THRESHOLD
    const isNearEnd = currentPage >= totalPages - 3
    
    if (isNearStart) {
        addRange(pages, 2, 5)
        pages.push('next5', totalPages)
    } else if (isNearEnd) {
        pages.push('prev5')
        addRange(pages, totalPages - 4, totalPages)
    } else {
        pages.push('prev5')
        addRange(pages, currentPage - 1, currentPage + 1)
        pages.push('next5', totalPages)
    }
    
    return pages
}

interface TablePaginationProps<TData> {
    table: Table<TData>
}

export function TablePagination<TData> ({ table }: TablePaginationProps<TData>) {
    const {
        getCanPreviousPage,
        getCanNextPage,
        getPageCount,
        getState,
        setPageIndex,
    } = table

    const { pagination } = getState()
    const { pageIndex } = pagination
    const totalPages = getPageCount()
    const currentPage = pageIndex + 1

    const canPreviousPage = getCanPreviousPage()
    const canNextPage = getCanNextPage()

    const handlePageChange = (newPageIndex: number) => {
        scrollToTableTop()
        setPageIndex(newPageIndex)
    }

    const pageNumbers = useMemo(() => {
        if (totalPages <= PAGINATION_CONSTANTS.MAX_VISIBLE_PAGES) {
            return generateSimplePagination(totalPages)
        }
        
        return generateComplexPagination(currentPage, totalPages)
    }, [currentPage, totalPages])
    
    const renderPageButton = (page: PageItem, index: number): JSX.Element => {
        let onClick: () => void
        let content: React.ReactNode
        let isActive = false
        
        if (page === 'prev5') {
            onClick = () => handlePageChange(Math.max(0, pageIndex - PAGINATION_CONSTANTS.PAGES_JUMP))
            content = '...'
        } else if (page === 'next5') {
            onClick = () => handlePageChange(Math.min(totalPages - 1, pageIndex + PAGINATION_CONSTANTS.PAGES_JUMP))
            content = '...'
        } else {
            onClick = () => handlePageChange(page as number - 1)
            content = page
            isActive = page === currentPage
        }
        
        return (
            <button
                key={index}
                className={`condo-table-pagination-btn ${isActive ? 'condo-table-pagination-btn-active' : ''}`}
                onClick={onClick}
                type='button'
            >
                {content}
            </button>
        )
    }

    return (
        <div className='condo-table-pagination'>  
            <div className='condo-table-pagination-center'>
                <button
                    className='condo-table-pagination-btn'
                    onClick={() => handlePageChange(pageIndex - 1)}
                    disabled={!canPreviousPage}
                    type='button'
                >
                    <ChevronLeft size='small' />
                </button>

                {pageNumbers.map(renderPageButton)}

                <button
                    className='condo-table-pagination-btn'
                    onClick={() => handlePageChange(pageIndex + 1)}
                    disabled={!canNextPage}
                    type='button'
                >
                    <ChevronRight size='small' />
                </button>
            </div>
        </div>
    )
}