import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs'
import NextDocument, { Head, Html, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document'

export default class Document extends NextDocument {
    static async getInitialProps (ctx: DocumentContext): Promise<DocumentInitialProps> {
        const cache = createCache()
        const originalRenderPage = ctx.renderPage

        ctx.renderPage = () =>
            originalRenderPage({
                // eslint-disable-next-line react/display-name
                enhanceApp: (App) => (props) =>
                    (
                        <StyleProvider cache={cache}>
                            <App {...props} />
                        </StyleProvider>
                    ),
            })

        const initialProps = await NextDocument.getInitialProps(ctx)

        return {
            ...initialProps,
            styles: (
                <>
                    {initialProps.styles}
                    <style
                        data-test='extract'
                        dangerouslySetInnerHTML={{ __html: extractStyle(cache) }}
                    />
                </>
            ),
        }
    }
    render (): JSX.Element {
        return (
            <Html>
                <Head/>
                <body>
                    <Main/>
                    <NextScript/>
                </body>
            </Html>
        )
    }
}