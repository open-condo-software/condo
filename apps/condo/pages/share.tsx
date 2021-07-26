import { useEffect } from 'react'
import Router from 'next/router'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import crypto from 'crypto'
import getConfig from 'next/config'
import {
    ALGORITHM,
    SALT,
    CRYPTOENCODING,
} from '@condo/domains/ticket/constants/crypto'


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
    date: string
}

interface IShareProps extends React.FC<ShareProps> {
    container: React.FC
}

const Share: IShareProps = ({ date, number, details, id }) => {
    const intl = useIntl()
    const ShareTitleMessage = intl.formatMessage({ id: 'ticket.shareTitle' }, {
        date,
        number,
    })
    const ShareDetailsMessage = intl.formatMessage({ id: 'ticket.shareDetails' }, {
        details,
    })


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
                <meta property="og:site_name" content={`Заявка номер ${ShareTitleMessage}`} />
                <meta property="og:title" content={`Заявка номер ${ShareTitleMessage}`} />
                <meta property="og:description" content={`Текст заявки: ${ShareDetailsMessage}`} />
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
    // TODO(pahaz): check is user email/phone is verified
    return { props: JSON.parse(decryptedText) }
}

Share.container = AuthLayout

export default Share

// http://localhost:3000/share?q=IJnfQeKro5my9UrJlK1F9QE727SwjHwWc99mrjpu56z9kPKefjJjx0e7n%2BQFhLlO%2BmC%2Bq2TZXwUvT5NCGRjWjnmzYv9t60eTqlv%2B6WwJmyBz5VAf%2BOan19bBpBGUJ0KOjVK1YMMfe8pwim7%2BygrA8XUW7X7vOA5VI6XqkxqaHKijk1Pte%2FlgqEuPf2Xl6g0U1m1KZ50mwiqfvott6uSH7XFzc%2B24qEYMyqxfLDasEzIJ%2BJxYY0fjU6bHFh49OaCMQwoXCSfcw5cUw6Jp%2BH605IgxNo9OHuupf9dI48wkHnkMVXyw9MECwXF9h6jE21x15URABK%2BTJnKPCv%2BYGGjs%2B4QHrTwsR%2BnFr0E71%2Fbgvew%3D
