import Layout from '../../components/Layout'
import fetch from 'isomorphic-unfetch'

const Post = (props) => {
    return (
        <Layout>
            <h1>{props.show.name}</h1>
            {props.show.image ? <img src={props.show.image.medium}/> : null}
        </Layout>
    )
}

Post.getInitialProps = async (context) => {
    const res = await fetch(`https://api.tvmaze.com/shows/${context.query.id}`)
    const show = await res.json()
    return { show }
}

export default Post