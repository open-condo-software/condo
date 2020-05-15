import App from 'next/app'

function preventInfinityLoop (ctx) {
    const inAppContext = Boolean(ctx.ctx)
    if (inAppContext && ctx.router.route === '/_error' && !ctx.router.asPath.startsWith('/404')) {
        // prevent infinity loop: https://github.com/zeit/next.js/issues/6973
        console.dir(ctx.router)
        if (inAppContext && ctx.ctx.err) {
            throw ctx.ctx.err
        } else {
            throw new Error(`preventInfinityLoop(): catch error!`)
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
    preventInfinityLoop,
    getContextIndependentWrappedInitialProps,
}
