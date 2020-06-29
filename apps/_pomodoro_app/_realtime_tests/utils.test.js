const {generateLink} = require('../realtime/application/utils/generateTimerId')

test('generateLink() Should generate random links', () => {
    const x = generateLink()
    const y = generateLink()
    expect(x).not.toBe(y)
})
