/** @jsx jsx */
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Row, Col, Image, Divider } from 'antd'
import keyBy from 'lodash/keyBy'
import truncate from 'lodash/truncate'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Card, Space, RadioGroup, Radio } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { CrossIcon } from '@condo/domains/common/components/icons/CrossIcon'
import { DEFAULT_BORDER_RADIUS } from '@condo/domains/common/constants/style'

import type { NewsItem } from '@app/condo/schema'
import type { RowProps } from 'antd'

enum NewsPreviewTabTypes {
    Push = 'push-notification',
    App = 'resident-app',
}

const DEFAULT_TAB = NewsPreviewTabTypes.App

type NewsItemPreview = Pick<NewsItem, 'title' | 'body' | 'validBefore'>
interface INewsItemPreview {
    (props: NewsItemPreview): React.ReactElement
}

interface INewsItemPushPreview {
    (props: Omit<NewsItemPreview, 'validBefore'>): React.ReactElement
}

type SharingAppPreviewData = { id: string, previewUrl: string, name: string }
type NewsSharingPreviewProps = NewsItemPreview & SharingAppPreviewData
interface INewsItemSharingPreview {
    (props: NewsSharingPreviewProps): React.ReactElement
}

type SharingAppsPreviewData = { sharingApps: SharingAppPreviewData[] }
interface INewsPreview {
    (props: NewsItemPreview & SharingAppsPreviewData): React.ReactElement
}

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
  background-image: url("/phoneSharingNewsPreview.png");
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

const NewsPushPreview: INewsItemPushPreview = ({ title, body }) => {
    const intl = useIntl()
    const CompanyNameTitle = intl.formatMessage({ id: 'MobileAppName' })
    const NowTitle = intl.formatMessage({ id: 'Now' })

    return (
        <NewsPushPreviewContainer>
            <Card bodyPadding={12} width={PREVIEW_CONTENT_WIDTH}>
                <Row gutter={PUSH_ROW_GUTTER}>
                    <Col span={12}>
                        <Space direction='horizontal' size={8}>
                            <Image preview={false} src='/logoDomaApp.png' />
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

const LINE_BREAK_STYLE: CSSProperties = { whiteSpace: 'break-spaces' }

const NewsAppPreview: INewsItemPreview = ({ title, body, validBefore }) => {
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

const NewsSharingPreview: INewsItemSharingPreview = ({ title, body, validBefore, name, previewUrl, id }) => {
    return (
        <SharingAppPreviewContainer key={id}>
            <iframe
                style={{
                    border: 0,
                    width: '100%',
                    height: '100%',
                    minHeight: '500px',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    padding: '15px',
                }}
                src={`${previewUrl}?title=${title}&body=${body}`}
            />
            <SharingAppOverflowContainer/>
        </SharingAppPreviewContainer>
    )
}


const NewsPreview: INewsPreview = ({ title, body, validBefore, sharingApps }) => {
    const intl = useIntl()
    const PushNotificationTitle = intl.formatMessage({ id: 'PushNotification' })
    const MobileAppTitle = intl.formatMessage({ id: 'MobileAppResident' })

    console.log(sharingApps)

    const sharingAppsIndex = keyBy(sharingApps, 'id')

    console.log(sharingAppsIndex)

    const [activeKey, setActiveKey] = useState<NewsPreviewTabTypes>(NewsPreviewTabTypes.Push)

    console.log(activeKey)

    console.log(sharingAppsIndex[activeKey])

    const newsPreviewContent = useMemo(() => {
        if (activeKey === NewsPreviewTabTypes.App) {
            return <NewsAppPreview title={title} body={body} validBefore={validBefore} />
        }
        if (activeKey === NewsPreviewTabTypes.Push) {
            return (
                <NewsPushPreview
                    title={truncate(title, { length: TITLE_MAX_LEN, omission: '...' })}
                    body={truncate(body, { length: BODY_MAX_LEN, omission: '...' })}
                />
            )
        }
        if (sharingAppsIndex[activeKey]) {
            return (
                <NewsSharingPreview
                    title={title}
                    body={body}
                    validBefore={validBefore}
                    id={activeKey}
                    previewUrl={sharingAppsIndex[activeKey].previewUrl}
                    name={sharingAppsIndex[activeKey].name}
                />
            )
        } else {
            setActiveKey(DEFAULT_TAB)
        }

    }, [activeKey, title, body, validBefore])

    const onChange = useCallback((event) => {
        setActiveKey(event.target.value)
    }, [])

    return (
        <NewsPreviewContainer>
            <div style={RADIO_GROUP_CONTAINER_STYLE}>
                <RadioGroup optionType='button' value={activeKey} onChange={onChange}>
                    <Radio
                        key={NewsPreviewTabTypes.Push}
                        value={NewsPreviewTabTypes.Push}
                        label={PushNotificationTitle}
                    />
                    <Radio
                        key={NewsPreviewTabTypes.App}
                        value={NewsPreviewTabTypes.App}
                        label={MobileAppTitle}
                    />
                    {(Array.isArray(sharingApps) && Object.values(sharingApps).map(app => (
                        <Radio
                            key={app.id}
                            value={app.id}
                            label={app.name}
                        />
                    )))}
                </RadioGroup>
            </div>
            {newsPreviewContent}
        </NewsPreviewContainer>
    )
}

const MemoizedNewsPreview = React.memo(NewsPreview)

export default MemoizedNewsPreview
