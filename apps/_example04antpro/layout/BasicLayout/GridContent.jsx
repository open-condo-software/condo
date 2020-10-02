import React from 'react'
import dynamic from 'next/dynamic'

const GridContent = dynamic(() => import('@ant-design/pro-layout').then(mod => mod.GridContent), {
    ssr: false,
})

export default GridContent
