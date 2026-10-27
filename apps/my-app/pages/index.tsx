import bridge from '@open-condo/bridge'

export default function Home () {
    const onClick = () => {
        bridge.send('CondoWebAppRequestAuth', { url: `${window.location.origin}/api/auth/condo` })
    }
    return (
        <div>
            <button onClick={onClick}>CLICK</button>
            TODO: IMPLEMENT ME
        </div>
    )
}
