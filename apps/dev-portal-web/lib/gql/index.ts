import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never }
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
const defaultOptions = {} as const
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: { input: string, output: string }
    String: { input: string, output: string }
    Boolean: { input: boolean, output: boolean }
    Int: { input: number, output: number }
    Float: { input: number, output: number }
    /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
    JSON: { input: any, output: any }
    /** The `Upload` scalar type represents a file upload. */
    Upload: { input: any, output: any }
}

export type AllB2CAppPropertiesInput = {
    app: B2CAppWhereUniqueInput
    environment: AppEnvironment
    first: Scalars['Int']['input']
    skip: Scalars['Int']['input']
}

export type AllB2CAppPropertiesOutput = {
    __typename?: 'AllB2CAppPropertiesOutput'
    meta: B2CAppPropertyMeta
    objs: Array<B2CAppProperty>
}

export enum AppEnvironment {
    Development = 'development',
    Production = 'production',
}

export enum AppType {
    B2B = 'B2B',
    B2C = 'B2C',
}

export type AppWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type AuthenticateUserWithPhoneAndPasswordInput = {
    password: Scalars['String']['input']
    phone: Scalars['String']['input']
}

export type AuthenticateUserWithPhoneAndPasswordOutput = {
    __typename?: 'AuthenticateUserWithPhoneAndPasswordOutput'
    item: User
    token: Scalars['String']['output']
}

/**  B2C application  */
export type B2CApp = {
    __typename?: 'B2CApp'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the B2CApp List config, or
   *  2. As an alias to the field set on 'labelField' in the B2CApp List config, or
   *  3. As an alias to a 'name' field on the B2CApp List (if one exists), or
   *  4. As an alias to the 'id' field on the B2CApp List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>
    deletedAt?: Maybe<Scalars['String']['output']>
    /**  Developer company name which will be exported. If not specified, creator name will be taken  */
    developer?: Maybe<Scalars['String']['output']>
    /**  ID of this entity in the development environment. If set, subsequent publications to this environment will update the entity with the specified ID.  */
    developmentExportId?: Maybe<Scalars['String']['output']>
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>
    id: Scalars['ID']['output']
    /**  Icon of application  */
    logo?: Maybe<File>
    /**  Name of application  */
    name?: Maybe<Scalars['String']['output']>
    newId?: Maybe<Scalars['String']['output']>
    /**  ID of this entity in the production environment. If set, subsequent publications to this environment will update the entity with the specified ID.  */
    productionExportId?: Maybe<Scalars['String']['output']>
    /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>
    updatedAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>
    v?: Maybe<Scalars['Int']['output']>
}

/**  Link between service user and B2C App. The existence of this connection means that this condo user will have the rights to perform actions on behalf of the integration and modify some B2CApp-related models, such as B2CAppProperty / B2CAppBuild as soon as app will be published to specified environment  */
export type B2CAppAccessRight = {
    __typename?: 'B2CAppAccessRight'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the B2CAppAccessRight List config, or
   *  2. As an alias to the field set on 'labelField' in the B2CAppAccessRight List config, or
   *  3. As an alias to a 'name' field on the B2CAppAccessRight List (if one exists), or
   *  4. As an alias to the 'id' field on the B2CAppAccessRight List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    /**  Link to B2CApp  */
    app?: Maybe<B2CApp>
    /**  Email of service condo user linked to the published app  */
    condoUserEmail?: Maybe<Scalars['String']['output']>
    /**  ID of condo user, which will be linked to the published app  */
    condoUserId?: Maybe<Scalars['ID']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>
    deletedAt?: Maybe<Scalars['String']['output']>
    /**  ID of this entity in the development environment. If set, subsequent publications to this environment will update the entity with the specified ID.  */
    developmentExportId?: Maybe<Scalars['String']['output']>
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>
    /**  Condo environment  */
    environment?: Maybe<AppEnvironment>
    id: Scalars['ID']['output']
    newId?: Maybe<Scalars['String']['output']>
    /**  ID of this entity in the production environment. If set, subsequent publications to this environment will update the entity with the specified ID.  */
    productionExportId?: Maybe<Scalars['String']['output']>
    /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>
    updatedAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>
    v?: Maybe<Scalars['Int']['output']>
}

