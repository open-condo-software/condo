export interface IConnectData {
    connect: IRelationshipField
}

export interface IRelationshipField {
    id: String | Number
}

export interface ISenderField {
    dv: Number
    fingerprint: String
}
