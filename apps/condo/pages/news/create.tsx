import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageHeader, PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { NewsForm } from '@condo/domains/news/components/NewsForm'
import { NewsReadAndManagePermissionRequired } from '@condo/domains/news/components/PageAccess'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'

export interface ICreateNewsPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CreateNewsPageContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'news.create.title' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} spaced/>
                <PageContent>
                    <NewsForm actionName='create'/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const CreateNewsPage: ICreateNewsPage = () => {
    const { canManage, isLoading: isAccessLoading } = useNewsItemsAccess()

    if (isAccessLoading) {
        return <LoadingOrErrorPage error='' loading={true}/>
    }

    if (!canManage) {
        return <AccessDeniedPage/>
    }

    return <CreateNewsPageContent />
}

CreateNewsPage.requiredAccess = NewsReadAndManagePermissionRequired

export default CreateNewsPage
