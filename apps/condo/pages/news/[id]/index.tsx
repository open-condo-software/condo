import { useGetNewsItemFilesQuery } from '@app/condo/gql'
import {
    NewsItem as INewsItem,
    NewsItemSharing as INewsItemSharing,
    NewsItemSharingStatusType,
} from '@app/condo/schema'
import { Col, notification, Row, RowProps } from 'antd'
import dayjs from 'dayjs'
import has from 'lodash/has'
import throttle from 'lodash/throttle'
import getConfig from 'next/config'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { IntlShape } from 'react-intl/src/types'

import { useCachePersistor } from '@open-condo/apollo'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Markdown, Typography } from '@open-condo/ui'

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
import { NEWS_ITEM_FILES } from '@condo/domains/common/constants/featureflags'
import { PageComponentType } from '@condo/domains/common/types'
import {
    convertFilesToUploadType,
    useModifiedFiles,
    FilesUploadList,
} from '@condo/domains/news/components/FilesUploadList'
import { NewsReadPermissionRequired } from '@condo/domains/news/components/PageAccess'
import { RecipientCounter } from '@condo/domains/news/components/RecipientCounter'
import { NewsItemScopeNoInstanceType } from '@condo/domains/news/components/types'
import { NEWS_ITEM_SOURCE_TYPES } from '@condo/domains/news/constants/newsItemSourceTypes'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { GET_NEWS_ITEMS_RECIPIENTS_COUNTERS_MUTATION } from '@condo/domains/news/gql'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'
import { isPostponedNewsItem } from '@condo/domains/news/utils'
import { NewsItem, NewsItemScope, NewsItemSharing } from '@condo/domains/news/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'

import styles from './index.module.css'


const { publicRuntimeConfig: { newsItemsSendingDelay } } = getConfig()


const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const HORIZONTAL_ROW_GUTTER: RowProps['gutter'] = [0, 24]

type FieldValueType = string | React.ReactNode | Array<any>
interface IFieldPairRowProps <T extends FieldValueType> {
    fieldTitle: string
    fieldValue: T
    renderFieldValue?: (value: T) => React.ReactElement
    align?: RowProps['align']
    className?: string
}
const FieldPairRow = <T extends FieldValueType> (props: IFieldPairRowProps<T>): React.ReactNode => {
    const {
        fieldTitle,
        fieldValue,
        renderFieldValue,
        align,
        className,
    } = props

    const { breakpoints } = useLayoutContext()

    return (
        <PageFieldRow
            title={fieldTitle}
            ellipsis
            labelSpan={!breakpoints.TABLET_LARGE ? 5 : 7}
            align={align}
            className={className}
        >
            <NotDefinedField value={fieldValue} render={renderFieldValue}/>
        </PageFieldRow>
    )
}

const processNewsItemScopes = (newsItemScopes: NewsItemScopeNoInstanceType[]) => {
    return newsItemScopes.map((scope) => {
        const propertyId = scope?.property?.id

        return {
            property: propertyId ? { id: propertyId } : null,
            unitType: scope?.unitType ?? null,
            unitName: scope?.unitName ?? null,
        }
    })
}