export type B2CAppAccessRightCreateInput = {
    app?: InputMaybe<B2CAppRelateToOneInput>
    condoUserId?: InputMaybe<Scalars['ID']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    environment?: InputMaybe<AppEnvironment>
    newId?: InputMaybe<Scalars['String']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

/**  A keystone list  */
export type B2CAppAccessRightHistoryRecord = {
    __typename?: 'B2CAppAccessRightHistoryRecord'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the B2CAppAccessRightHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the B2CAppAccessRightHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the B2CAppAccessRightHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the B2CAppAccessRightHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    app?: Maybe<Scalars['String']['output']>
    condoUserId?: Maybe<Scalars['ID']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    createdBy?: Maybe<Scalars['String']['output']>
    deletedAt?: Maybe<Scalars['String']['output']>
    developmentExportId?: Maybe<Scalars['String']['output']>
    dv?: Maybe<Scalars['Int']['output']>
    environment?: Maybe<Scalars['String']['output']>
    history_action?: Maybe<B2CAppAccessRightHistoryRecordHistoryActionType>
    history_date?: Maybe<Scalars['String']['output']>
    history_id?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    newId?: Maybe<Scalars['JSON']['output']>
    productionExportId?: Maybe<Scalars['String']['output']>
    sender?: Maybe<Scalars['JSON']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    updatedBy?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
}

export type B2CAppAccessRightHistoryRecordCreateInput = {
    app?: InputMaybe<Scalars['String']['input']>
    condoUserId?: InputMaybe<Scalars['ID']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    environment?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<B2CAppAccessRightHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export enum B2CAppAccessRightHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type B2CAppAccessRightHistoryRecordUpdateInput = {
    app?: InputMaybe<Scalars['String']['input']>
    condoUserId?: InputMaybe<Scalars['ID']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    environment?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<B2CAppAccessRightHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type B2CAppAccessRightHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<B2CAppAccessRightHistoryRecordWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<B2CAppAccessRightHistoryRecordWhereInput>>>
    app?: InputMaybe<Scalars['String']['input']>
    app_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    app_not?: InputMaybe<Scalars['String']['input']>
    app_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    condoUserId?: InputMaybe<Scalars['ID']['input']>
    condoUserId_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    condoUserId_not?: InputMaybe<Scalars['ID']['input']>
    condoUserId_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<Scalars['String']['input']>
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy_not?: InputMaybe<Scalars['String']['input']>
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    environment?: InputMaybe<Scalars['String']['input']>
    environment_contains?: InputMaybe<Scalars['String']['input']>
    environment_contains_i?: InputMaybe<Scalars['String']['input']>
    environment_ends_with?: InputMaybe<Scalars['String']['input']>
    environment_ends_with_i?: InputMaybe<Scalars['String']['input']>
    environment_i?: InputMaybe<Scalars['String']['input']>
    environment_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    environment_not?: InputMaybe<Scalars['String']['input']>
    environment_not_contains?: InputMaybe<Scalars['String']['input']>
    environment_not_contains_i?: InputMaybe<Scalars['String']['input']>
    environment_not_ends_with?: InputMaybe<Scalars['String']['input']>
    environment_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    environment_not_i?: InputMaybe<Scalars['String']['input']>
    environment_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    environment_not_starts_with?: InputMaybe<Scalars['String']['input']>
    environment_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    environment_starts_with?: InputMaybe<Scalars['String']['input']>
    environment_starts_with_i?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<B2CAppAccessRightHistoryRecordHistoryActionType>
    history_action_in?: InputMaybe<Array<InputMaybe<B2CAppAccessRightHistoryRecordHistoryActionType>>>
    history_action_not?: InputMaybe<B2CAppAccessRightHistoryRecordHistoryActionType>
    history_action_not_in?: InputMaybe<Array<InputMaybe<B2CAppAccessRightHistoryRecordHistoryActionType>>>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_date_gt?: InputMaybe<Scalars['String']['input']>
    history_date_gte?: InputMaybe<Scalars['String']['input']>
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_date_lt?: InputMaybe<Scalars['String']['input']>
    history_date_lte?: InputMaybe<Scalars['String']['input']>
    history_date_not?: InputMaybe<Scalars['String']['input']>
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id?: InputMaybe<Scalars['String']['input']>
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id_not?: InputMaybe<Scalars['String']['input']>
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    newId?: InputMaybe<Scalars['JSON']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    newId_not?: InputMaybe<Scalars['JSON']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender_not?: InputMaybe<Scalars['JSON']['input']>
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy_not?: InputMaybe<Scalars['String']['input']>
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type B2CAppAccessRightHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type B2CAppAccessRightHistoryRecordsCreateInput = {
    data?: InputMaybe<B2CAppAccessRightHistoryRecordCreateInput>
}

export type B2CAppAccessRightHistoryRecordsUpdateInput = {
    data?: InputMaybe<B2CAppAccessRightHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}

export type B2CAppAccessRightUpdateInput = {
    app?: InputMaybe<B2CAppRelateToOneInput>
    condoUserId?: InputMaybe<Scalars['ID']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    environment?: InputMaybe<AppEnvironment>
    newId?: InputMaybe<Scalars['String']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type B2CAppAccessRightWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<B2CAppAccessRightWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<B2CAppAccessRightWhereInput>>>
    app?: InputMaybe<B2CAppWhereInput>
    app_is_null?: InputMaybe<Scalars['Boolean']['input']>
    condoUserId?: InputMaybe<Scalars['ID']['input']>
    condoUserId_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    condoUserId_not?: InputMaybe<Scalars['ID']['input']>
    condoUserId_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<UserWhereInput>
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    environment?: InputMaybe<AppEnvironment>
    environment_in?: InputMaybe<Array<InputMaybe<AppEnvironment>>>
    environment_not?: InputMaybe<AppEnvironment>
    environment_not_in?: InputMaybe<Array<InputMaybe<AppEnvironment>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    newId?: InputMaybe<Scalars['String']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    newId_not?: InputMaybe<Scalars['String']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    sender_not?: InputMaybe<SenderFieldInput>
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<UserWhereInput>
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type B2CAppAccessRightWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type B2CAppAccessRightsCreateInput = {
    data?: InputMaybe<B2CAppAccessRightCreateInput>
}

export type B2CAppAccessRightsUpdateInput = {
    data?: InputMaybe<B2CAppAccessRightUpdateInput>
    id: Scalars['ID']['input']
}

/**  Cordova build of B2C Application  */
export type B2CAppBuild = {
    __typename?: 'B2CAppBuild'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the B2CAppBuild List config, or
   *  2. As an alias to the field set on 'labelField' in the B2CAppBuild List config, or
   *  3. As an alias to a 'name' field on the B2CAppBuild List (if one exists), or
   *  4. As an alias to the 'id' field on the B2CAppBuild List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    /**  Link to B2C application  */
    app?: Maybe<B2CApp>
    createdAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>
    /**  B2C app cordova build compressed to single .zip file  */
    data?: Maybe<File>
    deletedAt?: Maybe<Scalars['String']['output']>
    /**  ID of this entity in the development environment. If set, subsequent publications to this environment will update the entity with the specified ID.  */
    developmentExportId?: Maybe<Scalars['String']['output']>
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>
    id: Scalars['ID']['output']
    newId?: Maybe<Scalars['String']['output']>
    /**  ID of this entity in the production environment. If set, subsequent publications to this environment will update the entity with the specified ID.  */
    productionExportId?: Maybe<Scalars['String']['output']>
    /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>
    updatedAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>
    v?: Maybe<Scalars['Int']['output']>
    /**  Version of build which used to control builds inside B2CApp model. Must follow sem-ver notation format: <MAJOR>.<MINOR>.<PATCH> (E.g. 1.0.27, 3.6.0)  */
    version?: Maybe<Scalars['String']['output']>
}

export type B2CAppBuildCreateInput = {
    app?: InputMaybe<B2CAppRelateToOneInput>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    data?: InputMaybe<Scalars['Upload']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
    version?: InputMaybe<Scalars['String']['input']>
}

/**  A keystone list  */
export type B2CAppBuildHistoryRecord = {
    __typename?: 'B2CAppBuildHistoryRecord'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the B2CAppBuildHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the B2CAppBuildHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the B2CAppBuildHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the B2CAppBuildHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    app?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    createdBy?: Maybe<Scalars['String']['output']>
    data?: Maybe<Scalars['JSON']['output']>
    deletedAt?: Maybe<Scalars['String']['output']>
    developmentExportId?: Maybe<Scalars['String']['output']>
    dv?: Maybe<Scalars['Int']['output']>
    history_action?: Maybe<B2CAppBuildHistoryRecordHistoryActionType>
    history_date?: Maybe<Scalars['String']['output']>
    history_id?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    newId?: Maybe<Scalars['JSON']['output']>
    productionExportId?: Maybe<Scalars['String']['output']>
    sender?: Maybe<Scalars['JSON']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    updatedBy?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
    version?: Maybe<Scalars['String']['output']>
}

export type B2CAppBuildHistoryRecordCreateInput = {
    app?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    data?: InputMaybe<Scalars['JSON']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    history_action?: InputMaybe<B2CAppBuildHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    version?: InputMaybe<Scalars['String']['input']>
}

export enum B2CAppBuildHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type B2CAppBuildHistoryRecordUpdateInput = {
    app?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    data?: InputMaybe<Scalars['JSON']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    history_action?: InputMaybe<B2CAppBuildHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    version?: InputMaybe<Scalars['String']['input']>
}

export type B2CAppBuildHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<B2CAppBuildHistoryRecordWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<B2CAppBuildHistoryRecordWhereInput>>>
    app?: InputMaybe<Scalars['String']['input']>
    app_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    app_not?: InputMaybe<Scalars['String']['input']>
    app_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<Scalars['String']['input']>
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy_not?: InputMaybe<Scalars['String']['input']>
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    data?: InputMaybe<Scalars['JSON']['input']>
    data_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    data_not?: InputMaybe<Scalars['JSON']['input']>
    data_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    history_action?: InputMaybe<B2CAppBuildHistoryRecordHistoryActionType>
    history_action_in?: InputMaybe<Array<InputMaybe<B2CAppBuildHistoryRecordHistoryActionType>>>
    history_action_not?: InputMaybe<B2CAppBuildHistoryRecordHistoryActionType>
    history_action_not_in?: InputMaybe<Array<InputMaybe<B2CAppBuildHistoryRecordHistoryActionType>>>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_date_gt?: InputMaybe<Scalars['String']['input']>
    history_date_gte?: InputMaybe<Scalars['String']['input']>
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_date_lt?: InputMaybe<Scalars['String']['input']>
    history_date_lte?: InputMaybe<Scalars['String']['input']>
    history_date_not?: InputMaybe<Scalars['String']['input']>
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id?: InputMaybe<Scalars['String']['input']>
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id_not?: InputMaybe<Scalars['String']['input']>
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    newId?: InputMaybe<Scalars['JSON']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    newId_not?: InputMaybe<Scalars['JSON']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender_not?: InputMaybe<Scalars['JSON']['input']>
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy_not?: InputMaybe<Scalars['String']['input']>
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    version?: InputMaybe<Scalars['String']['input']>
    version_contains?: InputMaybe<Scalars['String']['input']>
    version_contains_i?: InputMaybe<Scalars['String']['input']>
    version_ends_with?: InputMaybe<Scalars['String']['input']>
    version_ends_with_i?: InputMaybe<Scalars['String']['input']>
    version_i?: InputMaybe<Scalars['String']['input']>
    version_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    version_not?: InputMaybe<Scalars['String']['input']>
    version_not_contains?: InputMaybe<Scalars['String']['input']>
    version_not_contains_i?: InputMaybe<Scalars['String']['input']>
    version_not_ends_with?: InputMaybe<Scalars['String']['input']>
    version_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    version_not_i?: InputMaybe<Scalars['String']['input']>
    version_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    version_not_starts_with?: InputMaybe<Scalars['String']['input']>
    version_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    version_starts_with?: InputMaybe<Scalars['String']['input']>
    version_starts_with_i?: InputMaybe<Scalars['String']['input']>
}

export type B2CAppBuildHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type B2CAppBuildHistoryRecordsCreateInput = {
    data?: InputMaybe<B2CAppBuildHistoryRecordCreateInput>
}

export type B2CAppBuildHistoryRecordsUpdateInput = {
    data?: InputMaybe<B2CAppBuildHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}

export type B2CAppBuildUpdateInput = {
    app?: InputMaybe<B2CAppRelateToOneInput>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    data?: InputMaybe<Scalars['Upload']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
    version?: InputMaybe<Scalars['String']['input']>
}

export type B2CAppBuildWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<B2CAppBuildWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<B2CAppBuildWhereInput>>>
    app?: InputMaybe<B2CAppWhereInput>
    app_is_null?: InputMaybe<Scalars['Boolean']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<UserWhereInput>
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    data?: InputMaybe<Scalars['String']['input']>
    data_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    data_not?: InputMaybe<Scalars['String']['input']>
    data_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    newId?: InputMaybe<Scalars['String']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    newId_not?: InputMaybe<Scalars['String']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    sender_not?: InputMaybe<SenderFieldInput>
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<UserWhereInput>
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    version?: InputMaybe<Scalars['String']['input']>
    version_contains?: InputMaybe<Scalars['String']['input']>
    version_contains_i?: InputMaybe<Scalars['String']['input']>
    version_ends_with?: InputMaybe<Scalars['String']['input']>
    version_ends_with_i?: InputMaybe<Scalars['String']['input']>
    version_i?: InputMaybe<Scalars['String']['input']>
    version_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    version_not?: InputMaybe<Scalars['String']['input']>
    version_not_contains?: InputMaybe<Scalars['String']['input']>
    version_not_contains_i?: InputMaybe<Scalars['String']['input']>
    version_not_ends_with?: InputMaybe<Scalars['String']['input']>
    version_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    version_not_i?: InputMaybe<Scalars['String']['input']>
    version_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    version_not_starts_with?: InputMaybe<Scalars['String']['input']>
    version_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    version_starts_with?: InputMaybe<Scalars['String']['input']>
    version_starts_with_i?: InputMaybe<Scalars['String']['input']>
}

export type B2CAppBuildWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type B2CAppBuildsCreateInput = {
    data?: InputMaybe<B2CAppBuildCreateInput>
}

export type B2CAppBuildsUpdateInput = {
    data?: InputMaybe<B2CAppBuildUpdateInput>
    id: Scalars['ID']['input']
}

export type B2CAppCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developer?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    logo?: InputMaybe<Scalars['Upload']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

/**  A keystone list  */
export type B2CAppHistoryRecord = {
    __typename?: 'B2CAppHistoryRecord'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the B2CAppHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the B2CAppHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the B2CAppHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the B2CAppHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    createdBy?: Maybe<Scalars['String']['output']>
    deletedAt?: Maybe<Scalars['String']['output']>
    developer?: Maybe<Scalars['String']['output']>
    developmentExportId?: Maybe<Scalars['String']['output']>
    dv?: Maybe<Scalars['Int']['output']>
    history_action?: Maybe<B2CAppHistoryRecordHistoryActionType>
    history_date?: Maybe<Scalars['String']['output']>
    history_id?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    logo?: Maybe<Scalars['JSON']['output']>
    name?: Maybe<Scalars['String']['output']>
    newId?: Maybe<Scalars['JSON']['output']>
    productionExportId?: Maybe<Scalars['String']['output']>
    sender?: Maybe<Scalars['JSON']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    updatedBy?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
}

export type B2CAppHistoryRecordCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developer?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    history_action?: InputMaybe<B2CAppHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    logo?: InputMaybe<Scalars['JSON']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export enum B2CAppHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type B2CAppHistoryRecordUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developer?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    history_action?: InputMaybe<B2CAppHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    logo?: InputMaybe<Scalars['JSON']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type B2CAppHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<B2CAppHistoryRecordWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<B2CAppHistoryRecordWhereInput>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<Scalars['String']['input']>
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy_not?: InputMaybe<Scalars['String']['input']>
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developer?: InputMaybe<Scalars['String']['input']>
    developer_contains?: InputMaybe<Scalars['String']['input']>
    developer_contains_i?: InputMaybe<Scalars['String']['input']>
    developer_ends_with?: InputMaybe<Scalars['String']['input']>
    developer_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developer_i?: InputMaybe<Scalars['String']['input']>
    developer_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developer_not?: InputMaybe<Scalars['String']['input']>
    developer_not_contains?: InputMaybe<Scalars['String']['input']>
    developer_not_contains_i?: InputMaybe<Scalars['String']['input']>
    developer_not_ends_with?: InputMaybe<Scalars['String']['input']>
    developer_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developer_not_i?: InputMaybe<Scalars['String']['input']>
    developer_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developer_not_starts_with?: InputMaybe<Scalars['String']['input']>
    developer_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developer_starts_with?: InputMaybe<Scalars['String']['input']>
    developer_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    history_action?: InputMaybe<B2CAppHistoryRecordHistoryActionType>
    history_action_in?: InputMaybe<Array<InputMaybe<B2CAppHistoryRecordHistoryActionType>>>
    history_action_not?: InputMaybe<B2CAppHistoryRecordHistoryActionType>
    history_action_not_in?: InputMaybe<Array<InputMaybe<B2CAppHistoryRecordHistoryActionType>>>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_date_gt?: InputMaybe<Scalars['String']['input']>
    history_date_gte?: InputMaybe<Scalars['String']['input']>
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_date_lt?: InputMaybe<Scalars['String']['input']>
    history_date_lte?: InputMaybe<Scalars['String']['input']>
    history_date_not?: InputMaybe<Scalars['String']['input']>
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id?: InputMaybe<Scalars['String']['input']>
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id_not?: InputMaybe<Scalars['String']['input']>
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    logo?: InputMaybe<Scalars['JSON']['input']>
    logo_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    logo_not?: InputMaybe<Scalars['JSON']['input']>
    logo_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    name?: InputMaybe<Scalars['String']['input']>
    name_contains?: InputMaybe<Scalars['String']['input']>
    name_contains_i?: InputMaybe<Scalars['String']['input']>
    name_ends_with?: InputMaybe<Scalars['String']['input']>
    name_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_i?: InputMaybe<Scalars['String']['input']>
    name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not?: InputMaybe<Scalars['String']['input']>
    name_not_contains?: InputMaybe<Scalars['String']['input']>
    name_not_contains_i?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_not_i?: InputMaybe<Scalars['String']['input']>
    name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not_starts_with?: InputMaybe<Scalars['String']['input']>
    name_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    name_starts_with?: InputMaybe<Scalars['String']['input']>
    name_starts_with_i?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    newId_not?: InputMaybe<Scalars['JSON']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender_not?: InputMaybe<Scalars['JSON']['input']>
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy_not?: InputMaybe<Scalars['String']['input']>
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type B2CAppHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type B2CAppHistoryRecordsCreateInput = {
    data?: InputMaybe<B2CAppHistoryRecordCreateInput>
}

export type B2CAppHistoryRecordsUpdateInput = {
    data?: InputMaybe<B2CAppHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}

export type B2CAppProperty = {
    __typename?: 'B2CAppProperty'
    address: Scalars['String']['output']
    id: Scalars['ID']['output']
}

export type B2CAppPropertyMeta = {
    __typename?: 'B2CAppPropertyMeta'
    count: Scalars['Int']['output']
}

export type B2CAppPublishOptions = {
    build?: InputMaybe<B2CAppBuildWhereUniqueInput>
    info?: InputMaybe<Scalars['Boolean']['input']>
}

/**  A model that determines the ability to publish a mini-application to the production stand, as well as the status of passing the pre-release checkout  */
export type B2CAppPublishRequest = {
    __typename?: 'B2CAppPublishRequest'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the B2CAppPublishRequest List config, or
   *  2. As an alias to the field set on 'labelField' in the B2CAppPublishRequest List config, or
   *  3. As an alias to a 'name' field on the B2CAppPublishRequest List (if one exists), or
   *  4. As an alias to the 'id' field on the B2CAppPublishRequest List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    /**  Reference to the application to which this request applies  */
    app?: Maybe<B2CApp>
    createdAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>
    deletedAt?: Maybe<Scalars['String']['output']>
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>
    id: Scalars['ID']['output']
    /**  Whether the application has been tested before release. Required prerequisite for obtaining permission to publish  */
    isAppTested?: Maybe<Scalars['Boolean']['output']>
    /**  A partnership agreement must be concluded before publication. This checkbox is responsible for the existence of such a contract. Required prerequisite for obtaining permission to publish  */
    isContractSigned?: Maybe<Scalars['Boolean']['output']>
    /**  Before publishing for the first time, it is necessary to ensure that all information about the application is valid and understandable for the user. Required prerequisite for obtaining permission to publish  */
    isInfoApproved?: Maybe<Scalars['Boolean']['output']>
    newId?: Maybe<Scalars['String']['output']>
    /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>
    /**  Status of consideration of the current request  */
    status?: Maybe<B2CAppPublishRequestStatusType>
    updatedAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>
    v?: Maybe<Scalars['Int']['output']>
}

export type B2CAppPublishRequestCreateInput = {
    app?: InputMaybe<B2CAppRelateToOneInput>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    isAppTested?: InputMaybe<Scalars['Boolean']['input']>
    isContractSigned?: InputMaybe<Scalars['Boolean']['input']>
    isInfoApproved?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    status?: InputMaybe<B2CAppPublishRequestStatusType>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

/**  A keystone list  */
export type B2CAppPublishRequestHistoryRecord = {
    __typename?: 'B2CAppPublishRequestHistoryRecord'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the B2CAppPublishRequestHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the B2CAppPublishRequestHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the B2CAppPublishRequestHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the B2CAppPublishRequestHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    app?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    createdBy?: Maybe<Scalars['String']['output']>
    deletedAt?: Maybe<Scalars['String']['output']>
    dv?: Maybe<Scalars['Int']['output']>
    history_action?: Maybe<B2CAppPublishRequestHistoryRecordHistoryActionType>
    history_date?: Maybe<Scalars['String']['output']>
    history_id?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    isAppTested?: Maybe<Scalars['Boolean']['output']>
    isContractSigned?: Maybe<Scalars['Boolean']['output']>
    isInfoApproved?: Maybe<Scalars['Boolean']['output']>
    newId?: Maybe<Scalars['JSON']['output']>
    sender?: Maybe<Scalars['JSON']['output']>
    status?: Maybe<Scalars['String']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    updatedBy?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
}

export type B2CAppPublishRequestHistoryRecordCreateInput = {
    app?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    history_action?: InputMaybe<B2CAppPublishRequestHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    isAppTested?: InputMaybe<Scalars['Boolean']['input']>
    isContractSigned?: InputMaybe<Scalars['Boolean']['input']>
    isInfoApproved?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    status?: InputMaybe<Scalars['String']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export enum B2CAppPublishRequestHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type B2CAppPublishRequestHistoryRecordUpdateInput = {
    app?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    history_action?: InputMaybe<B2CAppPublishRequestHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    isAppTested?: InputMaybe<Scalars['Boolean']['input']>
    isContractSigned?: InputMaybe<Scalars['Boolean']['input']>
    isInfoApproved?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    status?: InputMaybe<Scalars['String']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type B2CAppPublishRequestHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestHistoryRecordWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestHistoryRecordWhereInput>>>
    app?: InputMaybe<Scalars['String']['input']>
    app_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    app_not?: InputMaybe<Scalars['String']['input']>
    app_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<Scalars['String']['input']>
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy_not?: InputMaybe<Scalars['String']['input']>
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    history_action?: InputMaybe<B2CAppPublishRequestHistoryRecordHistoryActionType>
    history_action_in?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestHistoryRecordHistoryActionType>>>
    history_action_not?: InputMaybe<B2CAppPublishRequestHistoryRecordHistoryActionType>
    history_action_not_in?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestHistoryRecordHistoryActionType>>>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_date_gt?: InputMaybe<Scalars['String']['input']>
    history_date_gte?: InputMaybe<Scalars['String']['input']>
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_date_lt?: InputMaybe<Scalars['String']['input']>
    history_date_lte?: InputMaybe<Scalars['String']['input']>
    history_date_not?: InputMaybe<Scalars['String']['input']>
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id?: InputMaybe<Scalars['String']['input']>
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id_not?: InputMaybe<Scalars['String']['input']>
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    isAppTested?: InputMaybe<Scalars['Boolean']['input']>
    isAppTested_not?: InputMaybe<Scalars['Boolean']['input']>
    isContractSigned?: InputMaybe<Scalars['Boolean']['input']>
    isContractSigned_not?: InputMaybe<Scalars['Boolean']['input']>
    isInfoApproved?: InputMaybe<Scalars['Boolean']['input']>
    isInfoApproved_not?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    newId_not?: InputMaybe<Scalars['JSON']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender?: InputMaybe<Scalars['JSON']['input']>
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender_not?: InputMaybe<Scalars['JSON']['input']>
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    status?: InputMaybe<Scalars['String']['input']>
    status_contains?: InputMaybe<Scalars['String']['input']>
    status_contains_i?: InputMaybe<Scalars['String']['input']>
    status_ends_with?: InputMaybe<Scalars['String']['input']>
    status_ends_with_i?: InputMaybe<Scalars['String']['input']>
    status_i?: InputMaybe<Scalars['String']['input']>
    status_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    status_not?: InputMaybe<Scalars['String']['input']>
    status_not_contains?: InputMaybe<Scalars['String']['input']>
    status_not_contains_i?: InputMaybe<Scalars['String']['input']>
    status_not_ends_with?: InputMaybe<Scalars['String']['input']>
    status_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    status_not_i?: InputMaybe<Scalars['String']['input']>
    status_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    status_not_starts_with?: InputMaybe<Scalars['String']['input']>
    status_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    status_starts_with?: InputMaybe<Scalars['String']['input']>
    status_starts_with_i?: InputMaybe<Scalars['String']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy_not?: InputMaybe<Scalars['String']['input']>
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type B2CAppPublishRequestHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type B2CAppPublishRequestHistoryRecordsCreateInput = {
    data?: InputMaybe<B2CAppPublishRequestHistoryRecordCreateInput>
}

export type B2CAppPublishRequestHistoryRecordsUpdateInput = {
    data?: InputMaybe<B2CAppPublishRequestHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}

export enum B2CAppPublishRequestStatusType {
    Approved = 'approved',
    Pending = 'pending',
}

export type B2CAppPublishRequestUpdateInput = {
    app?: InputMaybe<B2CAppRelateToOneInput>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    isAppTested?: InputMaybe<Scalars['Boolean']['input']>
    isContractSigned?: InputMaybe<Scalars['Boolean']['input']>
    isInfoApproved?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    status?: InputMaybe<B2CAppPublishRequestStatusType>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type B2CAppPublishRequestWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestWhereInput>>>
    app?: InputMaybe<B2CAppWhereInput>
    app_is_null?: InputMaybe<Scalars['Boolean']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<UserWhereInput>
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    isAppTested?: InputMaybe<Scalars['Boolean']['input']>
    isAppTested_not?: InputMaybe<Scalars['Boolean']['input']>
    isContractSigned?: InputMaybe<Scalars['Boolean']['input']>
    isContractSigned_not?: InputMaybe<Scalars['Boolean']['input']>
    isInfoApproved?: InputMaybe<Scalars['Boolean']['input']>
    isInfoApproved_not?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    newId_not?: InputMaybe<Scalars['String']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    sender?: InputMaybe<SenderFieldInput>
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    sender_not?: InputMaybe<SenderFieldInput>
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    status?: InputMaybe<B2CAppPublishRequestStatusType>
    status_in?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestStatusType>>>
    status_not?: InputMaybe<B2CAppPublishRequestStatusType>
    status_not_in?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestStatusType>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<UserWhereInput>
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type B2CAppPublishRequestWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type B2CAppPublishRequestsCreateInput = {
    data?: InputMaybe<B2CAppPublishRequestCreateInput>
}

export type B2CAppPublishRequestsUpdateInput = {
    data?: InputMaybe<B2CAppPublishRequestUpdateInput>
    id: Scalars['ID']['input']
}

export type B2CAppRelateToOneInput = {
    connect?: InputMaybe<B2CAppWhereUniqueInput>
    create?: InputMaybe<B2CAppCreateInput>
    disconnect?: InputMaybe<B2CAppWhereUniqueInput>
    disconnectAll?: InputMaybe<Scalars['Boolean']['input']>
}

export type B2CAppUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    developer?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    logo?: InputMaybe<Scalars['Upload']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type B2CAppWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<B2CAppWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<B2CAppWhereInput>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<UserWhereInput>
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developer?: InputMaybe<Scalars['String']['input']>
    developer_contains?: InputMaybe<Scalars['String']['input']>
    developer_contains_i?: InputMaybe<Scalars['String']['input']>
    developer_ends_with?: InputMaybe<Scalars['String']['input']>
    developer_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developer_i?: InputMaybe<Scalars['String']['input']>
    developer_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developer_not?: InputMaybe<Scalars['String']['input']>
    developer_not_contains?: InputMaybe<Scalars['String']['input']>
    developer_not_contains_i?: InputMaybe<Scalars['String']['input']>
    developer_not_ends_with?: InputMaybe<Scalars['String']['input']>
    developer_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developer_not_i?: InputMaybe<Scalars['String']['input']>
    developer_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developer_not_starts_with?: InputMaybe<Scalars['String']['input']>
    developer_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developer_starts_with?: InputMaybe<Scalars['String']['input']>
    developer_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    developmentExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    developmentExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    logo?: InputMaybe<Scalars['String']['input']>
    logo_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    logo_not?: InputMaybe<Scalars['String']['input']>
    logo_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name?: InputMaybe<Scalars['String']['input']>
    name_contains?: InputMaybe<Scalars['String']['input']>
    name_contains_i?: InputMaybe<Scalars['String']['input']>
    name_ends_with?: InputMaybe<Scalars['String']['input']>
    name_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_i?: InputMaybe<Scalars['String']['input']>
    name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not?: InputMaybe<Scalars['String']['input']>
    name_not_contains?: InputMaybe<Scalars['String']['input']>
    name_not_contains_i?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_not_i?: InputMaybe<Scalars['String']['input']>
    name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not_starts_with?: InputMaybe<Scalars['String']['input']>
    name_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    name_starts_with?: InputMaybe<Scalars['String']['input']>
    name_starts_with_i?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    newId_not?: InputMaybe<Scalars['String']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_contains_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    productionExportId_not_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with?: InputMaybe<Scalars['String']['input']>
    productionExportId_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    sender_not?: InputMaybe<SenderFieldInput>
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<UserWhereInput>
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type B2CAppWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type B2CAppsCreateInput = {
    data?: InputMaybe<B2CAppCreateInput>
}

export type B2CAppsUpdateInput = {
    data?: InputMaybe<B2CAppUpdateInput>
    id: Scalars['ID']['input']
}

export enum CacheControlScope {
    Private = 'PRIVATE',
    Public = 'PUBLIC',
}

export type CompleteConfirmEmailActionInput = {
    actionId: Scalars['String']['input']
    code: Scalars['String']['input']
    dv: Scalars['Int']['input']
    sender: SenderFieldInput
}

export type CompleteConfirmEmailActionOutput = {
    __typename?: 'CompleteConfirmEmailActionOutput'
    status: Scalars['String']['output']
}

export type CompleteConfirmPhoneActionInput = {
    actionId: Scalars['String']['input']
    code: Scalars['String']['input']
    dv: Scalars['Int']['input']
    sender: SenderFieldInput
}

export type CompleteConfirmPhoneActionOutput = {
    __typename?: 'CompleteConfirmPhoneActionOutput'
    status: Scalars['String']['output']
}

/**  Internal schema used for user email confirmation. It's impossible to work with it via API.  */
export type ConfirmEmailAction = {
    __typename?: 'ConfirmEmailAction'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ConfirmEmailAction List config, or
   *  2. As an alias to the field set on 'labelField' in the ConfirmEmailAction List config, or
   *  3. As an alias to a 'name' field on the ConfirmEmailAction List (if one exists), or
   *  4. As an alias to the 'id' field on the ConfirmEmailAction List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    /**  Number of used attempts to enter the code. When 5 attempts are reached, this action becomes invalid.  */
    attempts?: Maybe<Scalars['Int']['output']>
    /**  Confirmation code. Generated inside one of action-creators, such as startConfirmEmailAction  */
    code?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>
    deletedAt?: Maybe<Scalars['String']['output']>
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>
    /**  Email to be verified  */
    email?: Maybe<Scalars['String']['output']>
    /**  Action expiration time. After the expiration time, it will not be possible to call action-required mutations with the current ConfirmEmailAction.  */
    expiresAt?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    /**  Verifies specified email. If the email has been recently verified (before ConfirmEmailAction expired), then knowing the ID of ConfirmEmailAction allows to register the user.  */
    isVerified?: Maybe<Scalars['Boolean']['output']>
    newId?: Maybe<Scalars['String']['output']>
    /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>
    updatedAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>
    v?: Maybe<Scalars['Int']['output']>
}

export type ConfirmEmailActionCreateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>
    code?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    email?: InputMaybe<Scalars['String']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

/**  A keystone list  */
export type ConfirmEmailActionHistoryRecord = {
    __typename?: 'ConfirmEmailActionHistoryRecord'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ConfirmEmailActionHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the ConfirmEmailActionHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the ConfirmEmailActionHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the ConfirmEmailActionHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    attempts?: Maybe<Scalars['Int']['output']>
    code?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    createdBy?: Maybe<Scalars['String']['output']>
    deletedAt?: Maybe<Scalars['String']['output']>
    dv?: Maybe<Scalars['Int']['output']>
    email?: Maybe<Scalars['String']['output']>
    expiresAt?: Maybe<Scalars['String']['output']>
    history_action?: Maybe<ConfirmEmailActionHistoryRecordHistoryActionType>
    history_date?: Maybe<Scalars['String']['output']>
    history_id?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    isVerified?: Maybe<Scalars['Boolean']['output']>
    newId?: Maybe<Scalars['JSON']['output']>
    sender?: Maybe<Scalars['JSON']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    updatedBy?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
}

export type ConfirmEmailActionHistoryRecordCreateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>
    code?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    email?: InputMaybe<Scalars['String']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<ConfirmEmailActionHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export enum ConfirmEmailActionHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type ConfirmEmailActionHistoryRecordUpdateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>
    code?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    email?: InputMaybe<Scalars['String']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<ConfirmEmailActionHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type ConfirmEmailActionHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<ConfirmEmailActionHistoryRecordWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<ConfirmEmailActionHistoryRecordWhereInput>>>
    attempts?: InputMaybe<Scalars['Int']['input']>
    attempts_gt?: InputMaybe<Scalars['Int']['input']>
    attempts_gte?: InputMaybe<Scalars['Int']['input']>
    attempts_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    attempts_lt?: InputMaybe<Scalars['Int']['input']>
    attempts_lte?: InputMaybe<Scalars['Int']['input']>
    attempts_not?: InputMaybe<Scalars['Int']['input']>
    attempts_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    code?: InputMaybe<Scalars['String']['input']>
    code_contains?: InputMaybe<Scalars['String']['input']>
    code_contains_i?: InputMaybe<Scalars['String']['input']>
    code_ends_with?: InputMaybe<Scalars['String']['input']>
    code_ends_with_i?: InputMaybe<Scalars['String']['input']>
    code_i?: InputMaybe<Scalars['String']['input']>
    code_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    code_not?: InputMaybe<Scalars['String']['input']>
    code_not_contains?: InputMaybe<Scalars['String']['input']>
    code_not_contains_i?: InputMaybe<Scalars['String']['input']>
    code_not_ends_with?: InputMaybe<Scalars['String']['input']>
    code_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    code_not_i?: InputMaybe<Scalars['String']['input']>
    code_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    code_not_starts_with?: InputMaybe<Scalars['String']['input']>
    code_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    code_starts_with?: InputMaybe<Scalars['String']['input']>
    code_starts_with_i?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<Scalars['String']['input']>
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy_not?: InputMaybe<Scalars['String']['input']>
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    email?: InputMaybe<Scalars['String']['input']>
    email_contains?: InputMaybe<Scalars['String']['input']>
    email_contains_i?: InputMaybe<Scalars['String']['input']>
    email_ends_with?: InputMaybe<Scalars['String']['input']>
    email_ends_with_i?: InputMaybe<Scalars['String']['input']>
    email_i?: InputMaybe<Scalars['String']['input']>
    email_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    email_not?: InputMaybe<Scalars['String']['input']>
    email_not_contains?: InputMaybe<Scalars['String']['input']>
    email_not_contains_i?: InputMaybe<Scalars['String']['input']>
    email_not_ends_with?: InputMaybe<Scalars['String']['input']>
    email_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    email_not_i?: InputMaybe<Scalars['String']['input']>
    email_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    email_not_starts_with?: InputMaybe<Scalars['String']['input']>
    email_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    email_starts_with?: InputMaybe<Scalars['String']['input']>
    email_starts_with_i?: InputMaybe<Scalars['String']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    expiresAt_gt?: InputMaybe<Scalars['String']['input']>
    expiresAt_gte?: InputMaybe<Scalars['String']['input']>
    expiresAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    expiresAt_lt?: InputMaybe<Scalars['String']['input']>
    expiresAt_lte?: InputMaybe<Scalars['String']['input']>
    expiresAt_not?: InputMaybe<Scalars['String']['input']>
    expiresAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_action?: InputMaybe<ConfirmEmailActionHistoryRecordHistoryActionType>
    history_action_in?: InputMaybe<Array<InputMaybe<ConfirmEmailActionHistoryRecordHistoryActionType>>>
    history_action_not?: InputMaybe<ConfirmEmailActionHistoryRecordHistoryActionType>
    history_action_not_in?: InputMaybe<Array<InputMaybe<ConfirmEmailActionHistoryRecordHistoryActionType>>>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_date_gt?: InputMaybe<Scalars['String']['input']>
    history_date_gte?: InputMaybe<Scalars['String']['input']>
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_date_lt?: InputMaybe<Scalars['String']['input']>
    history_date_lte?: InputMaybe<Scalars['String']['input']>
    history_date_not?: InputMaybe<Scalars['String']['input']>
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id?: InputMaybe<Scalars['String']['input']>
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id_not?: InputMaybe<Scalars['String']['input']>
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    isVerified_not?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    newId_not?: InputMaybe<Scalars['JSON']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender?: InputMaybe<Scalars['JSON']['input']>
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender_not?: InputMaybe<Scalars['JSON']['input']>
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy_not?: InputMaybe<Scalars['String']['input']>
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type ConfirmEmailActionHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type ConfirmEmailActionHistoryRecordsCreateInput = {
    data?: InputMaybe<ConfirmEmailActionHistoryRecordCreateInput>
}

export type ConfirmEmailActionHistoryRecordsUpdateInput = {
    data?: InputMaybe<ConfirmEmailActionHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}

export type ConfirmEmailActionUpdateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>
    code?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    email?: InputMaybe<Scalars['String']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type ConfirmEmailActionWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<ConfirmEmailActionWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<ConfirmEmailActionWhereInput>>>
    attempts?: InputMaybe<Scalars['Int']['input']>
    attempts_gt?: InputMaybe<Scalars['Int']['input']>
    attempts_gte?: InputMaybe<Scalars['Int']['input']>
    attempts_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    attempts_lt?: InputMaybe<Scalars['Int']['input']>
    attempts_lte?: InputMaybe<Scalars['Int']['input']>
    attempts_not?: InputMaybe<Scalars['Int']['input']>
    attempts_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    code?: InputMaybe<Scalars['String']['input']>
    code_contains?: InputMaybe<Scalars['String']['input']>
    code_contains_i?: InputMaybe<Scalars['String']['input']>
    code_ends_with?: InputMaybe<Scalars['String']['input']>
    code_ends_with_i?: InputMaybe<Scalars['String']['input']>
    code_i?: InputMaybe<Scalars['String']['input']>
    code_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    code_not?: InputMaybe<Scalars['String']['input']>
    code_not_contains?: InputMaybe<Scalars['String']['input']>
    code_not_contains_i?: InputMaybe<Scalars['String']['input']>
    code_not_ends_with?: InputMaybe<Scalars['String']['input']>
    code_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    code_not_i?: InputMaybe<Scalars['String']['input']>
    code_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    code_not_starts_with?: InputMaybe<Scalars['String']['input']>
    code_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    code_starts_with?: InputMaybe<Scalars['String']['input']>
    code_starts_with_i?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<UserWhereInput>
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    email?: InputMaybe<Scalars['String']['input']>
    email_contains?: InputMaybe<Scalars['String']['input']>
    email_contains_i?: InputMaybe<Scalars['String']['input']>
    email_ends_with?: InputMaybe<Scalars['String']['input']>
    email_ends_with_i?: InputMaybe<Scalars['String']['input']>
    email_i?: InputMaybe<Scalars['String']['input']>
    email_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    email_not?: InputMaybe<Scalars['String']['input']>
    email_not_contains?: InputMaybe<Scalars['String']['input']>
    email_not_contains_i?: InputMaybe<Scalars['String']['input']>
    email_not_ends_with?: InputMaybe<Scalars['String']['input']>
    email_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    email_not_i?: InputMaybe<Scalars['String']['input']>
    email_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    email_not_starts_with?: InputMaybe<Scalars['String']['input']>
    email_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    email_starts_with?: InputMaybe<Scalars['String']['input']>
    email_starts_with_i?: InputMaybe<Scalars['String']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    expiresAt_gt?: InputMaybe<Scalars['String']['input']>
    expiresAt_gte?: InputMaybe<Scalars['String']['input']>
    expiresAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    expiresAt_lt?: InputMaybe<Scalars['String']['input']>
    expiresAt_lte?: InputMaybe<Scalars['String']['input']>
    expiresAt_not?: InputMaybe<Scalars['String']['input']>
    expiresAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    isVerified_not?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    newId_not?: InputMaybe<Scalars['String']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    sender?: InputMaybe<SenderFieldInput>
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    sender_not?: InputMaybe<SenderFieldInput>
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<UserWhereInput>
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type ConfirmEmailActionWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type ConfirmEmailActionsCreateInput = {
    data?: InputMaybe<ConfirmEmailActionCreateInput>
}

export type ConfirmEmailActionsUpdateInput = {
    data?: InputMaybe<ConfirmEmailActionUpdateInput>
    id: Scalars['ID']['input']
}

/**  Internal schema used for user phone confirmation. It's impossible to work with it via API.  */
export type ConfirmPhoneAction = {
    __typename?: 'ConfirmPhoneAction'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ConfirmPhoneAction List config, or
   *  2. As an alias to the field set on 'labelField' in the ConfirmPhoneAction List config, or
   *  3. As an alias to a 'name' field on the ConfirmPhoneAction List (if one exists), or
   *  4. As an alias to the 'id' field on the ConfirmPhoneAction List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    /**  Number of used attempts to enter the code. When 5 attempts are reached, this action becomes invalid.  */
    attempts?: Maybe<Scalars['Int']['output']>
    /**  Confirmation code. Generated inside one of action-creators, such as startConfirmPhoneAction  */
    code?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>
    deletedAt?: Maybe<Scalars['String']['output']>
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>
    /**  Action expiration time. After the expiration time, it will not be possible to call action-required mutations with the current ConfirmPhoneAction.  */
    expiresAt?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    /**  Verifies specified phone. If the phone has been recently verified (before ConfirmPhoneAction expired), then knowing the ID of ConfirmPhoneAction allows to register the user.  */
    isVerified?: Maybe<Scalars['Boolean']['output']>
    newId?: Maybe<Scalars['String']['output']>
    /**  Phone to be verified  */
    phone?: Maybe<Scalars['String']['output']>
    /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>
    updatedAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>
    v?: Maybe<Scalars['Int']['output']>
}

export type ConfirmPhoneActionCreateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>
    code?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

/**  A keystone list  */
export type ConfirmPhoneActionHistoryRecord = {
    __typename?: 'ConfirmPhoneActionHistoryRecord'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ConfirmPhoneActionHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the ConfirmPhoneActionHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the ConfirmPhoneActionHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the ConfirmPhoneActionHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    attempts?: Maybe<Scalars['Int']['output']>
    code?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    createdBy?: Maybe<Scalars['String']['output']>
    deletedAt?: Maybe<Scalars['String']['output']>
    dv?: Maybe<Scalars['Int']['output']>
    expiresAt?: Maybe<Scalars['String']['output']>
    history_action?: Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>
    history_date?: Maybe<Scalars['String']['output']>
    history_id?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    isVerified?: Maybe<Scalars['Boolean']['output']>
    newId?: Maybe<Scalars['JSON']['output']>
    phone?: Maybe<Scalars['String']['output']>
    sender?: Maybe<Scalars['JSON']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    updatedBy?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
}

export type ConfirmPhoneActionHistoryRecordCreateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>
    code?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export enum ConfirmPhoneActionHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type ConfirmPhoneActionHistoryRecordUpdateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>
    code?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type ConfirmPhoneActionHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordWhereInput>>>
    attempts?: InputMaybe<Scalars['Int']['input']>
    attempts_gt?: InputMaybe<Scalars['Int']['input']>
    attempts_gte?: InputMaybe<Scalars['Int']['input']>
    attempts_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    attempts_lt?: InputMaybe<Scalars['Int']['input']>
    attempts_lte?: InputMaybe<Scalars['Int']['input']>
    attempts_not?: InputMaybe<Scalars['Int']['input']>
    attempts_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    code?: InputMaybe<Scalars['String']['input']>
    code_contains?: InputMaybe<Scalars['String']['input']>
    code_contains_i?: InputMaybe<Scalars['String']['input']>
    code_ends_with?: InputMaybe<Scalars['String']['input']>
    code_ends_with_i?: InputMaybe<Scalars['String']['input']>
    code_i?: InputMaybe<Scalars['String']['input']>
    code_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    code_not?: InputMaybe<Scalars['String']['input']>
    code_not_contains?: InputMaybe<Scalars['String']['input']>
    code_not_contains_i?: InputMaybe<Scalars['String']['input']>
    code_not_ends_with?: InputMaybe<Scalars['String']['input']>
    code_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    code_not_i?: InputMaybe<Scalars['String']['input']>
    code_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    code_not_starts_with?: InputMaybe<Scalars['String']['input']>
    code_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    code_starts_with?: InputMaybe<Scalars['String']['input']>
    code_starts_with_i?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<Scalars['String']['input']>
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy_not?: InputMaybe<Scalars['String']['input']>
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    expiresAt_gt?: InputMaybe<Scalars['String']['input']>
    expiresAt_gte?: InputMaybe<Scalars['String']['input']>
    expiresAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    expiresAt_lt?: InputMaybe<Scalars['String']['input']>
    expiresAt_lte?: InputMaybe<Scalars['String']['input']>
    expiresAt_not?: InputMaybe<Scalars['String']['input']>
    expiresAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_action?: InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>
    history_action_in?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>>>
    history_action_not?: InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>
    history_action_not_in?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>>>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_date_gt?: InputMaybe<Scalars['String']['input']>
    history_date_gte?: InputMaybe<Scalars['String']['input']>
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_date_lt?: InputMaybe<Scalars['String']['input']>
    history_date_lte?: InputMaybe<Scalars['String']['input']>
    history_date_not?: InputMaybe<Scalars['String']['input']>
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id?: InputMaybe<Scalars['String']['input']>
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id_not?: InputMaybe<Scalars['String']['input']>
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    isVerified_not?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    newId_not?: InputMaybe<Scalars['JSON']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    phone?: InputMaybe<Scalars['String']['input']>
    phone_contains?: InputMaybe<Scalars['String']['input']>
    phone_contains_i?: InputMaybe<Scalars['String']['input']>
    phone_ends_with?: InputMaybe<Scalars['String']['input']>
    phone_ends_with_i?: InputMaybe<Scalars['String']['input']>
    phone_i?: InputMaybe<Scalars['String']['input']>
    phone_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    phone_not?: InputMaybe<Scalars['String']['input']>
    phone_not_contains?: InputMaybe<Scalars['String']['input']>
    phone_not_contains_i?: InputMaybe<Scalars['String']['input']>
    phone_not_ends_with?: InputMaybe<Scalars['String']['input']>
    phone_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    phone_not_i?: InputMaybe<Scalars['String']['input']>
    phone_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    phone_not_starts_with?: InputMaybe<Scalars['String']['input']>
    phone_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    phone_starts_with?: InputMaybe<Scalars['String']['input']>
    phone_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender_not?: InputMaybe<Scalars['JSON']['input']>
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy_not?: InputMaybe<Scalars['String']['input']>
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type ConfirmPhoneActionHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type ConfirmPhoneActionHistoryRecordsCreateInput = {
    data?: InputMaybe<ConfirmPhoneActionHistoryRecordCreateInput>
}

export type ConfirmPhoneActionHistoryRecordsUpdateInput = {
    data?: InputMaybe<ConfirmPhoneActionHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}

export type ConfirmPhoneActionUpdateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>
    code?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type ConfirmPhoneActionWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionWhereInput>>>
    attempts?: InputMaybe<Scalars['Int']['input']>
    attempts_gt?: InputMaybe<Scalars['Int']['input']>
    attempts_gte?: InputMaybe<Scalars['Int']['input']>
    attempts_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    attempts_lt?: InputMaybe<Scalars['Int']['input']>
    attempts_lte?: InputMaybe<Scalars['Int']['input']>
    attempts_not?: InputMaybe<Scalars['Int']['input']>
    attempts_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    code?: InputMaybe<Scalars['String']['input']>
    code_contains?: InputMaybe<Scalars['String']['input']>
    code_contains_i?: InputMaybe<Scalars['String']['input']>
    code_ends_with?: InputMaybe<Scalars['String']['input']>
    code_ends_with_i?: InputMaybe<Scalars['String']['input']>
    code_i?: InputMaybe<Scalars['String']['input']>
    code_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    code_not?: InputMaybe<Scalars['String']['input']>
    code_not_contains?: InputMaybe<Scalars['String']['input']>
    code_not_contains_i?: InputMaybe<Scalars['String']['input']>
    code_not_ends_with?: InputMaybe<Scalars['String']['input']>
    code_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    code_not_i?: InputMaybe<Scalars['String']['input']>
    code_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    code_not_starts_with?: InputMaybe<Scalars['String']['input']>
    code_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    code_starts_with?: InputMaybe<Scalars['String']['input']>
    code_starts_with_i?: InputMaybe<Scalars['String']['input']>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<UserWhereInput>
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    expiresAt?: InputMaybe<Scalars['String']['input']>
    expiresAt_gt?: InputMaybe<Scalars['String']['input']>
    expiresAt_gte?: InputMaybe<Scalars['String']['input']>
    expiresAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    expiresAt_lt?: InputMaybe<Scalars['String']['input']>
    expiresAt_lte?: InputMaybe<Scalars['String']['input']>
    expiresAt_not?: InputMaybe<Scalars['String']['input']>
    expiresAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    isVerified?: InputMaybe<Scalars['Boolean']['input']>
    isVerified_not?: InputMaybe<Scalars['Boolean']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    newId_not?: InputMaybe<Scalars['String']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    phone?: InputMaybe<Scalars['String']['input']>
    phone_contains?: InputMaybe<Scalars['String']['input']>
    phone_contains_i?: InputMaybe<Scalars['String']['input']>
    phone_ends_with?: InputMaybe<Scalars['String']['input']>
    phone_ends_with_i?: InputMaybe<Scalars['String']['input']>
    phone_i?: InputMaybe<Scalars['String']['input']>
    phone_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    phone_not?: InputMaybe<Scalars['String']['input']>
    phone_not_contains?: InputMaybe<Scalars['String']['input']>
    phone_not_contains_i?: InputMaybe<Scalars['String']['input']>
    phone_not_ends_with?: InputMaybe<Scalars['String']['input']>
    phone_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    phone_not_i?: InputMaybe<Scalars['String']['input']>
    phone_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    phone_not_starts_with?: InputMaybe<Scalars['String']['input']>
    phone_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    phone_starts_with?: InputMaybe<Scalars['String']['input']>
    phone_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    sender_not?: InputMaybe<SenderFieldInput>
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<UserWhereInput>
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type ConfirmPhoneActionWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type ConfirmPhoneActionsCreateInput = {
    data?: InputMaybe<ConfirmPhoneActionCreateInput>
}

export type ConfirmPhoneActionsUpdateInput = {
    data?: InputMaybe<ConfirmPhoneActionUpdateInput>
    id: Scalars['ID']['input']
}

export type CreateB2CAppPropertyInput = {
    address: Scalars['String']['input']
    app: B2CAppWhereUniqueInput
    dv: Scalars['Int']['input']
    environment: AppEnvironment
    sender: SenderFieldInput
}

export type CreateB2CAppPropertyOutput = {
    __typename?: 'CreateB2CAppPropertyOutput'
    address: Scalars['String']['output']
    id: Scalars['String']['output']
}

export type CreateOidcClientInput = {
    app: AppWhereUniqueInput
    dv: Scalars['Int']['input']
    environment: AppEnvironment
    redirectUri: Scalars['String']['input']
    sender: SenderFieldInput
}

export type DeleteB2CAppPropertyInput = {
    dv: Scalars['Int']['input']
    environment: AppEnvironment
    id: Scalars['ID']['input']
    sender: SenderFieldInput
}

export type DeleteB2CAppPropertyOutput = {
    __typename?: 'DeleteB2CAppPropertyOutput'
    address: Scalars['String']['output']
    deletedAt?: Maybe<Scalars['String']['output']>
    id: Scalars['String']['output']
}

export type File = {
    __typename?: 'File'
    encoding?: Maybe<Scalars['String']['output']>
    filename?: Maybe<Scalars['String']['output']>
    id?: Maybe<Scalars['ID']['output']>
    mimetype?: Maybe<Scalars['String']['output']>
    originalFilename?: Maybe<Scalars['String']['output']>
    path?: Maybe<Scalars['String']['output']>
    publicUrl?: Maybe<Scalars['String']['output']>
}

export type GenerateOidcClientSecretInput = {
    app: AppWhereUniqueInput
    dv: Scalars['Int']['input']
    environment: AppEnvironment
    sender: SenderFieldInput
}

export type GetOidcClientInput = {
    app: AppWhereUniqueInput
    environment: AppEnvironment
}

export type ImportB2CAppFromInput = {
    developmentApp?: InputMaybe<B2CAppWhereUniqueInput>
    productionApp?: InputMaybe<B2CAppWhereUniqueInput>
}

export type ImportB2CAppInput = {
    dv: Scalars['Int']['input']
    from: ImportB2CAppFromInput
    options: ImportB2CAppOptionsInput
    sender: SenderFieldInput
    to: ImportB2CAppToInput
}

export type ImportB2CAppOptionsInput = {
    accessRight: Scalars['Boolean']['input']
    builds: Scalars['Boolean']['input']
    info: Scalars['Boolean']['input']
    publish: Scalars['Boolean']['input']
}

export type ImportB2CAppOutput = {
    __typename?: 'ImportB2CAppOutput'
    success: Scalars['Boolean']['output']
}

export type ImportB2CAppToInput = {
    app: B2CAppWhereUniqueInput
}

export type Mutation = {
    __typename?: 'Mutation'
    /**  Authenticate and generate a token for a User with the Password Authentication Strategy.  */
    authenticateUserWithPassword?: Maybe<AuthenticateUserOutput>
    authenticateUserWithPhoneAndPassword?: Maybe<AuthenticateUserWithPhoneAndPasswordOutput>
    completeConfirmEmailAction?: Maybe<CompleteConfirmEmailActionOutput>
    completeConfirmPhoneAction?: Maybe<CompleteConfirmPhoneActionOutput>
    /**  Create a single B2CApp item.  */
    createB2CApp?: Maybe<B2CApp>
    /**  Create a single B2CAppAccessRight item.  */
    createB2CAppAccessRight?: Maybe<B2CAppAccessRight>
    /**  Create a single B2CAppAccessRightHistoryRecord item.  */
    createB2CAppAccessRightHistoryRecord?: Maybe<B2CAppAccessRightHistoryRecord>
    /**  Create multiple B2CAppAccessRightHistoryRecord items.  */
    createB2CAppAccessRightHistoryRecords?: Maybe<Array<Maybe<B2CAppAccessRightHistoryRecord>>>
    /**  Create multiple B2CAppAccessRight items.  */
    createB2CAppAccessRights?: Maybe<Array<Maybe<B2CAppAccessRight>>>
    /**  Create a single B2CAppBuild item.  */
    createB2CAppBuild?: Maybe<B2CAppBuild>
    /**  Create a single B2CAppBuildHistoryRecord item.  */
    createB2CAppBuildHistoryRecord?: Maybe<B2CAppBuildHistoryRecord>
    /**  Create multiple B2CAppBuildHistoryRecord items.  */
    createB2CAppBuildHistoryRecords?: Maybe<Array<Maybe<B2CAppBuildHistoryRecord>>>
    /**  Create multiple B2CAppBuild items.  */
    createB2CAppBuilds?: Maybe<Array<Maybe<B2CAppBuild>>>
    /**  Create a single B2CAppHistoryRecord item.  */
    createB2CAppHistoryRecord?: Maybe<B2CAppHistoryRecord>
    /**  Create multiple B2CAppHistoryRecord items.  */
    createB2CAppHistoryRecords?: Maybe<Array<Maybe<B2CAppHistoryRecord>>>
    createB2CAppProperty?: Maybe<CreateB2CAppPropertyOutput>
    /**  Create a single B2CAppPublishRequest item.  */
    createB2CAppPublishRequest?: Maybe<B2CAppPublishRequest>
    /**  Create a single B2CAppPublishRequestHistoryRecord item.  */
    createB2CAppPublishRequestHistoryRecord?: Maybe<B2CAppPublishRequestHistoryRecord>
    /**  Create multiple B2CAppPublishRequestHistoryRecord items.  */
    createB2CAppPublishRequestHistoryRecords?: Maybe<Array<Maybe<B2CAppPublishRequestHistoryRecord>>>
    /**  Create multiple B2CAppPublishRequest items.  */
    createB2CAppPublishRequests?: Maybe<Array<Maybe<B2CAppPublishRequest>>>
    /**  Create multiple B2CApp items.  */
    createB2CApps?: Maybe<Array<Maybe<B2CApp>>>
    /**  Create a single ConfirmEmailAction item.  */
    createConfirmEmailAction?: Maybe<ConfirmEmailAction>
    /**  Create a single ConfirmEmailActionHistoryRecord item.  */
    createConfirmEmailActionHistoryRecord?: Maybe<ConfirmEmailActionHistoryRecord>
    /**  Create multiple ConfirmEmailActionHistoryRecord items.  */
    createConfirmEmailActionHistoryRecords?: Maybe<Array<Maybe<ConfirmEmailActionHistoryRecord>>>
    /**  Create multiple ConfirmEmailAction items.  */
    createConfirmEmailActions?: Maybe<Array<Maybe<ConfirmEmailAction>>>
    /**  Create a single ConfirmPhoneAction item.  */
    createConfirmPhoneAction?: Maybe<ConfirmPhoneAction>
    /**  Create a single ConfirmPhoneActionHistoryRecord item.  */
    createConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>
    /**  Create multiple ConfirmPhoneActionHistoryRecord items.  */
    createConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>
    /**  Create multiple ConfirmPhoneAction items.  */
    createConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>
    createOIDCClient?: Maybe<OidcClientWithSecret>
    /**  Create a single User item.  */
    createUser?: Maybe<User>
    /**  Create a single UserHistoryRecord item.  */
    createUserHistoryRecord?: Maybe<UserHistoryRecord>
    /**  Create multiple UserHistoryRecord items.  */
    createUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>
    /**  Create multiple User items.  */
    createUsers?: Maybe<Array<Maybe<User>>>
    /**  Create a single Webhook item.  */
    createWebhook?: Maybe<Webhook>
    /**  Create a single WebhookHistoryRecord item.  */
    createWebhookHistoryRecord?: Maybe<WebhookHistoryRecord>
    /**  Create multiple WebhookHistoryRecord items.  */
    createWebhookHistoryRecords?: Maybe<Array<Maybe<WebhookHistoryRecord>>>
    /**  Create a single WebhookSubscription item.  */
    createWebhookSubscription?: Maybe<WebhookSubscription>
    /**  Create a single WebhookSubscriptionHistoryRecord item.  */
    createWebhookSubscriptionHistoryRecord?: Maybe<WebhookSubscriptionHistoryRecord>
    /**  Create multiple WebhookSubscriptionHistoryRecord items.  */
    createWebhookSubscriptionHistoryRecords?: Maybe<Array<Maybe<WebhookSubscriptionHistoryRecord>>>
    /**  Create multiple WebhookSubscription items.  */
    createWebhookSubscriptions?: Maybe<Array<Maybe<WebhookSubscription>>>
    /**  Create multiple Webhook items.  */
    createWebhooks?: Maybe<Array<Maybe<Webhook>>>
    /**  Delete a single B2CApp item by ID.  */
    deleteB2CApp?: Maybe<B2CApp>
    /**  Delete a single B2CAppAccessRight item by ID.  */
    deleteB2CAppAccessRight?: Maybe<B2CAppAccessRight>
    /**  Delete a single B2CAppAccessRightHistoryRecord item by ID.  */
    deleteB2CAppAccessRightHistoryRecord?: Maybe<B2CAppAccessRightHistoryRecord>
    /**  Delete multiple B2CAppAccessRightHistoryRecord items by ID.  */
    deleteB2CAppAccessRightHistoryRecords?: Maybe<Array<Maybe<B2CAppAccessRightHistoryRecord>>>
    /**  Delete multiple B2CAppAccessRight items by ID.  */
    deleteB2CAppAccessRights?: Maybe<Array<Maybe<B2CAppAccessRight>>>
    /**  Delete a single B2CAppBuild item by ID.  */
    deleteB2CAppBuild?: Maybe<B2CAppBuild>
    /**  Delete a single B2CAppBuildHistoryRecord item by ID.  */
    deleteB2CAppBuildHistoryRecord?: Maybe<B2CAppBuildHistoryRecord>
    /**  Delete multiple B2CAppBuildHistoryRecord items by ID.  */
    deleteB2CAppBuildHistoryRecords?: Maybe<Array<Maybe<B2CAppBuildHistoryRecord>>>
    /**  Delete multiple B2CAppBuild items by ID.  */
    deleteB2CAppBuilds?: Maybe<Array<Maybe<B2CAppBuild>>>
    /**  Delete a single B2CAppHistoryRecord item by ID.  */
    deleteB2CAppHistoryRecord?: Maybe<B2CAppHistoryRecord>
    /**  Delete multiple B2CAppHistoryRecord items by ID.  */
    deleteB2CAppHistoryRecords?: Maybe<Array<Maybe<B2CAppHistoryRecord>>>
    deleteB2CAppProperty?: Maybe<DeleteB2CAppPropertyOutput>
    /**  Delete a single B2CAppPublishRequest item by ID.  */
    deleteB2CAppPublishRequest?: Maybe<B2CAppPublishRequest>
    /**  Delete a single B2CAppPublishRequestHistoryRecord item by ID.  */
    deleteB2CAppPublishRequestHistoryRecord?: Maybe<B2CAppPublishRequestHistoryRecord>
    /**  Delete multiple B2CAppPublishRequestHistoryRecord items by ID.  */
    deleteB2CAppPublishRequestHistoryRecords?: Maybe<Array<Maybe<B2CAppPublishRequestHistoryRecord>>>
    /**  Delete multiple B2CAppPublishRequest items by ID.  */
    deleteB2CAppPublishRequests?: Maybe<Array<Maybe<B2CAppPublishRequest>>>
    /**  Delete multiple B2CApp items by ID.  */
    deleteB2CApps?: Maybe<Array<Maybe<B2CApp>>>
    /**  Delete a single ConfirmEmailAction item by ID.  */
    deleteConfirmEmailAction?: Maybe<ConfirmEmailAction>
    /**  Delete a single ConfirmEmailActionHistoryRecord item by ID.  */
    deleteConfirmEmailActionHistoryRecord?: Maybe<ConfirmEmailActionHistoryRecord>
    /**  Delete multiple ConfirmEmailActionHistoryRecord items by ID.  */
    deleteConfirmEmailActionHistoryRecords?: Maybe<Array<Maybe<ConfirmEmailActionHistoryRecord>>>
    /**  Delete multiple ConfirmEmailAction items by ID.  */
    deleteConfirmEmailActions?: Maybe<Array<Maybe<ConfirmEmailAction>>>
    /**  Delete a single ConfirmPhoneAction item by ID.  */
    deleteConfirmPhoneAction?: Maybe<ConfirmPhoneAction>
    /**  Delete a single ConfirmPhoneActionHistoryRecord item by ID.  */
    deleteConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>
    /**  Delete multiple ConfirmPhoneActionHistoryRecord items by ID.  */
    deleteConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>
    /**  Delete multiple ConfirmPhoneAction items by ID.  */
    deleteConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>
    /**  Delete a single User item by ID.  */
    deleteUser?: Maybe<User>
    /**  Delete a single UserHistoryRecord item by ID.  */
    deleteUserHistoryRecord?: Maybe<UserHistoryRecord>
    /**  Delete multiple UserHistoryRecord items by ID.  */
    deleteUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>
    /**  Delete multiple User items by ID.  */
    deleteUsers?: Maybe<Array<Maybe<User>>>
    /**  Delete a single Webhook item by ID.  */
    deleteWebhook?: Maybe<Webhook>
    /**  Delete a single WebhookHistoryRecord item by ID.  */
    deleteWebhookHistoryRecord?: Maybe<WebhookHistoryRecord>
    /**  Delete multiple WebhookHistoryRecord items by ID.  */
    deleteWebhookHistoryRecords?: Maybe<Array<Maybe<WebhookHistoryRecord>>>
    /**  Delete a single WebhookSubscription item by ID.  */
    deleteWebhookSubscription?: Maybe<WebhookSubscription>
    /**  Delete a single WebhookSubscriptionHistoryRecord item by ID.  */
    deleteWebhookSubscriptionHistoryRecord?: Maybe<WebhookSubscriptionHistoryRecord>
    /**  Delete multiple WebhookSubscriptionHistoryRecord items by ID.  */
    deleteWebhookSubscriptionHistoryRecords?: Maybe<Array<Maybe<WebhookSubscriptionHistoryRecord>>>
    /**  Delete multiple WebhookSubscription items by ID.  */
    deleteWebhookSubscriptions?: Maybe<Array<Maybe<WebhookSubscription>>>
    /**  Delete multiple Webhook items by ID.  */
    deleteWebhooks?: Maybe<Array<Maybe<Webhook>>>
    generateOIDCClientSecret?: Maybe<OidcClientWithSecret>
    importB2CApp?: Maybe<ImportB2CAppOutput>
    publishB2CApp?: Maybe<PublishB2CAppOutput>
    registerAppUserService?: Maybe<RegisterAppUserServiceOutput>
    registerNewUser?: Maybe<User>
    startConfirmEmailAction?: Maybe<StartConfirmEmailActionOutput>
    startConfirmPhoneAction?: Maybe<StartConfirmPhoneActionOutput>
    unauthenticateUser?: Maybe<UnauthenticateUserOutput>
    updateAuthenticatedUser?: Maybe<User>
    /**  Update a single B2CApp item by ID.  */
    updateB2CApp?: Maybe<B2CApp>
    /**  Update a single B2CAppAccessRight item by ID.  */
    updateB2CAppAccessRight?: Maybe<B2CAppAccessRight>
    /**  Update a single B2CAppAccessRightHistoryRecord item by ID.  */
    updateB2CAppAccessRightHistoryRecord?: Maybe<B2CAppAccessRightHistoryRecord>
    /**  Update multiple B2CAppAccessRightHistoryRecord items by ID.  */
    updateB2CAppAccessRightHistoryRecords?: Maybe<Array<Maybe<B2CAppAccessRightHistoryRecord>>>
    /**  Update multiple B2CAppAccessRight items by ID.  */
    updateB2CAppAccessRights?: Maybe<Array<Maybe<B2CAppAccessRight>>>
    /**  Update a single B2CAppBuild item by ID.  */
    updateB2CAppBuild?: Maybe<B2CAppBuild>
    /**  Update a single B2CAppBuildHistoryRecord item by ID.  */
    updateB2CAppBuildHistoryRecord?: Maybe<B2CAppBuildHistoryRecord>
    /**  Update multiple B2CAppBuildHistoryRecord items by ID.  */
    updateB2CAppBuildHistoryRecords?: Maybe<Array<Maybe<B2CAppBuildHistoryRecord>>>
    /**  Update multiple B2CAppBuild items by ID.  */
    updateB2CAppBuilds?: Maybe<Array<Maybe<B2CAppBuild>>>
    /**  Update a single B2CAppHistoryRecord item by ID.  */
    updateB2CAppHistoryRecord?: Maybe<B2CAppHistoryRecord>
    /**  Update multiple B2CAppHistoryRecord items by ID.  */
    updateB2CAppHistoryRecords?: Maybe<Array<Maybe<B2CAppHistoryRecord>>>
    /**  Update a single B2CAppPublishRequest item by ID.  */
    updateB2CAppPublishRequest?: Maybe<B2CAppPublishRequest>
    /**  Update a single B2CAppPublishRequestHistoryRecord item by ID.  */
    updateB2CAppPublishRequestHistoryRecord?: Maybe<B2CAppPublishRequestHistoryRecord>
    /**  Update multiple B2CAppPublishRequestHistoryRecord items by ID.  */
    updateB2CAppPublishRequestHistoryRecords?: Maybe<Array<Maybe<B2CAppPublishRequestHistoryRecord>>>
    /**  Update multiple B2CAppPublishRequest items by ID.  */
    updateB2CAppPublishRequests?: Maybe<Array<Maybe<B2CAppPublishRequest>>>
    /**  Update multiple B2CApp items by ID.  */
    updateB2CApps?: Maybe<Array<Maybe<B2CApp>>>
    /**  Update a single ConfirmEmailAction item by ID.  */
    updateConfirmEmailAction?: Maybe<ConfirmEmailAction>
    /**  Update a single ConfirmEmailActionHistoryRecord item by ID.  */
    updateConfirmEmailActionHistoryRecord?: Maybe<ConfirmEmailActionHistoryRecord>
    /**  Update multiple ConfirmEmailActionHistoryRecord items by ID.  */
    updateConfirmEmailActionHistoryRecords?: Maybe<Array<Maybe<ConfirmEmailActionHistoryRecord>>>
    /**  Update multiple ConfirmEmailAction items by ID.  */
    updateConfirmEmailActions?: Maybe<Array<Maybe<ConfirmEmailAction>>>
    /**  Update a single ConfirmPhoneAction item by ID.  */
    updateConfirmPhoneAction?: Maybe<ConfirmPhoneAction>
    /**  Update a single ConfirmPhoneActionHistoryRecord item by ID.  */
    updateConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>
    /**  Update multiple ConfirmPhoneActionHistoryRecord items by ID.  */
    updateConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>
    /**  Update multiple ConfirmPhoneAction items by ID.  */
    updateConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>
    updateOIDCClientUrl?: Maybe<OidcClient>
    /**  Update a single User item by ID.  */
    updateUser?: Maybe<User>
    /**  Update a single UserHistoryRecord item by ID.  */
    updateUserHistoryRecord?: Maybe<UserHistoryRecord>
    /**  Update multiple UserHistoryRecord items by ID.  */
    updateUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>
    /**  Update multiple User items by ID.  */
    updateUsers?: Maybe<Array<Maybe<User>>>
    /**  Update a single Webhook item by ID.  */
    updateWebhook?: Maybe<Webhook>
    /**  Update a single WebhookHistoryRecord item by ID.  */
    updateWebhookHistoryRecord?: Maybe<WebhookHistoryRecord>
    /**  Update multiple WebhookHistoryRecord items by ID.  */
    updateWebhookHistoryRecords?: Maybe<Array<Maybe<WebhookHistoryRecord>>>
    /**  Update a single WebhookSubscription item by ID.  */
    updateWebhookSubscription?: Maybe<WebhookSubscription>
    /**  Update a single WebhookSubscriptionHistoryRecord item by ID.  */
    updateWebhookSubscriptionHistoryRecord?: Maybe<WebhookSubscriptionHistoryRecord>
    /**  Update multiple WebhookSubscriptionHistoryRecord items by ID.  */
    updateWebhookSubscriptionHistoryRecords?: Maybe<Array<Maybe<WebhookSubscriptionHistoryRecord>>>
    /**  Update multiple WebhookSubscription items by ID.  */
    updateWebhookSubscriptions?: Maybe<Array<Maybe<WebhookSubscription>>>
    /**  Update multiple Webhook items by ID.  */
    updateWebhooks?: Maybe<Array<Maybe<Webhook>>>
}


export type MutationAuthenticateUserWithPasswordArgs = {
    email?: InputMaybe<Scalars['String']['input']>
    password?: InputMaybe<Scalars['String']['input']>
}


export type MutationAuthenticateUserWithPhoneAndPasswordArgs = {
    data: AuthenticateUserWithPhoneAndPasswordInput
}


export type MutationCompleteConfirmEmailActionArgs = {
    data: CompleteConfirmEmailActionInput
}


export type MutationCompleteConfirmPhoneActionArgs = {
    data: CompleteConfirmPhoneActionInput
}


export type MutationCreateB2CAppArgs = {
    data?: InputMaybe<B2CAppCreateInput>
}


export type MutationCreateB2CAppAccessRightArgs = {
    data?: InputMaybe<B2CAppAccessRightCreateInput>
}


export type MutationCreateB2CAppAccessRightHistoryRecordArgs = {
    data?: InputMaybe<B2CAppAccessRightHistoryRecordCreateInput>
}


export type MutationCreateB2CAppAccessRightHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppAccessRightHistoryRecordsCreateInput>>>
}


export type MutationCreateB2CAppAccessRightsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppAccessRightsCreateInput>>>
}


export type MutationCreateB2CAppBuildArgs = {
    data?: InputMaybe<B2CAppBuildCreateInput>
}


export type MutationCreateB2CAppBuildHistoryRecordArgs = {
    data?: InputMaybe<B2CAppBuildHistoryRecordCreateInput>
}


export type MutationCreateB2CAppBuildHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppBuildHistoryRecordsCreateInput>>>
}


export type MutationCreateB2CAppBuildsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppBuildsCreateInput>>>
}


export type MutationCreateB2CAppHistoryRecordArgs = {
    data?: InputMaybe<B2CAppHistoryRecordCreateInput>
}


export type MutationCreateB2CAppHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppHistoryRecordsCreateInput>>>
}


export type MutationCreateB2CAppPropertyArgs = {
    data: CreateB2CAppPropertyInput
}


export type MutationCreateB2CAppPublishRequestArgs = {
    data?: InputMaybe<B2CAppPublishRequestCreateInput>
}


export type MutationCreateB2CAppPublishRequestHistoryRecordArgs = {
    data?: InputMaybe<B2CAppPublishRequestHistoryRecordCreateInput>
}


export type MutationCreateB2CAppPublishRequestHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestHistoryRecordsCreateInput>>>
}


