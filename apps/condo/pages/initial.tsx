import { PageComponentType } from '@condo/domains/common/types'


// NOTE: This empty page need for webview initial page
const InitialPage: PageComponentType = () => {
    return <></>
}

InitialPage.skipUserPrefetch = true

export default InitialPage
