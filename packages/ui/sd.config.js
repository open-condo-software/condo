/**
 * This file contains the configuration for the style-dictionary package,
 * which converts figma-tokens into style variables for various platforms.
 * Custom transformers are described in the bin/build-vars.js script, which uses this config
 */

const path = require('path')

module.exports = {
    source: [path.join(__dirname, 'src/tokens/sets/*.json')],
    platforms: {
        css: {
            transforms: [
                'name/cti/kebab',
                'transformer/int-px',
                'transformer/fonts/sans-serif',
                'transformer/fonts/int-weight',
                'transformer/shadow-css',
                'transformer/short-hex',
                'transformer/lower-hex',
            ],
            prefix: 'condo',
            buildPath: 'src/tokens/',
            files: [
                {
                    destination: 'variables.css',
                    format: 'css/variables',
                },
            ],
        },
    },
}