export type MutationCreateB2CAppPublishRequestsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestsCreateInput>>>
}


export type MutationCreateB2CAppsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppsCreateInput>>>
}


export type MutationCreateConfirmEmailActionArgs = {
    data?: InputMaybe<ConfirmEmailActionCreateInput>
}


export type MutationCreateConfirmEmailActionHistoryRecordArgs = {
    data?: InputMaybe<ConfirmEmailActionHistoryRecordCreateInput>
}


export type MutationCreateConfirmEmailActionHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmEmailActionHistoryRecordsCreateInput>>>
}


export type MutationCreateConfirmEmailActionsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmEmailActionsCreateInput>>>
}


export type MutationCreateConfirmPhoneActionArgs = {
    data?: InputMaybe<ConfirmPhoneActionCreateInput>
}


export type MutationCreateConfirmPhoneActionHistoryRecordArgs = {
    data?: InputMaybe<ConfirmPhoneActionHistoryRecordCreateInput>
}


export type MutationCreateConfirmPhoneActionHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordsCreateInput>>>
}


export type MutationCreateConfirmPhoneActionsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionsCreateInput>>>
}


export type MutationCreateOidcClientArgs = {
    data: CreateOidcClientInput
}


export type MutationCreateUserArgs = {
    data?: InputMaybe<UserCreateInput>
}


export type MutationCreateUserHistoryRecordArgs = {
    data?: InputMaybe<UserHistoryRecordCreateInput>
}


export type MutationCreateUserHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<UserHistoryRecordsCreateInput>>>
}


export type MutationCreateUsersArgs = {
    data?: InputMaybe<Array<InputMaybe<UsersCreateInput>>>
}


export type MutationCreateWebhookArgs = {
    data?: InputMaybe<WebhookCreateInput>
}


export type MutationCreateWebhookHistoryRecordArgs = {
    data?: InputMaybe<WebhookHistoryRecordCreateInput>
}


