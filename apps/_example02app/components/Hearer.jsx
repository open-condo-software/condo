import Link from 'next/link'

const linkStyle = {
    margin: `20px`,
}

const Header = () => (<div>
    <Link href="/"><a style={linkStyle}>Home</a></Link>
    <Link href="/about"><a style={linkStyle}>About</a></Link>
    <Link href="/blog"><a style={linkStyle}>Blog</a></Link>
</div>)

export default Header
