import { B2BAppContextStatusType } from '@app/condo/schema'
import dayjs from 'dayjs'
import get from 'lodash/get'
import has from 'lodash/has'
import uniq from 'lodash/uniq'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'
import { CreateNewsActionBar, getCompletedNotification } from '@condo/domains/news/components/NewsForm/CreateNewsForm'
import { NewsItem, NewsItemScope, NewsItemSharing, NewsItemTemplate } from '@condo/domains/news/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'

import { BaseNewsForm, BaseNewsFormProps, SendPeriodType } from './BaseNewsForm'

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
    const createNewsItemSharing = NewsItemSharing.useCreate({})

    const action: BaseNewsFormProps['newsItemAction'] = useCallback(async (values) => {
        return await createNewsItem(values)
    }, [createNewsItem])
    const newsItemSharingAction: BaseNewsFormProps['newsItemSharingAction'] = useCallback(async (values) => { return await createNewsItemSharing(values) }, [createNewsItemSharing])

    const {
        loading: totalPropertiesLoading,
        count: totalProperties,
        error: totalPropertiesError,
    } = Property.useCount({
        where: { organization: { id: organizationId } },
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

    const {
        loading: newsItemLoading,
        obj: newsItem,
        error: newsItemError,
    } = NewsItem.useObject({
        where: { id },
    })

    const selectedPropertiesId = useMemo(() => {
        return uniq(newsItemScopes.filter(item => has(item, ['property', 'id'])).map(item => item.property.id))
    }, [newsItemScopes])
    const { loading: propertiesLoading, objs: properties } = Property.useAllObjects({
        where: { id_in: selectedPropertiesId },
    })

    const sendPeriod: SendPeriodType = useMemo(() => {
        return get(newsItem, 'sendAt', null) ? 'later' : 'now'
    }, [newsItem])
    const sendAt = useMemo(() => get(newsItem, 'sendAt', null), [newsItem])
    const validBefore = useMemo(() => get(newsItem, 'validBefore', null), [newsItem])
    const hasAllProperties = useMemo(() => {
        return newsItemScopes.filter((scope) => scope.property === null && scope.unitType === null && scope.unitName === null).length > 0
    }, [newsItemScopes])
    const initialValues = useMemo(() => ({
        ...newsItem,
        newsItemScopes: newsItemScopes,
        hasAllProperties: hasAllProperties,
        properties: properties,
        sendPeriod: sendPeriod,
        sendAt: sendAt ? sendAt : null,
        validBefore: validBefore ? validBefore : null,
    }), [hasAllProperties, newsItem, newsItemScopes, properties, sendAt, sendPeriod, validBefore])

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

    const templates = isNewsItemTemplatesFetching || !newsItemTemplates?.length ? null : newsItemTemplates
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
        return getCompletedNotification(intl, () => {softDeleteNewsItem(newsItem)}, newsItem.id)
    }, [intl, softDeleteNewsItem])

    const error = useMemo(
        () => newsItemError || newsItemScopeError || newsItemTemplatesError || allNewsError || totalPropertiesError || sharingAppContextsError,
        [allNewsError, newsItemError, newsItemScopeError, newsItemTemplatesError, totalPropertiesError, sharingAppContextsError])
    const loading = useMemo(
        () => propertiesLoading || newsItemLoading || !newsItemScopeAllDataLoaded || isNewsFetching || isNewsItemTemplatesFetching || totalPropertiesLoading || isSharingAppContextsFetching,
        [isNewsFetching, isNewsItemTemplatesFetching, newsItemLoading, newsItemScopeAllDataLoaded, propertiesLoading, totalPropertiesLoading, isSharingAppContextsFetching])

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
            organizationId={organizationId}
            newsItemAction={action}
            ActionBar={CreateNewsActionBar}
            initialValues={initialValues}
            newsItem={newsItem}
            templates={templates}
            sharingAppContexts={sharingAppContexts}
            newsItemSharingAction={newsItemSharingAction}
            OnCompletedMsg={OnCompletedMsg}
            allNews={allNews}
            actionName='create'
            totalProperties={totalProperties}
        />
    )
}
