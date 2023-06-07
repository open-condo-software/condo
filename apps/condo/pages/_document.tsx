// @ts-nocheck
import { extractCritical } from 'emotion-server'
import Document, { Html, Head, Main, NextScript } from 'next/document'
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
                    <link id='favicon' rel='shortcut icon' href='/favicon.ico' type='image/x-icon'/>
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
