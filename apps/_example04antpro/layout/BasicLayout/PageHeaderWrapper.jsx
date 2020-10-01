import React from 'react'
import dynamic from 'next/dynamic'

const PageHeaderWrapper = dynamic(() => import('@ant-design/pro-layout').then(mod => mod.PageHeaderWrapper), {
    ssr: false,
})

export default PageHeaderWrapper
