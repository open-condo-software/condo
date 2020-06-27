const RAMRepository = require('../realtime/application/Repository')
const Exceptions = require('../realtime/application/Enums/Exceptions')

test('Repository get / set combination is working', () => {
    const x = new RAMRepository()
    x.setEntityById('foo','bar')
    x.setEntityById('foo2','bar2')
    expect(x.getEntityById('foo')).toBe('bar')
    expect(x.getEntityById('foo2')).toBe('bar2')
    try {
        x.getEntityById('foo3')
    } catch (e) {
        console.log(e)
        expect(e).toBe(Exceptions.ArgumentException)
    }
})

test('Repository delete is working', () => {
    const x = new RAMRepository()
    x.setEntityById('foo','bar')
    x.removeEntityById('foo')
    try {
        x.getEntityById('foo')
    } catch (e) {
        expect(e).toBe(Exceptions.ArgumentException)
    }
});
