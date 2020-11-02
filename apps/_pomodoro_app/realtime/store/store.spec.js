/**
 * @jest-environment node
 */

const store = require('./store')

test('Should get and set entites by ID', () => {
    const x = new store()
    x.setEntityById('foo', 'bar')
    x.setEntityById('foo2', 'bar2')
    expect(x.getEntityById('foo')).toBe('bar')
    expect(x.getEntityById('foo2')).toBe('bar2')
    try {
        x.getEntityById('foo3')
    } catch (e) {
        expect(e.name).toBe('WrongArgumentError')
    }
})

test('Should delete entities', () => {
    const x = new store()
    x.setEntityById('foo', 'bar')
    x.removeEntityById('foo')
    try {
        x.getEntityById('foo')
    } catch (e) {
        expect(e.name).toBe('WrongArgumentError')
    }
})
