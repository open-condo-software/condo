/** @jsx jsx */
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Row, Col, Image, Divider } from 'antd'
import keyBy from 'lodash/keyBy'
import truncate from 'lodash/truncate'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import { boolean } from 'zod'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Card, Space, RadioGroup, Radio } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { CrossIcon } from '@condo/domains/common/components/icons/CrossIcon'
import { DEFAULT_BORDER_RADIUS } from '@condo/domains/common/constants/style'

import type { NewsItem } from '@app/condo/schema'
import type { RowProps } from 'antd'

enum NewsPreviewTabTypes {
    Push = 'push-notification',
    App = 'app',
}

const DEFAULT_TAB = NewsPreviewTabTypes.App

// Main component (one for all previews) types:

type NewsPreview = ({
    appType: 'sharing' | 'Doma'
    newsItemData: NewsItemData
    app?: NewsItemAppPreviewSettings
    push?: NewsItemPushPreviewSettings
})

interface INewsPreview {
    (props: NewsPreview): React.ReactElement
}

type NewsItemData = ({
    title: string,
    body: string,
    validBefore: Pick<NewsItem, 'validBefore'>,
})

type NewsItemPushPreviewSettings = ({
    appName: string,
    appIcon: string
})

type NewsItemAppPreviewSettings = ({
    containerStyle: CSSProperties
})

// Generic app preview:

type NewsItemPreview = ({
    app: NewsItemAppPreviewSettings,
    newsItemData: NewsItemData
})

interface INewsItemAppPreview {
    (props: NewsItemPreview): React.ReactElement
}

// Generic push preview

type NewsItemPushPreview = ({
    push: NewsItemPushPreviewSettings,
    newsItemData: Omit<NewsItemData, 'validBefore'>
})

interface INewsItemPushPreview {
    (props: NewsItemPushPreview): React.ReactElement
}

// Doma types:

interface IDomaNewsItemPreview {
    (props: NewsItemData): React.ReactElement
}

interface IDomaNewsItemPushPreview {
    (props: Omit<NewsItemData, 'validBefore'>): React.ReactElement
}

// Common types:

const PUSH_ROW_GUTTER: RowProps['gutter'] = [0, 8]
const PUSH_ROW_CONTENT_GUTTER: RowProps['gutter'] = [0, 4]
const PUSH_DATETIME_TEXT_STYLE: React.CSSProperties = { textAlign: 'right' }
const APP_TOP_COLUMN_STYLE: React.CSSProperties = { textAlign: 'center', paddingTop: '12px' }
const APP_CLOSE_ICON_STYLE: React.CSSProperties = { position: 'absolute', right: '10px', top: '14px' }
const APP_CONTENT_STYLE: React.CSSProperties = { padding: '0 12px' }
const RADIO_GROUP_CONTAINER_STYLE: React.CSSProperties = { maxWidth: '360px' }
const PUSH_PARAGRAPH_ELLIPSIS_CONFIG = { rows: 2 }
const PREVIEW_CONTENT_WIDTH = 360
const STYLE_WIDTH_100P: React.CSSProperties = { width: '100%' }

const TITLE_MAX_LEN = 30
const BODY_MAX_LEN = 160

// TODO(DOMA-6153): rewrite to css-modules after migrating from custom style loader plugins
const NewsPreviewContainer = styled.div`
  width: 100%;
  max-width: 500px;
  max-height: 500px;
  background-color: ${colors.gray['1']};
  border-radius: ${DEFAULT_BORDER_RADIUS};
  padding: 40px 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const DomaAppPreviewContainer = styled.div`
  margin-top: 24px;
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: start;
  background-image: url("/phoneNewsPreview.png");
  justify-content: center;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top center;
  padding-top: 60px;
  padding-left: 22px;
  padding-right: 22px;
  min-height: 500px;
  max-width: ${PREVIEW_CONTENT_WIDTH}px;
  
  & .ant-divider {
    margin: 12px;
  }
