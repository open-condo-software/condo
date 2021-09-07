import React from 'react'

interface IEmptyTableCellProps {
    emptySymbol?: string
}

export const EmptyTableCell: React.FC<IEmptyTableCellProps> = ({ children, emptySymbol = '—' }) => <>{children || emptySymbol}</>