export type MutationCreateWebhookHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<WebhookHistoryRecordsCreateInput>>>
}


export type MutationCreateWebhookSubscriptionArgs = {
    data?: InputMaybe<WebhookSubscriptionCreateInput>
}


export type MutationCreateWebhookSubscriptionHistoryRecordArgs = {
    data?: InputMaybe<WebhookSubscriptionHistoryRecordCreateInput>
}


export type MutationCreateWebhookSubscriptionHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<WebhookSubscriptionHistoryRecordsCreateInput>>>
}


export type MutationCreateWebhookSubscriptionsArgs = {
    data?: InputMaybe<Array<InputMaybe<WebhookSubscriptionsCreateInput>>>
}


export type MutationCreateWebhooksArgs = {
    data?: InputMaybe<Array<InputMaybe<WebhooksCreateInput>>>
}


export type MutationDeleteB2CAppArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteB2CAppAccessRightArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteB2CAppAccessRightHistoryRecordArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteB2CAppAccessRightHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteB2CAppAccessRightsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteB2CAppBuildArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteB2CAppBuildHistoryRecordArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteB2CAppBuildHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteB2CAppBuildsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteB2CAppHistoryRecordArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteB2CAppHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteB2CAppPropertyArgs = {
    data: DeleteB2CAppPropertyInput
}


export type MutationDeleteB2CAppPublishRequestArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteB2CAppPublishRequestHistoryRecordArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteB2CAppPublishRequestHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteB2CAppPublishRequestsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteB2CAppsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteConfirmEmailActionArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteConfirmEmailActionHistoryRecordArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteConfirmEmailActionHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteConfirmEmailActionsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteConfirmPhoneActionArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteConfirmPhoneActionHistoryRecordArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteConfirmPhoneActionHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteConfirmPhoneActionsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteUserArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteUserHistoryRecordArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteUserHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteUsersArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteWebhookArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteWebhookHistoryRecordArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteWebhookHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteWebhookSubscriptionArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteWebhookSubscriptionHistoryRecordArgs = {
    id: Scalars['ID']['input']
}


export type MutationDeleteWebhookSubscriptionHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteWebhookSubscriptionsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationDeleteWebhooksArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>
}


export type MutationGenerateOidcClientSecretArgs = {
    data: GenerateOidcClientSecretInput
}


export type MutationImportB2CAppArgs = {
    data: ImportB2CAppInput
}


export type MutationPublishB2CAppArgs = {
    data: PublishB2CAppInput
}


export type MutationRegisterAppUserServiceArgs = {
    data: RegisterAppUserServiceInput
}


export type MutationRegisterNewUserArgs = {
    data: RegisterNewUserInput
}


export type MutationStartConfirmEmailActionArgs = {
    data: StartConfirmEmailActionInput
}


export type MutationStartConfirmPhoneActionArgs = {
    data: StartConfirmPhoneActionInput
}


export type MutationUpdateAuthenticatedUserArgs = {
    data?: InputMaybe<UserUpdateInput>
}


export type MutationUpdateB2CAppArgs = {
    data?: InputMaybe<B2CAppUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateB2CAppAccessRightArgs = {
    data?: InputMaybe<B2CAppAccessRightUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateB2CAppAccessRightHistoryRecordArgs = {
    data?: InputMaybe<B2CAppAccessRightHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateB2CAppAccessRightHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppAccessRightHistoryRecordsUpdateInput>>>
}


export type MutationUpdateB2CAppAccessRightsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppAccessRightsUpdateInput>>>
}


export type MutationUpdateB2CAppBuildArgs = {
    data?: InputMaybe<B2CAppBuildUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateB2CAppBuildHistoryRecordArgs = {
    data?: InputMaybe<B2CAppBuildHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateB2CAppBuildHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppBuildHistoryRecordsUpdateInput>>>
}


export type MutationUpdateB2CAppBuildsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppBuildsUpdateInput>>>
}


export type MutationUpdateB2CAppHistoryRecordArgs = {
    data?: InputMaybe<B2CAppHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateB2CAppHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppHistoryRecordsUpdateInput>>>
}


export type MutationUpdateB2CAppPublishRequestArgs = {
    data?: InputMaybe<B2CAppPublishRequestUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateB2CAppPublishRequestHistoryRecordArgs = {
    data?: InputMaybe<B2CAppPublishRequestHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateB2CAppPublishRequestHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestHistoryRecordsUpdateInput>>>
}


export type MutationUpdateB2CAppPublishRequestsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppPublishRequestsUpdateInput>>>
}


export type MutationUpdateB2CAppsArgs = {
    data?: InputMaybe<Array<InputMaybe<B2CAppsUpdateInput>>>
}


export type MutationUpdateConfirmEmailActionArgs = {
    data?: InputMaybe<ConfirmEmailActionUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateConfirmEmailActionHistoryRecordArgs = {
    data?: InputMaybe<ConfirmEmailActionHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateConfirmEmailActionHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmEmailActionHistoryRecordsUpdateInput>>>
}


export type MutationUpdateConfirmEmailActionsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmEmailActionsUpdateInput>>>
}


export type MutationUpdateConfirmPhoneActionArgs = {
    data?: InputMaybe<ConfirmPhoneActionUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateConfirmPhoneActionHistoryRecordArgs = {
    data?: InputMaybe<ConfirmPhoneActionHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateConfirmPhoneActionHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordsUpdateInput>>>
}


export type MutationUpdateConfirmPhoneActionsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionsUpdateInput>>>
}


export type MutationUpdateOidcClientUrlArgs = {
    data: UpdateOidcClientUrlInput
}


export type MutationUpdateUserArgs = {
    data?: InputMaybe<UserUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateUserHistoryRecordArgs = {
    data?: InputMaybe<UserHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateUserHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<UserHistoryRecordsUpdateInput>>>
}


export type MutationUpdateUsersArgs = {
    data?: InputMaybe<Array<InputMaybe<UsersUpdateInput>>>
}


export type MutationUpdateWebhookArgs = {
    data?: InputMaybe<WebhookUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateWebhookHistoryRecordArgs = {
    data?: InputMaybe<WebhookHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateWebhookHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<WebhookHistoryRecordsUpdateInput>>>
}


export type MutationUpdateWebhookSubscriptionArgs = {
    data?: InputMaybe<WebhookSubscriptionUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateWebhookSubscriptionHistoryRecordArgs = {
    data?: InputMaybe<WebhookSubscriptionHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}


export type MutationUpdateWebhookSubscriptionHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<WebhookSubscriptionHistoryRecordsUpdateInput>>>
}


export type MutationUpdateWebhookSubscriptionsArgs = {
    data?: InputMaybe<Array<InputMaybe<WebhookSubscriptionsUpdateInput>>>
}


export type MutationUpdateWebhooksArgs = {
    data?: InputMaybe<Array<InputMaybe<WebhooksUpdateInput>>>
}

export type OidcClient = {
    __typename?: 'OIDCClient'
    clientId: Scalars['String']['output']
    id: Scalars['String']['output']
    redirectUri: Scalars['String']['output']
}

export type OidcClientWithSecret = {
    __typename?: 'OIDCClientWithSecret'
    clientId: Scalars['String']['output']
    clientSecret: Scalars['String']['output']
    id: Scalars['String']['output']
    redirectUri: Scalars['String']['output']
}

export type PublishB2CAppInput = {
    app: B2CAppWhereUniqueInput
    dv: Scalars['Int']['input']
    environment: AppEnvironment
    options: B2CAppPublishOptions
    sender: SenderFieldInput
}

export type PublishB2CAppOutput = {
    __typename?: 'PublishB2CAppOutput'
    success: Scalars['Boolean']['output']
}

export type Query = {
    __typename?: 'Query'
    /**  Search for the B2CApp item with the matching ID.  */
    B2CApp?: Maybe<B2CApp>
    /**  Search for the B2CAppAccessRight item with the matching ID.  */
    B2CAppAccessRight?: Maybe<B2CAppAccessRight>
    /**  Search for the B2CAppAccessRightHistoryRecord item with the matching ID.  */
    B2CAppAccessRightHistoryRecord?: Maybe<B2CAppAccessRightHistoryRecord>
    /**  Search for the B2CAppBuild item with the matching ID.  */
    B2CAppBuild?: Maybe<B2CAppBuild>
    /**  Search for the B2CAppBuildHistoryRecord item with the matching ID.  */
    B2CAppBuildHistoryRecord?: Maybe<B2CAppBuildHistoryRecord>
    /**  Search for the B2CAppHistoryRecord item with the matching ID.  */
    B2CAppHistoryRecord?: Maybe<B2CAppHistoryRecord>
    /**  Search for the B2CAppPublishRequest item with the matching ID.  */
    B2CAppPublishRequest?: Maybe<B2CAppPublishRequest>
    /**  Search for the B2CAppPublishRequestHistoryRecord item with the matching ID.  */
    B2CAppPublishRequestHistoryRecord?: Maybe<B2CAppPublishRequestHistoryRecord>
    /**  Search for the ConfirmEmailAction item with the matching ID.  */
    ConfirmEmailAction?: Maybe<ConfirmEmailAction>
    /**  Search for the ConfirmEmailActionHistoryRecord item with the matching ID.  */
    ConfirmEmailActionHistoryRecord?: Maybe<ConfirmEmailActionHistoryRecord>
    /**  Search for the ConfirmPhoneAction item with the matching ID.  */
    ConfirmPhoneAction?: Maybe<ConfirmPhoneAction>
    /**  Search for the ConfirmPhoneActionHistoryRecord item with the matching ID.  */
    ConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>
    OIDCClient?: Maybe<OidcClient>
    /**  Search for the User item with the matching ID.  */
    User?: Maybe<User>
    /**  Search for the UserHistoryRecord item with the matching ID.  */
    UserHistoryRecord?: Maybe<UserHistoryRecord>
    /**  Search for the Webhook item with the matching ID.  */
    Webhook?: Maybe<Webhook>
    /**  Search for the WebhookHistoryRecord item with the matching ID.  */
    WebhookHistoryRecord?: Maybe<WebhookHistoryRecord>
    /**  Search for the WebhookSubscription item with the matching ID.  */
    WebhookSubscription?: Maybe<WebhookSubscription>
    /**  Search for the WebhookSubscriptionHistoryRecord item with the matching ID.  */
    WebhookSubscriptionHistoryRecord?: Maybe<WebhookSubscriptionHistoryRecord>
    /**  Retrieve the meta-data for the B2CAppAccessRightHistoryRecord list.  */
    _B2CAppAccessRightHistoryRecordsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the B2CAppAccessRight list.  */
    _B2CAppAccessRightsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the B2CAppBuildHistoryRecord list.  */
    _B2CAppBuildHistoryRecordsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the B2CAppBuild list.  */
    _B2CAppBuildsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the B2CAppHistoryRecord list.  */
    _B2CAppHistoryRecordsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the B2CAppPublishRequestHistoryRecord list.  */
    _B2CAppPublishRequestHistoryRecordsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the B2CAppPublishRequest list.  */
    _B2CAppPublishRequestsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the B2CApp list.  */
    _B2CAppsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the ConfirmEmailActionHistoryRecord list.  */
    _ConfirmEmailActionHistoryRecordsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the ConfirmEmailAction list.  */
    _ConfirmEmailActionsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the ConfirmPhoneActionHistoryRecord list.  */
    _ConfirmPhoneActionHistoryRecordsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the ConfirmPhoneAction list.  */
    _ConfirmPhoneActionsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the UserHistoryRecord list.  */
    _UserHistoryRecordsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the User list.  */
    _UsersMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the WebhookHistoryRecord list.  */
    _WebhookHistoryRecordsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the WebhookSubscriptionHistoryRecord list.  */
    _WebhookSubscriptionHistoryRecordsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the WebhookSubscription list.  */
    _WebhookSubscriptionsMeta?: Maybe<_ListMeta>
    /**  Retrieve the meta-data for the Webhook list.  */
    _WebhooksMeta?: Maybe<_ListMeta>
    /**  Perform a meta-query on all B2CAppAccessRightHistoryRecord items which match the where clause.  */
    _allB2CAppAccessRightHistoryRecordsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all B2CAppAccessRight items which match the where clause.  */
    _allB2CAppAccessRightsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all B2CAppBuildHistoryRecord items which match the where clause.  */
    _allB2CAppBuildHistoryRecordsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all B2CAppBuild items which match the where clause.  */
    _allB2CAppBuildsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all B2CAppHistoryRecord items which match the where clause.  */
    _allB2CAppHistoryRecordsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all B2CAppPublishRequestHistoryRecord items which match the where clause.  */
    _allB2CAppPublishRequestHistoryRecordsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all B2CAppPublishRequest items which match the where clause.  */
    _allB2CAppPublishRequestsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all B2CApp items which match the where clause.  */
    _allB2CAppsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all ConfirmEmailActionHistoryRecord items which match the where clause.  */
    _allConfirmEmailActionHistoryRecordsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all ConfirmEmailAction items which match the where clause.  */
    _allConfirmEmailActionsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all ConfirmPhoneActionHistoryRecord items which match the where clause.  */
    _allConfirmPhoneActionHistoryRecordsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all ConfirmPhoneAction items which match the where clause.  */
    _allConfirmPhoneActionsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all UserHistoryRecord items which match the where clause.  */
    _allUserHistoryRecordsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all User items which match the where clause.  */
    _allUsersMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all WebhookHistoryRecord items which match the where clause.  */
    _allWebhookHistoryRecordsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all WebhookSubscriptionHistoryRecord items which match the where clause.  */
    _allWebhookSubscriptionHistoryRecordsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all WebhookSubscription items which match the where clause.  */
    _allWebhookSubscriptionsMeta?: Maybe<_QueryMeta>
    /**  Perform a meta-query on all Webhook items which match the where clause.  */
    _allWebhooksMeta?: Maybe<_QueryMeta>
    /**  Retrieve the meta-data for all lists.  */
    _ksListsMeta?: Maybe<Array<Maybe<_ListMeta>>>
    /**  Search for all B2CAppAccessRightHistoryRecord items which match the where clause.  */
    allB2CAppAccessRightHistoryRecords?: Maybe<Array<Maybe<B2CAppAccessRightHistoryRecord>>>
    /**  Search for all B2CAppAccessRight items which match the where clause.  */
    allB2CAppAccessRights?: Maybe<Array<Maybe<B2CAppAccessRight>>>
    /**  Search for all B2CAppBuildHistoryRecord items which match the where clause.  */
    allB2CAppBuildHistoryRecords?: Maybe<Array<Maybe<B2CAppBuildHistoryRecord>>>
    /**  Search for all B2CAppBuild items which match the where clause.  */
    allB2CAppBuilds?: Maybe<Array<Maybe<B2CAppBuild>>>
    /**  Search for all B2CAppHistoryRecord items which match the where clause.  */
    allB2CAppHistoryRecords?: Maybe<Array<Maybe<B2CAppHistoryRecord>>>
    allB2CAppProperties?: Maybe<AllB2CAppPropertiesOutput>
    /**  Search for all B2CAppPublishRequestHistoryRecord items which match the where clause.  */
    allB2CAppPublishRequestHistoryRecords?: Maybe<Array<Maybe<B2CAppPublishRequestHistoryRecord>>>
    /**  Search for all B2CAppPublishRequest items which match the where clause.  */
    allB2CAppPublishRequests?: Maybe<Array<Maybe<B2CAppPublishRequest>>>
    /**  Search for all B2CApp items which match the where clause.  */
    allB2CApps?: Maybe<Array<Maybe<B2CApp>>>
    /**  Search for all ConfirmEmailActionHistoryRecord items which match the where clause.  */
    allConfirmEmailActionHistoryRecords?: Maybe<Array<Maybe<ConfirmEmailActionHistoryRecord>>>
    /**  Search for all ConfirmEmailAction items which match the where clause.  */
    allConfirmEmailActions?: Maybe<Array<Maybe<ConfirmEmailAction>>>
    /**  Search for all ConfirmPhoneActionHistoryRecord items which match the where clause.  */
    allConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>
    /**  Search for all ConfirmPhoneAction items which match the where clause.  */
    allConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>
    /**  Search for all UserHistoryRecord items which match the where clause.  */
    allUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>
    /**  Search for all User items which match the where clause.  */
    allUsers?: Maybe<Array<Maybe<User>>>
    /**  Search for all WebhookHistoryRecord items which match the where clause.  */
    allWebhookHistoryRecords?: Maybe<Array<Maybe<WebhookHistoryRecord>>>
    /**  Search for all WebhookSubscriptionHistoryRecord items which match the where clause.  */
    allWebhookSubscriptionHistoryRecords?: Maybe<Array<Maybe<WebhookSubscriptionHistoryRecord>>>
    /**  Search for all WebhookSubscription items which match the where clause.  */
    allWebhookSubscriptions?: Maybe<Array<Maybe<WebhookSubscription>>>
    /**  Search for all Webhook items which match the where clause.  */
    allWebhooks?: Maybe<Array<Maybe<Webhook>>>
    /** The version of the Keystone application serving this API. */
    appVersion?: Maybe<Scalars['String']['output']>
    authenticatedUser?: Maybe<User>
}


export type QueryB2CAppArgs = {
    where: B2CAppWhereUniqueInput
}


export type QueryB2CAppAccessRightArgs = {
    where: B2CAppAccessRightWhereUniqueInput
}


export type QueryB2CAppAccessRightHistoryRecordArgs = {
    where: B2CAppAccessRightHistoryRecordWhereUniqueInput
}


export type QueryB2CAppBuildArgs = {
    where: B2CAppBuildWhereUniqueInput
}


export type QueryB2CAppBuildHistoryRecordArgs = {
    where: B2CAppBuildHistoryRecordWhereUniqueInput
}


export type QueryB2CAppHistoryRecordArgs = {
    where: B2CAppHistoryRecordWhereUniqueInput
}


export type QueryB2CAppPublishRequestArgs = {
    where: B2CAppPublishRequestWhereUniqueInput
}


export type QueryB2CAppPublishRequestHistoryRecordArgs = {
    where: B2CAppPublishRequestHistoryRecordWhereUniqueInput
}


export type QueryConfirmEmailActionArgs = {
    where: ConfirmEmailActionWhereUniqueInput
}


export type QueryConfirmEmailActionHistoryRecordArgs = {
    where: ConfirmEmailActionHistoryRecordWhereUniqueInput
}


export type QueryConfirmPhoneActionArgs = {
    where: ConfirmPhoneActionWhereUniqueInput
}


export type QueryConfirmPhoneActionHistoryRecordArgs = {
    where: ConfirmPhoneActionHistoryRecordWhereUniqueInput
}


export type QueryOidcClientArgs = {
    data: GetOidcClientInput
}


export type QueryUserArgs = {
    where: UserWhereUniqueInput
}


export type QueryUserHistoryRecordArgs = {
    where: UserHistoryRecordWhereUniqueInput
}


export type QueryWebhookArgs = {
    where: WebhookWhereUniqueInput
}


export type QueryWebhookHistoryRecordArgs = {
    where: WebhookHistoryRecordWhereUniqueInput
}


export type QueryWebhookSubscriptionArgs = {
    where: WebhookSubscriptionWhereUniqueInput
}


export type QueryWebhookSubscriptionHistoryRecordArgs = {
    where: WebhookSubscriptionHistoryRecordWhereUniqueInput
}


export type Query_AllB2CAppAccessRightHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppAccessRightHistoryRecordsBy>>
    where?: InputMaybe<B2CAppAccessRightHistoryRecordWhereInput>
}


export type Query_AllB2CAppAccessRightsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppAccessRightsBy>>
    where?: InputMaybe<B2CAppAccessRightWhereInput>
}


export type Query_AllB2CAppBuildHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppBuildHistoryRecordsBy>>
    where?: InputMaybe<B2CAppBuildHistoryRecordWhereInput>
}


export type Query_AllB2CAppBuildsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppBuildsBy>>
    where?: InputMaybe<B2CAppBuildWhereInput>
}


export type Query_AllB2CAppHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppHistoryRecordsBy>>
    where?: InputMaybe<B2CAppHistoryRecordWhereInput>
}


export type Query_AllB2CAppPublishRequestHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppPublishRequestHistoryRecordsBy>>
    where?: InputMaybe<B2CAppPublishRequestHistoryRecordWhereInput>
}


export type Query_AllB2CAppPublishRequestsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppPublishRequestsBy>>
    where?: InputMaybe<B2CAppPublishRequestWhereInput>
}


export type Query_AllB2CAppsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppsBy>>
    where?: InputMaybe<B2CAppWhereInput>
}


export type Query_AllConfirmEmailActionHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortConfirmEmailActionHistoryRecordsBy>>
    where?: InputMaybe<ConfirmEmailActionHistoryRecordWhereInput>
}


export type Query_AllConfirmEmailActionsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortConfirmEmailActionsBy>>
    where?: InputMaybe<ConfirmEmailActionWhereInput>
}


export type Query_AllConfirmPhoneActionHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortConfirmPhoneActionHistoryRecordsBy>>
    where?: InputMaybe<ConfirmPhoneActionHistoryRecordWhereInput>
}


export type Query_AllConfirmPhoneActionsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortConfirmPhoneActionsBy>>
    where?: InputMaybe<ConfirmPhoneActionWhereInput>
}


export type Query_AllUserHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortUserHistoryRecordsBy>>
    where?: InputMaybe<UserHistoryRecordWhereInput>
}


export type Query_AllUsersMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortUsersBy>>
    where?: InputMaybe<UserWhereInput>
}


export type Query_AllWebhookHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortWebhookHistoryRecordsBy>>
    where?: InputMaybe<WebhookHistoryRecordWhereInput>
}


export type Query_AllWebhookSubscriptionHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortWebhookSubscriptionHistoryRecordsBy>>
    where?: InputMaybe<WebhookSubscriptionHistoryRecordWhereInput>
}


export type Query_AllWebhookSubscriptionsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortWebhookSubscriptionsBy>>
    where?: InputMaybe<WebhookSubscriptionWhereInput>
}


export type Query_AllWebhooksMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortWebhooksBy>>
    where?: InputMaybe<WebhookWhereInput>
}


export type Query_KsListsMetaArgs = {
    where?: InputMaybe<_KsListsMetaInput>
}


export type QueryAllB2CAppAccessRightHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppAccessRightHistoryRecordsBy>>
    where?: InputMaybe<B2CAppAccessRightHistoryRecordWhereInput>
}


export type QueryAllB2CAppAccessRightsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppAccessRightsBy>>
    where?: InputMaybe<B2CAppAccessRightWhereInput>
}


export type QueryAllB2CAppBuildHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppBuildHistoryRecordsBy>>
    where?: InputMaybe<B2CAppBuildHistoryRecordWhereInput>
}


export type QueryAllB2CAppBuildsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppBuildsBy>>
    where?: InputMaybe<B2CAppBuildWhereInput>
}


export type QueryAllB2CAppHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppHistoryRecordsBy>>
    where?: InputMaybe<B2CAppHistoryRecordWhereInput>
}


export type QueryAllB2CAppPropertiesArgs = {
    data: AllB2CAppPropertiesInput
}


export type QueryAllB2CAppPublishRequestHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppPublishRequestHistoryRecordsBy>>
    where?: InputMaybe<B2CAppPublishRequestHistoryRecordWhereInput>
}


export type QueryAllB2CAppPublishRequestsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppPublishRequestsBy>>
    where?: InputMaybe<B2CAppPublishRequestWhereInput>
}


export type QueryAllB2CAppsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortB2CAppsBy>>
    where?: InputMaybe<B2CAppWhereInput>
}


export type QueryAllConfirmEmailActionHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortConfirmEmailActionHistoryRecordsBy>>
    where?: InputMaybe<ConfirmEmailActionHistoryRecordWhereInput>
}


export type QueryAllConfirmEmailActionsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortConfirmEmailActionsBy>>
    where?: InputMaybe<ConfirmEmailActionWhereInput>
}


export type QueryAllConfirmPhoneActionHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortConfirmPhoneActionHistoryRecordsBy>>
    where?: InputMaybe<ConfirmPhoneActionHistoryRecordWhereInput>
}


export type QueryAllConfirmPhoneActionsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortConfirmPhoneActionsBy>>
    where?: InputMaybe<ConfirmPhoneActionWhereInput>
}


export type QueryAllUserHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortUserHistoryRecordsBy>>
    where?: InputMaybe<UserHistoryRecordWhereInput>
}


export type QueryAllUsersArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortUsersBy>>
    where?: InputMaybe<UserWhereInput>
}


export type QueryAllWebhookHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortWebhookHistoryRecordsBy>>
    where?: InputMaybe<WebhookHistoryRecordWhereInput>
}


export type QueryAllWebhookSubscriptionHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortWebhookSubscriptionHistoryRecordsBy>>
    where?: InputMaybe<WebhookSubscriptionHistoryRecordWhereInput>
}


export type QueryAllWebhookSubscriptionsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortWebhookSubscriptionsBy>>
    where?: InputMaybe<WebhookSubscriptionWhereInput>
}


export type QueryAllWebhooksArgs = {
    first?: InputMaybe<Scalars['Int']['input']>
    orderBy?: InputMaybe<Scalars['String']['input']>
    search?: InputMaybe<Scalars['String']['input']>
    skip?: InputMaybe<Scalars['Int']['input']>
    sortBy?: InputMaybe<Array<SortWebhooksBy>>
    where?: InputMaybe<WebhookWhereInput>
}

export type RegisterAppUserServiceInput = {
    app: AppWhereUniqueInput
    confirmEmailAction: ConfirmEmailActionWhereUniqueInput
    dv: Scalars['Int']['input']
    environment: AppEnvironment
    sender: SenderFieldInput
}

export type RegisterAppUserServiceOutput = {
    __typename?: 'RegisterAppUserServiceOutput'
    id: Scalars['ID']['output']
}

export type RegisterNewUserInput = {
    confirmPhoneAction: ConfirmPhoneActionWhereUniqueInput
    dv: Scalars['Int']['input']
    name: Scalars['String']['input']
    password: Scalars['String']['input']
    sender: SenderFieldInput
}

export type SenderField = {
    __typename?: 'SenderField'
    dv: Scalars['Int']['output']
    fingerprint: Scalars['String']['output']
}

export type SenderFieldInput = {
    dv: Scalars['Int']['input']
    fingerprint: Scalars['String']['input']
}

