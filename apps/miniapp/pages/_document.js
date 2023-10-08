import { extractCritical } from 'emotion-server'
import Document, { Html, Head, Main, NextScript } from 'next/document'

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
                <Head/>
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
