function mockEnv (envMock) {
    jest.mock('@open-condo/config', () => {
        const actual = jest.requireActual('@open-condo/config')
        return new Proxy(actual, {
            set: () => {},
            get: (target, p) => {
                const mockedValueOrGetter = envMock[p]
                if (!mockedValueOrGetter) {
                    return target[p]
                }

                let mockedValue = mockedValueOrGetter
                if (typeof mockedValueOrGetter === 'function') {
                    mockedValue = mockedValueOrGetter()
                }

                return JSON.stringify(mockedValue)
            },
        })
    })
}

module.exports = {
    mockEnv,
}