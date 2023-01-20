import Custom500, { ErrorLayout } from '@app/condo/pages/500'
import get from 'lodash/get'
import { NextPageContext } from 'next'
import NextErrorComponent from 'next/error'
import React from 'react'


export default function ErrorPage (): React.ReactElement {
    return <Custom500/>
}

ErrorPage.container = ErrorLayout

ErrorPage.getInitialProps = async (props: NextPageContext) => {
    const { req, asPath, pathname, res, err } = props

    console.error('Pathname, asPath:', pathname, asPath)

    console.error('ErrorPage:', err)

    console.error('Request:', req)

    const errorInitialProps = await NextErrorComponent.getInitialProps(props)

    console.error('ErrorInitialProps:', errorInitialProps)

    const statusCode = get(res, 'statusCode', 0)

    console.error('StatusCode:', statusCode)

    if (statusCode >= 500) {
        res.writeHead(302, {
            Location: '/500',
        })
        res.end()
    }

    if (statusCode === 404) {
        res.writeHead(302, {
            Location: '/404',
        })
        res.end()
    }

    return errorInitialProps
}