import { Col, Row, notification } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Typography } from '@open-condo/ui'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { NewsItem, NewsItemTemplate } from '@condo/domains/news/utils/clientSchema'

import { BaseNewsForm, BaseNewsItemFormProps } from './BaseNewsForm'


export const CreateNewsActionBar = (props) => {
    const intl = useIntl()
    const ShareButtonMessage = intl.formatMessage({ id: 'global.shareButton' })

    const { handleSave, isLoading } = props

    return (
        <ActionBar
            actions={[
                <Button
                    key='submit'
                    type='primary'
                    children={ShareButtonMessage}
                    onClick={handleSave}
                    disabled={isLoading}
                />,
            ]}
        />
    )
}

//TOOD(Kekmus) add reload table page after close
export const getCompletedNotification = (intl, action, key) => {
    const SuccessNotificationTitle = intl.formatMessage({ id: 'pages.condo.news.notification.success.title' })
    const SuccessNotificationDescription = intl.formatMessage({ id: 'pages.condo.news.notification.success.description' })

    return {
        message: (
            <Typography.Text strong size='large'>
                {SuccessNotificationTitle}
            </Typography.Text>
        ),
        description: (
            <Row gutter={[0, 28]}>
                <Col>
                    <Typography.Text size='medium' type='secondary'>
                        {SuccessNotificationDescription}
                    </Typography.Text>
                </Col>
                <Button
                    htmlType='button'
                    onClick={async () => { 
                        notification.close(key)
                        await action()
                    }}
                    type='primary'
                >
                    {intl.formatMessage(
                        { id: 'pages.condo.news.notification.success.button' }
                    )}
                </Button>
            </Row>
        ),
        key: key,
        duration: 15,
    }
}

export const CreateNewsForm: React.FC = () => {
    const intl = useIntl()
    const EmptyTemplateTitle = intl.formatMessage({ id: 'news.fields.emptyTemplate.title' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const createNewsItem = NewsItem.useCreate({ organization: { connect: { id: organizationId } } })
    const action: BaseNewsItemFormProps['action'] = useCallback(async (values) => {
        return await createNewsItem(values)
    }, [createNewsItem])

    const {
        loading: isNewsItemTemplatesFetching,
        objs: newsItemTemplates,
        error: newsItemTemplatesError,
    } = NewsItemTemplate.useObjects({})

    const {
        loading: isNewsFetching,
        objs: allNews,
        error: allNewsError,
    } = NewsItem.useAllObjects({
        where: { organization: { id: organizationId } },
    })

    const templates = isNewsItemTemplatesFetching ? null : newsItemTemplates
        .reduce((acc, template) => {
            acc[template.id] = {
                title: template.title,
                body: template.body,
            }
            return acc
        }, { emptyTemplate: { title: EmptyTemplateTitle, body: '' } })

    const softDeleteNewsItem = NewsItem.useSoftDelete()
    const OnCompletedMsg = useCallback((newsItem) => {
        return getCompletedNotification(intl, () => {softDeleteNewsItem(newsItem)}, newsItem.id)
    }, [intl, softDeleteNewsItem])

    const error = useMemo(() => newsItemTemplatesError || allNewsError, [allNewsError, newsItemTemplatesError])
    const loading = isNewsFetching || isNewsItemTemplatesFetching

    if (loading || error) {
        return (
            <LoadingOrErrorPage
                loading={loading}
                error={error && ServerErrorMsg}
            />
        )
    }

    return (
        <BaseNewsForm
            action={action}
            organizationId={organizationId}
            ActionBar={CreateNewsActionBar}
            templates={templates}
            OnCompletedMsg={OnCompletedMsg}
            allNews={allNews}
        />
    )
}
