import { useEffect } from 'react'
import Router from 'next/router'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import crypto from 'crypto'
import getConfig from 'next/config'
import {
    ALGORITHM,
    SALT,
    CRYPTOENCODING,
} from '@condo/domains/ticket/constants/crypto'
import React from 'react'
import BaseLayout, { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { format } from 'date-fns'
import { RU_LOCALE, EN_LOCALE, LOCALES } from '@condo/domains/common/constants/locale'

function RedirectToTicket ({ ticketId }) {
    const intl = useIntl()
    const RedirectingMessage = intl.formatMessage({ id: 'Redirecting' })

    useEffect(() => {
        const clearHandle = setTimeout(() => {
            Router.push(`/ticket/${ticketId}`)
        }, 0)
        return () => {
            clearTimeout(clearHandle)
        }
    })

    return <h1>{RedirectingMessage}</h1>
}

interface ShareProps {
    number: string
    details: string
    id: string
    date: string;
    locale?: string;
}

interface IShareProps extends React.FC<ShareProps> {
    container: React.FC
}

const Share: IShareProps = ({ date, number, details, id, locale }) => {
    let ShareTitleMessage
    let ShareDetailsMessage

    const dateFormatted = format(new Date(date), 'd MMMM Y', { locale: LOCALES[locale || RU_LOCALE] })

    if (locale === RU_LOCALE) {
        ShareTitleMessage = `С вами поделились заявкой №${number} от ${dateFormatted}.`
        ShareDetailsMessage = `Текст заявки: «${details}»`
    } else if (locale === EN_LOCALE) {
        ShareTitleMessage = `Ticket #${number} dated ${dateFormatted} has been shared with you.`
        ShareDetailsMessage = `The text of the ticket: "${details}"`
    }

    let origin = 'http://localhost:3000'
    if (typeof window !== 'undefined') {
        origin = window.location.origin
    } else {
        ({
            publicRuntimeConfig: { serverUrl: origin },
        } = getConfig())
    }

    return (
        <>
            <Head>
                <meta property="og:site_name" content={ShareTitleMessage} />
                <meta property="og:title" content={ShareTitleMessage} />
                <meta property="og:description" content={ShareDetailsMessage} />
                <meta property="og:updated_time" content="14400000" />
                <meta property="og:image" content={`${origin}/logoSnippet.png`} />
            </Head>
            <RedirectToTicket ticketId={id} />
        </>
    )
}

export const getServerSideProps = ({ query }) => {
    const decipher = crypto.createDecipher(ALGORITHM, SALT)
    const decryptedText = decipher.update(query.q.replace(/\s/gm, '+'), CRYPTOENCODING, 'utf8') + decipher.final('utf8')
    // TODO(leonid-d): update encrypt method, or use link shortening service
    return { props: JSON.parse(decryptedText) }
}

const EmptyLayout = ({ children, ...props }) => {
    return <BaseLayout
        {...props}
        logoLocation='topMenu'
        className='top-menu-only-layout'
    >
        <PageWrapper>
            {children}
        </PageWrapper>
    </BaseLayout>
}

Share.container = EmptyLayout

export default Share
