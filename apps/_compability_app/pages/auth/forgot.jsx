import { css, jsx } from '@emotion/core'
import { Typography } from 'antd'
import Head from 'next/head'
import { useIntl } from 'react-intl'

import { BaseLayout } from '../../common/containers'

const { Title, Paragraph } = Typography

const SignInPage = () => {
    const intl = useIntl()
    const ForgotPasswordTitleMsg = intl.formatMessage({ id: 'pages.auth.ForgotPasswordTitle' })
    const IsNotImplementedYetMsg = intl.formatMessage({ id: 'pages.auth.IsNotImplementedYet' })
    return (
        <>
            <Head>
                <title>{ForgotPasswordTitleMsg}</title>
            </Head>
            <Title css={css`text-align: center;`} level={2}>{ForgotPasswordTitleMsg}</Title>
            <Paragraph css={css`text-align: center;`}>{IsNotImplementedYetMsg}</Paragraph>
        </>
    )
}

function CustomContainer (props) {
    return (
        <BaseLayout
            {...props}
            logo="topMenu"
            sideMenuStyle={{ display: 'none' }}
            mainContentWrapperStyle={{ maxWidth: '600px', minWidth: '490px', paddingTop: '50px', margin: '0 auto' }}
            mainContentBreadcrumbStyle={{ display: 'none' }}
        />
    )
}

SignInPage.container = CustomContainer

export default SignInPage
