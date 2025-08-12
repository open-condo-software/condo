import styled from '@emotion/styled'
import { Col, Row, Space } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import isUndefined from 'lodash/isUndefined'
import { useRouter } from 'next/router'
import React, { CSSProperties, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { EMOJI } from '@condo/domains/common/constants/emoji'
import { Either } from '@condo/domains/common/types'

import { BasicEmptyListView, DEFAULT_CONTAINER_STYLE } from './EmptyListView'
import { IImportWrapperProps, ImportWrapper } from './Import/Index'
import { useLayoutContext } from './LayoutContext'


const ROW_GUTTER: Gutter | [Gutter, Gutter] = [10, 10]
const ROW_STYLE = { marginTop: '16px' }

type IBaseEmptyListProps = {
    label: string | React.ReactElement
    createRoute?: string
    containerStyle?: CSSProperties
    accessCheck?: boolean
    image?: string
}

type IEmptyListWithoutImportProps = IBaseEmptyListProps & {
    button?: React.ReactElement
    message?: string | React.ReactElement
    createLabel?: string
}

type TExternalImportWrapper = Pick<IImportWrapperProps, 'onFinish' | 'uploadButtonLabel' | 'importCardButton'>

type IEmptyListWithImportProps = IBaseEmptyListProps & {
    importLayoutProps?: {
        manualCreateEmoji: string
        manualCreateDescription: string
        importCreateEmoji: string
        importWrapper: IImportWrapperProps | TExternalImportWrapper
        OverrideImportWrapperFC?: React.FC<TExternalImportWrapper & Pick<IImportWrapperProps, 'accessCheck'>>
    }
}

type IEmptyListProps = Either<IEmptyListWithoutImportProps, IEmptyListWithImportProps>

const DesktopEmptyListCardWrapper = styled.div`
  max-width: 250px;
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

export const EmptyListContent: React.FC<IEmptyListProps> = (props) => {
    const {
        label,
        message,
        button,
        createRoute,
        createLabel,
        containerStyle = {},
        accessCheck,
        image,
        importLayoutProps,
    } = props

    const intl = useIntl()
    const EmptyListWithImportTitleMessage = intl.formatMessage({ id: 'emptyList.withImport.title' })
    const EmptyListWithImportManualCreateTitle = intl.formatMessage({ id: 'emptyList.withImport.manualCreate.title' })
    const EmptyListWithImportImportCreateTitle = intl.formatMessage({ id: 'emptyList.withImport.importCreate.title' })
    const EmptyListWithImportImportCreateDescription = intl.formatMessage({ id: 'emptyList.withImport.importCreate.description' })
    const AddMessage = intl.formatMessage({ id: 'Add' })

    const router = useRouter()
    const { breakpoints } = useLayoutContext()
    const isLargeScreen = breakpoints.TABLET_LARGE

    const desktopContainerStyle = useMemo(() => ({
        ...DEFAULT_CONTAINER_STYLE, ...containerStyle, border: `1px solid ${colors.gray[3]}`, borderRadius: '8px', padding: '40px',
    }), [containerStyle])

    const containerStyles = isLargeScreen ? desktopContainerStyle : { width: '100%' }

    if (accessCheck && importLayoutProps) {
        const {
            importWrapper,
            manualCreateEmoji,
            manualCreateDescription,
            importCreateEmoji,
            OverrideImportWrapperFC,
        } = importLayoutProps

        const CardWrapper = isLargeScreen ? DesktopEmptyListCardWrapper : MobileEmptyListCardWrapper
        const spaceStyles = !isLargeScreen ? { width: '100%' } : {}
        const domainName = get(importWrapper, 'domainName')
        const objsMessage = intl.formatMessage({ id: `import.${domainName}.plural` as FormatjsIntl.Message['ids'] }).toLowerCase()

        const ImportComponent = OverrideImportWrapperFC || ImportWrapper

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
                                    emoji: [{ symbol: EMOJI.WRITING_HAND }, { symbol: manualCreateEmoji }],
                                    headingTitle: EmptyListWithImportManualCreateTitle.replace('{objs}', objsMessage),
                                }}
                                body={{
                                    description: manualCreateDescription,
                                }}
                                onClick={() => router.push(createRoute)}
                            />
                        </CardWrapper>
                        <CardWrapper>
                            <ImportComponent
                                {...importWrapper}
                                accessCheck={accessCheck}
                                importCardButton={{
                                    header: {
                                        emoji: [{ symbol: EMOJI.ROBOT }, { symbol: importCreateEmoji }],
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
            image={image ? image : '/dino/searching@2x.png'}
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
                                        {createLabel || AddMessage}
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
