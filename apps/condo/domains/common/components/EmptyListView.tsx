import { Empty, EmptyProps, Space, Typography, Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import isUndefined from 'lodash/isUndefined'
import { useRouter } from 'next/router'
import React, { CSSProperties } from 'react'

import { Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { EmptyIcon } from './EmptyIcon'

export interface IEmptyListProps {
    label: string | React.ReactElement
    message?: string | React.ReactElement
    button?: React.ReactElement
    createRoute?: string
    createLabel?: string
    containerStyle?: CSSProperties
    accessCheck?: boolean
    image?: string
    withBorder?: boolean
}

export interface IBasicEmptyListProps extends EmptyProps {
    image?: string
    children?: React.ReactNode
    containerStyle?: CSSProperties,
    imageStyle?: CSSProperties,
    spaceSize?: number,
}

const DEFAULT_CONTAINER_STYLE: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
}
const ROW_GUTTER: Gutter | [Gutter, Gutter] = [10, 10]
const ROW_STYLE = { marginTop: '16px' }

export const BasicEmptyListView: React.FC<IBasicEmptyListProps> = ({
    image,
    children,
    containerStyle,
    spaceSize,
    imageStyle,
    ...other
}) => {
    return (
        <div style={{ ...DEFAULT_CONTAINER_STYLE, ...containerStyle }}>
            <Empty
                style={{ maxWidth: '350px' }}
                image={image ? image : <EmptyIcon/>}
                imageStyle={{ height: '200px', ...imageStyle }}
                description={
                    <Space direction='vertical' size={spaceSize || 0}>
                        {children}
                    </Space>
                }
                {...other}
            />
        </div>
    )
}

export const EmptyListView: React.FC<IEmptyListProps> = (props) => {
    const {
        label,
        message,
        button,
        createRoute,
        createLabel,
        containerStyle = {},
        accessCheck,
        image,
        withBorder = true,
    } = props

    const router = useRouter()

    const containerStyles = withBorder ?
        { ...containerStyle, border: `1px solid ${colors.gray[3]}`, borderRadius: '8px', padding: '40px' } :
        containerStyle

    return (
        <BasicEmptyListView
            image={image ? image : 'dino/searching@2x.png'}
            spaceSize={16}
            imageStyle={{ height: 200 }}
            containerStyle={containerStyles}
        >
            <Typography.Title level={4}>
                {label}
            </Typography.Title>
            {
                (accessCheck || isUndefined(accessCheck)) &&
                <>
                    {message && (
                        <Typography.Text type='secondary'>
                            {message}
                        </Typography.Text>
                    )}
                    <Row gutter={ROW_GUTTER} align='middle' justify='center' style={ROW_STYLE}>
                        {
                            button ? (
                                <Col>
                                    {button}
                                </Col>
                            ) : ''
                        }
                        {
                            createRoute && (
                                <Col>
                                    <Button
                                        type='primary'
                                        onClick={() => router.push(createRoute)}
                                    >
                                        {createLabel}
                                    </Button>
                                </Col>
                            )
                        }
                    </Row>
                </>
            }
        </BasicEmptyListView>
    )
}

export default EmptyListView
