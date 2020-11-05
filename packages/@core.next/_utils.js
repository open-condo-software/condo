import App from 'next/app'

let errors = {}
const DEBUG_RERENDERS = false
const DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER = false

function preventInfinityLoop (ctx) {
    const inAppContext = Boolean(ctx.ctx)
    if (inAppContext && ctx.router.route === '/_error' && !ctx.router.asPath.startsWith('/404')) {
        // prevent infinity loop: https://github.com/zeit/next.js/issues/6973
        if (inAppContext && ctx.ctx.err) {
            throw ctx.ctx.err
        } else {
            let url = ctx.router.asPath || ctx.router.route || ''
            url = url.split('?', 1)[0]
            if (url) {
                errors[url] = (errors[url] || 0) + 1
                if (errors[url] >= 10) {
                    const msg = 'preventInfinityLoop(): catch loop! Probably you don\'t have some URL'
                    console.dir(ctx.router)
                    throw new Error(msg)
                }
            }
        }
    }
}

async function getContextIndependentWrappedInitialProps (PageComponent, ctx) {
    const inAppContext = Boolean(ctx.ctx)
    let pageProps = {}
    if (PageComponent.getInitialProps) {
        pageProps = await PageComponent.getInitialProps(ctx)
    } else if (inAppContext) {
        pageProps = await App.getInitialProps(ctx)
    }
    return pageProps
}

module.exports = {
    DEBUG_RERENDERS,
    DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER,
    preventInfinityLoop,
    getContextIndependentWrappedInitialProps,
}
