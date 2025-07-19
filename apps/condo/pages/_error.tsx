import Custom500 from '@app/condo/pages/500'
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

    console.error('Pathname, asPath:', pathname, asPath)

    console.error('ErrorPage:', err)

    console.error('Request:', req)

    const errorInitialProps = await NextErrorComponent.getInitialProps(props)

    console.error('ErrorInitialProps:', errorInitialProps)

    const statusCode = get(res, 'statusCode', 0)

    console.error('StatusCode:', statusCode)

    return errorInitialProps
}

export default ErrorPage
