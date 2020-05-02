import Layout from '../components/Layout'
import Link from 'next/link'
import fetch from 'isomorphic-unfetch'

const PostInfo = (props) => (
    <li><Link href={'/blog/' + props.id}><a>{props.name}</a></Link></li>
)

const Blog = (props) => (
    <Layout>
        <ul>
            {props.shows.map((show) => (
                <PostInfo key={show.id} id={show.id} name={show.name}/>
            ))}
        </ul>
    </Layout>
)

Blog.getInitialProps = async () => {
    const res = await fetch('https://api.tvmaze.com/search/shows?q=batman')
    const data = await res.json()
    console.log(`Show data fetched. Count: ${data.length}`)
    return {
        shows: data.map(entry => entry.show),
    }
}

export default Blog