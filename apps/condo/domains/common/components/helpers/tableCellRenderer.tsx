import React from 'react'

import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'

import { colors, ELLIPSIS_ROWS } from '../../constants/style'

import { EmptyTableCell } from '../Table/EmptyTableCell'
import { getHighlited } from './highlited'

type GetRenderer = (search?: FilterValue, ellipsis?: boolean, postfix?: string) => (text?: string) => React.ReactElement

const ELLIPSIS_SETTINGS = { rows: ELLIPSIS_ROWS, expandable: false }
const ELLIPSIS_STYLES = { marginBottom: 0 }

const getTableCellRenderer: GetRenderer = (search, ellipsis = false, postfix = '') =>
    (text) => {
        const withHighlited = getHighlited(search, postfix)(text)

        return (
            <EmptyTableCell>
                {ellipsis
                    ? (
                        <Typography.Paragraph ellipsis={ELLIPSIS_SETTINGS} title={`${text} ${postfix || ''}`} style={ELLIPSIS_STYLES}>
                            {withHighlited}
                        </Typography.Paragraph>
                    )
                    : <>{withHighlited}</>
                }
            </EmptyTableCell>
        )
    }

export default getTableCellRenderer