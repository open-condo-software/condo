import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import createEmotionServer from '@emotion/server/create-instance'
import Document, { Html, Head, Main, NextScript } from 'next/document'
import React from 'react'

const cacheKey = 'css'
const emotionCache = createCache({ key: cacheKey, prepend: true })
const { extractCritical } = createEmotionServer(emotionCache)

// NOTE: Emotion setup copied from:
// https://www.dhiwise.com/post/implementing-nextjs-emotions-in-your-project

export default class MyDocument extends Document {
    static async getInitialProps (ctx) {
        const originalRenderPage = ctx.renderPage

        ctx.renderPage = () => (
            originalRenderPage({
                enhanceApp: (App) => (props) => (
                    <CacheProvider value={emotionCache}>
                        <App {...props} />
                    </CacheProvider>
                ),
            })
        )

        const initialProps = await Document.getInitialProps(ctx)
        const styles = extractCritical(initialProps.html)

        return {
            ...initialProps,
            styles: (
                <>
                    {initialProps.styles}
                    <style
                        data-emotion={`${cacheKey} ${styles.ids.join(' ')}`}
                        // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
                        dangerouslySetInnerHTML={{ __html: styles.css }}
                    />
                </>
            ),
        }
    }

    render () {
        return (
            <Html>
                <Head>
                    <link id='favicon' rel='shortcut icon' href='/favicon.ico' type='image/x-icon'/>
                </Head>
                <body>
                    <Main/>
                    <NextScript/>
                </body>
            </Html>
        )
    }
}
