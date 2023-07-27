import { Col, notification, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { ArgsProps as NotificationApiProps } from 'antd/es/notification'
import dayjs from 'dayjs'
import get from 'lodash/get'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { IntlShape } from 'react-intl/src/types'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Typography } from '@open-condo/ui'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { NewsItem, NewsItemTemplate } from '@condo/domains/news/utils/clientSchema'

import { BaseNewsForm, BaseNewsFormProps } from './BaseNewsForm'

const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 28]

export const CreateNewsActionBar: React.FC<{ handleSave: () => void, isLoading: boolean }> = (props) => {
    const intl = useIntl()
    const ShareButtonMessage = intl.formatMessage({ id: 'global.share' })

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

interface IButtonWithCountdownProps {
    notificationKey: string,
    action: () => void,
    intl: IntlShape,
    initialCountdown: number,
}

const ButtonWithCountdown = ({ notificationKey, action, intl, initialCountdown }: IButtonWithCountdownProps) => {
    const SuccessNotificationButtonText = intl.formatMessage({ id: 'news.notification.success.button' })
    const [countdown, setCountdown] = useState<number>(initialCountdown)

    const interval = useMemo(() => {
        return setInterval(() => {
            setCountdown((prev) => (prev - 1))
        }, 1000)
    }, [])

    useEffect(() => {
        if (countdown <= 0 && interval) {
            clearInterval(interval)
            notification.close(notificationKey)
        }
    }, [countdown, interval, notificationKey])

    return (
        <Button
            htmlType='button'
            onClick={async () => {
                clearInterval(interval)
                notification.close(notificationKey)
                await action()
            }}
            type='primary'
        >
            {`${SuccessNotificationButtonText} (${countdown})`}
        </Button>
    )
}

export const getCompletedNotification = (intl: IntlShape, action: () => void, key: string): NotificationApiProps => {
    const SuccessNotificationTitle = intl.formatMessage({ id: 'news.notification.success.title' })
    const SuccessNotificationDescription = intl.formatMessage({ id: 'news.notification.success.description' })

    const { publicRuntimeConfig: { newsItemsSendingDelay } } = getConfig()

    return {
        message: (
            <Typography.Text strong size='large'>
                {SuccessNotificationTitle}
            </Typography.Text>
        ),
        description: (
            <Row gutter={SMALL_VERTICAL_GUTTER}>
                <Col>
                    <Typography.Text size='medium' type='secondary'>
                        {SuccessNotificationDescription}
                    </Typography.Text>
                </Col>
            </Row>
        ),
        key: key,
        duration: newsItemsSendingDelay,
        btn: (
            <ButtonWithCountdown
                notificationKey={key}
                action={action}
                intl={intl}
                initialCountdown={newsItemsSendingDelay}
            />
        ),
    }
}

export const CreateNewsForm: React.FC = () => {
    const intl: IntlShape = useIntl()
    const EmptyTemplateTitle = intl.formatMessage({ id: 'news.fields.emptyTemplate.title' })
    const ServerErrorMsg = intl.formatMessage({ id: 'serverError' })

    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const createNewsItem = NewsItem.useCreate({ organization: { connect: { id: organizationId } } })
    const action: BaseNewsFormProps['action'] = useCallback(async (values) => {
        return await createNewsItem(values)
    }, [createNewsItem])

    const {
        loading: isNewsItemTemplatesFetching,
        objs: newsItemTemplates,
        error: newsItemTemplatesError,
    } = NewsItemTemplate.useObjects({
        where: {
            OR: [
                { organization_is_null: true },
                { organization: { id: organizationId } },
            ],
        },
    })

    const dateStart = dayjs().startOf('day')
    const {
        loading: isNewsFetching,
        objs: allNews,
        error: allNewsError,
    } = NewsItem.useAllObjects({
        where: {
            organization: { id: organizationId },
            createdAt_gte: dateStart.toISOString(),
        },
    })

    const templates = isNewsItemTemplatesFetching ? null : newsItemTemplates
        .reduce((acc, template) => {
            acc[template.id] = {
                title: template.title,
                body: template.body,
                type: template.type,
            }
            return acc
        }, { emptyTemplate: { title: EmptyTemplateTitle, body: '', type: null } })

    const softDeleteNewsItem = NewsItem.useSoftDelete()
    const OnCompletedMsg = useCallback((newsItem) => {
        if (newsItem.sendAt) {
            // No notification with deleting button for delayed news items.
            return null
        }
        return getCompletedNotification(
            intl,
            async () => {
                await softDeleteNewsItem(newsItem)
            },
            newsItem.id,
        )
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
            actionName='create'
        />
    )
}
