/** @jsx jsx */
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Row, Col, Image, Divider } from 'antd'
import truncate from 'lodash/truncate'
import React, { useCallback, useMemo, useState } from 'react'

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
type NewsPreviewProps = Pick<NewsItem, 'title' | 'body' | 'validBefore'>

interface INewsPreview {
    (props: NewsPreviewProps): React.ReactElement
}

interface INewsPushPreview {
    (props: Omit<NewsPreviewProps, 'validBefore'>): React.ReactElement
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
const AppPreviewContainer = styled.div`
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
const NewsPushPreviewContainer = styled.div`
  padding-top: 110px;
  padding-bottom: 190px;
`

const NewsPushPreview: INewsPushPreview = ({ title, body }) => {
    const intl = useIntl()
    const CompanyNameTitle = intl.formatMessage({ id: 'mobileAppName' })
    const NowTitle = intl.formatMessage({ id: 'now' })

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

const NewsAppPreview: INewsPreview = ({ title, body, validBefore }) => {
    const intl = useIntl()
    const NotificationFromOrganizationTitle = intl.formatMessage({ id: 'news.create.preview.app.notificationFromOrganization' })
    const ReceivedAtTitle = intl.formatMessage({ id: 'news.create.preview.app.receivedAt' })
    const ValidUntilTitle = intl.formatMessage({ id: 'news.create.preview.app.validUntil' }, { validBefore })

    return (
        <AppPreviewContainer>
            <Row style={STYLE_WIDTH_100P}>
                <Col span={24} style={APP_TOP_COLUMN_STYLE}>
                    <Typography.Text size='small' type='secondary'>
                        {NotificationFromOrganizationTitle}
                    </Typography.Text>
                    <CrossIcon style={APP_CLOSE_ICON_STYLE} />
                    <Divider />
                </Col>
                <Col span={24} style={APP_CONTENT_STYLE}>
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
                </Col>
            </Row>
        </AppPreviewContainer>
    )
}

const NewsPreview: INewsPreview = ({ title, body, validBefore }) => {
    const intl = useIntl()
    const PushNotificationTitle = intl.formatMessage({ id: 'pushNotification' })
    const MobileAppTitle = intl.formatMessage({ id: 'mobileAppResident' })

    const [activeKey, setActiveKey] = useState<NewsPreviewTabTypes>(NewsPreviewTabTypes.Push)

    const newsPreviewContent = useMemo(() => {
        if (activeKey === NewsPreviewTabTypes.App) {
            return <NewsAppPreview title={title} body={body} validBefore={validBefore} />
        }
        return (
            <NewsPushPreview
                title={truncate(title, { length: TITLE_MAX_LEN, omission: '...' })}
                body={truncate(body, { length: BODY_MAX_LEN, omission: '...' })}
            />
        )
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
                </RadioGroup>
            </div>
            {newsPreviewContent}
        </NewsPreviewContainer>
    )
}

const MemoizedNewsPreview = React.memo(NewsPreview)

export default MemoizedNewsPreview
