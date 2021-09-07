module.exports = {
    plugins: ['commitlint-plugin-function-rules'],
    rules: {
        'function-rules/subject-case': [
            2, // level: error
            'always',
            ({ header }) => {
                if (!header.match(/^DOMA-\d+ \w+/)) {
                    return [false, 'Wrong commit prefix. Please, start commit message with "DOMA-123" prefix followed by space, where 123 – is your task number. Example: "DOMA-123 short description"']
                }
                const headerMessage = header.split(/^DOMA-\d+ /)[1]
                const words = headerMessage.split(' ')
                const detailsPrompt = 'Please, provide more details about what was done'
                const fixRegexp = new RegExp('fix', 'i')
                if (words.length <= 3) {
                    if (header.match(fixRegexp)) {
                        const stopWords = ['review', 'bug', 'pr']
                        for (let stopWord of stopWords) {
                            const stopWordRegexp = new RegExp(stopWord, 'i')
                            if (header.match(stopWordRegexp)) {
                                return [false, `Messages, like "${stopWord} fixes" are too abstract. ${detailsPrompt}`]
                            }
                        }
                    }
                    return [false, `Commit message is too short. ${detailsPrompt}`]
                }
                return [true]
            },
        ],
    },
}