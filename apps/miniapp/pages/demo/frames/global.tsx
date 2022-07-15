import React, { useState } from 'react'
import { Space } from 'antd'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@miniapp/domains/common/components/BaseLayout'
import { Button } from '@condo/domains/common/components/Button'
import Head from 'next/head'
import { sendOpenModal, sendNotification } from '@condo/domains/common/utils/iframe.utils'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import getConfig from 'next/config'
const { publicRuntimeConfig: { condoUrl, serverUrl } } = getConfig()

const MODAL_PAGE = `${serverUrl}/demo/local`


const GlobalFramePage: React.FC = () => {
    const intl = useIntl()

    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })
    const OpenModalMessage = intl.formatMessage({ id: 'RequestModal' })
    const SendInfoMessage = intl.formatMessage({ id: 'SendNotification.info' })
    const SendWarningMessage = intl.formatMessage({ id: 'SendNotification.warning' })
    const SendErrorMessage = intl.formatMessage({ id: 'SendNotification.error' })

    const [content] = useState('')

    const handleModalClick = () => {
        if (typeof parent !== 'undefined') {
            sendOpenModal(MODAL_PAGE, true, parent, extractOrigin(condoUrl))
        }
    }

    const handleNotification = (type) => {
        if (typeof parent !== 'undefined') {
            sendNotification(type, type, parent, extractOrigin(condoUrl))
        }
    }

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    {content}
                    <Space direction={'horizontal'} wrap>
                        <Button
                            size={'small'}
                            type={'sberDefaultGradient'}
                            onClick={() => handleNotification('info')}
                        >
                            {SendInfoMessage}
                        </Button>
                        <Button
                            size={'small'}
                            type={'sberDefaultGradient'}
                            onClick={() => handleNotification('warning')}
                        >
                            {SendWarningMessage}
                        </Button>
                        <Button
                            size={'small'}
                            type={'sberDefaultGradient'}
                            onClick={() => handleNotification('error')}
                        >
                            {SendErrorMessage}
                        </Button>
                        <Button
                            size={'small'}
                            type={'sberDefaultGradient'}
                            onClick={handleModalClick}
                        >
                            {OpenModalMessage}
                        </Button>
                    </Space>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default GlobalFramePage
