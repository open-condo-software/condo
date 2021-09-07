module.exports = {
    plugins: ['commitlint-plugin-function-rules'],
    rules: {
        'function-rules/subject-case': [
            2, // level: error
            'always',
            ({ header }) => {
                if (!header.match(/^DOMA-\d+\ \w+/)) {
                    return [false, 'Wrong commit prefix. Please, start commit message with "DOMA-123" prefix followed by space, where 123 – is your task number. Example: "DOMA-123 short description"']
                }
                return [true];
            },
        ],
    }
}