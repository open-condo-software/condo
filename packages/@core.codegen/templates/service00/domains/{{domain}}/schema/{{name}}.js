/**
 * Generated by `{{ command }}`
 */

const { GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@{{app}}/domains/{{ domain }}/access/{{name}}')


const {{ name }} = new GQLCustomSchema('{{ name }}', {
    types: [
        {
            access: true,
            // TODO(codegen): write {{ name }} input !
            type: 'input {{ name.replace("Service", "") }}Input { dv: Int!, sender: JSON! }',
        },
        {
            access: true,
            // TODO(codegen): write {{ name }} output !
            type: 'type {{ name.replace("Service", "") }}Output { id: String! }',
        },
    ],
    {% if type == "mutations" %}
    mutations: [
        {
            access: access.can{{ name.replace('Service', '') }},
            schema: '{{ convertFirstLetterToLower(name.replace("Service", "")) }}(data: {{ name.replace("Service", "") }}Input!): {{ name.replace("Service", "") }}Output',
            resolver: async (parent, args, context, info, extra = {}) => {
                // TODO(codegen): write {{ name }} logic!
                const { data } = args
                return {
                    id: null,
                }
            },
        },
    ],
    {% else %}
    queries: [
        {
            access: access.can{{ name.replace('Service', '') }},
            schema: 'execute{{ name.replace("Service", "") }} (data: {{ name.replace("Service", "") }}Input!): {{ name.replace("Service", "") }}Output',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                // TODO(codegen): write logic here
            },
        },
    ],
    {% endif %}
})

module.exports = {
    {{ name }},
}
