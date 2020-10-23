import Link from 'next/link'

function HomePage() {
    return (
        <div className="HomePage">
            <h1> Pomodoro! </h1>
            <Link href={'/timer/test'}> Timer </Link>
        </div>
    )
}

export default HomePage
