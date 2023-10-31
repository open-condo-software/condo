import { checkBadWordsExclusions } from './badWords'


describe('function "checkBadWordsExclusions"', () => {
    describe('should return true for excluded words', () => {
        const cases = [
            'ипу', 'Ипу', 'ИПУ',
            'ипу!', '...ипу', 'ипу...', // "bad-words-next" may be return bad words with special chars
        ]
        it.each(cases)('%p', (exclusion) => {
            expect(checkBadWordsExclusions(exclusion)).toBeTruthy()
        })
    })

    describe('should return false for not excluded words', () => {
        const cases = [
            'word', 'слово', '123',
            'word!', ',слово', // "bad-words-next" may be return bad words with special chars
        ]

        it.each(cases)('%p', (goodWord) => {
            expect(checkBadWordsExclusions(goodWord)).toBeFalsy()
        })
    })
})
