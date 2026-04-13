import styled from '@emotion/styled'
import { Row, Col, Divider } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Card, Space, RadioGroup, Radio, Markdown } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { DEFAULT_BORDER_RADIUS } from '@condo/domains/common/constants/style'
import { stripMarkdown } from '@condo/domains/common/utils/stripMarkdown'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

import { DocumentsPreview } from './FilesPreview/DocumentsPreview'
import { ImageOrVideoPreview } from './FilesPreview/ImageOrVideoPreview'
import { UploadFileType } from './FilesUploadList'

import type { RowProps } from 'antd'

enum NewsPreviewTabTypes {
    Push = 'push-notification',
    App = 'app',
}

type NewsItemData = ({
    title: string
    body: string
    validBefore?: string
    files?: Array<UploadFileType>
})

interface INewsItemPushPreview {
    appName: string
    appIcon: string
    newsItemData: Omit<NewsItemData, 'validBefore'>
}

const PUSH_ROW_GUTTER: RowProps['gutter'] = [0, 8]
const PUSH_ROW_CONTENT_GUTTER: RowProps['gutter'] = [0, 4]
const PUSH_DATETIME_TEXT_STYLE: React.CSSProperties = { textAlign: 'right' }
const APP_TOP_COLUMN_STYLE: React.CSSProperties = { textAlign: 'center', paddingTop: '12px' }
const APP_CONTENT_STYLE: React.CSSProperties = { padding: '0 12px' }
const RADIO_GROUP_CONTAINER_STYLE: React.CSSProperties = { maxWidth: '360px' }
const PUSH_PARAGRAPH_ELLIPSIS_CONFIG = { rows: 2 }
const PREVIEW_CONTENT_WIDTH = 360
const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }
const CONDO_APP_BACKGROUND_PICTURE_URL = '/phoneNewsPreview.png'
const SHARING_APP_BACKGROUND_PICTURE_URL = '/phoneSharingNewsPreview.png'
const PREVIEW_CONTENT_HEIGHT = 500

const NewsPreviewContainer = styled.div`
  margin-left: auto;
  width: 100%;
  // Not a typo, done intentionally
  background-color: ${colors.gray['1']};
  border-radius: ${DEFAULT_BORDER_RADIUS};
  padding: 40px 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const CondoAppPreviewContainer = styled.div`
  margin-top: 24px;
  position: relative;
  height: ${675}px;
  width: ${330}px;
  display: flex;
  align-items: start;
  background-image: url(${CONDO_APP_BACKGROUND_PICTURE_URL});
  justify-content: center;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top center;
  padding-top: 60px;
  padding-left: 22px;
  padding-right: 22px;
  
  & .ant-divider {
    margin: 12px;
  }
`

const SharingAppPreviewContainer = styled.div`
  position: relative;
  
  margin-top: 24px;
  height: ${675}px;
  width: ${330}px;
  display: flex;
  align-items: start;
  justify-content: center;

  background-color: ${colors.gray['1']};
  
  padding-left: 20px;
  padding-right: 20px;
  
  & .ant-divider {
    margin: 12px;
  }
`

const SharingAppOverflowContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: start;
  background-image: url(${SHARING_APP_BACKGROUND_PICTURE_URL});
  justify-content: center;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top center;
  
  padding-left: 20px;
  padding-right: 20px;
  min-height: ${PREVIEW_CONTENT_HEIGHT}px;  
  max-width: ${PREVIEW_CONTENT_WIDTH}px;
`

const NewsPushPreviewContainer = styled.div`
  width: 100%;
  max-width: 360px;
  padding-top: 110px;
  padding-bottom: 190px;
`

const NewsPushPreview: React.FC<INewsItemPushPreview> = ({ appName, appIcon, newsItemData: { title, body } }) => {
    const intl = useIntl()
    const CompanyNameTitle =  appName
    const NowTitle = intl.formatMessage({ id: 'Now' })

    return (
        <NewsPushPreviewContainer>
            <Card bodyPadding={12}>
                <Row gutter={PUSH_ROW_GUTTER}>
                    <Col span={12}>
                        <Space direction='horizontal' size={8}>
                            <img style={{ width: 16, height: 16 }} src={appIcon} alt={`${appName} icon`}/>
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
                                    {stripMarkdown(body)}
                                </Typography.Paragraph>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card>
        </NewsPushPreviewContainer>
    )
}

interface INewsPreviewContainer {
    push?: {
        tabName: string
        content: React.ReactNode
    }
    app: {
        tabName: string
        content: React.ReactNode
    }
}

const NewsPreview: React.FC<INewsPreviewContainer> = ({ push, app }) => {

    const [activeKey, setActiveKey] = useState<NewsPreviewTabTypes>(push ? NewsPreviewTabTypes.Push : NewsPreviewTabTypes.App)

    const changeActiveKey = useCallback((event) => {
        setActiveKey(event.target.value)
    }, [])

    return (
        <NewsPreviewContainer>
            {
                (push && (
                    <div style={RADIO_GROUP_CONTAINER_STYLE}>
                        <RadioGroup optionType='button' value={activeKey} onChange={changeActiveKey}>
                            <Radio
                                key={NewsPreviewTabTypes.Push}
                                value={NewsPreviewTabTypes.Push}
                                label={push.tabName}
                            />
                            <Radio
                                key={NewsPreviewTabTypes.App}
                                value={NewsPreviewTabTypes.App}
                                label={app.tabName}
                            />
                        </RadioGroup>
                    </div>
                ))
            }
            {
                !push && (
                    <Typography.Title level={3}>{app.tabName}</Typography.Title>
                )
            }

            { (push && activeKey === NewsPreviewTabTypes.Push) && push.content }

            {/*Hidden is used so that IFrame inside app.content would not re-render (useful for sharing apps)*/}
            <div style={ activeKey === NewsPreviewTabTypes.App ? { display: 'block' } : { display: 'none' }}>
                {app.content}
            </div>
        </NewsPreviewContainer>
    )
}

