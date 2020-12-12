/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import Head from 'next/head'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

const Function = () => {
    const router = useRouter()
    const { id } = router.query

    return (
        <>
            <Head>
                <title>Function</title>
            </Head>
            <Button>ADD</Button>
        </>
    )
}

export default Function;
