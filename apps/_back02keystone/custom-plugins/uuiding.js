const { v4: uuid } = require('uuid')
const { Uuid } = require('@keystonejs/fields')

const uuiding = () => ({ fields = {}, hooks = {}, ...rest }) => {
    const idOptions = {
        type: Uuid,
        defaultValue: () => uuid(),
        isRequired: true,
    }

    fields['id'] = idOptions

    return { fields, hooks, ...rest }
}

module.exports = {
    uuiding,
}
