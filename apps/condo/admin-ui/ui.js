/** @jsx jsx */
/* eslint-disable no-use-before-define */

import { alpha } from '@arch-ui/color-utils'
import { uniformHeight } from '@arch-ui/common'
import { colors, gridSize } from '@arch-ui/theme'
import { jsx, keyframes } from '@emotion/core'
import { useCallback, useState, useEffect } from 'react'

export const Table = props => (
    <table
        css={{
            borderCollapse: 'collapse',
            borderSpacing: 0,
            tableLayout: 'fixed',
            width: '100%',
        }}
        {...props}
    />
)

export const TableRow = ({ isSelected, ...props }) => (
    <tr
        css={{
            '> td': {
                backgroundColor: isSelected ? colors.B.L95 : null,
                boxShadow: isSelected
                    ? `0 1px 0 ${colors.B.L85}, 0 -1px 0 ${colors.B.L85}`
                    : `0 -1px 0 ${colors.N10}`,
            },
        }}
        {...props}
    />
)

export const BodyCell = ({ status, ...props }) => (
    <td
        css={{
            ...status ? { color: status !== 'ERROR' ? 'rgb(82, 196, 26)' : '#ff4d4f' } : {},
            boxSizing: 'border-box',
            padding: `${gridSize + 2}px ${gridSize}px`,
            position: 'relative',
            border: '1px solid #CFCFCF',
        }}
        {...props}
    />
)

export const BodyCellTruncated = props => (
    <BodyCell
        css={{
            maxWidth: '10rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            wordWrap: 'normal',
        }}
        {...props}
    />
)

export const BodyCellHeader = ({ isWorking, ...props }) => (
    <BodyCell
        css={{
            color: isWorking ? 'rgb(82, 196, 26)' : '#ff4d4f',
            wordWrap: 'normal',
        }}
        {...props}
    />
)

export const HeaderCell = props => (
    <th
        style={{
            backgroundColor: 'white',
            boxShadow: `0 2px 0 ${alpha(colors.text, 0.1)}`,
            boxSizing: 'border-box',
            color: colors.N40,
            cursor: 'auto',
            display: 'table-cell',
            fontWeight: 'normal',
            padding: gridSize,
            position: 'sticky',
            top: 0,
            transition: 'background-color 100ms',
            zIndex: 1,
            textAlign: 'left',
            verticalAlign: 'bottom',
            fontSize: '1.1rem',
            ':hover': {
                color: null,
            },
        }}
        {...props}
    />
)

const slideOpen = keyframes`
  from {
    width: 42px;
  }
  to {
    width: 160px;
  }
`


export const Input = (props) => {
    const { value: initialValue, onChange, ...attrs } = props
    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])
    const [value, setValue] = useState(initialValue)
    const updateValue = useCallback(event => {
        setValue(event.target.value)
        onChange(event.target.value)
    }, [setValue, onChange])
    return (
        <input
            style={{
                ...uniformHeight,
                animation: `${slideOpen} 180ms cubic-bezier(0.2, 0, 0, 1)`,
                background: colors.N0,
                border: '1px solid #CFCFCF',
                ':focus': {
                    background: colors.N0,
                    outline: 0,
                },
            }}
            value={value}
            onChange={updateValue}
            {...attrs}
        />)
}