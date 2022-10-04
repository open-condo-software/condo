import React from 'react'
import getConfig from 'next/config'

const { publicRuntimeConfig:{ UseDeskWidgetId } } = getConfig()

const UseDeskWidget: React.FC = () => {
    return UseDeskWidgetId ?
        <script async src={`//lib.usedesk.ru/secure.usedesk.ru/${UseDeskWidgetId}.js`}></script> : null
}
export default UseDeskWidget