`

const SharingAppPreviewContainer = styled.div`
  position: relative;
  
  margin-top: 24px;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: start;
  justify-content: center;
  
  background-color:';
  
  padding-left: 20px;
  padding-right: 20px;
  min-height: 500px;
  max-width: ${PREVIEW_CONTENT_WIDTH}px;
  
  & .ant-divider {
    margin: 12px;
  }
`

const SharingAppOverflowContainer = styled.div`
  position: absolute;
  top: 3px;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: start;
  background-image: url("/phoneSharingNewsPreviewUpd.png");
  justify-content: center;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top center;
  
  padding-left: 20px;
  padding-right: 20px;
  min-height: 500px;  
  max-width: ${PREVIEW_CONTENT_WIDTH}px;
  
  & .ant-divider {
    margin: 12px;
  }
`

const NewsPushPreviewContainer = styled.div`
  padding-top: 110px;
  padding-bottom: 190px;
`

const NewsPushPreview: INewsItemPushPreview = ({ push, newsItemData: { title, body } }) => {
    const intl = useIntl()
    const CompanyNameTitle =  push.appName
    const NowTitle = intl.formatMessage({ id: 'Now' })

    return (
        <NewsPushPreviewContainer>
            <Card bodyPadding={12} width={PREVIEW_CONTENT_WIDTH}>
                <Row gutter={PUSH_ROW_GUTTER}>
                    <Col span={12}>
                        <Space direction='horizontal' size={8}>
                            <img style={{ width: 16, height: 16 }} src={push.appIcon}  alt={`${push.appName} icon`}/>
                            <Typography.Text size='medium' type='secondary'>{CompanyNameTitle}</Typography.Text>
                        </Space>
                    </Col>
                    <Col span={12} style={PUSH_DATETIME_TEXT_STYLE}>
                        <Typography.Text size='medium' type='secondary'>{NowTitle.toLowerCase()}</Typography.Text>
                    </Col>
                    <Col span={24}>
                        <Row gutter={PUSH_ROW_CONTENT_GUTTER}>
                            <Col span={24}>
                                <Typography.Text size='medium' strong>{title}</Typography.Text>
                            </Col>
                            <Col span={24}>
                                <Typography.Paragraph ellipsis={PUSH_PARAGRAPH_ELLIPSIS_CONFIG} size='medium'>
                                    {body}
                                </Typography.Paragraph>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card>
        </NewsPushPreviewContainer>
    )
}

const DomaNewsPushPreview: IDomaNewsItemPushPreview = ({ title, body }) => {
    const intl = useIntl()
    const DomaAppNameTitle = intl.formatMessage({ id: 'pages.condo.news.preview.condoAppName' })

    return <NewsPushPreview push={{ appName: DomaAppNameTitle, appIcon: '/logoDomaApp.png' }} newsItemData={{ title, body }}/>
}

const LINE_BREAK_STYLE: CSSProperties = { whiteSpace: 'break-spaces' }

const NewsAppPreview: INewsItemAppPreview = ({ app, newsItemData: { title, body, validBefore } }) => {
    const intl = useIntl()
    const NotificationFromOrganizationTitle = intl.formatMessage({ id: 'pages.news.create.preview.app.notificationFromOrganization' })
    const ReceivedAtTitle = intl.formatMessage({ id: 'pages.news.create.preview.app.receivedAt' })
    const ValidUntilTitle = intl.formatMessage({ id: 'pages.news.create.preview.app.validUntil' }, { validBefore })

    // todo @toplenboren Make it same pictures! so that our client does not have to download a lot of stuff!
    return (
        <SharingAppPreviewContainer>
            <div style={{ paddingLeft: '20px', paddingTop: '15px', marginRight: '-1px' }}>
                { /* Store it where? TODO: @toplenboren  */ }
                <Row style={{ background: 'url("/greendomBackground.png") no-repeat top', backgroundSize: 'contain', backgroundColor: 'white', height: '800px', width: '100%', padding: '50px 10px' }}>
                    <div style={{
                        marginTop: '150px',

                        display: 'flex',
                        flexDirection: 'column',
                        padding: '15px 12px',
                        gap: '12px',

                        background: '#FFFFFF',
                        boxShadow: '0px 2px 6.66666px rgba(0, 0, 0, 0.078), inset 0px 8px 9.33334px rgba(79, 79, 108, 0.071)',
                        borderRadius: '12px',
                    }}>
                        <span style={{
                            fontFamily: '"Open Sans", "Wix Madefor Display", var(--condo-font-fallback)',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '16px',
                            lineHeight: '20px',
                            flex: 'none',
                            letterSpacing: '-0.24px',
                        }}>
                            {title}
                        </span>
                        <span style={{
                            fontFamily: '"Open Sans", "Wix Madefor Display", var(--condo-font-fallback)',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '12px',
                            lineHeight: '20px',
                            color: 'rgba(0, 0, 0, 0.55)',
                            letterSpacing: '-0.24px',
                            flex: 'none',
                        }}>
                            {body}
                        </span>
                        <span style={{
                            fontFamily: '"Open Sans", "Wix Madefor Display", var(--condo-font-fallback)',
                            fontStyle: 'normal',
                            fontWeight: 500,
                            fontSize: '12px',
                            lineHeight: '20px',
                            letterSpacing: '-0.24px',
                            flex: 'none',
                        }}>
                            {ReceivedAtTitle}
                        </span>
                        {/*<div style={LINE_BREAK_STYLE}>*/}
                        {/*    <Space direction='vertical' size={16}>*/}
                        {/*        <Space direction='vertical' size={8}>*/}
                        {/*            <Typography.Title level={2}>*/}
                        {/*                {title}*/}
                        {/*            </Typography.Title>*/}
                        {/*            <Typography.Text size='small' type='secondary'>*/}
                        {/*                {ReceivedAtTitle}*/}
                        {/*                {!!validBefore && (*/}
                        {/*                    <>*/}
                        {/*                        &nbsp;(<Typography.Text size='small' type='danger'>{ValidUntilTitle}</Typography.Text>)*/}
                        {/*                    </>*/}
                        {/*                )}*/}
                        {/*            </Typography.Text>*/}
                        {/*        </Space>*/}
                        {/*        <Typography.Paragraph>*/}
                        {/*            {body}*/}
                        {/*        </Typography.Paragraph>*/}
                        {/*    </Space>*/}
                        {/*</div>*/}
                    </div>
                </Row>
            </div>
            <SharingAppOverflowContainer/>
        </SharingAppPreviewContainer>
    )
}

const DomaNewsAppPreview: IDomaNewsItemPreview = ({ title, body, validBefore }) => {
    const intl = useIntl()
    const NotificationFromOrganizationTitle = intl.formatMessage({ id: 'pages.news.create.preview.app.notificationFromOrganization' })
    const ReceivedAtTitle = intl.formatMessage({ id: 'pages.news.create.preview.app.receivedAt' })
    const ValidUntilTitle = intl.formatMessage({ id: 'pages.news.create.preview.app.validUntil' }, { validBefore })

    return (
        <DomaAppPreviewContainer>
            <Row style={STYLE_WIDTH_100P}>
                <Col span={24} style={APP_TOP_COLUMN_STYLE}>
                    <Typography.Text size='small' type='secondary'>
                        {NotificationFromOrganizationTitle}
                    </Typography.Text>
                    <CrossIcon style={APP_CLOSE_ICON_STYLE} />
                    <Divider />
                </Col>
                <Col span={24} style={APP_CONTENT_STYLE}>
                    <div style={LINE_BREAK_STYLE}>
                        <Space direction='vertical' size={16}>
                            <Space direction='vertical' size={8}>
                                <Typography.Title level={2}>
                                    {title}
                                </Typography.Title>
                                <Typography.Text size='small' type='secondary'>
                                    {ReceivedAtTitle}
                                    {!!validBefore && (
                                        <>
                                            &nbsp;(<Typography.Text size='small' type='danger'>{ValidUntilTitle}</Typography.Text>)
                                        </>
                                    )}
                                </Typography.Text>
                            </Space>
                            <Typography.Paragraph>
                                {body}
                            </Typography.Paragraph>
                        </Space>
                    </div>
                </Col>
            </Row>
        </DomaAppPreviewContainer>
    )
}

const NewsPreview: INewsPreview = ({ appType, push, app, newsItemData }) => {

    const { title, body, validBefore } = newsItemData

    const intl = useIntl()
    const PushNotificationTitle = intl.formatMessage({ id: 'pages.condo.news.preview.push' })
    const DomaMobileAppTitle = intl.formatMessage({ id: 'pages.condo.news.preview.condoAppName' })

    const [activeKey, setActiveKey] = useState<NewsPreviewTabTypes>(push ? NewsPreviewTabTypes.Push : NewsPreviewTabTypes.App)

    const newsPreviewContent = useMemo(() => {
        if (appType === 'Doma') {
            if (activeKey === NewsPreviewTabTypes.App) {
                return <DomaNewsAppPreview title={title} body={body} validBefore={validBefore}/>
            }
            if (activeKey === NewsPreviewTabTypes.Push) {
                return (
                    <DomaNewsPushPreview
                        title={truncate(title, { length: TITLE_MAX_LEN, omission: '...' })}
                        body={truncate(body, { length: BODY_MAX_LEN, omission: '...' })}
                    />
                )
            } else {
                setActiveKey(DEFAULT_TAB)
            }
        } else if (appType === 'sharing') {
            if (activeKey === NewsPreviewTabTypes.App) {
                return <NewsAppPreview
                    app={app}
                    newsItemData={newsItemData}
                />
            }
            if (activeKey === NewsPreviewTabTypes.Push) {
                return (
                    <NewsPushPreview
                        push={push}
                        newsItemData={newsItemData}
                    />
                )
            } else {
                setActiveKey(DEFAULT_TAB)
            }
        }
    }, [activeKey, title, body, validBefore])

    const onChange = useCallback((event) => {
        setActiveKey(event.target.value)
    }, [])

    return (
        <NewsPreviewContainer>
            <div style={RADIO_GROUP_CONTAINER_STYLE}>
                <RadioGroup optionType='button' value={activeKey} onChange={onChange}>
                    { push && (
                        <Radio
                            key={NewsPreviewTabTypes.Push}
                            value={NewsPreviewTabTypes.Push}
                            label={PushNotificationTitle}
                        />
                    )}
                    <Radio
                        key={NewsPreviewTabTypes.App}
                        value={NewsPreviewTabTypes.App}
                        // todo @toplenboren DO NOT USE PUSH.APPNAME HERE!
                        label={appType === 'Doma' ? DomaMobileAppTitle : 'Сбербанк Онлайн'}
                    />
                </RadioGroup>
            </div>
            {newsPreviewContent}
        </NewsPreviewContainer>
    )
}

const MemoizedNewsPreview = React.memo(NewsPreview)

export default MemoizedNewsPreview

// const NewsSharingPreview: INewsItemSharingPreview = ({ title, body, validBefore, name, previewUrl, id }) => {
//     return (
//         <SharingAppPreviewContainer key={id}>
//             <iframe
//                 style={{
//                     border: 0,
//                     width: '100%',
//                     height: '100%',
//                     minHeight: '500px',
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     padding: '15px',
//                 }}
//                 src={`${previewUrl}?title=${title}&body=${body}`}
//             />
//             <SharingAppOverflowContainer/>
//         </SharingAppPreviewContainer>
//     )
// }