const CondoAppPreview: React.FC<NewsItemData> = ({ title, body, validBefore, files }) => {
    const intl = useIntl()
    const NotificationFromOrganizationTitle = intl.formatMessage({ id: 'pages.news.create.preview.app.notificationFromOrganization' })
    const ReceivedAtTitle = intl.formatMessage({ id: 'pages.news.create.preview.app.receivedAt' })
    const ValidUntilTitle = intl.formatMessage({ id: 'pages.news.create.preview.app.validUntil' }, { validBefore })

    const filesByGroups = useMemo(() => {
        const isImageOrVideo = (file) => ['image/', 'video/'].some((mimetype) => file?.response?.mimetype?.startsWith(mimetype) || file?.type?.startsWith(mimetype))
        return files.reduce((acc, file) => {
            if (isImageOrVideo(file)) {
                acc.imagesAndVideos.push(file)
            } else {
                acc.documents.push(file)
            }
            return acc
        }, { documents: [], imagesAndVideos: [] })
    }, [files])

    return (
        <CondoAppPreviewContainer>
            <Row style={{ ...FULL_WIDTH_STYLE, maxHeight: 570, overflow: 'hidden' }}>
                <Col span={24} style={APP_TOP_COLUMN_STYLE}>
                    <Typography.Text size='small' type='secondary'>
                        {NotificationFromOrganizationTitle}
                    </Typography.Text>
                    <Divider />
                </Col>
                <Col span={24} style={APP_CONTENT_STYLE}>
                    <Space direction='vertical' size={16} width='100%'>
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

                        {
                            filesByGroups.imagesAndVideos.length > 0 && (
                                <ImageOrVideoPreview file={filesByGroups.imagesAndVideos[0]} />
                            )
                        }

                        <Typography.Paragraph type='secondary'>
                            <Markdown type='inline'>{body}</Markdown>
                        </Typography.Paragraph>

                        {
                            filesByGroups.documents.length > 0 && (
                                <DocumentsPreview files={filesByGroups.documents} />
                            )
                        }
                    </Space>
                </Col>
            </Row>
        </CondoAppPreviewContainer>
    )
}

const CondoNewsPreview: React.FC<NewsItemData> = ({ title, body, validBefore, files }) => {
    const intl = useIntl()
    const PushNotificationTitle = intl.formatMessage({ id: 'pages.condo.news.preview.push' })
    const CondoMobileAppTitle = intl.formatMessage({ id: 'pages.condo.news.preview.condoAppName' })

    return (
        <NewsPreview
            app={{
                tabName: CondoMobileAppTitle,
                content: <CondoAppPreview title={title} body={body} validBefore={validBefore} files={files} />,
            }}

            push={{
                tabName: PushNotificationTitle,
                content: <NewsPushPreview appName={CondoMobileAppTitle} appIcon='/logoDomaApp.png' newsItemData={{ title, body }}/>,
            }}
        />
    )
}

export const MemoizedCondoNewsPreview = React.memo(CondoNewsPreview)

interface ISharingAppNewsPreview {
    hasPush?: boolean
    ctxId: string
    appName: string
    appIcon: string

    iFrameUrl: string
    iFrameRef: React.Ref<HTMLIFrameElement>

    title: string
    body: string
    newsType: string
    validBefore?: string
}

const SharingNewsPreview: React.FC<ISharingAppNewsPreview> = ({ hasPush = true, appName, appIcon, iFrameUrl, iFrameRef, title, body, ctxId, newsType, validBefore }) => {
    const intl = useIntl()
    const PushNotificationTitle = intl.formatMessage({ id: 'pages.condo.news.preview.push' })

    const appPreview = useMemo(() => {

        return (
            <SharingAppPreviewContainer>
                <IFrame
                    // el => iFrameRef.current = el is used here to support IFrame API
                    // @ts-ignore
                    ref={el => iFrameRef.current = el}
                    src={`${iFrameUrl}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&ctxId=${ctxId}&validBefore=${validBefore}&newsType=${newsType}`}
                    reloadScope='organization'
                />
                <SharingAppOverflowContainer/>
            </SharingAppPreviewContainer>
        )
    // title and body not included here by design as they are used only as initial values
    }, [ iFrameUrl, iFrameRef ])

    return (
        <NewsPreview
            app={{
                tabName: appName,
                content: appPreview,
            }}

            push={hasPush
                ? {
                    tabName: PushNotificationTitle,
                    content: <NewsPushPreview appName={appName} appIcon={appIcon} newsItemData={{ title, body }}/>,
                }
                : undefined
            }
        />
    )
}

export const MemoizedSharingNewsPreview = React.memo(SharingNewsPreview)
