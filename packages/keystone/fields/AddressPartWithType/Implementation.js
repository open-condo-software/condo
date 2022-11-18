const { JsonImplementation } = require('../Json/Implementation')

class AddressPartWithTypeImplementation extends JsonImplementation {
    constructor (path, ref) {
        super(...arguments)
        this.allowedValues = ref.allowedValues
    }

    extendAdminMeta (meta) {
        const { allowedValues } = this

        return super.extendAdminMeta({ ...meta, allowedValues })
    }
}

module.exports = { AddressPartWithTypeImplementation }
