// @ts-nocheck
import { extractCritical } from 'emotion-server'
import Document, { Html, Head, Main, NextScript } from 'next/document'
import React from 'react'


const CriticalStyles = ({ css, ids }) => {
    const innerHtml = { __html: css }
    return (
        <style
            data-emotion-css={ids.join(' ')}
            dangerouslySetInnerHTML={innerHtml}
        />
    )
}

export default class MyDocument extends Document {
    static getInitialProps ({ renderPage }) {
        const page = renderPage()
        const styles = extractCritical(page.html)
        return { ...page, ...styles }
    }

    render () {
        return (
            <Html>
                <Head>
                    <link id='favicon' rel='shortcut icon' href='/favicon.ico' type='image/x-icon'/>
                    <CriticalStyles css={this.props.css} ids={this.props.ids}/>
                </Head>
                {/*
                 NOTE: Extensions similar to Grammarly, ColorZilla, and LanguageTool are therefore the cause of this warning,
                 so you have to find out which one is doing this and then disable/configure it
                 to not run on the ports you usually use for development.
                 https://stackoverflow.com/a/75339011/941020

                 NOTE: The `suppressHydrationWarning` applies to the `<body>` element and its immediate children
                 (`<Main />`, `<NextScript />`), suppressing hydration warnings for these elements.
                 It does not propagate to deeper nested elements within `<Main />` or `<NextScript />`.
                 */}
                <body suppressHydrationWarning={true}>
                    <Main/>
                    <NextScript/>
                </body>
            </Html>
        )
    }
}
