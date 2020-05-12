function Button ({onClick}) {
    return (
        <button onClick={onClick}>Click Me</button>
    )
}

function HomePage () {
    return (
        <div>
            <div>Welcome to App!</div>
            <Button onClick={() => alert("Hello world")}/>
        </div>
    )
}

export default HomePage
