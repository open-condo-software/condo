const get = require('lodash/get')

const tokens = require('./src/tokens/tokens.json')

const textColor = get(tokens, ['global', 'color', 'black', 'value'], '#222')

module.exports = {
    'loader': 'less-loader',
    'options': {
        'lessOptions': {
            'javascriptEnabled': true,
            'modifyVars': {
                '@ant-prefix': 'condo',
                '@text-color': textColor,
                '@heading-color': textColor,
            },
        },
    },
}