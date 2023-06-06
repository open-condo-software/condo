import { Col, ColProps } from 'antd'
import React from 'react'

import { Typography } from '@open-condo/ui'

import { colors } from '@condo/domains/common/constants/style'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'


const LINK_STYLE = { color: colors.black, textDecoration: 'underline', textDecorationColor: colors.lightGrey[5] }

export type FieldPairRowProps = {
    fieldTitle: string,
    fieldValue: string,
    href?: string,
    titleColProps?: ColProps,
    valueColProps?: ColProps,
}

export const FieldPairRow: React.FC<FieldPairRowProps> = (props) => {
    const {
        fieldTitle,
        fieldValue,
        href,
        titleColProps,
        valueColProps,
    } = props

    return (
        <>
            <Col {...titleColProps}>
                <Typography.Text type='secondary'>
                    {fieldTitle}
                </Typography.Text>
            </Col>
            <Col {...valueColProps}>
                {
                    href ? (
                        <Typography.Link href={href} style={LINK_STYLE}>
                            <NotDefinedField value={fieldValue}/>
                        </Typography.Link>
                    ) : <NotDefinedField value={fieldValue}/>
                }
            </Col>
        </>
    )
}
