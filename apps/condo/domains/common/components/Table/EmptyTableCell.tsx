import React from 'react'

type EmptyTableCellProps = React.PropsWithChildren<{
    emptySymbol?: string
}>

export function EmptyTableCell ({ children, emptySymbol = '—' }: EmptyTableCellProps) { 
    return <>{children || emptySymbol}</>
}
