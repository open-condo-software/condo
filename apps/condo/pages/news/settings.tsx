/** @jsx jsx */
import { jsx } from '@emotion/react'
import { RowProps } from 'antd'
import Head from 'next/head'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, ActionBarProps, Button, Typography } from '@open-condo/ui'

import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import {
    NewsReadAndManagePermissionRequired,
} from '@condo/domains/news/components/PageAccess'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'

interface INewsIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const NewsSettingsPage: INewsIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.news.index.pageTitle' })

    const { organization } = useOrganization()
    const { isLoading: isAccessLoading } = useNewsItemsAccess()
    
    if (isAccessLoading) {
        return <LoadingOrErrorPage error='' loading={true}/>
    }

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>Настройки</Typography.Title>} />
            </PageWrapper>
        </>
    )
}

NewsSettingsPage.requiredAccess = NewsReadAndManagePermissionRequired
export default NewsSettingsPage
