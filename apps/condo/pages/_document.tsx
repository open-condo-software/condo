// @ts-nocheck
import Document, { Html, Head, Main, NextScript } from 'next/document'
import { extractCritical } from 'emotion-server'
import React from 'react'

export default class MyDocument extends Document {
    static getInitialProps ({ renderPage }) {
        const page = renderPage()
        const styles = extractCritical(page.html)
        return { ...page, ...styles }
    }

    render () {
        const innerHtml = { __html: this.props.css }
        return (
            <Html>
                <Head>
                    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                </Head>
                <body>
                    <Main/>
                    <NextScript/>
                    <style
                        data-emotion-css={this.props.ids.join(' ')}
                        dangerouslySetInnerHTML={innerHtml}
                    />
                </body>
            </Html>
        )
    }
}
