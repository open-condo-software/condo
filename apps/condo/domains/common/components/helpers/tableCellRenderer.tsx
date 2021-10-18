import React from 'react'

import { isEmpty } from 'lodash'
import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'

import { colors, ELLIPSIS_ROWS } from '../../constants/style'

import { Highliter } from '../Highliter'
import { EmptyTableCell } from '../Table/EmptyTableCell'

type GetRenderer = (search?: FilterValue, ellipsis?: boolean, postfix?: string) => (text?: string) => React.ReactElement

const getTableCellRenderer: GetRenderer = (search, ellipsis = false, postfix = '') =>
    (text) => {
        let result
        if (!isEmpty(search) && text) {
            result = (
                <>
                    <Highliter
                        text={String(text)}
                        search={String(search)}
                        renderPart={(part) => (
                            <Typography.Text style={{ backgroundColor: colors.markColor }}>{part}</Typography.Text>
                        )}
                    />
                    {postfix && ` ${postfix}`}
                </>
            )
        } else {
            result = postfix ? `${text} ${postfix}` : text
        }

        return (
            <EmptyTableCell>
                {ellipsis
                    ? (
                        <Typography.Paragraph ellipsis={{ rows: ELLIPSIS_ROWS, expandable: false }} title={text + (postfix && ` ${postfix}`)} style={{ marginBottom: 0 }}>
                            {result}
                        </Typography.Paragraph>
                    )
                    : <>{result}</>
                }
            </EmptyTableCell>
        )
    }

export default getTableCellRenderer