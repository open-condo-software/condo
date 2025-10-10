import { B2BAppContextStatusType } from '@app/condo/schema'
import { Col, notification, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { ArgsProps as NotificationApiProps } from 'antd/es/notification'
import dayjs from 'dayjs'
import get from 'lodash/get'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { IntlShape } from 'react-intl/src/types'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Typography } from '@open-condo/ui'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'
import { NewsItem, NewsItemTemplate, NewsItemSharing } from '@condo/domains/news/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'

import { BaseNewsForm, BaseNewsFormProps } from './BaseNewsForm'


const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 28]

// TODO DOMA-7397 This function use only in OldBaseNewsForm. In BaseNewsForm this function is not nedeed
/**
 * @deprecated
 * @param props 
 * @returns 
 */
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
    notificationKey: string
    action: () => void
    intl: IntlShape
    initialCountdown: number
}

const ButtonWithCountdown = ({ notificationKey, action, intl, initialCountdown }: IButtonWithCountdownProps) => {
    const SuccessNotificationButtonText = intl.formatMessage({ id: 'pages.condo.news.notification.success.button' })
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
    const SuccessNotificationTitle = intl.formatMessage({ id: 'pages.condo.news.notification.success.title' })
    const SuccessNotificationDescription = intl.formatMessage({ id: 'pages.condo.news.notification.success.description' })

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

function tryJSONParse (value) {
    try {
        return JSON.parse(value)
    } catch (error) {
        console.log(error)
    }
}

export const CreateNewsForm: React.FC = () => {
    const intl: IntlShape = useIntl()
    const EmptyTemplateTitle = intl.formatMessage({ id: 'news.fields.emptyTemplate.title' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const InitialOrganizationNewsItemTitle = intl.formatMessage({ id: 'news.initialOrganizationNewsItem.title' })
    const InitialOrganizationNewsItemBody = intl.formatMessage({ id: 'news.initialOrganizationNewsItem.body' })

    const { query } = useRouter()
    const initialValueFromQuery = query?.initialValue && typeof query?.initialValue === 'string' ? tryJSONParse(query?.initialValue) : undefined
    const initialStepFromQuery = query?.initialStep && typeof query?.initialStep === 'string' ? tryJSONParse(query?.initialStep) : undefined

    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const createNewsItem = NewsItem.useCreate({ organization: { connect: { id: organizationId } } })
    const createNewsItemSharing = NewsItemSharing.useCreate({})

    const action: BaseNewsFormProps['newsItemAction'] = useCallback(async (values) => { return await createNewsItem(values) }, [createNewsItem])
    const createNewsItemSharingAction: BaseNewsFormProps['newsItemSharingAction'] = useCallback(async (values) => { return await createNewsItemSharing(values) }, [createNewsItemSharing])

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

    const {
        loading: isSharingAppContextsFetching,
        objs: sharingAppContexts,
        error: sharingAppContextsError,
    } = B2BAppContext.useObjects({
        where: {
            status: B2BAppContextStatusType.Finished,
            organization: { id: organizationId },
            app: { newsSharingConfig_is_null: false, deletedAt: null },
            deletedAt: null,
        },
    })

    const {
        loading: totalPropertiesLoading,
        count: totalProperties,
        error: totalPropertiesError,
    } = Property.useCount({
        where: { organization: { id: organizationId } },
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

    const { count: organizationNewsCount, loading: organizationNewsCountLoading } = NewsItem.useCount({
        where: {
            organization: { id: organizationId },
        },
    })

    const templates = isNewsItemTemplatesFetching ? null : newsItemTemplates
        .reduce((acc, template) => {
            acc[template.id] = {
                title: template.title,
                body: template.body,
                type: template.type,
                label: template.name,
                category: template.category,
            }
            return acc
        }, { emptyTemplate: { title: EmptyTemplateTitle, body: '', type: null, category: '' } })

    const softDeleteNewsItem = NewsItem.useSoftDelete()
    const OnCompletedMsg = useCallback((newsItem) => {
        if (newsItem.sendAt) {
            // No notification with deleting button for delayed news items.
            return null
        }
        return getCompletedNotification(
            intl,
            async () => { await softDeleteNewsItem(newsItem) }, // NOSONAR
            newsItem.id,
        )
    }, [intl, softDeleteNewsItem])

    const error = useMemo(() => newsItemTemplatesError || allNewsError || totalPropertiesError || sharingAppContextsError, [allNewsError, newsItemTemplatesError, totalPropertiesError, sharingAppContextsError])
    const loading = isNewsFetching || isNewsItemTemplatesFetching || totalPropertiesLoading || organizationNewsCountLoading || isSharingAppContextsFetching

    const initialValues = useMemo(() => {
        if (initialValueFromQuery) {
            return {
                title: initialValueFromQuery.title,
                body: initialValueFromQuery.body,
                hasAllProperties: initialValueFromQuery.hasAllProperties,
                type: initialValueFromQuery.type,
                validBefore: initialValueFromQuery.validBefore,
            }
        }

        if (organizationNewsCount === 0) {
            return {
                title: InitialOrganizationNewsItemTitle,
                body: InitialOrganizationNewsItemBody,
            }
        }

        return {}
    }, [InitialOrganizationNewsItemBody, InitialOrganizationNewsItemTitle, initialValueFromQuery, organizationNewsCount])

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
            autoFocusBody={organizationNewsCount === 0}
            initialValues={initialValues}
            organizationId={organizationId}
            newsItemAction={action}
            ActionBar={CreateNewsActionBar}
            templates={templates}
            sharingAppContexts={sharingAppContexts}
            newsItemSharingAction={createNewsItemSharingAction}
            OnCompletedMsg={OnCompletedMsg}
            allNews={allNews}
            actionName='create'
            totalProperties={totalProperties}
            initialPropertiesFromQuery={initialValueFromQuery?.propertyIds}
            initialStep={initialStepFromQuery}
        />
    )
}
