import JsonController from '../../Json/views/Controller'

class AddressPartWithTypeController extends JsonController {
    constructor (config, ...args) {
        super(...arguments)
        this.allowedValues = config.allowedValues
    }
}

export default AddressPartWithTypeController
