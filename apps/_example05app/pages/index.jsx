/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Typography } from 'antd'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import Chat from '../containers/Chat'

function HomePage () {
    const auth = useAuth()
    const intl = useIntl()
    return <>
        <Head><title>Welcome</title></Head>
        <Typography.Title
            css={css`text-align: center;`}>{intl.formatMessage({ id: 'welcome' }, { name: auth.user ? auth.user.name : 'GUEST' })}</Typography.Title>
        <div>
            <Chat />
        </div>
    </>
}

export default HomePage
