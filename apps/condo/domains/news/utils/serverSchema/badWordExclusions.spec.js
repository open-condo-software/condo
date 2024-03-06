import { BadWordsExclusions } from './badWordsExclusions'


describe('Class BadWordExclusions', () => {
    describe('Basic logic', () => {
        const badWordExclusions = new BadWordsExclusions({ words: ['one', 'two', 'three'] })

        describe('method "check"', () => {
            describe('Should detect words that have been excluded', () => {
                const cases = [
                    'One', 'one', 'ONE', 'one...', 'one!!', '!one',
                    'twO', 'three',
                ]
                it.each(cases)('%p', (word) => {
                    expect(badWordExclusions.check(word)).toBeTruthy()
                })
            })

            describe('Should not detect words that have been excluded', () => {
                const cases = [
                    'Four', 'four', 'FOUR', 'four...', 'four!!', '!four',
                    'fiveE', 'six',
                ]
                it.each(cases)('%p', (word) => {
                    expect(badWordExclusions.check(word)).toBeFalsy()
                })
            })
        })
    })

    describe('Should supports word masks with (like *example or example* or *example*)', () => {
        const excludedWordMasks = [
            'потребител*',
            '*канал',
            '*дом*',
        ]
        const badWordExclusions = new BadWordsExclusions({ words: excludedWordMasks })

        describe('method "check"', () => {
            describe('Should detect words that have been excluded', () => {
                const cases = [
                    'Потребитель', '!потребителя', '...потребителю', 'потребителем...',
                    'потребителПостфикс!',

                    'КАНАЛ', '!Водоканал', '...ТелеКанал', 'РадиоТелеКанал...',
                    'ПрефиксКанал!',

                    'ДОМ', '!Домашний', '...придомовая',
                    'ПрефиксДом...', 'ДомПостфикс!', 'ПрефиксДомПостфикс!',
                ]

                it.each(cases)('%p', (word) => {
                    expect(badWordExclusions.check(word)).toBeTruthy()
                })
            })

            describe('Should not detect words that have been excluded', () => {
                const cases = [
                    'ПрефиксПотребител', '!ПрефиксПотребителПостфикс',
                    'каналПостфикс', 'ПрефиксКаналПостфикс!',
                ]

                it.each(cases)('%p', (word) => {
                    expect(badWordExclusions.check(word)).toBeFalsy()
                })
            })
        })
    })
})