export enum SortB2CAppAccessRightHistoryRecordsBy {
    CondoUserIdAsc = 'condoUserId_ASC',
    CondoUserIdDesc = 'condoUserId_DESC',
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DevelopmentExportIdAsc = 'developmentExportId_ASC',
    DevelopmentExportIdDesc = 'developmentExportId_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    EnvironmentAsc = 'environment_ASC',
    EnvironmentDesc = 'environment_DESC',
    HistoryActionAsc = 'history_action_ASC',
    HistoryActionDesc = 'history_action_DESC',
    HistoryDateAsc = 'history_date_ASC',
    HistoryDateDesc = 'history_date_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    ProductionExportIdAsc = 'productionExportId_ASC',
    ProductionExportIdDesc = 'productionExportId_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortB2CAppAccessRightsBy {
    AppAsc = 'app_ASC',
    AppDesc = 'app_DESC',
    CondoUserIdAsc = 'condoUserId_ASC',
    CondoUserIdDesc = 'condoUserId_DESC',
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    CreatedByAsc = 'createdBy_ASC',
    CreatedByDesc = 'createdBy_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DevelopmentExportIdAsc = 'developmentExportId_ASC',
    DevelopmentExportIdDesc = 'developmentExportId_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    EnvironmentAsc = 'environment_ASC',
    EnvironmentDesc = 'environment_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    ProductionExportIdAsc = 'productionExportId_ASC',
    ProductionExportIdDesc = 'productionExportId_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UpdatedByAsc = 'updatedBy_ASC',
    UpdatedByDesc = 'updatedBy_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortB2CAppBuildHistoryRecordsBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DevelopmentExportIdAsc = 'developmentExportId_ASC',
    DevelopmentExportIdDesc = 'developmentExportId_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    HistoryActionAsc = 'history_action_ASC',
    HistoryActionDesc = 'history_action_DESC',
    HistoryDateAsc = 'history_date_ASC',
    HistoryDateDesc = 'history_date_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    ProductionExportIdAsc = 'productionExportId_ASC',
    ProductionExportIdDesc = 'productionExportId_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
    VersionAsc = 'version_ASC',
    VersionDesc = 'version_DESC',
}

export enum SortB2CAppBuildsBy {
    AppAsc = 'app_ASC',
    AppDesc = 'app_DESC',
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    CreatedByAsc = 'createdBy_ASC',
    CreatedByDesc = 'createdBy_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DevelopmentExportIdAsc = 'developmentExportId_ASC',
    DevelopmentExportIdDesc = 'developmentExportId_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    ProductionExportIdAsc = 'productionExportId_ASC',
    ProductionExportIdDesc = 'productionExportId_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UpdatedByAsc = 'updatedBy_ASC',
    UpdatedByDesc = 'updatedBy_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
    VersionAsc = 'version_ASC',
    VersionDesc = 'version_DESC',
}

export enum SortB2CAppHistoryRecordsBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DeveloperAsc = 'developer_ASC',
    DeveloperDesc = 'developer_DESC',
    DevelopmentExportIdAsc = 'developmentExportId_ASC',
    DevelopmentExportIdDesc = 'developmentExportId_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    HistoryActionAsc = 'history_action_ASC',
    HistoryActionDesc = 'history_action_DESC',
    HistoryDateAsc = 'history_date_ASC',
    HistoryDateDesc = 'history_date_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    NameAsc = 'name_ASC',
    NameDesc = 'name_DESC',
    ProductionExportIdAsc = 'productionExportId_ASC',
    ProductionExportIdDesc = 'productionExportId_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortB2CAppPublishRequestHistoryRecordsBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    HistoryActionAsc = 'history_action_ASC',
    HistoryActionDesc = 'history_action_DESC',
    HistoryDateAsc = 'history_date_ASC',
    HistoryDateDesc = 'history_date_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    IsAppTestedAsc = 'isAppTested_ASC',
    IsAppTestedDesc = 'isAppTested_DESC',
    IsContractSignedAsc = 'isContractSigned_ASC',
    IsContractSignedDesc = 'isContractSigned_DESC',
    IsInfoApprovedAsc = 'isInfoApproved_ASC',
    IsInfoApprovedDesc = 'isInfoApproved_DESC',
    StatusAsc = 'status_ASC',
    StatusDesc = 'status_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortB2CAppPublishRequestsBy {
    AppAsc = 'app_ASC',
    AppDesc = 'app_DESC',
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    CreatedByAsc = 'createdBy_ASC',
    CreatedByDesc = 'createdBy_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    IsAppTestedAsc = 'isAppTested_ASC',
    IsAppTestedDesc = 'isAppTested_DESC',
    IsContractSignedAsc = 'isContractSigned_ASC',
    IsContractSignedDesc = 'isContractSigned_DESC',
    IsInfoApprovedAsc = 'isInfoApproved_ASC',
    IsInfoApprovedDesc = 'isInfoApproved_DESC',
    StatusAsc = 'status_ASC',
    StatusDesc = 'status_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UpdatedByAsc = 'updatedBy_ASC',
    UpdatedByDesc = 'updatedBy_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortB2CAppsBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    CreatedByAsc = 'createdBy_ASC',
    CreatedByDesc = 'createdBy_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DeveloperAsc = 'developer_ASC',
    DeveloperDesc = 'developer_DESC',
    DevelopmentExportIdAsc = 'developmentExportId_ASC',
    DevelopmentExportIdDesc = 'developmentExportId_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    NameAsc = 'name_ASC',
    NameDesc = 'name_DESC',
    ProductionExportIdAsc = 'productionExportId_ASC',
    ProductionExportIdDesc = 'productionExportId_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UpdatedByAsc = 'updatedBy_ASC',
    UpdatedByDesc = 'updatedBy_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortConfirmEmailActionHistoryRecordsBy {
    AttemptsAsc = 'attempts_ASC',
    AttemptsDesc = 'attempts_DESC',
    CodeAsc = 'code_ASC',
    CodeDesc = 'code_DESC',
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    EmailAsc = 'email_ASC',
    EmailDesc = 'email_DESC',
    ExpiresAtAsc = 'expiresAt_ASC',
    ExpiresAtDesc = 'expiresAt_DESC',
    HistoryActionAsc = 'history_action_ASC',
    HistoryActionDesc = 'history_action_DESC',
    HistoryDateAsc = 'history_date_ASC',
    HistoryDateDesc = 'history_date_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    IsVerifiedAsc = 'isVerified_ASC',
    IsVerifiedDesc = 'isVerified_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortConfirmEmailActionsBy {
    AttemptsAsc = 'attempts_ASC',
    AttemptsDesc = 'attempts_DESC',
    CodeAsc = 'code_ASC',
    CodeDesc = 'code_DESC',
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    CreatedByAsc = 'createdBy_ASC',
    CreatedByDesc = 'createdBy_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    EmailAsc = 'email_ASC',
    EmailDesc = 'email_DESC',
    ExpiresAtAsc = 'expiresAt_ASC',
    ExpiresAtDesc = 'expiresAt_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    IsVerifiedAsc = 'isVerified_ASC',
    IsVerifiedDesc = 'isVerified_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UpdatedByAsc = 'updatedBy_ASC',
    UpdatedByDesc = 'updatedBy_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortConfirmPhoneActionHistoryRecordsBy {
    AttemptsAsc = 'attempts_ASC',
    AttemptsDesc = 'attempts_DESC',
    CodeAsc = 'code_ASC',
    CodeDesc = 'code_DESC',
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    ExpiresAtAsc = 'expiresAt_ASC',
    ExpiresAtDesc = 'expiresAt_DESC',
    HistoryActionAsc = 'history_action_ASC',
    HistoryActionDesc = 'history_action_DESC',
    HistoryDateAsc = 'history_date_ASC',
    HistoryDateDesc = 'history_date_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    IsVerifiedAsc = 'isVerified_ASC',
    IsVerifiedDesc = 'isVerified_DESC',
    PhoneAsc = 'phone_ASC',
    PhoneDesc = 'phone_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortConfirmPhoneActionsBy {
    AttemptsAsc = 'attempts_ASC',
    AttemptsDesc = 'attempts_DESC',
    CodeAsc = 'code_ASC',
    CodeDesc = 'code_DESC',
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    CreatedByAsc = 'createdBy_ASC',
    CreatedByDesc = 'createdBy_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    ExpiresAtAsc = 'expiresAt_ASC',
    ExpiresAtDesc = 'expiresAt_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    IsVerifiedAsc = 'isVerified_ASC',
    IsVerifiedDesc = 'isVerified_DESC',
    PhoneAsc = 'phone_ASC',
    PhoneDesc = 'phone_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UpdatedByAsc = 'updatedBy_ASC',
    UpdatedByDesc = 'updatedBy_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortUserHistoryRecordsBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    EmailAsc = 'email_ASC',
    EmailDesc = 'email_DESC',
    HistoryActionAsc = 'history_action_ASC',
    HistoryActionDesc = 'history_action_DESC',
    HistoryDateAsc = 'history_date_ASC',
    HistoryDateDesc = 'history_date_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    IsAdminAsc = 'isAdmin_ASC',
    IsAdminDesc = 'isAdmin_DESC',
    IsSupportAsc = 'isSupport_ASC',
    IsSupportDesc = 'isSupport_DESC',
    NameAsc = 'name_ASC',
    NameDesc = 'name_DESC',
    PasswordAsc = 'password_ASC',
    PasswordDesc = 'password_DESC',
    PhoneAsc = 'phone_ASC',
    PhoneDesc = 'phone_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortUsersBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    CreatedByAsc = 'createdBy_ASC',
    CreatedByDesc = 'createdBy_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    EmailAsc = 'email_ASC',
    EmailDesc = 'email_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    IsAdminAsc = 'isAdmin_ASC',
    IsAdminDesc = 'isAdmin_DESC',
    IsSupportAsc = 'isSupport_ASC',
    IsSupportDesc = 'isSupport_DESC',
    NameAsc = 'name_ASC',
    NameDesc = 'name_DESC',
    PhoneAsc = 'phone_ASC',
    PhoneDesc = 'phone_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UpdatedByAsc = 'updatedBy_ASC',
    UpdatedByDesc = 'updatedBy_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortWebhookHistoryRecordsBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DescriptionAsc = 'description_ASC',
    DescriptionDesc = 'description_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    HistoryActionAsc = 'history_action_ASC',
    HistoryActionDesc = 'history_action_DESC',
    HistoryDateAsc = 'history_date_ASC',
    HistoryDateDesc = 'history_date_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    NameAsc = 'name_ASC',
    NameDesc = 'name_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UrlAsc = 'url_ASC',
    UrlDesc = 'url_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortWebhookSubscriptionHistoryRecordsBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    FailuresCountAsc = 'failuresCount_ASC',
    FailuresCountDesc = 'failuresCount_DESC',
    FieldsAsc = 'fields_ASC',
    FieldsDesc = 'fields_DESC',
    HistoryActionAsc = 'history_action_ASC',
    HistoryActionDesc = 'history_action_DESC',
    HistoryDateAsc = 'history_date_ASC',
    HistoryDateDesc = 'history_date_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    MaxPackSizeAsc = 'maxPackSize_ASC',
    MaxPackSizeDesc = 'maxPackSize_DESC',
    ModelAsc = 'model_ASC',
    ModelDesc = 'model_DESC',
    SyncedAmountAsc = 'syncedAmount_ASC',
    SyncedAmountDesc = 'syncedAmount_DESC',
    SyncedAtAsc = 'syncedAt_ASC',
    SyncedAtDesc = 'syncedAt_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UrlAsc = 'url_ASC',
    UrlDesc = 'url_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export enum SortWebhookSubscriptionsBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    CreatedByAsc = 'createdBy_ASC',
    CreatedByDesc = 'createdBy_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    FailuresCountAsc = 'failuresCount_ASC',
    FailuresCountDesc = 'failuresCount_DESC',
    FieldsAsc = 'fields_ASC',
    FieldsDesc = 'fields_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    MaxPackSizeAsc = 'maxPackSize_ASC',
    MaxPackSizeDesc = 'maxPackSize_DESC',
    ModelAsc = 'model_ASC',
    ModelDesc = 'model_DESC',
    SyncedAmountAsc = 'syncedAmount_ASC',
    SyncedAmountDesc = 'syncedAmount_DESC',
    SyncedAtAsc = 'syncedAt_ASC',
    SyncedAtDesc = 'syncedAt_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UpdatedByAsc = 'updatedBy_ASC',
    UpdatedByDesc = 'updatedBy_DESC',
    UrlAsc = 'url_ASC',
    UrlDesc = 'url_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
    WebhookAsc = 'webhook_ASC',
    WebhookDesc = 'webhook_DESC',
}

export enum SortWebhooksBy {
    CreatedAtAsc = 'createdAt_ASC',
    CreatedAtDesc = 'createdAt_DESC',
    CreatedByAsc = 'createdBy_ASC',
    CreatedByDesc = 'createdBy_DESC',
    DeletedAtAsc = 'deletedAt_ASC',
    DeletedAtDesc = 'deletedAt_DESC',
    DescriptionAsc = 'description_ASC',
    DescriptionDesc = 'description_DESC',
    DvAsc = 'dv_ASC',
    DvDesc = 'dv_DESC',
    IdAsc = 'id_ASC',
    IdDesc = 'id_DESC',
    NameAsc = 'name_ASC',
    NameDesc = 'name_DESC',
    UpdatedAtAsc = 'updatedAt_ASC',
    UpdatedAtDesc = 'updatedAt_DESC',
    UpdatedByAsc = 'updatedBy_ASC',
    UpdatedByDesc = 'updatedBy_DESC',
    UrlAsc = 'url_ASC',
    UrlDesc = 'url_DESC',
    UserAsc = 'user_ASC',
    UserDesc = 'user_DESC',
    VAsc = 'v_ASC',
    VDesc = 'v_DESC',
}

export type StartConfirmEmailActionInput = {
    dv: Scalars['Int']['input']
    email: Scalars['String']['input']
    sender: SenderFieldInput
}

export type StartConfirmEmailActionOutput = {
    __typename?: 'StartConfirmEmailActionOutput'
    actionId: Scalars['String']['output']
    email: Scalars['String']['output']
}

export type StartConfirmPhoneActionInput = {
    dv: Scalars['Int']['input']
    phone: Scalars['String']['input']
    sender: SenderFieldInput
}

export type StartConfirmPhoneActionOutput = {
    __typename?: 'StartConfirmPhoneActionOutput'
    actionId: Scalars['String']['output']
    phone: Scalars['String']['output']
}

export type UpdateOidcClientUrlInput = {
    app: AppWhereUniqueInput
    dv: Scalars['Int']['input']
    environment: AppEnvironment
    redirectUri: Scalars['String']['input']
    sender: SenderFieldInput
}

/**  Account of individual developer or development company.  */
export type User = {
    __typename?: 'User'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the User List config, or
   *  2. As an alias to the field set on 'labelField' in the User List config, or
   *  3. As an alias to a 'name' field on the User List (if one exists), or
   *  4. As an alias to the 'id' field on the User List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>
    deletedAt?: Maybe<Scalars['String']['output']>
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>
    /**  User email. Currently used only for internal Keystone mutations.  */
    email?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    /**  Provides a superuser access to any schema data  */
    isAdmin?: Maybe<Scalars['Boolean']['output']>
    /**  Provide access to admin-panel, where different task can be performed  */
    isSupport?: Maybe<Scalars['Boolean']['output']>
    /**  Name. If impersonal account should be a company name  */
    name?: Maybe<Scalars['String']['output']>
    newId?: Maybe<Scalars['String']['output']>
    /**  User password used for authentication. Self-update only field  */
    password_is_set?: Maybe<Scalars['Boolean']['output']>
    /**  User phone. Required for authentication, used as main contact info  */
    phone?: Maybe<Scalars['String']['output']>
    /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>
    updatedAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>
    v?: Maybe<Scalars['Int']['output']>
}

export type UserCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    email?: InputMaybe<Scalars['String']['input']>
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>
    isSupport?: InputMaybe<Scalars['Boolean']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    password?: InputMaybe<Scalars['String']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

/**  A keystone list  */
export type UserHistoryRecord = {
    __typename?: 'UserHistoryRecord'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the UserHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the UserHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the UserHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the UserHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    createdBy?: Maybe<Scalars['String']['output']>
    deletedAt?: Maybe<Scalars['String']['output']>
    dv?: Maybe<Scalars['Int']['output']>
    email?: Maybe<Scalars['String']['output']>
    history_action?: Maybe<UserHistoryRecordHistoryActionType>
    history_date?: Maybe<Scalars['String']['output']>
    history_id?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    isAdmin?: Maybe<Scalars['Boolean']['output']>
    isSupport?: Maybe<Scalars['Boolean']['output']>
    name?: Maybe<Scalars['String']['output']>
    newId?: Maybe<Scalars['JSON']['output']>
    password?: Maybe<Scalars['String']['output']>
    phone?: Maybe<Scalars['String']['output']>
    sender?: Maybe<Scalars['JSON']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    updatedBy?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
}

export type UserHistoryRecordCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    email?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<UserHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>
    isSupport?: InputMaybe<Scalars['Boolean']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    password?: InputMaybe<Scalars['String']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export enum UserHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type UserHistoryRecordUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    email?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<UserHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>
    isSupport?: InputMaybe<Scalars['Boolean']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    password?: InputMaybe<Scalars['String']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type UserHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<UserHistoryRecordWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<UserHistoryRecordWhereInput>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<Scalars['String']['input']>
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy_not?: InputMaybe<Scalars['String']['input']>
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    email?: InputMaybe<Scalars['String']['input']>
    email_contains?: InputMaybe<Scalars['String']['input']>
    email_contains_i?: InputMaybe<Scalars['String']['input']>
    email_ends_with?: InputMaybe<Scalars['String']['input']>
    email_ends_with_i?: InputMaybe<Scalars['String']['input']>
    email_i?: InputMaybe<Scalars['String']['input']>
    email_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    email_not?: InputMaybe<Scalars['String']['input']>
    email_not_contains?: InputMaybe<Scalars['String']['input']>
    email_not_contains_i?: InputMaybe<Scalars['String']['input']>
    email_not_ends_with?: InputMaybe<Scalars['String']['input']>
    email_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    email_not_i?: InputMaybe<Scalars['String']['input']>
    email_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    email_not_starts_with?: InputMaybe<Scalars['String']['input']>
    email_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    email_starts_with?: InputMaybe<Scalars['String']['input']>
    email_starts_with_i?: InputMaybe<Scalars['String']['input']>
    history_action?: InputMaybe<UserHistoryRecordHistoryActionType>
    history_action_in?: InputMaybe<Array<InputMaybe<UserHistoryRecordHistoryActionType>>>
    history_action_not?: InputMaybe<UserHistoryRecordHistoryActionType>
    history_action_not_in?: InputMaybe<Array<InputMaybe<UserHistoryRecordHistoryActionType>>>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_date_gt?: InputMaybe<Scalars['String']['input']>
    history_date_gte?: InputMaybe<Scalars['String']['input']>
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_date_lt?: InputMaybe<Scalars['String']['input']>
    history_date_lte?: InputMaybe<Scalars['String']['input']>
    history_date_not?: InputMaybe<Scalars['String']['input']>
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id?: InputMaybe<Scalars['String']['input']>
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id_not?: InputMaybe<Scalars['String']['input']>
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>
    isAdmin_not?: InputMaybe<Scalars['Boolean']['input']>
    isSupport?: InputMaybe<Scalars['Boolean']['input']>
    isSupport_not?: InputMaybe<Scalars['Boolean']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    name_contains?: InputMaybe<Scalars['String']['input']>
    name_contains_i?: InputMaybe<Scalars['String']['input']>
    name_ends_with?: InputMaybe<Scalars['String']['input']>
    name_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_i?: InputMaybe<Scalars['String']['input']>
    name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not?: InputMaybe<Scalars['String']['input']>
    name_not_contains?: InputMaybe<Scalars['String']['input']>
    name_not_contains_i?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_not_i?: InputMaybe<Scalars['String']['input']>
    name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not_starts_with?: InputMaybe<Scalars['String']['input']>
    name_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    name_starts_with?: InputMaybe<Scalars['String']['input']>
    name_starts_with_i?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    newId_not?: InputMaybe<Scalars['JSON']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    password?: InputMaybe<Scalars['String']['input']>
    password_contains?: InputMaybe<Scalars['String']['input']>
    password_contains_i?: InputMaybe<Scalars['String']['input']>
    password_ends_with?: InputMaybe<Scalars['String']['input']>
    password_ends_with_i?: InputMaybe<Scalars['String']['input']>
    password_i?: InputMaybe<Scalars['String']['input']>
    password_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    password_not?: InputMaybe<Scalars['String']['input']>
    password_not_contains?: InputMaybe<Scalars['String']['input']>
    password_not_contains_i?: InputMaybe<Scalars['String']['input']>
    password_not_ends_with?: InputMaybe<Scalars['String']['input']>
    password_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    password_not_i?: InputMaybe<Scalars['String']['input']>
    password_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    password_not_starts_with?: InputMaybe<Scalars['String']['input']>
    password_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    password_starts_with?: InputMaybe<Scalars['String']['input']>
    password_starts_with_i?: InputMaybe<Scalars['String']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    phone_contains?: InputMaybe<Scalars['String']['input']>
    phone_contains_i?: InputMaybe<Scalars['String']['input']>
    phone_ends_with?: InputMaybe<Scalars['String']['input']>
    phone_ends_with_i?: InputMaybe<Scalars['String']['input']>
    phone_i?: InputMaybe<Scalars['String']['input']>
    phone_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    phone_not?: InputMaybe<Scalars['String']['input']>
    phone_not_contains?: InputMaybe<Scalars['String']['input']>
    phone_not_contains_i?: InputMaybe<Scalars['String']['input']>
    phone_not_ends_with?: InputMaybe<Scalars['String']['input']>
    phone_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    phone_not_i?: InputMaybe<Scalars['String']['input']>
    phone_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    phone_not_starts_with?: InputMaybe<Scalars['String']['input']>
    phone_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    phone_starts_with?: InputMaybe<Scalars['String']['input']>
    phone_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender_not?: InputMaybe<Scalars['JSON']['input']>
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy_not?: InputMaybe<Scalars['String']['input']>
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type UserHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type UserHistoryRecordsCreateInput = {
    data?: InputMaybe<UserHistoryRecordCreateInput>
}

export type UserHistoryRecordsUpdateInput = {
    data?: InputMaybe<UserHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}

export type UserRelateToOneInput = {
    connect?: InputMaybe<UserWhereUniqueInput>
    create?: InputMaybe<UserCreateInput>
    disconnect?: InputMaybe<UserWhereUniqueInput>
    disconnectAll?: InputMaybe<Scalars['Boolean']['input']>
}

export type UserUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    email?: InputMaybe<Scalars['String']['input']>
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>
    isSupport?: InputMaybe<Scalars['Boolean']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    password?: InputMaybe<Scalars['String']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type UserWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<UserWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<UserWhereInput>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<UserWhereInput>
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    email?: InputMaybe<Scalars['String']['input']>
    email_contains?: InputMaybe<Scalars['String']['input']>
    email_contains_i?: InputMaybe<Scalars['String']['input']>
    email_ends_with?: InputMaybe<Scalars['String']['input']>
    email_ends_with_i?: InputMaybe<Scalars['String']['input']>
    email_i?: InputMaybe<Scalars['String']['input']>
    email_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    email_not?: InputMaybe<Scalars['String']['input']>
    email_not_contains?: InputMaybe<Scalars['String']['input']>
    email_not_contains_i?: InputMaybe<Scalars['String']['input']>
    email_not_ends_with?: InputMaybe<Scalars['String']['input']>
    email_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    email_not_i?: InputMaybe<Scalars['String']['input']>
    email_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    email_not_starts_with?: InputMaybe<Scalars['String']['input']>
    email_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    email_starts_with?: InputMaybe<Scalars['String']['input']>
    email_starts_with_i?: InputMaybe<Scalars['String']['input']>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>
    isAdmin_not?: InputMaybe<Scalars['Boolean']['input']>
    isSupport?: InputMaybe<Scalars['Boolean']['input']>
    isSupport_not?: InputMaybe<Scalars['Boolean']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    name_contains?: InputMaybe<Scalars['String']['input']>
    name_contains_i?: InputMaybe<Scalars['String']['input']>
    name_ends_with?: InputMaybe<Scalars['String']['input']>
    name_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_i?: InputMaybe<Scalars['String']['input']>
    name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not?: InputMaybe<Scalars['String']['input']>
    name_not_contains?: InputMaybe<Scalars['String']['input']>
    name_not_contains_i?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_not_i?: InputMaybe<Scalars['String']['input']>
    name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not_starts_with?: InputMaybe<Scalars['String']['input']>
    name_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    name_starts_with?: InputMaybe<Scalars['String']['input']>
    name_starts_with_i?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    newId_not?: InputMaybe<Scalars['String']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    password_is_set?: InputMaybe<Scalars['Boolean']['input']>
    phone?: InputMaybe<Scalars['String']['input']>
    phone_contains?: InputMaybe<Scalars['String']['input']>
    phone_contains_i?: InputMaybe<Scalars['String']['input']>
    phone_ends_with?: InputMaybe<Scalars['String']['input']>
    phone_ends_with_i?: InputMaybe<Scalars['String']['input']>
    phone_i?: InputMaybe<Scalars['String']['input']>
    phone_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    phone_not?: InputMaybe<Scalars['String']['input']>
    phone_not_contains?: InputMaybe<Scalars['String']['input']>
    phone_not_contains_i?: InputMaybe<Scalars['String']['input']>
    phone_not_ends_with?: InputMaybe<Scalars['String']['input']>
    phone_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    phone_not_i?: InputMaybe<Scalars['String']['input']>
    phone_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    phone_not_starts_with?: InputMaybe<Scalars['String']['input']>
    phone_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    phone_starts_with?: InputMaybe<Scalars['String']['input']>
    phone_starts_with_i?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    sender_not?: InputMaybe<SenderFieldInput>
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<UserWhereInput>
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type UserWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type UsersCreateInput = {
    data?: InputMaybe<UserCreateInput>
}

export type UsersUpdateInput = {
    data?: InputMaybe<UserUpdateInput>
    id: Scalars['ID']['input']
}

/**  Webhooks are a way that the APP can send automated web callback with some messages to other apps or system to inform them about any updates. How does it work: 1. When objects are created or changed, we make requests to the GraphQL API to get data on behalf of the specified user; 2. Then we send the data to remote url. Webhook model contains basic configuration of integration, such as external server url, name, encryption parameters and so on.  */
export type Webhook = {
    __typename?: 'Webhook'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the Webhook List config, or
   *  2. As an alias to the field set on 'labelField' in the Webhook List config, or
   *  3. As an alias to a 'name' field on the Webhook List (if one exists), or
   *  4. As an alias to the 'id' field on the Webhook List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>
    deletedAt?: Maybe<Scalars['String']['output']>
    /**  Any other details that reveal the purpose of this hook  */
    description?: Maybe<Scalars['String']['output']>
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>
    id: Scalars['ID']['output']
    /**  Short name used to distinguish this hook from others. Usually it's the name of the integration  */
    name?: Maybe<Scalars['String']['output']>
    newId?: Maybe<Scalars['String']['output']>
    /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>
    updatedAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>
    /**  Webhook target URL to which requests will be sent  */
    url?: Maybe<Scalars['String']['output']>
    /**  The user on whose behalf a request is being made to the GraphQL API to prepare webhook data  */
    user?: Maybe<User>
    v?: Maybe<Scalars['Int']['output']>
}

export type WebhookCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    description?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    url?: InputMaybe<Scalars['String']['input']>
    user?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

