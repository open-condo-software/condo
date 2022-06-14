import React from 'react'
import getConfig from 'next/config'

const {
    publicRuntimeConfig,
} = getConfig()

const { JivoSiteWidgetId } = publicRuntimeConfig

const JivoSiteWidget: React.FC = () => {
    return JivoSiteWidgetId ? 
        <script src={`//code.jivosite.com/widget/${JivoSiteWidgetId}`} async></script> : null 
}

export default JivoSiteWidget
