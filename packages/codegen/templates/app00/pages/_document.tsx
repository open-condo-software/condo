import { extractCritical } from 'emotion-server'
import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
    static getInitialProps ({ renderPage }) {
        const page = renderPage()
        const styles = extractCritical(page.html)
        return { ...page, ...styles }
    }

    render () {
        // @ts-ignore
        const innerHtml = { __html: this.props.css }
        return (
            <Html>
                <Head/>
                <body>
                    <Main/>
                    <NextScript/>
                    <style
                        // @ts-ignore
                        data-emotion-css={this.props.ids.join(' ')}
                        dangerouslySetInnerHTML={innerHtml}
                    />
                </body>
            </Html>
        )
    }
}
