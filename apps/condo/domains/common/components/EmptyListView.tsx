import styled from '@emotion/styled'
import { Empty, EmptyProps, Space, Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import isUndefined from 'lodash/isUndefined'
import { useRouter } from 'next/router'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { useLayoutContext } from './containers/BaseLayout'
import { EmptyIcon } from './EmptyIcon'
import { IImportWrapperProps, ImportWrapper } from './Import/Index'


export interface IEmptyListProps {
    label: string | React.ReactElement
    message?: string | React.ReactElement
    createRoute?: string
    createLabel?: string
    containerStyle?: CSSProperties
    accessCheck?: boolean
    image?: string
    withBorder?: boolean
    importLayoutProps?: {
        manualCreateEmoji: string
        manualCreateDescription: string
        importCreateEmoji: string
        importWrapper: Omit<IImportWrapperProps, 'importCardProps'>
    }
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

const DesktopEmptyListCardWrapper = styled.div`
  width: 250px;
  height: 300px;
  
  .condo-card {
    height: 100%;
    display: flex;
    flex-flow: column;
    
    .condo-card-head {
      height: 168px;
    }
    
    .condo-card-body {
      flex-grow: 1;
    }
  }
`

const MobileEmptyListCardWrapper = styled.div`
    width: 100%;
`

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
        createRoute,
        createLabel,
        containerStyle = {},
        accessCheck,
        image,
        withBorder = true,
        importLayoutProps,
    } = props

    const intl = useIntl()
    const EmptyListWithImportTitleMessage = intl.formatMessage({ id: 'emptyList.withImport.title' })
    const EmptyListWithImportManualCreateTitle = intl.formatMessage({ id: 'emptyList.withImport.manualCreate.title' })
    const EmptyListWithImportImportCreateTitle = intl.formatMessage({ id: 'emptyList.withImport.importCreate.title' })
    const EmptyListWithImportImportCreateDescription = intl.formatMessage({ id: 'emptyList.withImport.importCreate.description' })

    const router = useRouter()
    const { breakpoints } = useLayoutContext()
    const isLargeScreen = breakpoints.TABLET_LARGE

    const desktopContainerStyle = withBorder ?
        { ...DEFAULT_CONTAINER_STYLE, ...containerStyle, border: `1px solid ${colors.gray[3]}`, borderRadius: '8px', padding: '40px' } :
        { ...DEFAULT_CONTAINER_STYLE, containerStyle }

    const containerStyles = isLargeScreen ? desktopContainerStyle : { width: '100%' }

    if (accessCheck && importLayoutProps) {
        const {
            importWrapper,
            manualCreateEmoji,
            manualCreateDescription,
            importCreateEmoji,
        } = importLayoutProps

        const CardWrapper = isLargeScreen ? DesktopEmptyListCardWrapper : MobileEmptyListCardWrapper
        const spaceStyles = !isLargeScreen ? { width: '100%' } : {}
        const domainName = get(importWrapper, 'domainName')
        const objsMessage = intl.formatMessage({ id: `import.${domainName}.plural` }).toLowerCase()

        return (
            <div style={containerStyles}>
                <Space size={isLargeScreen ? 40 : 16} direction='vertical' style={spaceStyles}>
                    <div style={isLargeScreen ? { textAlign: 'center' } : {}}>
                        <Typography.Text size='small' type='secondary'>
                            {EmptyListWithImportTitleMessage.replace('{objs}', objsMessage)}
                        </Typography.Text>
                    </div>
                    <Space size={8} direction={isLargeScreen ? 'horizontal' : 'vertical'} style={spaceStyles}>
                        <CardWrapper>
                            <Card.CardButton
                                header={{
                                    emoji: [{ symbol: '✍️' }, { symbol: manualCreateEmoji }],
                                    headingTitle: EmptyListWithImportManualCreateTitle.replace('{objs}', objsMessage),
                                }}
                                body={{
                                    description: manualCreateDescription,
                                }}
                                onClick={() => router.push(createRoute)}
                            />
                        </CardWrapper>
                        <CardWrapper>
                            <ImportWrapper
                                {...importWrapper}
                                importCardButton={{
                                    header: {
                                        emoji: [{ symbol: '🤖' }, { symbol: importCreateEmoji }],
                                        headingTitle: EmptyListWithImportImportCreateTitle.replace('{objs}', objsMessage),
                                    },
                                    body: {
                                        description: EmptyListWithImportImportCreateDescription,
                                    },
                                }}
                            />
                        </CardWrapper>
                    </Space>
                </Space>
            </div>
        )
    }

    return (
        <BasicEmptyListView
            image={image ? image : 'dino/searching@2x.png'}
            spaceSize={16}
            imageStyle={{ height: 200 }}
            containerStyle={desktopContainerStyle}
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
