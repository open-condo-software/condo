const { rules } = require('./.eslintrc')

module.exports = {
    extends: ['./.eslintrc.js'],
    rules: {
        'no-restricted-imports': [
            'error',
            rules["no-restricted-imports"][1],
        ]
    }
}
