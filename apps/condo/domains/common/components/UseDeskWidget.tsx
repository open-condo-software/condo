import React from 'react'
import getConfig from 'next/config'

const UseDeskWidget: React.FC = () => {

    const { publicRuntimeConfig:{ UseDeskWidgetId } } = getConfig()

    return UseDeskWidgetId ?
        <script async src={`//lib.usedesk.ru/secure.usedesk.ru/${UseDeskWidgetId}.js`}></script> : null
}
export default UseDeskWidget
