module.exports = {
    plugins: ['commitlint-plugin-function-rules'],
    rules: {
        'function-rules/subject-case': [
            2, // level: error
            'always',
            ({ header }) => {
                const standalonePrefixes = ['HOTFIX', 'INFRA', 'REFACTOR']
                for (let prefix of standalonePrefixes) {
                    if (header.match(new RegExp(`^${prefix} \\w+`, 'i'))) {
                        return [true]
                    }
                }
                if (!header.match(/^DOMA-\d+ \w+/)) {
                    return [false, 'Wrong commit prefix. Allowed prefixes: DOMA-123, HOTFIX, INFRA. Examples: "DOMA-123 describe what have been done", "HOTFIX describe what have been fixed", "INFRA describe what have been introduced".']
                }
                const headerMessage = header.split(/^DOMA-\d+ /)[1]
                const words = headerMessage.split(' ')
                const detailsPrompt = 'Please, provide more details about what was done'
                const fixRegexp = new RegExp('fix', 'i')
                if (words.length <= 2) {
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