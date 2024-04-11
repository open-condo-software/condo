/** @jsx jsx */
import { jsx } from '@emotion/react'
import { Col, notification, Row, RowProps } from 'antd'
import dayjs from 'dayjs'
import every from 'lodash/every'
import get from 'lodash/get'
import has from 'lodash/has'
import getConfig from 'next/config'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'


import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar } from '@open-condo/ui'
import { Typography, Button } from '@open-condo/ui'

import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import {
    PageContent,
    PageHeader,
    PageWrapper, useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { NewsReadPermissionRequired } from '@condo/domains/news/components/PageAccess'
import { RecipientCounter } from '@condo/domains/news/components/RecipientCounter'
import { TNewsItemScopeNoInstance } from '@condo/domains/news/components/types'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'
import { isPostponedNewsItem } from '@condo/domains/news/utils'
import { NewsItem, NewsItemScope } from '@condo/domains/news/utils/clientSchema'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'

const { publicRuntimeConfig: { newsItemsSendingDelay } } = getConfig()


const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const HORIZONTAL_ROW_GUTTER: RowProps['gutter'] = [0, 24]
const HEADER_STYLES: React.CSSProperties = { paddingBottom: '20px' }

interface IFieldPairRowProps {
    fieldTitle: string,
    fieldValue: string | React.ReactNode,
}
const FieldPairRow: React.FC<IFieldPairRowProps> = (props) => {
    const {
        fieldTitle,
        fieldValue,
    } = props

    const { breakpoints } = useLayoutContext()

    return (
        <PageFieldRow title={fieldTitle} ellipsis labelSpan={!breakpoints.TABLET_LARGE ? 5 : 7}>
            <NotDefinedField value={fieldValue}/>
        </PageFieldRow>
    )
}

const NewsItemCard: React.FC = () => {
    const intl = useIntl()
    const Regular = intl.formatMessage({ id: 'pages.news.newsItemCard.type.common' })
    const Emergency = intl.formatMessage({ id: 'pages.news.newsItemCard.type.emergency' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const NotFoundMsg = intl.formatMessage({ id: 'NotFound' })
    const SendAtLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.sendAt' })
    const TypeLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.type' })
    const ValidBeforeLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.validBefore' })
    const TitleLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.title' })
    const BodyLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.body' })
    const EditTitle = intl.formatMessage({ id: 'Edit' })
    const DeleteTitle = intl.formatMessage({ id: 'Delete' })
    const ResendTitle = intl.formatMessage({ id: 'pages.news.newsItemCard.resendButton' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'news.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'news.ConfirmDeleteMessage' })
    const CancelMessage = intl.formatMessage({ id: 'news.CancelMessage' })
    const NotSentMessage = intl.formatMessage({ id: 'pages.news.newsItemCard.status.notSent' })
    const SendingMessage = intl.formatMessage({ id: 'pages.news.newsItemCard.status.sending' })

    const { user } = useAuth()
    const { query, push } = useRouter()
    const { organization } = useOrganization()

    const { canManage, isLoading: isAccessLoading } = useNewsItemsAccess()

    const newsItemId = String(get(query, 'id'))

    const {
        obj: newsItem,
        loading: newsItemLoading,
        error: newsItemError,
    } = NewsItem.useObject({
        where: {
            id: newsItemId,
        },
    })

    const PageTitleMsg = intl.formatMessage({ id: 'pages.news.newsItemCard.title' }, { number: get(newsItem, 'number', '...') })

    const {
        objs: newsItemScopes,
        loading: newsItemScopesLoading,
        error: newsItemScopesError,
    } = NewsItemScope.useAllObjects({
        where: {
            newsItem: { id: newsItemId },
        },
    })

    // NOTE: load only 1 property because if there are more, the map information is not needed
    const { loading: propertyLoading, obj: property } = Property.useObject({
        where: { id: get(newsItemScopes, [0, 'property', 'id'], null) },
    })

    const newsItemScopesNoInstance: TNewsItemScopeNoInstance[] = useMemo(() => {
        const isAllScopesHaveProperty = every(newsItemScopes, newsItemScope => {
            return has(newsItemScope, ['property', 'id'])
        })

        if (!isAllScopesHaveProperty) {
            return newsItemScopes.map(newsItemScope => {
                return {
                    property: newsItemScope.property,
                    unitName: newsItemScope.unitName,
                    unitType: newsItemScope.unitType,
                }
            })
        }

        const isAllScopesHaveSameProperty = every(newsItemScopes, newsItemScope => {
            return newsItemScope.property.id === newsItemScopes[0].property.id
        })

        if (isAllScopesHaveSameProperty) {
            return newsItemScopes.map(newsItemScope => {
                return {
                    property: property,
                    unitName: newsItemScope.unitName,
                    unitType: newsItemScope.unitType,
                }
            })
        } else {
            return newsItemScopes.map(newsItemScope => {
                return { property: newsItemScope.property }
            })
        }
    }, [newsItemScopes, property])

    const typesNamesMapping = {
        [NEWS_TYPE_COMMON]: Regular,
        [NEWS_TYPE_EMERGENCY]: Emergency,
    }
    const newsItemType = typesNamesMapping[get(newsItem, 'type')] || ''
    const createdBy = get(newsItem, 'createdBy.id', null)
    const {
        obj: employee,
        loading: employeeLoading,
        error: employeeError,
    } = OrganizationEmployee.useObject({
        where: {
            organization: {
                id: organization.id,
            },
            user: {
                id: createdBy,
            },
        },
    })

    const softDeleteNews = NewsItem.useSoftDelete(() => push('/news/'))
    const handleDeleteButtonClick = useCallback(async () => {
        notification.close(newsItem.id)
        await softDeleteNews(newsItem)
    }, [softDeleteNews, newsItem])

    const CreatedByLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.author' }, {
        createdBy: get(employee, 'name'),
        isOwner: createdBy === user.id,
    })

    const isSent = get(newsItem, 'sentAt')
    const isSending = useMemo(() => {
        const sendAt = get(newsItem, 'sendAt', null)
        return sendAt && dayjs().diff(dayjs(sendAt)) > 0 && !isSent
    }, [newsItem, isSent])
    const canBeUpdated = useMemo(
        () => isPostponedNewsItem(newsItem, newsItemsSendingDelay) && !isSending,
        [newsItem, isSending]
    )
    const formattedSendAt = useMemo(() => {
        const dateToShow = get(newsItem, 'sendAt', null)
        if (!dateToShow) return '—'

        let status
        if (isSending) {
            status = SendingMessage
        } else if (!isSent) {
            status = NotSentMessage
        }

        return (
            <>
                {dayjs(dateToShow).format('YYYY.MM.DD HH:mm')}
                {status && <Typography.Text type='secondary'> ({status})</Typography.Text>}
            </>
        )
    }, [NotSentMessage, SendingMessage, isSending, isSent, newsItem])

    const isLoading = employeeLoading || newsItemLoading || isAccessLoading || newsItemScopesLoading || propertyLoading
    const hasError = employeeError || newsItemError || newsItemScopesError
    const isNotFound = !isLoading && (!employee || !newsItem)
    if (hasError || isLoading || isNotFound) {
        const errorToPrint = hasError ? ServerErrorMsg : isNotFound ? NotFoundMsg : null
        return <LoadingOrErrorPage loading={isLoading} error={errorToPrint}/>
    }

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row
                        gutter={PAGE_ROW_GUTTER}
                    >
                        <Col span={24}>
                            <PageHeader title={<Typography.Title>{PageTitleMsg}</Typography.Title>} style={HEADER_STYLES}/>
                            <Typography.Text type='secondary'>
                                {CreatedByLabel}
                            </Typography.Text>
                        </Col>
                        <Col span={24} lg={16}>
                            <FrontLayerContainer>
                                <Row gutter={HORIZONTAL_ROW_GUTTER}>
                                    <FieldPairRow
                                        fieldTitle={SendAtLabel}
                                        fieldValue={formattedSendAt}
                                    />
                                    <FieldPairRow
                                        fieldTitle={TypeLabel}
                                        fieldValue={newsItemType}
                                    />
                                    {
                                        newsItem.validBefore && (
                                            <FieldPairRow
                                                fieldTitle={ValidBeforeLabel}
                                                fieldValue={dayjs(newsItem.validBefore).format('YYYY.MM.DD HH:mm')}
                                            />
                                        )
                                    }
                                    <FieldPairRow
                                        fieldTitle={TitleLabel}
                                        fieldValue={newsItem.title}
                                    />
                                    <FieldPairRow
                                        fieldTitle={BodyLabel}
                                        fieldValue={newsItem.body}
                                    />
                                </Row>
                            </FrontLayerContainer>
                        </Col>
                        {canManage && (
                            <>
                                <Col span={24} sm={24} md={16} lg={8}>
                                    <RecipientCounter newsItemScopes={newsItemScopesNoInstance}/>
                                </Col>
                                <Col span={24}>
                                    <ActionBar actions={[
                                        !isSent && canBeUpdated && (
                                            <Link key='update' href={`/news/${get(newsItem, 'id')}/update`}>
                                                <Button type='primary'>{EditTitle}</Button>
                                            </Link>
                                        ),
                                        !isSent && canBeUpdated && (
                                            <DeleteButtonWithConfirmModal
                                                key='delete'
                                                title={ConfirmDeleteTitle}
                                                message={ConfirmDeleteMessage}
                                                okButtonLabel={DeleteTitle}
                                                action={handleDeleteButtonClick}
                                                buttonContent={DeleteTitle}
                                                showCancelButton={true}
                                                cancelMessage={CancelMessage}
                                                messageType='secondary'
                                            />
                                        ),
                                        isSent && (
                                            <Link key='resend' href={`/news/${get(newsItem, 'id')}/resend`}>
                                                <Button type='primary'>{ResendTitle}</Button>
                                            </Link>
                                        ),
                                    ]}/>
                                </Col>
                            </>
                        )}
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const NewsItemCardPage = () => {
    const { canRead, isLoading: isAccessLoading } = useNewsItemsAccess()

    if (isAccessLoading) {
        return <LoadingOrErrorPage error='' loading={true}/>
    }

    if (!canRead) {
        return <AccessDeniedPage/>
    }

    return <NewsItemCard/>
}
NewsItemCardPage.requiredAccess = NewsReadPermissionRequired

export default NewsItemCardPage