/**  A keystone list  */
export type WebhookHistoryRecord = {
    __typename?: 'WebhookHistoryRecord'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the WebhookHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the WebhookHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the WebhookHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the WebhookHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    createdBy?: Maybe<Scalars['String']['output']>
    deletedAt?: Maybe<Scalars['String']['output']>
    description?: Maybe<Scalars['String']['output']>
    dv?: Maybe<Scalars['Int']['output']>
    history_action?: Maybe<WebhookHistoryRecordHistoryActionType>
    history_date?: Maybe<Scalars['String']['output']>
    history_id?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    name?: Maybe<Scalars['String']['output']>
    newId?: Maybe<Scalars['JSON']['output']>
    sender?: Maybe<Scalars['JSON']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    updatedBy?: Maybe<Scalars['String']['output']>
    url?: Maybe<Scalars['String']['output']>
    user?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
}

export type WebhookHistoryRecordCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    description?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    history_action?: InputMaybe<WebhookHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    url?: InputMaybe<Scalars['String']['input']>
    user?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export enum WebhookHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type WebhookHistoryRecordUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    description?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    history_action?: InputMaybe<WebhookHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    url?: InputMaybe<Scalars['String']['input']>
    user?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type WebhookHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<WebhookHistoryRecordWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<WebhookHistoryRecordWhereInput>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<Scalars['String']['input']>
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy_not?: InputMaybe<Scalars['String']['input']>
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    description?: InputMaybe<Scalars['String']['input']>
    description_contains?: InputMaybe<Scalars['String']['input']>
    description_contains_i?: InputMaybe<Scalars['String']['input']>
    description_ends_with?: InputMaybe<Scalars['String']['input']>
    description_ends_with_i?: InputMaybe<Scalars['String']['input']>
    description_i?: InputMaybe<Scalars['String']['input']>
    description_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    description_not?: InputMaybe<Scalars['String']['input']>
    description_not_contains?: InputMaybe<Scalars['String']['input']>
    description_not_contains_i?: InputMaybe<Scalars['String']['input']>
    description_not_ends_with?: InputMaybe<Scalars['String']['input']>
    description_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    description_not_i?: InputMaybe<Scalars['String']['input']>
    description_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    description_not_starts_with?: InputMaybe<Scalars['String']['input']>
    description_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    description_starts_with?: InputMaybe<Scalars['String']['input']>
    description_starts_with_i?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    history_action?: InputMaybe<WebhookHistoryRecordHistoryActionType>
    history_action_in?: InputMaybe<Array<InputMaybe<WebhookHistoryRecordHistoryActionType>>>
    history_action_not?: InputMaybe<WebhookHistoryRecordHistoryActionType>
    history_action_not_in?: InputMaybe<Array<InputMaybe<WebhookHistoryRecordHistoryActionType>>>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_date_gt?: InputMaybe<Scalars['String']['input']>
    history_date_gte?: InputMaybe<Scalars['String']['input']>
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_date_lt?: InputMaybe<Scalars['String']['input']>
    history_date_lte?: InputMaybe<Scalars['String']['input']>
    history_date_not?: InputMaybe<Scalars['String']['input']>
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id?: InputMaybe<Scalars['String']['input']>
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id_not?: InputMaybe<Scalars['String']['input']>
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    name?: InputMaybe<Scalars['String']['input']>
    name_contains?: InputMaybe<Scalars['String']['input']>
    name_contains_i?: InputMaybe<Scalars['String']['input']>
    name_ends_with?: InputMaybe<Scalars['String']['input']>
    name_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_i?: InputMaybe<Scalars['String']['input']>
    name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not?: InputMaybe<Scalars['String']['input']>
    name_not_contains?: InputMaybe<Scalars['String']['input']>
    name_not_contains_i?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_not_i?: InputMaybe<Scalars['String']['input']>
    name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not_starts_with?: InputMaybe<Scalars['String']['input']>
    name_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    name_starts_with?: InputMaybe<Scalars['String']['input']>
    name_starts_with_i?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    newId_not?: InputMaybe<Scalars['JSON']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender?: InputMaybe<Scalars['JSON']['input']>
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender_not?: InputMaybe<Scalars['JSON']['input']>
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy_not?: InputMaybe<Scalars['String']['input']>
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url?: InputMaybe<Scalars['String']['input']>
    url_contains?: InputMaybe<Scalars['String']['input']>
    url_contains_i?: InputMaybe<Scalars['String']['input']>
    url_ends_with?: InputMaybe<Scalars['String']['input']>
    url_ends_with_i?: InputMaybe<Scalars['String']['input']>
    url_i?: InputMaybe<Scalars['String']['input']>
    url_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url_not?: InputMaybe<Scalars['String']['input']>
    url_not_contains?: InputMaybe<Scalars['String']['input']>
    url_not_contains_i?: InputMaybe<Scalars['String']['input']>
    url_not_ends_with?: InputMaybe<Scalars['String']['input']>
    url_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    url_not_i?: InputMaybe<Scalars['String']['input']>
    url_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url_not_starts_with?: InputMaybe<Scalars['String']['input']>
    url_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    url_starts_with?: InputMaybe<Scalars['String']['input']>
    url_starts_with_i?: InputMaybe<Scalars['String']['input']>
    user?: InputMaybe<Scalars['String']['input']>
    user_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    user_not?: InputMaybe<Scalars['String']['input']>
    user_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type WebhookHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type WebhookHistoryRecordsCreateInput = {
    data?: InputMaybe<WebhookHistoryRecordCreateInput>
}

export type WebhookHistoryRecordsUpdateInput = {
    data?: InputMaybe<WebhookHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}

export type WebhookRelateToOneInput = {
    connect?: InputMaybe<WebhookWhereUniqueInput>
    create?: InputMaybe<WebhookCreateInput>
    disconnect?: InputMaybe<WebhookWhereUniqueInput>
    disconnectAll?: InputMaybe<Scalars['Boolean']['input']>
}

/**  Determines which models the WebHook will be subscribed to. When model changes subscription task will be triggered to resolve changed data and send a webhook  */
export type WebhookSubscription = {
    __typename?: 'WebhookSubscription'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the WebhookSubscription List config, or
   *  2. As an alias to the field set on 'labelField' in the WebhookSubscription List config, or
   *  3. As an alias to a 'name' field on the WebhookSubscription List (if one exists), or
   *  4. As an alias to the 'id' field on the WebhookSubscription List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>
    deletedAt?: Maybe<Scalars['String']['output']>
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>
    /**  The number of consecutive failures to send webhooks to a remote server. Field value is automatically incremented when the specified url is unavailable or the server response was not ok, but no more than once per hour. Field value is automatically reset to 0 when the remote server is successfully reached (syncedAt or syncedAmount changed), or can be manually reset by support. As soon as the counter reaches the value 10, which is interpreted as the unavailability of the external service for at least 10 hours, the webhook will stop being sent to this url. In this case, you will need to manually reset the counter via support to resume sending.  */
    failuresCount?: Maybe<Scalars['Int']['output']>
    /**  String representing list of model fields in graphql-query format. Exactly the fields specified here will be sent by the webhook. Correct examples: "field1 field2 { subfield }", "{ field1 relation { subfield } }"  */
    fields?: Maybe<Scalars['String']['output']>
    /**  Filters which is stored in JSON and used to filter models sent by the webhook. Examples of filters can be found in ModelWhereInput GQL type, where Model is name of your model  */
    filters?: Maybe<Scalars['JSON']['output']>
    id: Scalars['ID']['output']
    /**  The maximum number of objects that the server can send in one request. The default is 100, and maxPackSize cannot be set beyond this value. In most cases, you do not need to override this field, but it is recommended to lower this value for requests with a large number of related fields or in case of external restrictions of the server accepting webhooks.  */
    maxPackSize?: Maybe<Scalars['Int']['output']>
    /**  The data model (schema) that the webhook is subscribed to  */
    model?: Maybe<WebhookSubscriptionModelType>
    newId?: Maybe<Scalars['String']['output']>
    /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>
    /**  The number of objects successfully delivered by webhooks. On successful synchronization, the syncedAt field is updated and syncedAmount becomes 0. If the remote server fails, syncedAt will not be updated, and syncedAmount will increment to the number of successfully delivered objects.  */
    syncedAmount?: Maybe<Scalars['Int']['output']>
    /**  The time was the data was last synced. At the next synchronization, only objects that have changed since that time will be sent.  */
    syncedAt?: Maybe<Scalars['String']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>
    /**  Webhook target URL to which requests will be sent. Overrides url from webhook relation. Used in case when you need to send specific model to a separate url  */
    url?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
    /**  Link to a webhook containing information about integration  */
    webhook?: Maybe<Webhook>
}

export type WebhookSubscriptionCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    failuresCount?: InputMaybe<Scalars['Int']['input']>
    fields?: InputMaybe<Scalars['String']['input']>
    filters?: InputMaybe<Scalars['JSON']['input']>
    maxPackSize?: InputMaybe<Scalars['Int']['input']>
    model?: InputMaybe<WebhookSubscriptionModelType>
    newId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    syncedAmount?: InputMaybe<Scalars['Int']['input']>
    syncedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    url?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    webhook?: InputMaybe<WebhookRelateToOneInput>
}

/**  A keystone list  */
export type WebhookSubscriptionHistoryRecord = {
    __typename?: 'WebhookSubscriptionHistoryRecord'
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the WebhookSubscriptionHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the WebhookSubscriptionHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the WebhookSubscriptionHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the WebhookSubscriptionHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>
    createdAt?: Maybe<Scalars['String']['output']>
    createdBy?: Maybe<Scalars['String']['output']>
    deletedAt?: Maybe<Scalars['String']['output']>
    dv?: Maybe<Scalars['Int']['output']>
    failuresCount?: Maybe<Scalars['Int']['output']>
    fields?: Maybe<Scalars['String']['output']>
    filters?: Maybe<Scalars['JSON']['output']>
    history_action?: Maybe<WebhookSubscriptionHistoryRecordHistoryActionType>
    history_date?: Maybe<Scalars['String']['output']>
    history_id?: Maybe<Scalars['String']['output']>
    id: Scalars['ID']['output']
    maxPackSize?: Maybe<Scalars['Int']['output']>
    model?: Maybe<Scalars['String']['output']>
    newId?: Maybe<Scalars['JSON']['output']>
    sender?: Maybe<Scalars['JSON']['output']>
    syncedAmount?: Maybe<Scalars['Int']['output']>
    syncedAt?: Maybe<Scalars['String']['output']>
    updatedAt?: Maybe<Scalars['String']['output']>
    updatedBy?: Maybe<Scalars['String']['output']>
    url?: Maybe<Scalars['String']['output']>
    v?: Maybe<Scalars['Int']['output']>
    webhook?: Maybe<Scalars['String']['output']>
}

export type WebhookSubscriptionHistoryRecordCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    failuresCount?: InputMaybe<Scalars['Int']['input']>
    fields?: InputMaybe<Scalars['String']['input']>
    filters?: InputMaybe<Scalars['JSON']['input']>
    history_action?: InputMaybe<WebhookSubscriptionHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    maxPackSize?: InputMaybe<Scalars['Int']['input']>
    model?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    syncedAmount?: InputMaybe<Scalars['Int']['input']>
    syncedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    url?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    webhook?: InputMaybe<Scalars['String']['input']>
}

export enum WebhookSubscriptionHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type WebhookSubscriptionHistoryRecordUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<Scalars['String']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    failuresCount?: InputMaybe<Scalars['Int']['input']>
    fields?: InputMaybe<Scalars['String']['input']>
    filters?: InputMaybe<Scalars['JSON']['input']>
    history_action?: InputMaybe<WebhookSubscriptionHistoryRecordHistoryActionType>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_id?: InputMaybe<Scalars['String']['input']>
    maxPackSize?: InputMaybe<Scalars['Int']['input']>
    model?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    sender?: InputMaybe<Scalars['JSON']['input']>
    syncedAmount?: InputMaybe<Scalars['Int']['input']>
    syncedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    url?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    webhook?: InputMaybe<Scalars['String']['input']>
}

export type WebhookSubscriptionHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<WebhookSubscriptionHistoryRecordWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<WebhookSubscriptionHistoryRecordWhereInput>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<Scalars['String']['input']>
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy_not?: InputMaybe<Scalars['String']['input']>
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    failuresCount?: InputMaybe<Scalars['Int']['input']>
    failuresCount_gt?: InputMaybe<Scalars['Int']['input']>
    failuresCount_gte?: InputMaybe<Scalars['Int']['input']>
    failuresCount_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    failuresCount_lt?: InputMaybe<Scalars['Int']['input']>
    failuresCount_lte?: InputMaybe<Scalars['Int']['input']>
    failuresCount_not?: InputMaybe<Scalars['Int']['input']>
    failuresCount_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    fields?: InputMaybe<Scalars['String']['input']>
    fields_contains?: InputMaybe<Scalars['String']['input']>
    fields_contains_i?: InputMaybe<Scalars['String']['input']>
    fields_ends_with?: InputMaybe<Scalars['String']['input']>
    fields_ends_with_i?: InputMaybe<Scalars['String']['input']>
    fields_i?: InputMaybe<Scalars['String']['input']>
    fields_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    fields_not?: InputMaybe<Scalars['String']['input']>
    fields_not_contains?: InputMaybe<Scalars['String']['input']>
    fields_not_contains_i?: InputMaybe<Scalars['String']['input']>
    fields_not_ends_with?: InputMaybe<Scalars['String']['input']>
    fields_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    fields_not_i?: InputMaybe<Scalars['String']['input']>
    fields_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    fields_not_starts_with?: InputMaybe<Scalars['String']['input']>
    fields_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    fields_starts_with?: InputMaybe<Scalars['String']['input']>
    fields_starts_with_i?: InputMaybe<Scalars['String']['input']>
    filters?: InputMaybe<Scalars['JSON']['input']>
    filters_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    filters_not?: InputMaybe<Scalars['JSON']['input']>
    filters_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    history_action?: InputMaybe<WebhookSubscriptionHistoryRecordHistoryActionType>
    history_action_in?: InputMaybe<Array<InputMaybe<WebhookSubscriptionHistoryRecordHistoryActionType>>>
    history_action_not?: InputMaybe<WebhookSubscriptionHistoryRecordHistoryActionType>
    history_action_not_in?: InputMaybe<Array<InputMaybe<WebhookSubscriptionHistoryRecordHistoryActionType>>>
    history_date?: InputMaybe<Scalars['String']['input']>
    history_date_gt?: InputMaybe<Scalars['String']['input']>
    history_date_gte?: InputMaybe<Scalars['String']['input']>
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_date_lt?: InputMaybe<Scalars['String']['input']>
    history_date_lte?: InputMaybe<Scalars['String']['input']>
    history_date_not?: InputMaybe<Scalars['String']['input']>
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id?: InputMaybe<Scalars['String']['input']>
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    history_id_not?: InputMaybe<Scalars['String']['input']>
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    maxPackSize?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_gt?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_gte?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    maxPackSize_lt?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_lte?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_not?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    model?: InputMaybe<Scalars['String']['input']>
    model_contains?: InputMaybe<Scalars['String']['input']>
    model_contains_i?: InputMaybe<Scalars['String']['input']>
    model_ends_with?: InputMaybe<Scalars['String']['input']>
    model_ends_with_i?: InputMaybe<Scalars['String']['input']>
    model_i?: InputMaybe<Scalars['String']['input']>
    model_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    model_not?: InputMaybe<Scalars['String']['input']>
    model_not_contains?: InputMaybe<Scalars['String']['input']>
    model_not_contains_i?: InputMaybe<Scalars['String']['input']>
    model_not_ends_with?: InputMaybe<Scalars['String']['input']>
    model_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    model_not_i?: InputMaybe<Scalars['String']['input']>
    model_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    model_not_starts_with?: InputMaybe<Scalars['String']['input']>
    model_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    model_starts_with?: InputMaybe<Scalars['String']['input']>
    model_starts_with_i?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['JSON']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    newId_not?: InputMaybe<Scalars['JSON']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender?: InputMaybe<Scalars['JSON']['input']>
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    sender_not?: InputMaybe<Scalars['JSON']['input']>
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    syncedAmount?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_gt?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_gte?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    syncedAmount_lt?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_lte?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_not?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    syncedAt?: InputMaybe<Scalars['String']['input']>
    syncedAt_gt?: InputMaybe<Scalars['String']['input']>
    syncedAt_gte?: InputMaybe<Scalars['String']['input']>
    syncedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    syncedAt_lt?: InputMaybe<Scalars['String']['input']>
    syncedAt_lte?: InputMaybe<Scalars['String']['input']>
    syncedAt_not?: InputMaybe<Scalars['String']['input']>
    syncedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<Scalars['String']['input']>
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy_not?: InputMaybe<Scalars['String']['input']>
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url?: InputMaybe<Scalars['String']['input']>
    url_contains?: InputMaybe<Scalars['String']['input']>
    url_contains_i?: InputMaybe<Scalars['String']['input']>
    url_ends_with?: InputMaybe<Scalars['String']['input']>
    url_ends_with_i?: InputMaybe<Scalars['String']['input']>
    url_i?: InputMaybe<Scalars['String']['input']>
    url_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url_not?: InputMaybe<Scalars['String']['input']>
    url_not_contains?: InputMaybe<Scalars['String']['input']>
    url_not_contains_i?: InputMaybe<Scalars['String']['input']>
    url_not_ends_with?: InputMaybe<Scalars['String']['input']>
    url_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    url_not_i?: InputMaybe<Scalars['String']['input']>
    url_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url_not_starts_with?: InputMaybe<Scalars['String']['input']>
    url_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    url_starts_with?: InputMaybe<Scalars['String']['input']>
    url_starts_with_i?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    webhook?: InputMaybe<Scalars['String']['input']>
    webhook_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    webhook_not?: InputMaybe<Scalars['String']['input']>
    webhook_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
}

export type WebhookSubscriptionHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type WebhookSubscriptionHistoryRecordsCreateInput = {
    data?: InputMaybe<WebhookSubscriptionHistoryRecordCreateInput>
}

export type WebhookSubscriptionHistoryRecordsUpdateInput = {
    data?: InputMaybe<WebhookSubscriptionHistoryRecordUpdateInput>
    id: Scalars['ID']['input']
}

export enum WebhookSubscriptionModelType {
    B2CAppPublishRequest = 'B2CAppPublishRequest',
}

export type WebhookSubscriptionUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    failuresCount?: InputMaybe<Scalars['Int']['input']>
    fields?: InputMaybe<Scalars['String']['input']>
    filters?: InputMaybe<Scalars['JSON']['input']>
    maxPackSize?: InputMaybe<Scalars['Int']['input']>
    model?: InputMaybe<WebhookSubscriptionModelType>
    newId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    syncedAmount?: InputMaybe<Scalars['Int']['input']>
    syncedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    url?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    webhook?: InputMaybe<WebhookRelateToOneInput>
}

export type WebhookSubscriptionWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<WebhookSubscriptionWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<WebhookSubscriptionWhereInput>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<UserWhereInput>
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    failuresCount?: InputMaybe<Scalars['Int']['input']>
    failuresCount_gt?: InputMaybe<Scalars['Int']['input']>
    failuresCount_gte?: InputMaybe<Scalars['Int']['input']>
    failuresCount_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    failuresCount_lt?: InputMaybe<Scalars['Int']['input']>
    failuresCount_lte?: InputMaybe<Scalars['Int']['input']>
    failuresCount_not?: InputMaybe<Scalars['Int']['input']>
    failuresCount_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    fields?: InputMaybe<Scalars['String']['input']>
    fields_contains?: InputMaybe<Scalars['String']['input']>
    fields_contains_i?: InputMaybe<Scalars['String']['input']>
    fields_ends_with?: InputMaybe<Scalars['String']['input']>
    fields_ends_with_i?: InputMaybe<Scalars['String']['input']>
    fields_i?: InputMaybe<Scalars['String']['input']>
    fields_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    fields_not?: InputMaybe<Scalars['String']['input']>
    fields_not_contains?: InputMaybe<Scalars['String']['input']>
    fields_not_contains_i?: InputMaybe<Scalars['String']['input']>
    fields_not_ends_with?: InputMaybe<Scalars['String']['input']>
    fields_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    fields_not_i?: InputMaybe<Scalars['String']['input']>
    fields_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    fields_not_starts_with?: InputMaybe<Scalars['String']['input']>
    fields_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    fields_starts_with?: InputMaybe<Scalars['String']['input']>
    fields_starts_with_i?: InputMaybe<Scalars['String']['input']>
    filters?: InputMaybe<Scalars['JSON']['input']>
    filters_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    filters_not?: InputMaybe<Scalars['JSON']['input']>
    filters_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    maxPackSize?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_gt?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_gte?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    maxPackSize_lt?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_lte?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_not?: InputMaybe<Scalars['Int']['input']>
    maxPackSize_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    model?: InputMaybe<WebhookSubscriptionModelType>
    model_in?: InputMaybe<Array<InputMaybe<WebhookSubscriptionModelType>>>
    model_not?: InputMaybe<WebhookSubscriptionModelType>
    model_not_in?: InputMaybe<Array<InputMaybe<WebhookSubscriptionModelType>>>
    newId?: InputMaybe<Scalars['String']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    newId_not?: InputMaybe<Scalars['String']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    sender?: InputMaybe<SenderFieldInput>
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    sender_not?: InputMaybe<SenderFieldInput>
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    syncedAmount?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_gt?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_gte?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    syncedAmount_lt?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_lte?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_not?: InputMaybe<Scalars['Int']['input']>
    syncedAmount_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    syncedAt?: InputMaybe<Scalars['String']['input']>
    syncedAt_gt?: InputMaybe<Scalars['String']['input']>
    syncedAt_gte?: InputMaybe<Scalars['String']['input']>
    syncedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    syncedAt_lt?: InputMaybe<Scalars['String']['input']>
    syncedAt_lte?: InputMaybe<Scalars['String']['input']>
    syncedAt_not?: InputMaybe<Scalars['String']['input']>
    syncedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<UserWhereInput>
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    url?: InputMaybe<Scalars['String']['input']>
    url_contains?: InputMaybe<Scalars['String']['input']>
    url_contains_i?: InputMaybe<Scalars['String']['input']>
    url_ends_with?: InputMaybe<Scalars['String']['input']>
    url_ends_with_i?: InputMaybe<Scalars['String']['input']>
    url_i?: InputMaybe<Scalars['String']['input']>
    url_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url_not?: InputMaybe<Scalars['String']['input']>
    url_not_contains?: InputMaybe<Scalars['String']['input']>
    url_not_contains_i?: InputMaybe<Scalars['String']['input']>
    url_not_ends_with?: InputMaybe<Scalars['String']['input']>
    url_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    url_not_i?: InputMaybe<Scalars['String']['input']>
    url_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url_not_starts_with?: InputMaybe<Scalars['String']['input']>
    url_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    url_starts_with?: InputMaybe<Scalars['String']['input']>
    url_starts_with_i?: InputMaybe<Scalars['String']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    webhook?: InputMaybe<WebhookWhereInput>
    webhook_is_null?: InputMaybe<Scalars['Boolean']['input']>
}

export type WebhookSubscriptionWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type WebhookSubscriptionsCreateInput = {
    data?: InputMaybe<WebhookSubscriptionCreateInput>
}

export type WebhookSubscriptionsUpdateInput = {
    data?: InputMaybe<WebhookSubscriptionUpdateInput>
    id: Scalars['ID']['input']
}

export type WebhookUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdBy?: InputMaybe<UserRelateToOneInput>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    description?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    name?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    sender?: InputMaybe<SenderFieldInput>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedBy?: InputMaybe<UserRelateToOneInput>
    url?: InputMaybe<Scalars['String']['input']>
    user?: InputMaybe<UserRelateToOneInput>
    v?: InputMaybe<Scalars['Int']['input']>
}

export type WebhookWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<WebhookWhereInput>>>
    OR?: InputMaybe<Array<InputMaybe<WebhookWhereInput>>>
    createdAt?: InputMaybe<Scalars['String']['input']>
    createdAt_gt?: InputMaybe<Scalars['String']['input']>
    createdAt_gte?: InputMaybe<Scalars['String']['input']>
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdAt_lt?: InputMaybe<Scalars['String']['input']>
    createdAt_lte?: InputMaybe<Scalars['String']['input']>
    createdAt_not?: InputMaybe<Scalars['String']['input']>
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    createdBy?: InputMaybe<UserWhereInput>
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    deletedAt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>
    deletedAt_not?: InputMaybe<Scalars['String']['input']>
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    description?: InputMaybe<Scalars['String']['input']>
    description_contains?: InputMaybe<Scalars['String']['input']>
    description_contains_i?: InputMaybe<Scalars['String']['input']>
    description_ends_with?: InputMaybe<Scalars['String']['input']>
    description_ends_with_i?: InputMaybe<Scalars['String']['input']>
    description_i?: InputMaybe<Scalars['String']['input']>
    description_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    description_not?: InputMaybe<Scalars['String']['input']>
    description_not_contains?: InputMaybe<Scalars['String']['input']>
    description_not_contains_i?: InputMaybe<Scalars['String']['input']>
    description_not_ends_with?: InputMaybe<Scalars['String']['input']>
    description_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    description_not_i?: InputMaybe<Scalars['String']['input']>
    description_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    description_not_starts_with?: InputMaybe<Scalars['String']['input']>
    description_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    description_starts_with?: InputMaybe<Scalars['String']['input']>
    description_starts_with_i?: InputMaybe<Scalars['String']['input']>
    dv?: InputMaybe<Scalars['Int']['input']>
    dv_gt?: InputMaybe<Scalars['Int']['input']>
    dv_gte?: InputMaybe<Scalars['Int']['input']>
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    dv_lt?: InputMaybe<Scalars['Int']['input']>
    dv_lte?: InputMaybe<Scalars['Int']['input']>
    dv_not?: InputMaybe<Scalars['Int']['input']>
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    id?: InputMaybe<Scalars['ID']['input']>
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    id_not?: InputMaybe<Scalars['ID']['input']>
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>
    name?: InputMaybe<Scalars['String']['input']>
    name_contains?: InputMaybe<Scalars['String']['input']>
    name_contains_i?: InputMaybe<Scalars['String']['input']>
    name_ends_with?: InputMaybe<Scalars['String']['input']>
    name_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_i?: InputMaybe<Scalars['String']['input']>
    name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not?: InputMaybe<Scalars['String']['input']>
    name_not_contains?: InputMaybe<Scalars['String']['input']>
    name_not_contains_i?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with?: InputMaybe<Scalars['String']['input']>
    name_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    name_not_i?: InputMaybe<Scalars['String']['input']>
    name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    name_not_starts_with?: InputMaybe<Scalars['String']['input']>
    name_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    name_starts_with?: InputMaybe<Scalars['String']['input']>
    name_starts_with_i?: InputMaybe<Scalars['String']['input']>
    newId?: InputMaybe<Scalars['String']['input']>
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    newId_not?: InputMaybe<Scalars['String']['input']>
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    sender?: InputMaybe<SenderFieldInput>
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    sender_not?: InputMaybe<SenderFieldInput>
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>
    updatedAt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>
    updatedAt_not?: InputMaybe<Scalars['String']['input']>
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    updatedBy?: InputMaybe<UserWhereInput>
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>
    url?: InputMaybe<Scalars['String']['input']>
    url_contains?: InputMaybe<Scalars['String']['input']>
    url_contains_i?: InputMaybe<Scalars['String']['input']>
    url_ends_with?: InputMaybe<Scalars['String']['input']>
    url_ends_with_i?: InputMaybe<Scalars['String']['input']>
    url_i?: InputMaybe<Scalars['String']['input']>
    url_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url_not?: InputMaybe<Scalars['String']['input']>
    url_not_contains?: InputMaybe<Scalars['String']['input']>
    url_not_contains_i?: InputMaybe<Scalars['String']['input']>
    url_not_ends_with?: InputMaybe<Scalars['String']['input']>
    url_not_ends_with_i?: InputMaybe<Scalars['String']['input']>
    url_not_i?: InputMaybe<Scalars['String']['input']>
    url_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
    url_not_starts_with?: InputMaybe<Scalars['String']['input']>
    url_not_starts_with_i?: InputMaybe<Scalars['String']['input']>
    url_starts_with?: InputMaybe<Scalars['String']['input']>
    url_starts_with_i?: InputMaybe<Scalars['String']['input']>
    user?: InputMaybe<UserWhereInput>
    user_is_null?: InputMaybe<Scalars['Boolean']['input']>
    v?: InputMaybe<Scalars['Int']['input']>
    v_gt?: InputMaybe<Scalars['Int']['input']>
    v_gte?: InputMaybe<Scalars['Int']['input']>
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
    v_lt?: InputMaybe<Scalars['Int']['input']>
    v_lte?: InputMaybe<Scalars['Int']['input']>
    v_not?: InputMaybe<Scalars['Int']['input']>
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>
}

