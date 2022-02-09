const { v4: uuid } = require('uuid')

const { plugin } = require('./utils/typing')

const uuided = () => plugin(({ fields = {}, hooks = {}, ...rest }) => {
    const idOptions = {
        type: 'Uuid',
        defaultValue: () => uuid(),
        isRequired: true,
    }

    fields['id'] = { ...idOptions }

    return { fields, hooks, ...rest }
})

module.exports = {
    uuided,
}
