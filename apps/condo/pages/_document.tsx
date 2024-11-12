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
                {/*
                    NOTE: Extensions similar to Grammarly, ColorZilla and LanguageTool are therefore the cause of this warning,
                    so you have to find out which one is doing this and then disable/configure it
                    to not run on the ports you usually use for development.
                    https://stackoverflow.com/a/75339011/941020
                */}
                <body suppressHydrationWarning={true}>
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
