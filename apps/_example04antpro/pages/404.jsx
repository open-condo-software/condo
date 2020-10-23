import React from 'react'
import { Button, Result } from 'antd'
import Router from 'next/router'

const NoFoundPage = () => (
    <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
            <Button type="primary" onClick={() => Router.push('/')}>
                Back Home
            </Button>
        }
    />
)

export default NoFoundPage
