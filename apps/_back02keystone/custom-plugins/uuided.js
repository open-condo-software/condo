const { v4: uuid } = require('uuid')
const { Uuid } = require('@keystonejs/fields')

const uuided = () => ({ fields = {}, hooks = {}, ...rest }) => {
    const idOptions = {
        type: Uuid,
        defaultValue: () => uuid(),
        isRequired: true,
    }

    fields['id'] = { ...idOptions }

    return { fields, hooks, ...rest }
}

module.exports = {
    uuided,
}
