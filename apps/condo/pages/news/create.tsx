import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageHeader, PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState, ifSsrIsNotDisabled } from '@condo/domains/common/utils/next/ssr'
import { NewsForm } from '@condo/domains/news/components/NewsForm'
import { NewsReadAndManagePermissionRequired } from '@condo/domains/news/components/PageAccess'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'
import { Property } from '@condo/domains/property/utils/clientSchema'

import type { GetServerSideProps } from 'next'


export interface ICreateNewsPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

interface ICreateNewsPageContentProps {
    propertiesCount?: number
    canManage?: boolean
}

const CreateNewsPageContent: React.FC<ICreateNewsPageContentProps> = ({ propertiesCount, canManage }) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'news.create.title' })
    const PropertyGateLabel = intl.formatMessage({ id: 'pages.condo.news.index.propertyGate.header' })
    const PropertyGateMessage = intl.formatMessage({ id: 'pages.condo.news.index.propertyGate.title' })
    const PropertyGateButtonLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} spaced/>
                <PageContent>
                    { propertiesCount !== 0 ?
                        <NewsForm actionName='create'/>
                        :
                        <EmptyListContent
                            image='/dino/playing@2x.png'
                            label={PropertyGateLabel}
                            message={PropertyGateMessage}
                            createRoute='/property/create?next=/news/create&skipTourModal=true'
                            createLabel={PropertyGateButtonLabel}
                            accessCheck={canManage}
                        />
                    }
                </PageContent>
            </PageWrapper>
        </>
    )
}

const CreateNewsPage: ICreateNewsPage = () => {
    const { canManage, isLoading: isAccessLoading } = useNewsItemsAccess()

    const intl = useIntl()
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    
    const { organization } = useOrganization()

    const {
        count: propertiesCount,
        loading: propertiesLoading,
        error: propertiesError,
    } = Property.useCount({ where: { organization: { id: get(organization, 'id') } }, first: 1 })

    const loading = isAccessLoading || propertiesLoading
    const error = propertiesError

    if (loading || error) {
        const errorToPrint = error ? ServerErrorMsg : null
        return <LoadingOrErrorPage loading={loading} error={errorToPrint}/>
    }

    if (isAccessLoading) {
        return <LoadingOrErrorPage error='' loading={true}/>
    }

    if (!canManage) {
        return <AccessDeniedPage/>
    }
    
    return <CreateNewsPageContent propertiesCount={propertiesCount} canManage={canManage} />
}

CreateNewsPage.requiredAccess = NewsReadAndManagePermissionRequired

export default CreateNewsPage

export const getServerSideProps: GetServerSideProps = ifSsrIsNotDisabled(async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
})