export type WebhookWhereUniqueInput = {
    id: Scalars['ID']['input']
}

export type WebhooksCreateInput = {
    data?: InputMaybe<WebhookCreateInput>
}

export type WebhooksUpdateInput = {
    data?: InputMaybe<WebhookUpdateInput>
    id: Scalars['ID']['input']
}

export type _ListAccess = {
    __typename?: '_ListAccess'
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'auth' operations.
   */
    auth?: Maybe<Scalars['JSON']['output']>
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'create' operations.
   * NOTE: 'create' can only return a Boolean.
   * It is not possible to specify a declarative Where clause for this
   * operation
   */
    create?: Maybe<Scalars['Boolean']['output']>
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'delete' operations.
   */
    delete?: Maybe<Scalars['JSON']['output']>
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'read' operations.
   */
    read?: Maybe<Scalars['JSON']['output']>
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'update' operations.
   */
    update?: Maybe<Scalars['JSON']['output']>
}

export type _ListInputTypes = {
    __typename?: '_ListInputTypes'
    /** Create mutation input type name */
    createInput?: Maybe<Scalars['String']['output']>
    /** Create many mutation input type name */
    createManyInput?: Maybe<Scalars['String']['output']>
    /** Update mutation name input */
    updateInput?: Maybe<Scalars['String']['output']>
    /** Update many mutation name input */
    updateManyInput?: Maybe<Scalars['String']['output']>
    /** Input type for matching multiple items */
    whereInput?: Maybe<Scalars['String']['output']>
    /** Input type for matching a unique item */
    whereUniqueInput?: Maybe<Scalars['String']['output']>
}

export type _ListMeta = {
    __typename?: '_ListMeta'
    /** Access control configuration for the currently authenticated request */
    access?: Maybe<_ListAccess>
    /** The list's user-facing description */
    description?: Maybe<Scalars['String']['output']>
    /** The Keystone list key */
    key?: Maybe<Scalars['String']['output']>
    /** The list's display name in the Admin UI */
    label?: Maybe<Scalars['String']['output']>
    /**
   * The Keystone List name
   * @deprecated Use `key` instead
   */
    name?: Maybe<Scalars['String']['output']>
    /** The list's data path */
    path?: Maybe<Scalars['String']['output']>
    /** The list's plural display name */
    plural?: Maybe<Scalars['String']['output']>
    /** Information on the generated GraphQL schema */
    schema?: Maybe<_ListSchema>
    /** The list's singular display name */
    singular?: Maybe<Scalars['String']['output']>
}

export type _ListMutations = {
    __typename?: '_ListMutations'
    /** Create mutation name */
    create?: Maybe<Scalars['String']['output']>
    /** Create many mutation name */
    createMany?: Maybe<Scalars['String']['output']>
    /** Delete mutation name */
    delete?: Maybe<Scalars['String']['output']>
    /** Delete many mutation name */
    deleteMany?: Maybe<Scalars['String']['output']>
    /** Update mutation name */
    update?: Maybe<Scalars['String']['output']>
    /** Update many mutation name */
    updateMany?: Maybe<Scalars['String']['output']>
}

export type _ListQueries = {
    __typename?: '_ListQueries'
    /** Single-item query name */
    item?: Maybe<Scalars['String']['output']>
    /** All-items query name */
    list?: Maybe<Scalars['String']['output']>
    /** List metadata query name */
    meta?: Maybe<Scalars['String']['output']>
}

export type _ListSchema = {
    __typename?: '_ListSchema'
    /** Information about fields defined on this list */
    fields?: Maybe<Array<Maybe<_ListSchemaFields>>>
    /** Top-level GraphQL input types */
    inputTypes?: Maybe<_ListInputTypes>
    /** Top-level GraphQL mutation names */
    mutations?: Maybe<_ListMutations>
    /**
   * Top level GraphQL query names which either return this type, or
   * provide aggregate information about this type
   */
    queries?: Maybe<_ListQueries>
    /**
   * Information about fields on other types which return this type, or
   * provide aggregate information about this type
   */
    relatedFields?: Maybe<Array<Maybe<_ListSchemaRelatedFields>>>
    /** The typename as used in GraphQL queries */
    type?: Maybe<Scalars['String']['output']>
}


export type _ListSchemaFieldsArgs = {
    where?: InputMaybe<_ListSchemaFieldsInput>
}

export type _ListSchemaFields = {
    __typename?: '_ListSchemaFields'
    /**
   * The name of the field in its list
   * @deprecated Use `path` instead
   */
    name?: Maybe<Scalars['String']['output']>
    /** The path of the field in its list */
    path?: Maybe<Scalars['String']['output']>
    /** The field type (ie, Checkbox, Text, etc) */
    type?: Maybe<Scalars['String']['output']>
}

export type _ListSchemaFieldsInput = {
    type?: InputMaybe<Scalars['String']['input']>
}

export type _ListSchemaRelatedFields = {
    __typename?: '_ListSchemaRelatedFields'
    /** A list of GraphQL field names */
    fields?: Maybe<Array<Maybe<Scalars['String']['output']>>>
    /** The typename as used in GraphQL queries */
    type?: Maybe<Scalars['String']['output']>
}

export type _QueryMeta = {
    __typename?: '_QueryMeta'
    count?: Maybe<Scalars['Int']['output']>
}

export type _KsListsMetaInput = {
    /** Whether this is an auxiliary helper list */
    auxiliary?: InputMaybe<Scalars['Boolean']['input']>
    key?: InputMaybe<Scalars['String']['input']>
}

export type AuthenticateUserOutput = {
    __typename?: 'authenticateUserOutput'
    /**  Retrieve information on the newly authenticated User here.  */
    item?: Maybe<User>
    /**  Used to make subsequent authenticated requests by setting this token in a header: 'Authorization: Bearer <token>'.  */
    token?: Maybe<Scalars['String']['output']>
}

export type UnauthenticateUserOutput = {
    __typename?: 'unauthenticateUserOutput'
    /**
   * `true` when unauthentication succeeds.
   * NOTE: unauthentication always succeeds when the request has an invalid or missing authentication token.
   */
    success?: Maybe<Scalars['Boolean']['output']>
}

export type AllAppsQueryVariables = Exact<{
    creator: UserWhereInput
    first: Scalars['Int']['input']
}>


export type AllAppsQuery = { __typename?: 'Query', b2c?: Array<{ __typename?: 'B2CApp', id: string, name?: string | null, createdAt?: string | null, logo?: { __typename?: 'File', publicUrl?: string | null } | null } | null> | null }

export type GetB2CAppQueryVariables = Exact<{
    id: Scalars['ID']['input']
}>


export type GetB2CAppQuery = { __typename?: 'Query', app?: { __typename?: 'B2CApp', id: string, name?: string | null, developer?: string | null, developmentExportId?: string | null, productionExportId?: string | null, logo?: { __typename?: 'File', publicUrl?: string | null } | null } | null }

export type AllB2CAppBuildsQueryVariables = Exact<{
    where: B2CAppBuildWhereInput
    first: Scalars['Int']['input']
    skip: Scalars['Int']['input']
}>


export type AllB2CAppBuildsQuery = { __typename?: 'Query', builds?: Array<{ __typename?: 'B2CAppBuild', id: string, version?: string | null, createdAt?: string | null } | null> | null, meta?: { __typename?: '_QueryMeta', count?: number | null } | null }

export type AllB2CAppPublishRequestsQueryVariables = Exact<{
    appId: Scalars['ID']['input']
}>


export type AllB2CAppPublishRequestsQuery = { __typename?: 'Query', requests?: Array<{ __typename?: 'B2CAppPublishRequest', isAppTested?: boolean | null, isInfoApproved?: boolean | null, isContractSigned?: boolean | null, status?: B2CAppPublishRequestStatusType | null } | null> | null }

export type CreateB2CAppMutationVariables = Exact<{
    data: B2CAppCreateInput
}>


export type CreateB2CAppMutation = { __typename?: 'Mutation', app?: { __typename?: 'B2CApp', id: string, name?: string | null } | null }

export type UpdateB2CAppMutationVariables = Exact<{
    id: Scalars['ID']['input']
    data: B2CAppUpdateInput
}>


export type UpdateB2CAppMutation = { __typename?: 'Mutation', app?: { __typename?: 'B2CApp', id: string } | null }

export type CreateB2CAppBuildMutationVariables = Exact<{
    data: B2CAppBuildCreateInput
}>


export type CreateB2CAppBuildMutation = { __typename?: 'Mutation', build?: { __typename?: 'B2CAppBuild', id: string, version?: string | null } | null }

export type PublishB2CAppMutationVariables = Exact<{
    data: PublishB2CAppInput
}>


export type PublishB2CAppMutation = { __typename?: 'Mutation', publishB2CApp?: { __typename?: 'PublishB2CAppOutput', success: boolean } | null }

export type CreateB2CAppPublishRequestMutationVariables = Exact<{
    data: B2CAppPublishRequestCreateInput
}>


export type CreateB2CAppPublishRequestMutation = { __typename?: 'Mutation', request?: { __typename?: 'B2CAppPublishRequest', id: string } | null }

export type AllB2CAppPropertiesQueryVariables = Exact<{
    data: AllB2CAppPropertiesInput
}>


export type AllB2CAppPropertiesQuery = { __typename?: 'Query', properties?: { __typename?: 'AllB2CAppPropertiesOutput', objs: Array<{ __typename?: 'B2CAppProperty', id: string, address: string }>, meta: { __typename?: 'B2CAppPropertyMeta', count: number } } | null }

export type CreateB2CAppPropertyMutationVariables = Exact<{
    data: CreateB2CAppPropertyInput
}>


export type CreateB2CAppPropertyMutation = { __typename?: 'Mutation', property?: { __typename?: 'CreateB2CAppPropertyOutput', id: string } | null }

export type DeleteB2CAppPropertyMutationVariables = Exact<{
    data: DeleteB2CAppPropertyInput
}>


export type DeleteB2CAppPropertyMutation = { __typename?: 'Mutation', property?: { __typename?: 'DeleteB2CAppPropertyOutput', id: string, address: string } | null }

export type AllB2CAppAccessRightsQueryVariables = Exact<{
    appId: Scalars['ID']['input']
    environment: AppEnvironment
}>


export type AllB2CAppAccessRightsQuery = { __typename?: 'Query', rights?: Array<{ __typename?: 'B2CAppAccessRight', condoUserEmail?: string | null } | null> | null }

export type GetOidcClientQueryVariables = Exact<{
    data: GetOidcClientInput
}>


export type GetOidcClientQuery = { __typename?: 'Query', client?: { __typename?: 'OIDCClient', id: string, clientId: string, redirectUri: string } | null }

export type CreateOidcClientMutationVariables = Exact<{
    data: CreateOidcClientInput
}>


export type CreateOidcClientMutation = { __typename?: 'Mutation', client?: { __typename?: 'OIDCClientWithSecret', clientSecret: string } | null }

export type UpdateOidcClientUrlMutationVariables = Exact<{
    data: UpdateOidcClientUrlInput
}>


export type UpdateOidcClientUrlMutation = { __typename?: 'Mutation', client?: { __typename?: 'OIDCClient', redirectUri: string } | null }

export type GenerateOidcClientSecretMutationVariables = Exact<{
    data: GenerateOidcClientSecretInput
}>


export type GenerateOidcClientSecretMutation = { __typename?: 'Mutation', client?: { __typename?: 'OIDCClientWithSecret', clientSecret: string } | null }

export type StartConfirmEmailActionMutationVariables = Exact<{
    data: StartConfirmEmailActionInput
}>


export type StartConfirmEmailActionMutation = { __typename?: 'Mutation', startConfirmEmailAction?: { __typename?: 'StartConfirmEmailActionOutput', actionId: string, email: string } | null }

export type CompleteConfirmEmailActionMutationVariables = Exact<{
    data: CompleteConfirmEmailActionInput
}>


export type CompleteConfirmEmailActionMutation = { __typename?: 'Mutation', completeConfirmEmailAction?: { __typename?: 'CompleteConfirmEmailActionOutput', status: string } | null }

export type RegisterAppUserServiceMutationVariables = Exact<{
    data: RegisterAppUserServiceInput
}>


export type RegisterAppUserServiceMutation = { __typename?: 'Mutation', condoUser?: { __typename?: 'RegisterAppUserServiceOutput', id: string } | null }

export type AuthenticatedUserQueryVariables = Exact<{ [key: string]: never }>


export type AuthenticatedUserQuery = { __typename?: 'Query', authenticatedUser?: { __typename?: 'User', id: string, name?: string | null, phone?: string | null, isAdmin?: boolean | null, isSupport?: boolean | null } | null }

export type SignInMutationVariables = Exact<{
    phone: Scalars['String']['input']
    password: Scalars['String']['input']
}>


export type SignInMutation = { __typename?: 'Mutation', authenticateUserWithPhoneAndPassword?: { __typename?: 'AuthenticateUserWithPhoneAndPasswordOutput', item: { __typename?: 'User', id: string } } | null }

export type SignOutMutationVariables = Exact<{ [key: string]: never }>


export type SignOutMutation = { __typename?: 'Mutation', unauthenticateUser?: { __typename?: 'unauthenticateUserOutput', success?: boolean | null } | null }

export type StartConfirmPhoneActionMutationVariables = Exact<{
    data: StartConfirmPhoneActionInput
}>


export type StartConfirmPhoneActionMutation = { __typename?: 'Mutation', startConfirmPhoneAction?: { __typename?: 'StartConfirmPhoneActionOutput', actionId: string, phone: string } | null }

export type CompleteConfirmPhoneActionMutationVariables = Exact<{
    data: CompleteConfirmPhoneActionInput
}>


export type CompleteConfirmPhoneActionMutation = { __typename?: 'Mutation', completeConfirmPhoneAction?: { __typename?: 'CompleteConfirmPhoneActionOutput', status: string } | null }

export type RegisterNewUserMutationVariables = Exact<{
    data: RegisterNewUserInput
}>


export type RegisterNewUserMutation = { __typename?: 'Mutation', registerNewUser?: { __typename?: 'User', id: string } | null }


export const AllAppsDocument = gql`
    query allApps($creator: UserWhereInput!, $first: Int!) {
  b2c: allB2CApps(
    sortBy: createdAt_DESC
    where: {createdBy: $creator}
    first: $first
  ) {
    id
    name
    createdAt
    logo {
      publicUrl
    }
  }
}
    `

/**
 * __useAllAppsQuery__
 *
 * To run a query within a React component, call `useAllAppsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllAppsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllAppsQuery({
 *   variables: {
 *      creator: // value for 'creator'
 *      first: // value for 'first'
 *   },
 * });
 */
export function useAllAppsQuery (baseOptions: Apollo.QueryHookOptions<AllAppsQuery, AllAppsQueryVariables> & ({ variables: AllAppsQueryVariables, skip?: boolean } | { skip: boolean }) ) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<AllAppsQuery, AllAppsQueryVariables>(AllAppsDocument, options)
}
export function useAllAppsLazyQuery (baseOptions?: Apollo.LazyQueryHookOptions<AllAppsQuery, AllAppsQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<AllAppsQuery, AllAppsQueryVariables>(AllAppsDocument, options)
}
export function useAllAppsSuspenseQuery (baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AllAppsQuery, AllAppsQueryVariables>) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
    return Apollo.useSuspenseQuery<AllAppsQuery, AllAppsQueryVariables>(AllAppsDocument, options)
}
export type AllAppsQueryHookResult = ReturnType<typeof useAllAppsQuery>
export type AllAppsLazyQueryHookResult = ReturnType<typeof useAllAppsLazyQuery>
export type AllAppsSuspenseQueryHookResult = ReturnType<typeof useAllAppsSuspenseQuery>
export type AllAppsQueryResult = Apollo.QueryResult<AllAppsQuery, AllAppsQueryVariables>
export const GetB2CAppDocument = gql`
    query getB2CApp($id: ID!) {
  app: B2CApp(where: {id: $id}) {
    id
    name
    developer
    logo {
      publicUrl
    }
    developmentExportId
    productionExportId
  }
}
    `

/**
 * __useGetB2CAppQuery__
 *
 * To run a query within a React component, call `useGetB2CAppQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetB2CAppQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetB2CAppQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetB2CAppQuery (baseOptions: Apollo.QueryHookOptions<GetB2CAppQuery, GetB2CAppQueryVariables> & ({ variables: GetB2CAppQueryVariables, skip?: boolean } | { skip: boolean }) ) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<GetB2CAppQuery, GetB2CAppQueryVariables>(GetB2CAppDocument, options)
}
export function useGetB2CAppLazyQuery (baseOptions?: Apollo.LazyQueryHookOptions<GetB2CAppQuery, GetB2CAppQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<GetB2CAppQuery, GetB2CAppQueryVariables>(GetB2CAppDocument, options)
}
export function useGetB2CAppSuspenseQuery (baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetB2CAppQuery, GetB2CAppQueryVariables>) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
    return Apollo.useSuspenseQuery<GetB2CAppQuery, GetB2CAppQueryVariables>(GetB2CAppDocument, options)
}
export type GetB2CAppQueryHookResult = ReturnType<typeof useGetB2CAppQuery>
export type GetB2CAppLazyQueryHookResult = ReturnType<typeof useGetB2CAppLazyQuery>
export type GetB2CAppSuspenseQueryHookResult = ReturnType<typeof useGetB2CAppSuspenseQuery>
export type GetB2CAppQueryResult = Apollo.QueryResult<GetB2CAppQuery, GetB2CAppQueryVariables>
export const AllB2CAppBuildsDocument = gql`
    query allB2CAppBuilds($where: B2CAppBuildWhereInput!, $first: Int!, $skip: Int!) {
  builds: allB2CAppBuilds(
    where: $where
    first: $first
    skip: $skip
    sortBy: createdAt_DESC
  ) {
    id
    version
    createdAt
  }
  meta: _allB2CAppBuildsMeta(where: $where) {
    count
  }
}
    `

/**
 * __useAllB2CAppBuildsQuery__
 *
 * To run a query within a React component, call `useAllB2CAppBuildsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllB2CAppBuildsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllB2CAppBuildsQuery({
 *   variables: {
 *      where: // value for 'where'
 *      first: // value for 'first'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useAllB2CAppBuildsQuery (baseOptions: Apollo.QueryHookOptions<AllB2CAppBuildsQuery, AllB2CAppBuildsQueryVariables> & ({ variables: AllB2CAppBuildsQueryVariables, skip?: boolean } | { skip: boolean }) ) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<AllB2CAppBuildsQuery, AllB2CAppBuildsQueryVariables>(AllB2CAppBuildsDocument, options)
}
export function useAllB2CAppBuildsLazyQuery (baseOptions?: Apollo.LazyQueryHookOptions<AllB2CAppBuildsQuery, AllB2CAppBuildsQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<AllB2CAppBuildsQuery, AllB2CAppBuildsQueryVariables>(AllB2CAppBuildsDocument, options)
}
export function useAllB2CAppBuildsSuspenseQuery (baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AllB2CAppBuildsQuery, AllB2CAppBuildsQueryVariables>) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
    return Apollo.useSuspenseQuery<AllB2CAppBuildsQuery, AllB2CAppBuildsQueryVariables>(AllB2CAppBuildsDocument, options)
}
export type AllB2CAppBuildsQueryHookResult = ReturnType<typeof useAllB2CAppBuildsQuery>
export type AllB2CAppBuildsLazyQueryHookResult = ReturnType<typeof useAllB2CAppBuildsLazyQuery>
export type AllB2CAppBuildsSuspenseQueryHookResult = ReturnType<typeof useAllB2CAppBuildsSuspenseQuery>
export type AllB2CAppBuildsQueryResult = Apollo.QueryResult<AllB2CAppBuildsQuery, AllB2CAppBuildsQueryVariables>
export const AllB2CAppPublishRequestsDocument = gql`
    query allB2CAppPublishRequests($appId: ID!) {
  requests: allB2CAppPublishRequests(where: {app: {id: $appId}}, first: 1) {
    isAppTested
    isInfoApproved
    isContractSigned
    status
  }
}
    `

/**
 * __useAllB2CAppPublishRequestsQuery__
 *
 * To run a query within a React component, call `useAllB2CAppPublishRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllB2CAppPublishRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllB2CAppPublishRequestsQuery({
 *   variables: {
 *      appId: // value for 'appId'
 *   },
 * });
 */
export function useAllB2CAppPublishRequestsQuery (baseOptions: Apollo.QueryHookOptions<AllB2CAppPublishRequestsQuery, AllB2CAppPublishRequestsQueryVariables> & ({ variables: AllB2CAppPublishRequestsQueryVariables, skip?: boolean } | { skip: boolean }) ) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<AllB2CAppPublishRequestsQuery, AllB2CAppPublishRequestsQueryVariables>(AllB2CAppPublishRequestsDocument, options)
}
export function useAllB2CAppPublishRequestsLazyQuery (baseOptions?: Apollo.LazyQueryHookOptions<AllB2CAppPublishRequestsQuery, AllB2CAppPublishRequestsQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<AllB2CAppPublishRequestsQuery, AllB2CAppPublishRequestsQueryVariables>(AllB2CAppPublishRequestsDocument, options)
}
export function useAllB2CAppPublishRequestsSuspenseQuery (baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AllB2CAppPublishRequestsQuery, AllB2CAppPublishRequestsQueryVariables>) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
    return Apollo.useSuspenseQuery<AllB2CAppPublishRequestsQuery, AllB2CAppPublishRequestsQueryVariables>(AllB2CAppPublishRequestsDocument, options)
}
export type AllB2CAppPublishRequestsQueryHookResult = ReturnType<typeof useAllB2CAppPublishRequestsQuery>
export type AllB2CAppPublishRequestsLazyQueryHookResult = ReturnType<typeof useAllB2CAppPublishRequestsLazyQuery>
export type AllB2CAppPublishRequestsSuspenseQueryHookResult = ReturnType<typeof useAllB2CAppPublishRequestsSuspenseQuery>
export type AllB2CAppPublishRequestsQueryResult = Apollo.QueryResult<AllB2CAppPublishRequestsQuery, AllB2CAppPublishRequestsQueryVariables>
export const CreateB2CAppDocument = gql`
    mutation createB2CApp($data: B2CAppCreateInput!) {
  app: createB2CApp(data: $data) {
    id
    name
  }
}
    `
export type CreateB2CAppMutationFn = Apollo.MutationFunction<CreateB2CAppMutation, CreateB2CAppMutationVariables>

