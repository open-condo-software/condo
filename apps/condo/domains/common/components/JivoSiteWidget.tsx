import React from 'react'
import getConfig from 'next/config'

const JivoSiteWidget: React.FC = () => {

    const { publicRuntimeConfig:{ JivoSiteWidgetId } } = getConfig()

    return JivoSiteWidgetId ? 
        <script src={`//code.jivosite.com/widget/${JivoSiteWidgetId}`} async></script> : null 
}

export default JivoSiteWidget
