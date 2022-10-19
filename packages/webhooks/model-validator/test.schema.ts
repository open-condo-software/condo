export type Maybe<T> = T | null;

export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    JSON: any;
    Upload: any;
};

export type File = {
    __typename?: 'File';
    id?: Maybe<Scalars['ID']>;
    path?: Maybe<Scalars['String']>;
    filename?: Maybe<Scalars['String']>;
    originalFilename?: Maybe<Scalars['String']>;
    mimetype?: Maybe<Scalars['String']>;
    encoding?: Maybe<Scalars['String']>;
    publicUrl?: Maybe<Scalars['String']>;
};

export type MyModel = {
    __typename?: 'MyModel';
    stringField?: Maybe<Scalars['String']>;
    fileField?: Maybe<File>;
    boolField?: Maybe<Scalars['Boolean']>;
    selectField?: Maybe<Scalars['String']>;
    manyRelationField: Array<RelationModel>;
    manyEnumField?: Maybe<Array<EnumField>>;
    id: Scalars['ID'];
    intField?: Maybe<Scalars['Int']>;
    typedField?: Maybe<TypedField>;
};

export type TypedField = {
    __typename?: 'TypedField';
    dv: Scalars['Int'];
    substring: Scalars['String'];
};

export type RelationModel = {
    __typename?: 'RelationModel';
    myModel?: Maybe<MyModel>;
    id: Scalars['ID'];
};

export enum EnumField {
    EnumValue = 'EnumValue'
}

export type MyModelWhereInput = {
    AND?: Maybe<Array<Maybe<MyModelWhereInput>>>;
    OR?: Maybe<Array<Maybe<MyModelWhereInput>>>;
    stringField?: Maybe<Scalars['String']>;
    stringField_not?: Maybe<Scalars['String']>;
    stringField_contains?: Maybe<Scalars['String']>;
    stringField_not_contains?: Maybe<Scalars['String']>;
    stringField_starts_with?: Maybe<Scalars['String']>;
    stringField_not_starts_with?: Maybe<Scalars['String']>;
    stringField_ends_with?: Maybe<Scalars['String']>;
    stringField_not_ends_with?: Maybe<Scalars['String']>;
    stringField_i?: Maybe<Scalars['String']>;
    stringField_not_i?: Maybe<Scalars['String']>;
    stringField_contains_i?: Maybe<Scalars['String']>;
    stringField_not_contains_i?: Maybe<Scalars['String']>;
    stringField_starts_with_i?: Maybe<Scalars['String']>;
    stringField_not_starts_with_i?: Maybe<Scalars['String']>;
    stringField_ends_with_i?: Maybe<Scalars['String']>;
    stringField_not_ends_with_i?: Maybe<Scalars['String']>;
    stringField_in?: Maybe<Array<Maybe<Scalars['String']>>>;
    stringField_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
    fileField?: Maybe<Scalars['String']>;
    fileField_not?: Maybe<Scalars['String']>;
    fileField_in?: Maybe<Array<Maybe<Scalars['String']>>>;
    fileField_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
    boolField?: Maybe<Scalars['Boolean']>;
    boolField_not?: Maybe<Scalars['Boolean']>;
    /**  condition must be true for all nodes  */
    manyRelationField_every?: Maybe<RelationModelWhereInput>;
    /**  condition must be true for at least 1 node  */
    manyRelationField_some?: Maybe<RelationModelWhereInput>;
    /**  condition must be false for all nodes  */
    manyRelationField_none?: Maybe<RelationModelWhereInput>;
    manyEnumField?: Maybe<Array<EnumField>>;
    manyEnumField_not?: Maybe<Array<EnumField>>;
    manyEnumField_in?: Maybe<Array<Maybe<Array<EnumField>>>>;
    manyEnumField_not_in?: Maybe<Array<Maybe<Array<EnumField>>>>;
    id?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
    id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
    intField?: Maybe<Scalars['Int']>;
    intField_not?: Maybe<Scalars['Int']>;
    intField_lt?: Maybe<Scalars['Int']>;
    intField_lte?: Maybe<Scalars['Int']>;
    intField_gt?: Maybe<Scalars['Int']>;
    intField_gte?: Maybe<Scalars['Int']>;
    intField_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
    intField_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
    typedField?: Maybe<TypedFieldInput>;
    typedField_not?: Maybe<TypedFieldInput>;
    typedField_in?: Maybe<Array<Maybe<TypedFieldInput>>>;
    typedField_not_in?: Maybe<Array<Maybe<TypedFieldInput>>>;
};

export type TypedFieldInput = {
    dv: Scalars['Int'];
    substring: Scalars['String'];
};

export type RelationModelWhereInput = {
    AND?: Maybe<Array<Maybe<RelationModelWhereInput>>>;
    OR?: Maybe<Array<Maybe<RelationModelWhereInput>>>;
    myModel?: Maybe<MyModelWhereInput>;
    myModel_is_null?: Maybe<Scalars['Boolean']>;
    id?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
    id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
};