/**
 * __useCreateB2CAppMutation__
 *
 * To run a mutation, you first call `useCreateB2CAppMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateB2CAppMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createB2CAppMutation, { data, loading, error }] = useCreateB2CAppMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateB2CAppMutation (baseOptions?: Apollo.MutationHookOptions<CreateB2CAppMutation, CreateB2CAppMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<CreateB2CAppMutation, CreateB2CAppMutationVariables>(CreateB2CAppDocument, options)
}
export type CreateB2CAppMutationHookResult = ReturnType<typeof useCreateB2CAppMutation>
export type CreateB2CAppMutationResult = Apollo.MutationResult<CreateB2CAppMutation>
export type CreateB2CAppMutationOptions = Apollo.BaseMutationOptions<CreateB2CAppMutation, CreateB2CAppMutationVariables>
export const UpdateB2CAppDocument = gql`
    mutation updateB2CApp($id: ID!, $data: B2CAppUpdateInput!) {
  app: updateB2CApp(id: $id, data: $data) {
    id
  }
}
    `
export type UpdateB2CAppMutationFn = Apollo.MutationFunction<UpdateB2CAppMutation, UpdateB2CAppMutationVariables>

/**
 * __useUpdateB2CAppMutation__
 *
 * To run a mutation, you first call `useUpdateB2CAppMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateB2CAppMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateB2CAppMutation, { data, loading, error }] = useUpdateB2CAppMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateB2CAppMutation (baseOptions?: Apollo.MutationHookOptions<UpdateB2CAppMutation, UpdateB2CAppMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<UpdateB2CAppMutation, UpdateB2CAppMutationVariables>(UpdateB2CAppDocument, options)
}
export type UpdateB2CAppMutationHookResult = ReturnType<typeof useUpdateB2CAppMutation>
export type UpdateB2CAppMutationResult = Apollo.MutationResult<UpdateB2CAppMutation>
export type UpdateB2CAppMutationOptions = Apollo.BaseMutationOptions<UpdateB2CAppMutation, UpdateB2CAppMutationVariables>
export const CreateB2CAppBuildDocument = gql`
    mutation createB2CAppBuild($data: B2CAppBuildCreateInput!) {
  build: createB2CAppBuild(data: $data) {
    id
    version
  }
}
    `
export type CreateB2CAppBuildMutationFn = Apollo.MutationFunction<CreateB2CAppBuildMutation, CreateB2CAppBuildMutationVariables>

/**
 * __useCreateB2CAppBuildMutation__
 *
 * To run a mutation, you first call `useCreateB2CAppBuildMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateB2CAppBuildMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createB2CAppBuildMutation, { data, loading, error }] = useCreateB2CAppBuildMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateB2CAppBuildMutation (baseOptions?: Apollo.MutationHookOptions<CreateB2CAppBuildMutation, CreateB2CAppBuildMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<CreateB2CAppBuildMutation, CreateB2CAppBuildMutationVariables>(CreateB2CAppBuildDocument, options)
}
export type CreateB2CAppBuildMutationHookResult = ReturnType<typeof useCreateB2CAppBuildMutation>
export type CreateB2CAppBuildMutationResult = Apollo.MutationResult<CreateB2CAppBuildMutation>
export type CreateB2CAppBuildMutationOptions = Apollo.BaseMutationOptions<CreateB2CAppBuildMutation, CreateB2CAppBuildMutationVariables>
export const PublishB2CAppDocument = gql`
    mutation publishB2CApp($data: PublishB2CAppInput!) {
  publishB2CApp(data: $data) {
    success
  }
}
    `
export type PublishB2CAppMutationFn = Apollo.MutationFunction<PublishB2CAppMutation, PublishB2CAppMutationVariables>

/**
 * __usePublishB2CAppMutation__
 *
 * To run a mutation, you first call `usePublishB2CAppMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePublishB2CAppMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publishB2CAppMutation, { data, loading, error }] = usePublishB2CAppMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function usePublishB2CAppMutation (baseOptions?: Apollo.MutationHookOptions<PublishB2CAppMutation, PublishB2CAppMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<PublishB2CAppMutation, PublishB2CAppMutationVariables>(PublishB2CAppDocument, options)
}
export type PublishB2CAppMutationHookResult = ReturnType<typeof usePublishB2CAppMutation>
export type PublishB2CAppMutationResult = Apollo.MutationResult<PublishB2CAppMutation>
export type PublishB2CAppMutationOptions = Apollo.BaseMutationOptions<PublishB2CAppMutation, PublishB2CAppMutationVariables>
export const CreateB2CAppPublishRequestDocument = gql`
    mutation createB2CAppPublishRequest($data: B2CAppPublishRequestCreateInput!) {
  request: createB2CAppPublishRequest(data: $data) {
    id
  }
}
    `
export type CreateB2CAppPublishRequestMutationFn = Apollo.MutationFunction<CreateB2CAppPublishRequestMutation, CreateB2CAppPublishRequestMutationVariables>

/**
 * __useCreateB2CAppPublishRequestMutation__
 *
 * To run a mutation, you first call `useCreateB2CAppPublishRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateB2CAppPublishRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createB2CAppPublishRequestMutation, { data, loading, error }] = useCreateB2CAppPublishRequestMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateB2CAppPublishRequestMutation (baseOptions?: Apollo.MutationHookOptions<CreateB2CAppPublishRequestMutation, CreateB2CAppPublishRequestMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<CreateB2CAppPublishRequestMutation, CreateB2CAppPublishRequestMutationVariables>(CreateB2CAppPublishRequestDocument, options)
}
export type CreateB2CAppPublishRequestMutationHookResult = ReturnType<typeof useCreateB2CAppPublishRequestMutation>
export type CreateB2CAppPublishRequestMutationResult = Apollo.MutationResult<CreateB2CAppPublishRequestMutation>
export type CreateB2CAppPublishRequestMutationOptions = Apollo.BaseMutationOptions<CreateB2CAppPublishRequestMutation, CreateB2CAppPublishRequestMutationVariables>
export const AllB2CAppPropertiesDocument = gql`
    query allB2CAppProperties($data: AllB2CAppPropertiesInput!) {
  properties: allB2CAppProperties(data: $data) {
    objs {
      id
      address
    }
    meta {
      count
    }
  }
}
    `

/**
 * __useAllB2CAppPropertiesQuery__
 *
 * To run a query within a React component, call `useAllB2CAppPropertiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllB2CAppPropertiesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllB2CAppPropertiesQuery({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useAllB2CAppPropertiesQuery (baseOptions: Apollo.QueryHookOptions<AllB2CAppPropertiesQuery, AllB2CAppPropertiesQueryVariables> & ({ variables: AllB2CAppPropertiesQueryVariables, skip?: boolean } | { skip: boolean }) ) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<AllB2CAppPropertiesQuery, AllB2CAppPropertiesQueryVariables>(AllB2CAppPropertiesDocument, options)
}
export function useAllB2CAppPropertiesLazyQuery (baseOptions?: Apollo.LazyQueryHookOptions<AllB2CAppPropertiesQuery, AllB2CAppPropertiesQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<AllB2CAppPropertiesQuery, AllB2CAppPropertiesQueryVariables>(AllB2CAppPropertiesDocument, options)
}
export function useAllB2CAppPropertiesSuspenseQuery (baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AllB2CAppPropertiesQuery, AllB2CAppPropertiesQueryVariables>) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
    return Apollo.useSuspenseQuery<AllB2CAppPropertiesQuery, AllB2CAppPropertiesQueryVariables>(AllB2CAppPropertiesDocument, options)
}
export type AllB2CAppPropertiesQueryHookResult = ReturnType<typeof useAllB2CAppPropertiesQuery>
export type AllB2CAppPropertiesLazyQueryHookResult = ReturnType<typeof useAllB2CAppPropertiesLazyQuery>
export type AllB2CAppPropertiesSuspenseQueryHookResult = ReturnType<typeof useAllB2CAppPropertiesSuspenseQuery>
export type AllB2CAppPropertiesQueryResult = Apollo.QueryResult<AllB2CAppPropertiesQuery, AllB2CAppPropertiesQueryVariables>
export const CreateB2CAppPropertyDocument = gql`
    mutation createB2CAppProperty($data: CreateB2CAppPropertyInput!) {
  property: createB2CAppProperty(data: $data) {
    id
  }
}
    `
export type CreateB2CAppPropertyMutationFn = Apollo.MutationFunction<CreateB2CAppPropertyMutation, CreateB2CAppPropertyMutationVariables>

/**
 * __useCreateB2CAppPropertyMutation__
 *
 * To run a mutation, you first call `useCreateB2CAppPropertyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateB2CAppPropertyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createB2CAppPropertyMutation, { data, loading, error }] = useCreateB2CAppPropertyMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateB2CAppPropertyMutation (baseOptions?: Apollo.MutationHookOptions<CreateB2CAppPropertyMutation, CreateB2CAppPropertyMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<CreateB2CAppPropertyMutation, CreateB2CAppPropertyMutationVariables>(CreateB2CAppPropertyDocument, options)
}
export type CreateB2CAppPropertyMutationHookResult = ReturnType<typeof useCreateB2CAppPropertyMutation>
export type CreateB2CAppPropertyMutationResult = Apollo.MutationResult<CreateB2CAppPropertyMutation>
export type CreateB2CAppPropertyMutationOptions = Apollo.BaseMutationOptions<CreateB2CAppPropertyMutation, CreateB2CAppPropertyMutationVariables>
export const DeleteB2CAppPropertyDocument = gql`
    mutation deleteB2CAppProperty($data: DeleteB2CAppPropertyInput!) {
  property: deleteB2CAppProperty(data: $data) {
    id
    address
  }
}
    `
export type DeleteB2CAppPropertyMutationFn = Apollo.MutationFunction<DeleteB2CAppPropertyMutation, DeleteB2CAppPropertyMutationVariables>

/**
 * __useDeleteB2CAppPropertyMutation__
 *
 * To run a mutation, you first call `useDeleteB2CAppPropertyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteB2CAppPropertyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteB2CAppPropertyMutation, { data, loading, error }] = useDeleteB2CAppPropertyMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useDeleteB2CAppPropertyMutation (baseOptions?: Apollo.MutationHookOptions<DeleteB2CAppPropertyMutation, DeleteB2CAppPropertyMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<DeleteB2CAppPropertyMutation, DeleteB2CAppPropertyMutationVariables>(DeleteB2CAppPropertyDocument, options)
}
export type DeleteB2CAppPropertyMutationHookResult = ReturnType<typeof useDeleteB2CAppPropertyMutation>
export type DeleteB2CAppPropertyMutationResult = Apollo.MutationResult<DeleteB2CAppPropertyMutation>
export type DeleteB2CAppPropertyMutationOptions = Apollo.BaseMutationOptions<DeleteB2CAppPropertyMutation, DeleteB2CAppPropertyMutationVariables>
export const AllB2CAppAccessRightsDocument = gql`
    query allB2CAppAccessRights($appId: ID!, $environment: AppEnvironment!) {
  rights: allB2CAppAccessRights(
    where: {app: {id: $appId}, environment: $environment}
    first: 1
  ) {
    condoUserEmail
  }
}
    `

/**
 * __useAllB2CAppAccessRightsQuery__
 *
 * To run a query within a React component, call `useAllB2CAppAccessRightsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllB2CAppAccessRightsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllB2CAppAccessRightsQuery({
 *   variables: {
 *      appId: // value for 'appId'
 *      environment: // value for 'environment'
 *   },
 * });
 */
export function useAllB2CAppAccessRightsQuery (baseOptions: Apollo.QueryHookOptions<AllB2CAppAccessRightsQuery, AllB2CAppAccessRightsQueryVariables> & ({ variables: AllB2CAppAccessRightsQueryVariables, skip?: boolean } | { skip: boolean }) ) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<AllB2CAppAccessRightsQuery, AllB2CAppAccessRightsQueryVariables>(AllB2CAppAccessRightsDocument, options)
}
export function useAllB2CAppAccessRightsLazyQuery (baseOptions?: Apollo.LazyQueryHookOptions<AllB2CAppAccessRightsQuery, AllB2CAppAccessRightsQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<AllB2CAppAccessRightsQuery, AllB2CAppAccessRightsQueryVariables>(AllB2CAppAccessRightsDocument, options)
}
export function useAllB2CAppAccessRightsSuspenseQuery (baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AllB2CAppAccessRightsQuery, AllB2CAppAccessRightsQueryVariables>) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
    return Apollo.useSuspenseQuery<AllB2CAppAccessRightsQuery, AllB2CAppAccessRightsQueryVariables>(AllB2CAppAccessRightsDocument, options)
}
export type AllB2CAppAccessRightsQueryHookResult = ReturnType<typeof useAllB2CAppAccessRightsQuery>
export type AllB2CAppAccessRightsLazyQueryHookResult = ReturnType<typeof useAllB2CAppAccessRightsLazyQuery>
export type AllB2CAppAccessRightsSuspenseQueryHookResult = ReturnType<typeof useAllB2CAppAccessRightsSuspenseQuery>
export type AllB2CAppAccessRightsQueryResult = Apollo.QueryResult<AllB2CAppAccessRightsQuery, AllB2CAppAccessRightsQueryVariables>
export const GetOidcClientDocument = gql`
    query getOIDCClient($data: GetOIDCClientInput!) {
  client: OIDCClient(data: $data) {
    id
    clientId
    redirectUri
  }
}
    `

/**
 * __useGetOidcClientQuery__
 *
 * To run a query within a React component, call `useGetOidcClientQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOidcClientQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOidcClientQuery({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useGetOidcClientQuery (baseOptions: Apollo.QueryHookOptions<GetOidcClientQuery, GetOidcClientQueryVariables> & ({ variables: GetOidcClientQueryVariables, skip?: boolean } | { skip: boolean }) ) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<GetOidcClientQuery, GetOidcClientQueryVariables>(GetOidcClientDocument, options)
}
export function useGetOidcClientLazyQuery (baseOptions?: Apollo.LazyQueryHookOptions<GetOidcClientQuery, GetOidcClientQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<GetOidcClientQuery, GetOidcClientQueryVariables>(GetOidcClientDocument, options)
}
export function useGetOidcClientSuspenseQuery (baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetOidcClientQuery, GetOidcClientQueryVariables>) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
    return Apollo.useSuspenseQuery<GetOidcClientQuery, GetOidcClientQueryVariables>(GetOidcClientDocument, options)
}
export type GetOidcClientQueryHookResult = ReturnType<typeof useGetOidcClientQuery>
export type GetOidcClientLazyQueryHookResult = ReturnType<typeof useGetOidcClientLazyQuery>
export type GetOidcClientSuspenseQueryHookResult = ReturnType<typeof useGetOidcClientSuspenseQuery>
export type GetOidcClientQueryResult = Apollo.QueryResult<GetOidcClientQuery, GetOidcClientQueryVariables>
export const CreateOidcClientDocument = gql`
    mutation createOIDCClient($data: CreateOIDCClientInput!) {
  client: createOIDCClient(data: $data) {
    clientSecret
  }
}
    `
export type CreateOidcClientMutationFn = Apollo.MutationFunction<CreateOidcClientMutation, CreateOidcClientMutationVariables>

/**
 * __useCreateOidcClientMutation__
 *
 * To run a mutation, you first call `useCreateOidcClientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateOidcClientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createOidcClientMutation, { data, loading, error }] = useCreateOidcClientMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateOidcClientMutation (baseOptions?: Apollo.MutationHookOptions<CreateOidcClientMutation, CreateOidcClientMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<CreateOidcClientMutation, CreateOidcClientMutationVariables>(CreateOidcClientDocument, options)
}
export type CreateOidcClientMutationHookResult = ReturnType<typeof useCreateOidcClientMutation>
export type CreateOidcClientMutationResult = Apollo.MutationResult<CreateOidcClientMutation>
export type CreateOidcClientMutationOptions = Apollo.BaseMutationOptions<CreateOidcClientMutation, CreateOidcClientMutationVariables>
export const UpdateOidcClientUrlDocument = gql`
    mutation updateOIDCClientUrl($data: UpdateOIDCClientUrlInput!) {
  client: updateOIDCClientUrl(data: $data) {
    redirectUri
  }
}
    `
export type UpdateOidcClientUrlMutationFn = Apollo.MutationFunction<UpdateOidcClientUrlMutation, UpdateOidcClientUrlMutationVariables>

/**
 * __useUpdateOidcClientUrlMutation__
 *
 * To run a mutation, you first call `useUpdateOidcClientUrlMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOidcClientUrlMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOidcClientUrlMutation, { data, loading, error }] = useUpdateOidcClientUrlMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateOidcClientUrlMutation (baseOptions?: Apollo.MutationHookOptions<UpdateOidcClientUrlMutation, UpdateOidcClientUrlMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<UpdateOidcClientUrlMutation, UpdateOidcClientUrlMutationVariables>(UpdateOidcClientUrlDocument, options)
}
export type UpdateOidcClientUrlMutationHookResult = ReturnType<typeof useUpdateOidcClientUrlMutation>
export type UpdateOidcClientUrlMutationResult = Apollo.MutationResult<UpdateOidcClientUrlMutation>
export type UpdateOidcClientUrlMutationOptions = Apollo.BaseMutationOptions<UpdateOidcClientUrlMutation, UpdateOidcClientUrlMutationVariables>
export const GenerateOidcClientSecretDocument = gql`
    mutation generateOIDCClientSecret($data: GenerateOIDCClientSecretInput!) {
  client: generateOIDCClientSecret(data: $data) {
    clientSecret
  }
}
    `
export type GenerateOidcClientSecretMutationFn = Apollo.MutationFunction<GenerateOidcClientSecretMutation, GenerateOidcClientSecretMutationVariables>

/**
 * __useGenerateOidcClientSecretMutation__
 *
 * To run a mutation, you first call `useGenerateOidcClientSecretMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGenerateOidcClientSecretMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generateOidcClientSecretMutation, { data, loading, error }] = useGenerateOidcClientSecretMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useGenerateOidcClientSecretMutation (baseOptions?: Apollo.MutationHookOptions<GenerateOidcClientSecretMutation, GenerateOidcClientSecretMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<GenerateOidcClientSecretMutation, GenerateOidcClientSecretMutationVariables>(GenerateOidcClientSecretDocument, options)
}
export type GenerateOidcClientSecretMutationHookResult = ReturnType<typeof useGenerateOidcClientSecretMutation>
export type GenerateOidcClientSecretMutationResult = Apollo.MutationResult<GenerateOidcClientSecretMutation>
export type GenerateOidcClientSecretMutationOptions = Apollo.BaseMutationOptions<GenerateOidcClientSecretMutation, GenerateOidcClientSecretMutationVariables>
export const StartConfirmEmailActionDocument = gql`
    mutation startConfirmEmailAction($data: StartConfirmEmailActionInput!) {
  startConfirmEmailAction(data: $data) {
    actionId
    email
  }
}
    `
export type StartConfirmEmailActionMutationFn = Apollo.MutationFunction<StartConfirmEmailActionMutation, StartConfirmEmailActionMutationVariables>

/**
 * __useStartConfirmEmailActionMutation__
 *
 * To run a mutation, you first call `useStartConfirmEmailActionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStartConfirmEmailActionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [startConfirmEmailActionMutation, { data, loading, error }] = useStartConfirmEmailActionMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useStartConfirmEmailActionMutation (baseOptions?: Apollo.MutationHookOptions<StartConfirmEmailActionMutation, StartConfirmEmailActionMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<StartConfirmEmailActionMutation, StartConfirmEmailActionMutationVariables>(StartConfirmEmailActionDocument, options)
}
export type StartConfirmEmailActionMutationHookResult = ReturnType<typeof useStartConfirmEmailActionMutation>
export type StartConfirmEmailActionMutationResult = Apollo.MutationResult<StartConfirmEmailActionMutation>
export type StartConfirmEmailActionMutationOptions = Apollo.BaseMutationOptions<StartConfirmEmailActionMutation, StartConfirmEmailActionMutationVariables>
export const CompleteConfirmEmailActionDocument = gql`
    mutation completeConfirmEmailAction($data: CompleteConfirmEmailActionInput!) {
  completeConfirmEmailAction(data: $data) {
    status
  }
}
    `
export type CompleteConfirmEmailActionMutationFn = Apollo.MutationFunction<CompleteConfirmEmailActionMutation, CompleteConfirmEmailActionMutationVariables>

/**
 * __useCompleteConfirmEmailActionMutation__
 *
 * To run a mutation, you first call `useCompleteConfirmEmailActionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompleteConfirmEmailActionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completeConfirmEmailActionMutation, { data, loading, error }] = useCompleteConfirmEmailActionMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCompleteConfirmEmailActionMutation (baseOptions?: Apollo.MutationHookOptions<CompleteConfirmEmailActionMutation, CompleteConfirmEmailActionMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<CompleteConfirmEmailActionMutation, CompleteConfirmEmailActionMutationVariables>(CompleteConfirmEmailActionDocument, options)
}
export type CompleteConfirmEmailActionMutationHookResult = ReturnType<typeof useCompleteConfirmEmailActionMutation>
export type CompleteConfirmEmailActionMutationResult = Apollo.MutationResult<CompleteConfirmEmailActionMutation>
export type CompleteConfirmEmailActionMutationOptions = Apollo.BaseMutationOptions<CompleteConfirmEmailActionMutation, CompleteConfirmEmailActionMutationVariables>
export const RegisterAppUserServiceDocument = gql`
    mutation registerAppUserService($data: RegisterAppUserServiceInput!) {
  condoUser: registerAppUserService(data: $data) {
    id
  }
}
    `
export type RegisterAppUserServiceMutationFn = Apollo.MutationFunction<RegisterAppUserServiceMutation, RegisterAppUserServiceMutationVariables>

/**
 * __useRegisterAppUserServiceMutation__
 *
 * To run a mutation, you first call `useRegisterAppUserServiceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterAppUserServiceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerAppUserServiceMutation, { data, loading, error }] = useRegisterAppUserServiceMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useRegisterAppUserServiceMutation (baseOptions?: Apollo.MutationHookOptions<RegisterAppUserServiceMutation, RegisterAppUserServiceMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<RegisterAppUserServiceMutation, RegisterAppUserServiceMutationVariables>(RegisterAppUserServiceDocument, options)
}
export type RegisterAppUserServiceMutationHookResult = ReturnType<typeof useRegisterAppUserServiceMutation>
export type RegisterAppUserServiceMutationResult = Apollo.MutationResult<RegisterAppUserServiceMutation>
export type RegisterAppUserServiceMutationOptions = Apollo.BaseMutationOptions<RegisterAppUserServiceMutation, RegisterAppUserServiceMutationVariables>
export const AuthenticatedUserDocument = gql`
    query authenticatedUser {
  authenticatedUser {
    id
    name
    phone
    isAdmin
    isSupport
  }
}
    `

/**
 * __useAuthenticatedUserQuery__
 *
 * To run a query within a React component, call `useAuthenticatedUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useAuthenticatedUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAuthenticatedUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useAuthenticatedUserQuery (baseOptions?: Apollo.QueryHookOptions<AuthenticatedUserQuery, AuthenticatedUserQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<AuthenticatedUserQuery, AuthenticatedUserQueryVariables>(AuthenticatedUserDocument, options)
}
export function useAuthenticatedUserLazyQuery (baseOptions?: Apollo.LazyQueryHookOptions<AuthenticatedUserQuery, AuthenticatedUserQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<AuthenticatedUserQuery, AuthenticatedUserQueryVariables>(AuthenticatedUserDocument, options)
}
export function useAuthenticatedUserSuspenseQuery (baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AuthenticatedUserQuery, AuthenticatedUserQueryVariables>) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
    return Apollo.useSuspenseQuery<AuthenticatedUserQuery, AuthenticatedUserQueryVariables>(AuthenticatedUserDocument, options)
}
export type AuthenticatedUserQueryHookResult = ReturnType<typeof useAuthenticatedUserQuery>
export type AuthenticatedUserLazyQueryHookResult = ReturnType<typeof useAuthenticatedUserLazyQuery>
export type AuthenticatedUserSuspenseQueryHookResult = ReturnType<typeof useAuthenticatedUserSuspenseQuery>
export type AuthenticatedUserQueryResult = Apollo.QueryResult<AuthenticatedUserQuery, AuthenticatedUserQueryVariables>
export const SignInDocument = gql`
    mutation signIn($phone: String!, $password: String!) {
  authenticateUserWithPhoneAndPassword(data: {phone: $phone, password: $password}) {
    item {
      id
    }
  }
}
    `
export type SignInMutationFn = Apollo.MutationFunction<SignInMutation, SignInMutationVariables>

/**
 * __useSignInMutation__
 *
 * To run a mutation, you first call `useSignInMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSignInMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [signInMutation, { data, loading, error }] = useSignInMutation({
 *   variables: {
 *      phone: // value for 'phone'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useSignInMutation (baseOptions?: Apollo.MutationHookOptions<SignInMutation, SignInMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<SignInMutation, SignInMutationVariables>(SignInDocument, options)
}
export type SignInMutationHookResult = ReturnType<typeof useSignInMutation>
export type SignInMutationResult = Apollo.MutationResult<SignInMutation>
export type SignInMutationOptions = Apollo.BaseMutationOptions<SignInMutation, SignInMutationVariables>
export const SignOutDocument = gql`
    mutation signOut {
  unauthenticateUser {
    success
  }
}
    `
export type SignOutMutationFn = Apollo.MutationFunction<SignOutMutation, SignOutMutationVariables>

/**
 * __useSignOutMutation__
 *
 * To run a mutation, you first call `useSignOutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSignOutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [signOutMutation, { data, loading, error }] = useSignOutMutation({
 *   variables: {
 *   },
 * });
 */
export function useSignOutMutation (baseOptions?: Apollo.MutationHookOptions<SignOutMutation, SignOutMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<SignOutMutation, SignOutMutationVariables>(SignOutDocument, options)
}
export type SignOutMutationHookResult = ReturnType<typeof useSignOutMutation>
export type SignOutMutationResult = Apollo.MutationResult<SignOutMutation>
export type SignOutMutationOptions = Apollo.BaseMutationOptions<SignOutMutation, SignOutMutationVariables>
export const StartConfirmPhoneActionDocument = gql`
    mutation startConfirmPhoneAction($data: StartConfirmPhoneActionInput!) {
  startConfirmPhoneAction(data: $data) {
    actionId
    phone
  }
}
    `
export type StartConfirmPhoneActionMutationFn = Apollo.MutationFunction<StartConfirmPhoneActionMutation, StartConfirmPhoneActionMutationVariables>

/**
 * __useStartConfirmPhoneActionMutation__
 *
 * To run a mutation, you first call `useStartConfirmPhoneActionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStartConfirmPhoneActionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [startConfirmPhoneActionMutation, { data, loading, error }] = useStartConfirmPhoneActionMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useStartConfirmPhoneActionMutation (baseOptions?: Apollo.MutationHookOptions<StartConfirmPhoneActionMutation, StartConfirmPhoneActionMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<StartConfirmPhoneActionMutation, StartConfirmPhoneActionMutationVariables>(StartConfirmPhoneActionDocument, options)
}
export type StartConfirmPhoneActionMutationHookResult = ReturnType<typeof useStartConfirmPhoneActionMutation>
export type StartConfirmPhoneActionMutationResult = Apollo.MutationResult<StartConfirmPhoneActionMutation>
export type StartConfirmPhoneActionMutationOptions = Apollo.BaseMutationOptions<StartConfirmPhoneActionMutation, StartConfirmPhoneActionMutationVariables>
export const CompleteConfirmPhoneActionDocument = gql`
    mutation completeConfirmPhoneAction($data: CompleteConfirmPhoneActionInput!) {
  completeConfirmPhoneAction(data: $data) {
    status
  }
}
    `
export type CompleteConfirmPhoneActionMutationFn = Apollo.MutationFunction<CompleteConfirmPhoneActionMutation, CompleteConfirmPhoneActionMutationVariables>

/**
 * __useCompleteConfirmPhoneActionMutation__
 *
 * To run a mutation, you first call `useCompleteConfirmPhoneActionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompleteConfirmPhoneActionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completeConfirmPhoneActionMutation, { data, loading, error }] = useCompleteConfirmPhoneActionMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCompleteConfirmPhoneActionMutation (baseOptions?: Apollo.MutationHookOptions<CompleteConfirmPhoneActionMutation, CompleteConfirmPhoneActionMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<CompleteConfirmPhoneActionMutation, CompleteConfirmPhoneActionMutationVariables>(CompleteConfirmPhoneActionDocument, options)
}
export type CompleteConfirmPhoneActionMutationHookResult = ReturnType<typeof useCompleteConfirmPhoneActionMutation>
export type CompleteConfirmPhoneActionMutationResult = Apollo.MutationResult<CompleteConfirmPhoneActionMutation>
export type CompleteConfirmPhoneActionMutationOptions = Apollo.BaseMutationOptions<CompleteConfirmPhoneActionMutation, CompleteConfirmPhoneActionMutationVariables>
export const RegisterNewUserDocument = gql`
    mutation registerNewUser($data: RegisterNewUserInput!) {
  registerNewUser(data: $data) {
    id
  }
}
    `
export type RegisterNewUserMutationFn = Apollo.MutationFunction<RegisterNewUserMutation, RegisterNewUserMutationVariables>

/**
 * __useRegisterNewUserMutation__
 *
 * To run a mutation, you first call `useRegisterNewUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterNewUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerNewUserMutation, { data, loading, error }] = useRegisterNewUserMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useRegisterNewUserMutation (baseOptions?: Apollo.MutationHookOptions<RegisterNewUserMutation, RegisterNewUserMutationVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<RegisterNewUserMutation, RegisterNewUserMutationVariables>(RegisterNewUserDocument, options)
}
export type RegisterNewUserMutationHookResult = ReturnType<typeof useRegisterNewUserMutation>
export type RegisterNewUserMutationResult = Apollo.MutationResult<RegisterNewUserMutation>
export type RegisterNewUserMutationOptions = Apollo.BaseMutationOptions<RegisterNewUserMutation, RegisterNewUserMutationVariables>