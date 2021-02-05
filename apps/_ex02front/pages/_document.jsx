import Document, { Head, Html, Main, NextScript } from 'next/document'
import { extractCritical } from 'emotion-server'

class MyDocument extends Document {
    static getInitialProps ({ renderPage }) {
        const page = renderPage()
        const styles = extractCritical(page.html)
        return { ...page, ...styles }
    }

    render () {
        return (
            <Html>
                <Head/>
                <body>
                <Main/>
                <NextScript/>
                <style
                    data-emotion-css={this.props.ids.join(' ')}
                    dangerouslySetInnerHTML={{ __html: this.props.css }}
                />
                </body>
            </Html>
        )
    }
}

export default MyDocument
