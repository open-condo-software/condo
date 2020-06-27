const LinkGenerator = require('../realtime/application/LinkGenerator')

test('Should generate random links', () => {
    const x = LinkGenerator.Generate()
    const y = LinkGenerator.Generate()
    expect(x).not.toBe(y)
})
