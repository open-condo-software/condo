interface Access {
    read: Boolean
    create: Boolean
    update: Boolean
    delete: Boolean
    auth: Boolean
}

interface SchemaFields {
    [key: string]: {
        type: Object
    }
}

interface Schema {
    fields: SchemaFields
    access: Access
    plugins?: any[]
}

interface CustomType {
    access: Boolean
    type: Schema
}

interface CustomSchemaQueryMutation {
    access: Boolean | Function
    schema: String
    resolver: (parent, args, context, info, extra) => Promise<any>
}

interface CustomSchema {
    types?: CustomType[],
    mutations?: CustomSchemaQueryMutation[],
    queries?: CustomSchemaQueryMutation[],
}

export class GQLListSchema {
    constructor(name: String, schema: Schema)
}

export class GQLCustomSchema {
    constructor(name: String, schema: CustomSchema)
}
