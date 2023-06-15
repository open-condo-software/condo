/** @jsx jsx */
import { jsx } from '@emotion/react'
import { Col, Row, RowProps } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'


import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar } from '@open-condo/ui'
import { Typography, Button } from '@open-condo/ui'

import {
    PageContent,
    PageHeader,
    PageWrapper,
} from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { RecipientCounter } from '@condo/domains/news/components/RecipientCounter'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { NewsItem, NewsItemScope } from '@condo/domains/news/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'


const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const HORIZONTAL_ROW_GUTTER: RowProps['gutter'] = [0, 24]
const fieldPairRowStyle = { width: '100%' }

interface IFieldPairRowProps {
    fieldTitle: string,
    fieldValue: string,
}
const FieldPairRow: React.FC<IFieldPairRowProps> = (props) => {
    const {
        fieldTitle,
        fieldValue,
    } = props
    return (
        <>
            <Col span={8}>
                <Typography.Text type='secondary'>
                    {fieldTitle}
                </Typography.Text>
            </Col>
            <Col span={16} style={fieldPairRowStyle}>
                <NotDefinedField value={fieldValue}/>
            </Col>
        </>
    )
}

const NewsItemCard: React.FC = () => {
    const intl = useIntl()
    const Regular = intl.formatMessage({ id: 'Regular' })
    const Emergency = intl.formatMessage({ id: 'Emergency' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const NotFoundMsg = intl.formatMessage({ id: 'NotFound' })
    const SentAtLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.sentAt' })
    const TypeLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.type' })
    const ValidBeforeLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.validBefore' })
    const TitleLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.title' })
    const BodyLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.field.body' })
    const EditTitle = intl.formatMessage({ id: 'Edit' })
    const DeleteTitle = intl.formatMessage({ id: 'Delete' })
    const ResendTitle = intl.formatMessage({ id: 'pages.news.newsItemCard.resendButton' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'news.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'news.ConfirmDeleteMessage' })

    const { user } = useAuth()
    const { query, push } = useRouter()
    const { organization } = useOrganization()

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
    } = NewsItemScope.useObjects({
        where: {
            newsItem: { id: newsItemId },
        },
    })

    const typesNamesMapping = {
        [NEWS_TYPE_COMMON]: Regular,
        [NEWS_TYPE_EMERGENCY]: Emergency,
    }
    const newsItemType = typesNamesMapping[get(newsItem, 'type')] || ''
    const createdBy = get(newsItem, 'createdBy.id')
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
        await softDeleteNews(newsItem)
    }, [softDeleteNews, newsItem])

    const CreatedByLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.author' }, {
        createdBy: get(employee, 'name'),
        isOwner: createdBy === user.id,
    })

    const isLoading = employeeLoading || newsItemLoading
    const hasError = employeeError || newsItemError
    const isNotFound = !isLoading && (!employee || !newsItem)
    if (hasError || isLoading || isNotFound) {
        const errorToPrint = hasError ? ServerErrorMsg : isNotFound ? NotFoundMsg : null
        return <LoadingOrErrorPage loading={isLoading} error={errorToPrint}/>
    }

    return (
        <PageWrapper>
            <PageContent>
                <Row
                    gutter={PAGE_ROW_GUTTER}
                >
                    <Col span={24}>
                        <PageHeader title={<Typography.Title>{PageTitleMsg}</Typography.Title>} />
                        <Typography.Text type='secondary'>
                            {CreatedByLabel}
                        </Typography.Text>
                    </Col>
                    <Col span={16}>
                        <FrontLayerContainer>
                            <Row gutter={HORIZONTAL_ROW_GUTTER}>
                                <FieldPairRow
                                    fieldTitle={SentAtLabel}
                                    fieldValue={newsItem.sentAt ? dayjs(newsItem.sentAt).format('YYYY.MM.DD HH:mm') : '-'}
                                />
                                <FieldPairRow
                                    fieldTitle={TypeLabel}
                                    fieldValue={newsItemType}
                                />
                                <FieldPairRow
                                    fieldTitle={ValidBeforeLabel}
                                    fieldValue={newsItem.validBefore ?? '-'}
                                />
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
                    <Col span={8}>
                        <RecipientCounter newsItemScopes={newsItemScopes}/>
                    </Col>
                    <Row>
                        {get(newsItem, 'sentAt') ? (
                            <Link key='resend' href={`/news/${get(newsItem, 'id')}/resend`}>
                                <Button
                                    type='primary'
                                >
                                    {ResendTitle}
                                </Button>
                            </Link>
                        ) : ( <ActionBar actions={[
                            <Link key='update' href={`/news/${get(newsItem, 'id')}/update`}>
                                <Button
                                    type='primary'
                                >
                                    {EditTitle}
                                </Button>
                            </Link>,
                            <DeleteButtonWithConfirmModal
                                key='delete'
                                title={ConfirmDeleteTitle}
                                message={ConfirmDeleteMessage}
                                okButtonLabel={DeleteTitle}
                                action={handleDeleteButtonClick}
                                buttonContent={DeleteTitle}
                            />,
                        ]}/>)
                        }
                    </Row>
                </Row>
            </PageContent>
        </PageWrapper>
    )
}

const NewsItemCardPage = () => {
    return <NewsItemCard/>
}
NewsItemCardPage.requiredAccess = OrganizationRequired

export default NewsItemCardPage
