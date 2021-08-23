import React from 'react'
import isEmpty from 'lodash/isEmpty'
import { Highliter } from '../Highliter'
import { Typography } from 'antd'
import { colors } from '../../constants/style'
import { EmptyTableCell } from './EmptyTableCell'

export const getTextRender = (search: string) => {
    return function render (text: string): string | React.ReactNode {
        let result: string | React.ReactNode = text
        if (!isEmpty(search) && text) {
            result = (
                <Highliter
                    text={String(text)}
                    search={String(search)}
                    renderPart={(part) => (
                        <Typography.Text style={{ backgroundColor: colors.markColor }}>
                            {part}
                        </Typography.Text>
                    )}
                />
            )
        }
        return (<EmptyTableCell>{result}</EmptyTableCell>)
    }
}