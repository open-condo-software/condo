import Header from './Hearer'
import Head from 'next/head'

const layoutStyle = {
    margin: `20px`,
}

const Layout = (props) => (<>
    <Head>
        <link rel="icon" href="/favicon.ico"/>
    </Head>
    <Header/>
    <div style={layoutStyle}>
        {props.children}
    </div>
</>)

export default Layout
