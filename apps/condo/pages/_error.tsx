import get from 'lodash/get'
import { NextPageContext } from 'next/dist/next-server/lib/utils'
import NextErrorComponent from 'next/error'
import React from 'react'

import Custom500, { ErrorLayout } from './500'

export default function ErrorPage (): React.ReactElement {
    return <Custom500/>
}

ErrorPage.container = ErrorLayout

ErrorPage.getInitialProps = async (props: NextPageContext) => {
    const { res, err } = props

    console.error('ErrorPage:', err)

    const errorInitialProps = await NextErrorComponent.getInitialProps(props)

    const statusCode = get(res, 'statusCode', 0)

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
