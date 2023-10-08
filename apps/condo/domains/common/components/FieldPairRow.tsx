import { Col, ColProps } from 'antd'
import React from 'react'

import { Typography } from '@open-condo/ui'

import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'


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
                        <Typography.Link href={href} size='large'>
                            {fieldValue}
                        </Typography.Link>
                    ) : <NotDefinedField value={fieldValue}/>
                }
            </Col>
        </>
    )
}
