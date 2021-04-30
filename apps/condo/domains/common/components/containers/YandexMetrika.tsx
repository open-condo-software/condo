import React from 'react'
import getConfig from 'next/config'

const YandexMetrika = () => {
    const { publicRuntimeConfig } = getConfig()
    const { ymAccount } = publicRuntimeConfig

    return ymAccount ? (
        <div dangerouslySetInnerHTML={{
            __html: `<script type="text/javascript" >
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                ym(${parseInt(ymAccount)}, "init", {
                        clickmap:true,
                        trackLinks:true,
                        accurateTrackBounce:true,
                        webvisor:true
                });
            </script>`,
        }}>
        </div>
    ) : null
}

export default YandexMetrika
