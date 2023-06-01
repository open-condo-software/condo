import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { getCompletedNotification, CreateNewsActionBar } from '@condo/domains/news/components/NewsForm/CreateNewsForm'
import { NewsItem, NewsItemTemplate, NewsItemScope } from '@condo/domains/news/utils/clientSchema'

import { BaseNewsForm, SendPeriodType, BaseNewsFormProps } from './BaseNewsForm'

export interface IResendNewsForm {
    id: string
}

export const ResendNewsForm: React.FC<IResendNewsForm> = ({ id }) => {
    const intl = useIntl()
    const EmptyTemplateTitle = intl.formatMessage({ id: 'news.fields.emptyTemplate.title' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const createNewsItem = NewsItem.useCreate({ organization: { connect: { id: organizationId } } })
    const action: BaseNewsFormProps['action'] = useCallback(async (values) => {
        return await createNewsItem(values)
    }, [createNewsItem])

    const {
        loading: newsItemLoading,
        obj: newsItem,
        error: newsItemError,
    } = NewsItem.useObject({
        where: { id },
    })

    const {
        allDataLoaded: newsItemScopeAllDataLoaded,
        objs: newsItemScopes,
        error: newsItemScopeError,
    } = NewsItemScope.useAllObjects({
        where: {
            newsItem: { 
                id: id,
            },
        },
    })

    const sendPeriod: SendPeriodType = useMemo(() => {
        return get(newsItem, 'sendAt', null) ? 'later' : 'now'
    }, [newsItem])
    const hasAllProperties = useMemo(() => {
        return isEmpty(newsItemScopes)
    }, [newsItemScopes])
    const sendAt = useMemo(() => get(newsItem, 'sendAt', null), [newsItem])
    const validBefore = useMemo(() => get(newsItem, 'validBefore', null), [newsItem])
    const initialValues = useMemo(() => ({
        ...newsItem,
        newsItemScopes: newsItemScopes,
        hasAllProperties: hasAllProperties,
        sendPeriod: sendPeriod,
        sendAt: sendAt ? sendAt : null,
        validBefore: validBefore ? validBefore : null,
    }), [hasAllProperties, newsItem, newsItemScopes, sendAt, sendPeriod, validBefore])

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
            }
            return acc
        }, { emptyTemplate: { title: EmptyTemplateTitle, body: '' } })

    const softDeleteNewsItem = NewsItem.useSoftDelete()
    const OnCompletedMsg = useCallback((newsItem) => {
        return getCompletedNotification(intl, () => {softDeleteNewsItem(newsItem)}, newsItem.id)
    }, [intl, softDeleteNewsItem])

    const error = useMemo(
        () => newsItemError || newsItemScopeError || newsItemTemplatesError || allNewsError, 
        [allNewsError, newsItemError, newsItemScopeError, newsItemTemplatesError])
    const loading = useMemo(
        () => newsItemLoading || !newsItemScopeAllDataLoaded || isNewsFetching || isNewsItemTemplatesFetching, 
        [isNewsFetching, isNewsItemTemplatesFetching, newsItemLoading, newsItemScopeAllDataLoaded])

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
            initialValues={initialValues}
            newsItem={newsItem}
            templates={templates}
            OnCompletedMsg={OnCompletedMsg}
            allNews={allNews}
            actionName='create'
        />
    )
}
