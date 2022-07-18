import React, { useCallback } from 'react'
import { Alert } from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@miniapp/domains/common/components/BaseLayout'
import { Button } from '@condo/domains/common/components/Button'
import Head from 'next/head'
import getConfig from 'next/config'
const { publicRuntimeConfig: { condoUrl } } = getConfig()
import { sendCloseModal } from '@condo/domains/common/utils/iframe.utils'
import { IFrameWrapper } from '@condo/domains/common/components/IFrame'


const GlobalFramePage: React.FC = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })
    const ContentMessage = intl.formatMessage({ id: 'IAmExternal' })
    const ButtonMessage = intl.formatMessage({ id: 'ExternalButton' })
    const router = useRouter()
    const { query: { modalId } } = router

    const handleModalClose = useCallback(() => {
        if (typeof parent !== 'undefined' && modalId && !Array.isArray(modalId)) {
            sendCloseModal(modalId, parent, condoUrl)
        }
    }, [modalId])

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <IFrameWrapper>
                        <Alert message={ContentMessage}  type={'info'} />
                        <Button
                            type={'sberDefaultGradient'}
                            onClick={handleModalClose}
                        >
                            {ButtonMessage}
                        </Button>
                    </IFrameWrapper>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default GlobalFramePage
