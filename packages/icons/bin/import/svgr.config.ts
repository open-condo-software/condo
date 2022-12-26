import type { Config } from '@svgr/core'

const config: Config = {
    typescript: true,
    icon: true,
    svgProps: {
        width: 'inherit',
        height: 'inherit',

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
    template: ({ jsx }, { tpl }) => tpl`${jsx}`,
}

export default config