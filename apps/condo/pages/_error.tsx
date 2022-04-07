import React from 'react'
import Custom500, { ErrorLayout } from './500'

export default function ErrorPage (): React.ReactElement {
    return <Custom500 />
}

ErrorPage.container = ErrorLayout

ErrorPage.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404

    if (statusCode >= 500 && statusCode < 600) {
        res.writeHead(302, {
            Location: '/500',
        })
        res.end()
    }

    if (statusCode === 404){
        res.writeHead(302, {
            Location: '/404',
        })
        res.end()
    }

    return { }
}