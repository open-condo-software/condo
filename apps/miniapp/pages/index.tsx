import React from 'react'

import { useLaunchParams } from '@app/condo/domains/miniapp/hooks/useLaunchParams'


const IndexPage = () => {
    const { context, loading: contextLoading, error: contextError } = useLaunchParams()

    if (contextLoading) {
        return <>Loading...</>
    }

    if (contextError) {
        return <>Context error: {JSON.stringify(contextError)}</>
    }

    return (
        <>
            {JSON.stringify(context)}
        </>
    )
}


export default IndexPage
