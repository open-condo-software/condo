import getConfig from 'next/config'
import React from 'react'

/**
 * GoogleTagManager component that injects the GTM script and noscript iframe
 * when a valid GTM ID is provided in the runtime configuration.
 *
 * @returns JSX.Element | null - GTM scripts or null if GTM ID is not configured
*/
const GoogleTagManager: React.FC = () => {
    const { publicRuntimeConfig } = getConfig()
    const { googleTagManagerId } = publicRuntimeConfig

    // Validate GTM ID format (should be in format GTM-XXXXXXX)
    const isValidGtmId = googleTagManagerId && /^GTM-[A-Z0-9]+$/.test(googleTagManagerId)
        
    if (googleTagManagerId && !isValidGtmId) {
        console.warn(`Invalid Google Tag Manager ID format: ${googleTagManagerId}`)
    }
    
    return isValidGtmId ?
        <>
            <script dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer', "${googleTagManagerId}");`,
            }}>
            </script>
            <noscript>
                <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
                    height='0'
                    width='0'
                    style={{
                        display: 'none',
                        visibility: 'hidden',
                    }}
                ></iframe>
            </noscript>
        </>
        :
        null
}

export default GoogleTagManager