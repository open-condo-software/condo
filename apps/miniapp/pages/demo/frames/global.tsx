import React, { useCallback, useEffect, useState } from 'react'
import { Space } from 'antd'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@miniapp/domains/common/components/BaseLayout'
import { Button } from '@condo/domains/common/components/Button'
import Head from 'next/head'
import { sendOpenModal, sendNotification } from '@condo/domains/common/utils/iframe.utils'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import getConfig from 'next/config'
const { publicRuntimeConfig: { condoUrl, serverUrl } } = getConfig()

const MODAL_PAGE = `${serverUrl}/demo/frames/modal`


const GlobalFramePage: React.FC = () => {
    const intl = useIntl()

    const PageTitleMsg = intl.formatMessage({ id: 'pages.index.PageTitle' })
    const OpenModalMessage = intl.formatMessage({ id: 'RequestModal' })
    const SendInfoMessage = intl.formatMessage({ id: 'SendNotification.info' })
    const SendWarningMessage = intl.formatMessage({ id: 'SendNotification.warning' })
    const SendErrorMessage = intl.formatMessage({ id: 'SendNotification.error' })
    const ClearLogsMessage = intl.formatMessage({ id: 'ClearLogs' })

    const [content, setContent] = useState<Array<string>>([''])

    const handleModalClick = useCallback(() => {
        if (typeof parent !== 'undefined') {
            sendOpenModal(MODAL_PAGE, true, parent, extractOrigin(condoUrl))
        }
    }, [])

    const getHandleNotification = useCallback((type) => () => {
        if (typeof parent !== 'undefined') {
            sendNotification(type, type, parent, extractOrigin(condoUrl))
        }
    }, [])

    const handleMessage = useCallback((event) => {
        if (event.data) {
            setContent((prev) => [...prev, JSON.stringify(event.data)])
        }
    }, [])

    const handleClear = useCallback(() => {
        setContent([])
    }, [])

    useEffect(() => {
        window.addEventListener('message', handleMessage)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [handleMessage])

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Space direction={'horizontal'} wrap>
                        <Button
                            size={'small'}
                            type={'sberDefaultGradient'}
                            onClick={getHandleNotification('info')}
                        >
                            {SendInfoMessage}
                        </Button>
                        <Button
                            size={'small'}
                            type={'sberDefaultGradient'}
                            onClick={getHandleNotification('warning')}
                        >
                            {SendWarningMessage}
                        </Button>
                        <Button
                            size={'small'}
                            type={'sberDefaultGradient'}
                            onClick={getHandleNotification('error')}
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
                        <Button
                            size={'small'}
                            type={'sberDefaultGradient'}
                            onClick={handleClear}
                        >
                            {ClearLogsMessage}
                        </Button>
                    </Space>
                    {content.map((row, index) => (
                        <div key={index}>{row}</div>
                    ))}
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default GlobalFramePage
