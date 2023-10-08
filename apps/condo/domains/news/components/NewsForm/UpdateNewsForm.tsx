import dayjs from 'dayjs'
import get from 'lodash/get'
import has from 'lodash/has'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { NewsItem, NewsItemScope, NewsItemTemplate } from '@condo/domains/news/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'

import { BaseNewsForm, SendPeriodType, BaseNewsFormProps } from './BaseNewsForm'
export interface IUpdateNewsForm {
    id: string
}

export const UpdateNewsActionBar = (props) => {
    const intl = useIntl()
    const SaveButtonMessage = intl.formatMessage({ id: 'Save' })

    const { handleSave, isLoading } = props

    return (
        <ActionBar
            actions={[
                <Button
                    key='submit'
                    type='primary'
                    children={SaveButtonMessage}
                    onClick={handleSave}
                    disabled={isLoading}
                />,
            ]}
        />
    )
}


export const UpdateNewsForm: React.FC<IUpdateNewsForm> = ({ id }) => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const EmptyTemplateTitle = intl.formatMessage({ id: 'news.fields.emptyTemplate.title' })
    
    const router = useRouter()

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

    const selectedPropertiesId = useMemo(() => {
        return uniq(newsItemScopes.filter(item => has(item, ['property', 'id'])).map(item => item.property.id))
    }, [newsItemScopes]) 
    const { loading: propertiesLoading, objs: properties } = Property.useAllObjects({
        where: { id_in: selectedPropertiesId },
    })

    const updateNewsItem = NewsItem.useUpdate({})
    const action: BaseNewsFormProps['action'] = useCallback(
        async (values) => {
            return await updateNewsItem(values, newsItem)
        }, [updateNewsItem, newsItem])
    const afterAction = useCallback(
        async () => await router.push(`/news/${id}`),
        [id, router])

    const sendPeriod: SendPeriodType = useMemo(() => {
        return get(newsItem, 'sendAt', null) ? 'later' : 'now'
    }, [newsItem])
    const hasAllProperties = useMemo(() => {
        return newsItemScopes.length === 1 && !has(newsItemScopes[0], ['property', 'id'])
    }, [newsItemScopes])
    const sendAt = useMemo(() => get(newsItem, 'sendAt', null), [newsItem])
    const validBefore = useMemo(() => get(newsItem, 'validBefore', null), [newsItem])
    const initialValues = useMemo(() => ({
        ...newsItem,
        newsItemScopes: newsItemScopes,
        hasAllProperties: hasAllProperties,
        properties: properties,
        sendPeriod: sendPeriod,
        sendAt: sendAt ? sendAt : null,
        validBefore: validBefore ? validBefore : null,
    }), [hasAllProperties, newsItem, newsItemScopes, properties, sendAt, sendPeriod, validBefore])

    const organizationId = useMemo(() => get(newsItem, 'organization.id', null), [newsItem])

    const {
        loading: isNewsItemTemplatesFetching,
        objs: NewsItemTemplates,
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

    const templates = isNewsItemTemplatesFetching ? null : NewsItemTemplates
        .reduce((acc, template) => {
            acc[template.id] = {
                title: template.title,
                body: template.body,
                type: template.type,
            }
            return acc
        }, { emptyTemplate: { title: EmptyTemplateTitle, body: '', type: null } })

    const error = useMemo(
        () => newsItemError || newsItemScopeError || allNewsError || newsItemTemplatesError,
        [allNewsError, newsItemError, newsItemScopeError, newsItemTemplatesError])
    const loading = useMemo(
        () => propertiesLoading || newsItemLoading || !newsItemScopeAllDataLoaded || isNewsFetching || isNewsItemTemplatesFetching, 
        [isNewsFetching, isNewsItemTemplatesFetching, newsItemLoading, newsItemScopeAllDataLoaded, propertiesLoading])

    if (loading || error) {
        return (
            <LoadingOrErrorPage
                loading={loading}
                error={error && ServerErrorMessage}
            />
        )
    }

    return (
        <BaseNewsForm
            action={action}
            organizationId={organizationId}
            ActionBar={UpdateNewsActionBar}
            afterAction={afterAction}
            initialValues={initialValues}
            newsItem={newsItem}
            templates={templates}
            OnCompletedMsg={null}
            allNews={allNews}
            actionName='update'
        />
    )
}