const getNewsItemScopesNoInstance = (
    newsItemScopes: NewsItemScopeNoInstanceType[],
    property: NewsItemScopeNoInstanceType['property'],
): NewsItemScopeNoInstanceType[] => {
    const isAllScopesHaveProperty = newsItemScopes.every(newsItemScope => {
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

    const isAllScopesHaveSameProperty = newsItemScopes.every(newsItemScope => {
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
    }

    return newsItemScopes.map(newsItemScope => {
        return {
            property: newsItemScope.property,
            unitName: newsItemScope.unitName,
            unitType: newsItemScope.unitType,
        }
    })
}

const getNewsItemSourceName = (newsItem: INewsItem | null | undefined, intl: IntlShape): string => {
    if (newsItem?.source?.name) return newsItem.source.name

    if (newsItem?.source?.type === NEWS_ITEM_SOURCE_TYPES.REGISTRY) {
        return intl.formatMessage({ id: 'news.source.REGISTRY.name' })
    }

    return intl.formatMessage({ id: 'news.source.NEWS_FORM.name' })
}

const renderBodyFieldValue = (value: string | React.ReactNode) => {
    if (typeof value === 'string') {
        return <Markdown type='inline'>{value}</Markdown>
    }

    return <>{value}</>
}

const formatNewsItemSharingSendAt = (
    newsItem: INewsItem,
    newsItemSharing: INewsItemSharing,
    intl: IntlShape,
) => {
    const NotSentMessage = intl.formatMessage({ id: 'pages.news.newsItemCard.status.notSent' })
    const SendingMessage = intl.formatMessage({ id: 'pages.news.newsItemCard.status.sending' })
    const ErrorMessage = intl.formatMessage({ id: 'pages.news.newsItemCard.status.error' })
    const SentMessage = intl.formatMessage({ id: 'pages.news.newsItemCard.status.success' })

    let dateToShow = newsItem.sendAt ?? null
    let status

    if (newsItemSharing.status === NewsItemSharingStatusType.Scheduled) {
        status = NotSentMessage
    } else if (newsItemSharing.status === NewsItemSharingStatusType.Processing) {
        status = SendingMessage
    } else if (newsItemSharing.status === NewsItemSharingStatusType.Error) {
        status = ErrorMessage
    } else if (newsItemSharing.status === NewsItemSharingStatusType.Published) {
        dateToShow = newsItemSharing.updatedAt ?? null
        status = SentMessage
    }

    if (!dateToShow) return '—'

    return (
        <>
            {dayjs(dateToShow).format('YYYY.MM.DD HH:mm')}
            {status && <Typography.Text type='secondary'> ({status})</Typography.Text>}
        </>
    )
}

type NewsItemCardHeaderProps = {
    newsItem: INewsItem
    title: string
}

const NewsItemCardHeader: React.FC<NewsItemCardHeaderProps> = ({ newsItem, title }) => {
    const intl = useIntl()
    const Regular = intl.formatMessage({ id: 'pages.news.newsItemCard.type.common' })
    const Emergency = intl.formatMessage({ id: 'pages.news.newsItemCard.type.emergency' })
    const AuthorLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.author' })
    const YouSuffix = intl.formatMessage({ id: 'pages.news.newsItemCard.author.you' })
    const ValidBeforePrefix = intl.formatMessage({ id: 'pages.news.newsItemCard.header.validBefore' })

    const { user } = useAuth()
    const typesNamesMapping = {
        [NEWS_TYPE_COMMON]: Regular,
        [NEWS_TYPE_EMERGENCY]: Emergency,
    }
    const newsItemType = typesNamesMapping[newsItem.type] || ''
    const authorName = newsItem.user?.name
    const isOwner = newsItem.user?.id === user?.id
    const sendAtDate = newsItem.sentAt || newsItem.sendAt
    const headerSendAt = sendAtDate
        ? intl.formatMessage(
            { id: 'pages.news.newsItemCard.header.sendAt' },
            { date: dayjs(sendAtDate).format('DD.MM.YYYY, HH:mm') },
        )
        : null
    const headerType = newsItemType
        ? intl.formatMessage({ id: 'pages.news.newsItemCard.header.type' }, { type: newsItemType.toLowerCase() })
        : null
    const validBeforeDate = newsItem.validBefore
        ? dayjs(newsItem.validBefore).format('D MMMM YYYY HH:mm')
        : null
    const headerLine1 = (headerSendAt || authorName) ? (
        <>
            {headerSendAt}
            {headerSendAt && authorName ? ', ' : null}
            {authorName && (
                <>
                    {AuthorLabel}{' '}
                    <Typography.Text type='primary'>
                        {authorName}{isOwner ? ` ${YouSuffix}` : ''}
                    </Typography.Text>
                </>
            )}
        </>
    ) : null
    const headerLine2 = (headerType || validBeforeDate) ? (
        <>
            {headerType}
            {headerType && validBeforeDate ? ', ' : null}
            {validBeforeDate && (
                <>
                    {ValidBeforePrefix}{' '}
                    <Typography.Text type='primary'>{validBeforeDate}</Typography.Text>
                </>
            )}
        </>
    ) : null

    return (
        <Col span={24} className={styles.header}>
            <PageHeader
                className={styles.pageHeader}
                title={<Typography.Title>{title}</Typography.Title>}
            />
            <div className={styles.headerMeta}>
                {headerLine1 && (
                    <Typography.Text type='secondary'>{headerLine1}</Typography.Text>
                )}
                {headerLine2 && (
                    <Typography.Text type='secondary'>{headerLine2}</Typography.Text>
                )}
            </div>
        </Col>
    )
}

type NewsItemCardActionsProps = {
    newsItem: INewsItem
    sharingsCount: number
    canManage: boolean
    refetchNews: () => void
}

const NewsItemCardActions: React.FC<NewsItemCardActionsProps> = ({
    newsItem,
    sharingsCount,
    canManage,
    refetchNews,
}) => {
    const intl = useIntl()
    const EditTitle = intl.formatMessage({ id: 'Edit' })
    const ResendTitle = intl.formatMessage({ id: 'pages.news.newsItemCard.resendButton' })
    const DeleteTitle = intl.formatMessage({ id: 'Delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'news.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'news.ConfirmDeleteMessage' })
    const DeprecateTitle = intl.formatMessage({ id: 'news.DeprecateTitle' })
    const ConfirmDeprecateTitle = intl.formatMessage({ id: 'news.ConfirmDeprecateTitle' })
    const ConfirmDeprecateMessage = intl.formatMessage({ id: 'news.ConfirmDeprecateMessage' })
    const CancelMessage = intl.formatMessage({ id: 'news.CancelMessage' })

    const { push } = useRouter()
    const softDeleteNewsAction = NewsItem.useSoftDelete(() => push('/news'))
    const handleDeleteButtonClick = useCallback(async () => {
        notification.close(newsItem.id)
        await softDeleteNewsAction(newsItem)
    }, [softDeleteNewsAction, newsItem])

    const updateNewsAction = NewsItem.useUpdate({}, () => refetchNews())
    const handleDeprecateNowButtonClick = useCallback(async () => {
        notification.close(newsItem.id)
        // To deprecate news item now you need to send validBefore = now
        // If user has broken time settings in their OS, result of Date.now() will be wrong
        // This might result in an error when validBefore is less than sentAt
        const deprecateDatetime = newsItem.sentAt || dayjs().toISOString()
        await updateNewsAction({ validBefore: deprecateDatetime }, newsItem)
    }, [updateNewsAction, newsItem])

    if (!canManage) return null

    const isSent = Boolean(newsItem.sentAt)
    const sendAt = newsItem.sendAt ?? null
    const isSending = Boolean(sendAt && dayjs().diff(dayjs(sendAt)) > 0 && !isSent)
    const canBeUpdated = isPostponedNewsItem(newsItem, newsItemsSendingDelay) && !isSending
    const canBeDeprecated = isSent
        && (!newsItem.validBefore || dayjs(newsItem.validBefore) > dayjs())
        && sharingsCount === 0

    return (
        <Col span={24}>
            <ActionBar actions={[
                !isSent && canBeUpdated && (
                    <Link key='update' href={`/news/${newsItem.id}/update`}>
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
                (isSending || isSent) && (
                    <Link key='resend' href={`/news/${newsItem.id}/resend`}>
                        <Button type='primary'>{ResendTitle}</Button>
                    </Link>
                ),
                canBeDeprecated && (
                    <DeleteButtonWithConfirmModal
                        key='validBefore'
                        title={ConfirmDeprecateTitle}
                        message={ConfirmDeprecateMessage}
                        okButtonLabel={DeprecateTitle}
                        action={handleDeprecateNowButtonClick}
                        buttonContent={DeprecateTitle}
                        showCancelButton={true}
                        cancelMessage={CancelMessage}
                        messageType='secondary'
                        buttonCustomProps={{ type:'secondary', danger: undefined }}
                    />
                ),
            ]}/>
        </Col>
    )
}

const NewsItemCard: React.FC = () => {
    const intl = useIntl()
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const NotFoundMsg = intl.formatMessage({ id: 'NotFound' })
    const SendAtLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.sendAt' })
    const SourceLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.source' })
    const WillReceiveLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.willReceive' })
    const TitleLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.title' })
    const BodyLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.body' })
    const FilesLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.files' })

    const { useFlag } = useFeatureFlags()
    const isNewsItemFilesEnabled = useFlag(NEWS_ITEM_FILES)

    const { query } = useRouter()

    const { canManage, isLoading: isAccessLoading } = useNewsItemsAccess()

    const { persistor } = useCachePersistor()

    const newsItemId = String(query?.id)

    const {
        obj: newsItem,
        loading: newsItemLoading,
        error: newsItemError,
        refetch: refetchNews,
    } = NewsItem.useObject({
        where: {
            id: newsItemId,
        },
    })

    const PageTitleMsg = intl.formatMessage({ id: 'pages.news.newsItemCard.title' }, { number: newsItem?.number ?? '...' })

    const {
        loading: newsItemFilesLoading,
        data: newsItemFilesData,
    } = useGetNewsItemFilesQuery({
        variables: {
            where: {
                newsItem: {
                    id: newsItemId,
                },
            },
        },
        skip: !persistor || !newsItemId,
    })

    const files = useMemo(() => newsItemFilesData?.newsItemFiles?.filter(Boolean), [newsItemFilesData])

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
        where: { id: newsItemScopes?.[0]?.property?.id ?? null },
    })

    const newsItemScopesNoInstance = useMemo(
        () => getNewsItemScopesNoInstance(newsItemScopes, property),
        [newsItemScopes, property],
    )

    const organizationId = newsItem?.organization?.id

    const [receiversCount, setReceiversCount] = useState<number | null>(null)
    const [getCounters] = useLazyQuery(GET_NEWS_ITEMS_RECIPIENTS_COUNTERS_MUTATION, {
        onCompleted: (data) => {
            setReceiversCount(data?.result?.receiversCount ?? 0)
        },
        onError: () => {
            setReceiversCount(null)
        },
        fetchPolicy: 'cache-first',
    })
    const throttledGetCounters = useMemo(() => throttle(getCounters, 1500), [getCounters])
    const processedNewsItemScopes = useMemo(
        () => processNewsItemScopes(newsItemScopesNoInstance),
        [newsItemScopesNoInstance],
    )

    useEffect(() => {
        if (!organizationId || newsItemScopesLoading) return

        throttledGetCounters({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    organization: { id: organizationId },
                    newsItemScopes: processedNewsItemScopes,
                },
            },
        })

        return () => throttledGetCounters.cancel()
    }, [organizationId, newsItemScopesLoading, processedNewsItemScopes, throttledGetCounters])

    const {
        objs: newsItemSharings,
        loading: newsItemSharingsLoading,
        error: newsItemSharingsError,
    } = NewsItemSharing.useObjects({
        where: {
            newsItem: { id: newsItemId },
        },
    })

    const { modifyFiles } = useModifiedFiles()

    const sourceName = getNewsItemSourceName(newsItem, intl)
    const receiversCountValue = receiversCount == null ? '—' : String(receiversCount)
    const shouldShowFiles = isNewsItemFilesEnabled || Boolean(files?.length)

    const isLoading = [
        newsItemLoading,
        isAccessLoading,
        newsItemScopesLoading,
        propertyLoading,
        newsItemSharingsLoading,
        newsItemFilesLoading,
    ].some(Boolean)
    const hasError = [newsItemError, newsItemScopesError, newsItemSharingsError].some(Boolean)

    if (isLoading) {
        return <LoadingOrErrorPage error='' loading={true}/>
    }

    if (hasError) {
        return <LoadingOrErrorPage error={ServerErrorMsg}/>
    }

    if (!newsItem) {
        return <LoadingOrErrorPage error={NotFoundMsg}/>
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
                        <NewsItemCardHeader newsItem={newsItem} title={PageTitleMsg} />
                        <Col span={24} lg={16}>
                            <FrontLayerContainer>
                                <Row gutter={HORIZONTAL_ROW_GUTTER}>
                                    <FieldPairRow
                                        fieldTitle={WillReceiveLabel}
                                        fieldValue={receiversCountValue}
                                    />
                                    <FieldPairRow
                                        fieldTitle={SourceLabel}
                                        fieldValue={sourceName}
                                    />
                                    <FieldPairRow
                                        fieldTitle={TitleLabel}
                                        fieldValue={newsItem.title}
                                    />
                                    <FieldPairRow
                                        fieldTitle={BodyLabel}
                                        fieldValue={newsItem.body}
                                        renderFieldValue={renderBodyFieldValue}
                                    />
                                    {
                                        shouldShowFiles && (
                                            <FieldPairRow
                                                fieldTitle={FilesLabel}
                                                fieldValue={files}
                                                align='top'
                                                className={styles.filesField}
                                                renderFieldValue={(files) => {
                                                    return (
                                                        <FilesUploadList
                                                            type='view'
                                                            fileList={convertFilesToUploadType(files)}
                                                            updateFileList={modifyFiles}
                                                        />
                                                    )
                                                }}
                                            />
                                        )
                                    }
                                </Row>
                            </FrontLayerContainer>
                        </Col>
                        { canManage && (
                            <Col span={24} sm={24} md={16} lg={8}>
                                <RecipientCounter newsItemScopes={newsItemScopesNoInstance}/>
                            </Col>
                        ) }

                        { newsItemSharings.map(newsItemSharing => (
                            <>
                                <Col span={24}>
                                    <Typography.Title level={2}>{newsItemSharing?.b2bAppContext?.app?.newsSharingConfig?.name}</Typography.Title>
                                </Col>
                                <Col span={24} lg={16}>
                                    <FrontLayerContainer>
                                        <Row gutter={HORIZONTAL_ROW_GUTTER}>
                                            <FieldPairRow
                                                fieldTitle={SendAtLabel}
                                                fieldValue={formatNewsItemSharingSendAt(newsItem, newsItemSharing, intl)}
                                            />
                                            <FieldPairRow
                                                fieldTitle={TitleLabel}
                                                fieldValue={newsItemSharing?.sharingParams?.preview?.renderedTitle}
                                            />
                                            <FieldPairRow
                                                fieldTitle={BodyLabel}
                                                fieldValue={newsItemSharing?.sharingParams?.preview?.renderedBody}
                                                renderFieldValue={renderBodyFieldValue}
                                            />
                                        </Row>
                                    </FrontLayerContainer>
                                </Col>
                            </>
                        ))}

                        <NewsItemCardActions
                            newsItem={newsItem}
                            sharingsCount={newsItemSharings.length}
                            canManage={canManage}
                            refetchNews={refetchNews}
                        />
                    </Row>

                </PageContent>
            </PageWrapper>
        </>
    )
}

const NewsItemCardPage: PageComponentType = () => {
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
