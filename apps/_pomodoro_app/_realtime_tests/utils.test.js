const {generateLink} = require('../realtime/application/utils/generateLink')

test('generateLink() Should generate random links', () => {
    const x = generateLink()
    const y = generateLink()
    expect(x).not.toBe(y)
})
