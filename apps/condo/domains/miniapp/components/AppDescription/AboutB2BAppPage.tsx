import React, { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import Error from 'next/error'
import Head from 'next/head'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import { B2BApp, B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'
import { B2B_APP_TYPE } from '@condo/domains/miniapp/constants'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { AppDescriptionPageContent } from './AppDescriptionPageContent'



interface AboutB2BAppPageProps {
    id: string,
}


export const AboutB2BAppPage: React.FC<AboutB2BAppPageProps> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const router = useRouter()
    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)

    const { obj: app, error: appError, loading: appLoading } = B2BApp.useObject({
        where: { id },
    })
    const appId = get(app, 'id', null)
    const { obj: context, error: contextError, loading: contextLoading } = B2BAppContext.useObject({
        where: {
            app: { id: appId },
            organization: { id: organizationId },
        },
    })

    const redirectUrl = `/miniapps/${id}?type=${B2B_APP_TYPE}`

    const initialAction = B2BAppContext.useCreate({}, () => {
        router.push(redirectUrl)
    })

    const createContextAction = useCallback(() => {
        initialAction({ organization: organizationId, app: id } )
    }, [initialAction, id, organizationId])

    // NOTE: Page visiting is valid if:
    // App context not exist
    // If context exist -> redirect to app index page
    useEffect(() => {
        if (app && !contextLoading && !contextError && context && context.id) {
            router.push(redirectUrl)
        }
    }, [router, app, contextLoading, contextError, context, id])

    if (appLoading || contextLoading || appError || contextError) {
        return <LoadingOrErrorPage title={LoadingMessage} error={appError || contextError} loading={appLoading || contextLoading}/>
    }

    if (!app) {
        return <Error statusCode={404}/>
    }

    const tagMessage = intl.formatMessage({ id: `miniapps.category.${app.category}` })
    const aboutSections = get(app, ['about', '0', 'props', 'sections'], [])

    return (
        <>
            <Head>
                <title>{app.name}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <AppDescriptionPageContent
                        title={app.name}
                        description={app.shortDescription}
                        published={app.createdAt}
                        logoSrc={get(app, ['logo', 'publicUrl'])}
                        tag={tagMessage}
                        developer={app.developer}
                        partnerUrl={app.partnerUrl}
                        aboutSections={aboutSections}
                        instruction={app.instruction}
                        appUrl={app.appUrl}
                        connectAction={createContextAction}
                    />
                </PageContent>
            </PageWrapper>
        </>
    )
}