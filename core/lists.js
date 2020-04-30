const { ArgumentError } = require('ow')
const ow = require('ow')

const registerLists = (keystone, modulesList) => {
    modulesList.forEach(
        (module) => Object.values(module).forEach(
            (ksList) => ksList._type === 'KeystoneList' && ksList.register(keystone)))
}

class KeystoneList {

    constructor (name, schema) {
        ow(schema, ow.object.partialShape({
            fields: ow.object.valuesOfType(ow.object.hasKeys('type')),
            access: ow.object.nonEmpty,
        }))
        this.schema = schema
        this.name = name
        this._type = 'KeystoneList'
    }

    register (keystone) {
        keystone.createList(this.name, this.schema)
    }
}

module.exports = {
    KeystoneList,
    registerLists,
}
