function generateLink() {
        const consonants = 'bcdfghjklmnpqrstvwxyz'.split('')
        const vowels = 'aeiou'.split('')
        const rand = (lim) => {return Math.floor(Math.random() * lim)}

        const createRandomWord = (length) => {
            let word = ''

            for (let i = 0; i < length / 2; ++i) {
                let randConsonant = consonants[rand(consonants.length)]
                let randVowel = vowels[rand(vowels.length)]

                word += randConsonant
                word += i * 2 < length - 1 ? randVowel : ''
            }
            return word
        }

        return(createRandomWord(5) + '-' + createRandomWord(5) )
    }

module.exports = {
    generateLink: generateLink
}
