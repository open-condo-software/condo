import React from 'react'

interface IEmptyTableCellProps {
    emptySymbol?: string
}

export const EmptyTableCell: React.FC<React.PropsWithChildren<IEmptyTableCellProps>> = ({ children, emptySymbol = '—' }) => (
    <>{children || emptySymbol}</>
)

