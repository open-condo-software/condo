const { InjectionsSeeker } = require('@address-service/domains/common/utils/services/InjectionsSeeker')

describe('Injections seeker', () => {
    test('Search parts extracted correctly', async () => {
        const injectionsSeeker = new InjectionsSeeker('Some _- +== string with a comma: , ...  Hello world!')

        const searchParts = injectionsSeeker.extractSearchParts()

        expect(searchParts).toEqual(['Some', 'string', 'with', 'comma', 'Hello', 'world'])
    })
})
