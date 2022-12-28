import type { Config } from '@svgr/core'

const config: Config = {
    typescript: true,
    icon: true,
    svgProps: {
        width: 'inherit',
        height: 'inherit',
        viewBox: '0 0 24 24',
    },
    replaceAttrValues: {
        '#222': 'currentColor',
    },
    jsxRuntime: 'automatic',
    plugins: [
        '@svgr/plugin-svgo',
        '@svgr/plugin-jsx',
        '@svgr/plugin-prettier',
    ],
    svgoConfig: {},
    prettierConfig: {
        semi: false,
        useTabs: true,
        singleQuote: true,
        jsxSingleQuote: true,
        trailingComma: 'none',
    },
    // NOTE: plugin-jsx is omitting types from template, so returning just processed svg tag here
    template: ({ jsx }, { tpl }) => tpl`${jsx}`,
}

export default config