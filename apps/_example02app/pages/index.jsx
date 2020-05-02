import Router from 'next/router'

import Layout from '../components/Layout'

const Index = () => {
    return (
        <Layout>
            <p>Hello Next.js</p>
            <p>Click <span onClick={() => Router.push('/about')}>here</span> to read more</p>
        </Layout>
    )
}

export default Index
