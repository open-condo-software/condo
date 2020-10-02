import React from 'react'
import { Button, Result } from 'antd'
import Router from 'next/router'

const ServerErrorPage = () => (
    <Result
        status="500"
        title="500"
        subTitle="Sorry, the server is reporting an error."
        extra={
            <Button type="primary" onClick={() => Router.push('/')}>
                Back Home
            </Button>
        }
    />
)

export default ServerErrorPage
