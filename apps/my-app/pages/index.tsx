import bridge from '@open-condo/bridge'

import { useTRPC, useQuery } from '@/domains/common/utils/trpc.client'

export default function Home () {
    const onClick = () => {
        bridge.send('CondoWebAppRequestAuth', { url: `${window.location.origin}/api/auth/condo` })
    }

    const trpc = useTRPC()
    const res = useQuery(trpc.user.authenticatedUser.queryOptions())

    return (
        <div>
            <button onClick={onClick}>CLICK</button>
            <pre>{JSON.stringify(res.data, null, 2)}</pre>
        </div>
    )
}
