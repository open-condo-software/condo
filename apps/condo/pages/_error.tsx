import Custom500 from '@app/condo/pages/500'
import { captureException } from '@sentry/nextjs'
import get from 'lodash/get'
import NextErrorComponent from 'next/error'
import React from 'react'

import { PageComponentType } from '@condo/domains/common/types'


const ErrorPage: PageComponentType = () => {
    return <Custom500/>
}

ErrorPage.container = (props) => <React.Fragment {...props} />

ErrorPage.getInitialProps = async (props) => {
    const { req, asPath, pathname, res, err } = props

    console.error({ msg: 'Pathname, asPath:', data: { pathname, asPath } })

    console.error({ msg: 'ErrorPage:', error: err })

    console.error({ msg: 'Request:', data: { req } })

    captureException(err)

    const errorInitialProps = await NextErrorComponent.getInitialProps(props)

    console.error({ msg: 'ErrorInitialProps:', data: { errorInitialProps } })

    const statusCode = get(res, 'statusCode', 0)

    console.error({ msg: 'StatusCode:', data: { statusCode } })

    return errorInitialProps
}

export default ErrorPage
