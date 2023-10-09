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
    ID: { input: string; output: string; }
    String: { input: string; output: string; }
    Boolean: { input: boolean; output: boolean; }
    Int: { input: number; output: number; }
    Float: { input: number; output: number; }
    /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
    JSON: { input: any; output: any; }
    /** The `Upload` scalar type represents a file upload. */
    Upload: { input: any; output: any; }
}

export type AuthenticateUserWithPhoneAndPasswordInput = {
    password: Scalars['String']['input'];
    phone: Scalars['String']['input'];
}

export type AuthenticateUserWithPhoneAndPasswordOutput = {
    __typename?: 'AuthenticateUserWithPhoneAndPasswordOutput';
    item: User;
    token: Scalars['String']['output'];
}

export enum CacheControlScope {
    Private = 'PRIVATE',
    Public = 'PUBLIC',
}

export type CompleteConfirmPhoneActionInput = {
    actionId: Scalars['String']['input'];
    code: Scalars['String']['input'];
    dv: Scalars['Int']['input'];
    sender: SenderFieldInput;
}

export type CompleteConfirmPhoneActionOutput = {
    __typename?: 'CompleteConfirmPhoneActionOutput';
    status: Scalars['String']['output'];
}

/**  Internal schema used for user phone confirmation. It's impossible to work with it via API.  */
export type ConfirmPhoneAction = {
    __typename?: 'ConfirmPhoneAction';
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ConfirmPhoneAction List config, or
   *  2. As an alias to the field set on 'labelField' in the ConfirmPhoneAction List config, or
   *  3. As an alias to a 'name' field on the ConfirmPhoneAction List (if one exists), or
   *  4. As an alias to the 'id' field on the ConfirmPhoneAction List.
   */
    _label_?: Maybe<Scalars['String']['output']>;
    /**  Number of attempts to enter the code. When 5 attempts are reached, this action becomes invalid.  */
    attempts?: Maybe<Scalars['Int']['output']>;
    /**  Confirmation code. Generated inside one of action-creators, such as startConfirmPhoneAction  */
    code?: Maybe<Scalars['String']['output']>;
    createdAt?: Maybe<Scalars['String']['output']>;
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>;
    deletedAt?: Maybe<Scalars['String']['output']>;
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>;
    /**  Action expiration time. After the expiration time, it will not be possible to register a user using this action.  */
    expiresAt?: Maybe<Scalars['String']['output']>;
    id: Scalars['ID']['output'];
    /**  Verifies number verification. If the number has been recently verified (before ConfirmPhoneAction expired), then knowing the ID ConfirmPhoneAction allows to register the user.  */
    isVerified?: Maybe<Scalars['Boolean']['output']>;
    newId?: Maybe<Scalars['String']['output']>;
    /**  Phone number to be verified  */
    phone?: Maybe<Scalars['String']['output']>;
    /**  Client-side device identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>;
    updatedAt?: Maybe<Scalars['String']['output']>;
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>;
    v?: Maybe<Scalars['Int']['output']>;
}

export type ConfirmPhoneActionCreateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>;
    code?: InputMaybe<Scalars['String']['input']>;
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdBy?: InputMaybe<UserRelateToOneInput>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    expiresAt?: InputMaybe<Scalars['String']['input']>;
    isVerified?: InputMaybe<Scalars['Boolean']['input']>;
    newId?: InputMaybe<Scalars['String']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<SenderFieldInput>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedBy?: InputMaybe<UserRelateToOneInput>;
    v?: InputMaybe<Scalars['Int']['input']>;
}

/**  A keystone list  */
export type ConfirmPhoneActionHistoryRecord = {
    __typename?: 'ConfirmPhoneActionHistoryRecord';
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ConfirmPhoneActionHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the ConfirmPhoneActionHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the ConfirmPhoneActionHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the ConfirmPhoneActionHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>;
    attempts?: Maybe<Scalars['Int']['output']>;
    code?: Maybe<Scalars['String']['output']>;
    createdAt?: Maybe<Scalars['String']['output']>;
    createdBy?: Maybe<Scalars['String']['output']>;
    deletedAt?: Maybe<Scalars['String']['output']>;
    dv?: Maybe<Scalars['Int']['output']>;
    expiresAt?: Maybe<Scalars['String']['output']>;
    history_action?: Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
    history_date?: Maybe<Scalars['String']['output']>;
    history_id?: Maybe<Scalars['String']['output']>;
    id: Scalars['ID']['output'];
    isVerified?: Maybe<Scalars['Boolean']['output']>;
    newId?: Maybe<Scalars['JSON']['output']>;
    phone?: Maybe<Scalars['String']['output']>;
    sender?: Maybe<Scalars['JSON']['output']>;
    updatedAt?: Maybe<Scalars['String']['output']>;
    updatedBy?: Maybe<Scalars['String']['output']>;
    v?: Maybe<Scalars['Int']['output']>;
}

export type ConfirmPhoneActionHistoryRecordCreateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>;
    code?: InputMaybe<Scalars['String']['input']>;
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdBy?: InputMaybe<Scalars['String']['input']>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    expiresAt?: InputMaybe<Scalars['String']['input']>;
    history_action?: InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
    history_date?: InputMaybe<Scalars['String']['input']>;
    history_id?: InputMaybe<Scalars['String']['input']>;
    isVerified?: InputMaybe<Scalars['Boolean']['input']>;
    newId?: InputMaybe<Scalars['JSON']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<Scalars['JSON']['input']>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedBy?: InputMaybe<Scalars['String']['input']>;
    v?: InputMaybe<Scalars['Int']['input']>;
}

export enum ConfirmPhoneActionHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type ConfirmPhoneActionHistoryRecordUpdateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>;
    code?: InputMaybe<Scalars['String']['input']>;
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdBy?: InputMaybe<Scalars['String']['input']>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    expiresAt?: InputMaybe<Scalars['String']['input']>;
    history_action?: InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
    history_date?: InputMaybe<Scalars['String']['input']>;
    history_id?: InputMaybe<Scalars['String']['input']>;
    isVerified?: InputMaybe<Scalars['Boolean']['input']>;
    newId?: InputMaybe<Scalars['JSON']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<Scalars['JSON']['input']>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedBy?: InputMaybe<Scalars['String']['input']>;
    v?: InputMaybe<Scalars['Int']['input']>;
}

export type ConfirmPhoneActionHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordWhereInput>>>;
    OR?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordWhereInput>>>;
    attempts?: InputMaybe<Scalars['Int']['input']>;
    attempts_gt?: InputMaybe<Scalars['Int']['input']>;
    attempts_gte?: InputMaybe<Scalars['Int']['input']>;
    attempts_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    attempts_lt?: InputMaybe<Scalars['Int']['input']>;
    attempts_lte?: InputMaybe<Scalars['Int']['input']>;
    attempts_not?: InputMaybe<Scalars['Int']['input']>;
    attempts_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    code?: InputMaybe<Scalars['String']['input']>;
    code_contains?: InputMaybe<Scalars['String']['input']>;
    code_contains_i?: InputMaybe<Scalars['String']['input']>;
    code_ends_with?: InputMaybe<Scalars['String']['input']>;
    code_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    code_i?: InputMaybe<Scalars['String']['input']>;
    code_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    code_not?: InputMaybe<Scalars['String']['input']>;
    code_not_contains?: InputMaybe<Scalars['String']['input']>;
    code_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    code_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    code_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    code_not_i?: InputMaybe<Scalars['String']['input']>;
    code_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    code_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    code_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    code_starts_with?: InputMaybe<Scalars['String']['input']>;
    code_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdAt_gt?: InputMaybe<Scalars['String']['input']>;
    createdAt_gte?: InputMaybe<Scalars['String']['input']>;
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdAt_lt?: InputMaybe<Scalars['String']['input']>;
    createdAt_lte?: InputMaybe<Scalars['String']['input']>;
    createdAt_not?: InputMaybe<Scalars['String']['input']>;
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdBy?: InputMaybe<Scalars['String']['input']>;
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdBy_not?: InputMaybe<Scalars['String']['input']>;
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>;
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>;
    deletedAt_not?: InputMaybe<Scalars['String']['input']>;
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    dv_gt?: InputMaybe<Scalars['Int']['input']>;
    dv_gte?: InputMaybe<Scalars['Int']['input']>;
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    dv_lt?: InputMaybe<Scalars['Int']['input']>;
    dv_lte?: InputMaybe<Scalars['Int']['input']>;
    dv_not?: InputMaybe<Scalars['Int']['input']>;
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    expiresAt?: InputMaybe<Scalars['String']['input']>;
    expiresAt_gt?: InputMaybe<Scalars['String']['input']>;
    expiresAt_gte?: InputMaybe<Scalars['String']['input']>;
    expiresAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    expiresAt_lt?: InputMaybe<Scalars['String']['input']>;
    expiresAt_lte?: InputMaybe<Scalars['String']['input']>;
    expiresAt_not?: InputMaybe<Scalars['String']['input']>;
    expiresAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    history_action?: InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
    history_action_in?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>>>;
    history_action_not?: InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
    history_action_not_in?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordHistoryActionType>>>;
    history_date?: InputMaybe<Scalars['String']['input']>;
    history_date_gt?: InputMaybe<Scalars['String']['input']>;
    history_date_gte?: InputMaybe<Scalars['String']['input']>;
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    history_date_lt?: InputMaybe<Scalars['String']['input']>;
    history_date_lte?: InputMaybe<Scalars['String']['input']>;
    history_date_not?: InputMaybe<Scalars['String']['input']>;
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    history_id?: InputMaybe<Scalars['String']['input']>;
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    history_id_not?: InputMaybe<Scalars['String']['input']>;
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    id?: InputMaybe<Scalars['ID']['input']>;
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
    id_not?: InputMaybe<Scalars['ID']['input']>;
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
    isVerified?: InputMaybe<Scalars['Boolean']['input']>;
    isVerified_not?: InputMaybe<Scalars['Boolean']['input']>;
    newId?: InputMaybe<Scalars['JSON']['input']>;
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
    newId_not?: InputMaybe<Scalars['JSON']['input']>;
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
    phone?: InputMaybe<Scalars['String']['input']>;
    phone_contains?: InputMaybe<Scalars['String']['input']>;
    phone_contains_i?: InputMaybe<Scalars['String']['input']>;
    phone_ends_with?: InputMaybe<Scalars['String']['input']>;
    phone_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_i?: InputMaybe<Scalars['String']['input']>;
    phone_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    phone_not?: InputMaybe<Scalars['String']['input']>;
    phone_not_contains?: InputMaybe<Scalars['String']['input']>;
    phone_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    phone_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    phone_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    phone_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_starts_with?: InputMaybe<Scalars['String']['input']>;
    phone_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<Scalars['JSON']['input']>;
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
    sender_not?: InputMaybe<Scalars['JSON']['input']>;
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>;
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>;
    updatedAt_not?: InputMaybe<Scalars['String']['input']>;
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedBy?: InputMaybe<Scalars['String']['input']>;
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedBy_not?: InputMaybe<Scalars['String']['input']>;
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    v?: InputMaybe<Scalars['Int']['input']>;
    v_gt?: InputMaybe<Scalars['Int']['input']>;
    v_gte?: InputMaybe<Scalars['Int']['input']>;
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    v_lt?: InputMaybe<Scalars['Int']['input']>;
    v_lte?: InputMaybe<Scalars['Int']['input']>;
    v_not?: InputMaybe<Scalars['Int']['input']>;
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
}

export type ConfirmPhoneActionHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input'];
}

export type ConfirmPhoneActionHistoryRecordsCreateInput = {
    data?: InputMaybe<ConfirmPhoneActionHistoryRecordCreateInput>;
}

export type ConfirmPhoneActionHistoryRecordsUpdateInput = {
    data?: InputMaybe<ConfirmPhoneActionHistoryRecordUpdateInput>;
    id: Scalars['ID']['input'];
}

export type ConfirmPhoneActionUpdateInput = {
    attempts?: InputMaybe<Scalars['Int']['input']>;
    code?: InputMaybe<Scalars['String']['input']>;
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdBy?: InputMaybe<UserRelateToOneInput>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    expiresAt?: InputMaybe<Scalars['String']['input']>;
    isVerified?: InputMaybe<Scalars['Boolean']['input']>;
    newId?: InputMaybe<Scalars['String']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<SenderFieldInput>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedBy?: InputMaybe<UserRelateToOneInput>;
    v?: InputMaybe<Scalars['Int']['input']>;
}

export type ConfirmPhoneActionWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionWhereInput>>>;
    OR?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionWhereInput>>>;
    attempts?: InputMaybe<Scalars['Int']['input']>;
    attempts_gt?: InputMaybe<Scalars['Int']['input']>;
    attempts_gte?: InputMaybe<Scalars['Int']['input']>;
    attempts_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    attempts_lt?: InputMaybe<Scalars['Int']['input']>;
    attempts_lte?: InputMaybe<Scalars['Int']['input']>;
    attempts_not?: InputMaybe<Scalars['Int']['input']>;
    attempts_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    code?: InputMaybe<Scalars['String']['input']>;
    code_contains?: InputMaybe<Scalars['String']['input']>;
    code_contains_i?: InputMaybe<Scalars['String']['input']>;
    code_ends_with?: InputMaybe<Scalars['String']['input']>;
    code_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    code_i?: InputMaybe<Scalars['String']['input']>;
    code_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    code_not?: InputMaybe<Scalars['String']['input']>;
    code_not_contains?: InputMaybe<Scalars['String']['input']>;
    code_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    code_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    code_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    code_not_i?: InputMaybe<Scalars['String']['input']>;
    code_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    code_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    code_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    code_starts_with?: InputMaybe<Scalars['String']['input']>;
    code_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdAt_gt?: InputMaybe<Scalars['String']['input']>;
    createdAt_gte?: InputMaybe<Scalars['String']['input']>;
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdAt_lt?: InputMaybe<Scalars['String']['input']>;
    createdAt_lte?: InputMaybe<Scalars['String']['input']>;
    createdAt_not?: InputMaybe<Scalars['String']['input']>;
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdBy?: InputMaybe<UserWhereInput>;
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>;
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>;
    deletedAt_not?: InputMaybe<Scalars['String']['input']>;
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    dv_gt?: InputMaybe<Scalars['Int']['input']>;
    dv_gte?: InputMaybe<Scalars['Int']['input']>;
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    dv_lt?: InputMaybe<Scalars['Int']['input']>;
    dv_lte?: InputMaybe<Scalars['Int']['input']>;
    dv_not?: InputMaybe<Scalars['Int']['input']>;
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    expiresAt?: InputMaybe<Scalars['String']['input']>;
    expiresAt_gt?: InputMaybe<Scalars['String']['input']>;
    expiresAt_gte?: InputMaybe<Scalars['String']['input']>;
    expiresAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    expiresAt_lt?: InputMaybe<Scalars['String']['input']>;
    expiresAt_lte?: InputMaybe<Scalars['String']['input']>;
    expiresAt_not?: InputMaybe<Scalars['String']['input']>;
    expiresAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    id?: InputMaybe<Scalars['ID']['input']>;
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
    id_not?: InputMaybe<Scalars['ID']['input']>;
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
    isVerified?: InputMaybe<Scalars['Boolean']['input']>;
    isVerified_not?: InputMaybe<Scalars['Boolean']['input']>;
    newId?: InputMaybe<Scalars['String']['input']>;
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    newId_not?: InputMaybe<Scalars['String']['input']>;
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    phone?: InputMaybe<Scalars['String']['input']>;
    phone_contains?: InputMaybe<Scalars['String']['input']>;
    phone_contains_i?: InputMaybe<Scalars['String']['input']>;
    phone_ends_with?: InputMaybe<Scalars['String']['input']>;
    phone_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_i?: InputMaybe<Scalars['String']['input']>;
    phone_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    phone_not?: InputMaybe<Scalars['String']['input']>;
    phone_not_contains?: InputMaybe<Scalars['String']['input']>;
    phone_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    phone_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    phone_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    phone_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_starts_with?: InputMaybe<Scalars['String']['input']>;
    phone_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<SenderFieldInput>;
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
    sender_not?: InputMaybe<SenderFieldInput>;
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>;
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>;
    updatedAt_not?: InputMaybe<Scalars['String']['input']>;
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedBy?: InputMaybe<UserWhereInput>;
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>;
    v?: InputMaybe<Scalars['Int']['input']>;
    v_gt?: InputMaybe<Scalars['Int']['input']>;
    v_gte?: InputMaybe<Scalars['Int']['input']>;
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    v_lt?: InputMaybe<Scalars['Int']['input']>;
    v_lte?: InputMaybe<Scalars['Int']['input']>;
    v_not?: InputMaybe<Scalars['Int']['input']>;
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
}

export type ConfirmPhoneActionWhereUniqueInput = {
    id: Scalars['ID']['input'];
}

export type ConfirmPhoneActionsCreateInput = {
    data?: InputMaybe<ConfirmPhoneActionCreateInput>;
}

export type ConfirmPhoneActionsUpdateInput = {
    data?: InputMaybe<ConfirmPhoneActionUpdateInput>;
    id: Scalars['ID']['input'];
}

export type Mutation = {
    __typename?: 'Mutation';
    /**  Authenticate and generate a token for a User with the Password Authentication Strategy.  */
    authenticateUserWithPassword?: Maybe<AuthenticateUserOutput>;
    authenticateUserWithPhoneAndPassword?: Maybe<AuthenticateUserWithPhoneAndPasswordOutput>;
    completeConfirmPhoneAction?: Maybe<CompleteConfirmPhoneActionOutput>;
    /**  Create a single ConfirmPhoneAction item.  */
    createConfirmPhoneAction?: Maybe<ConfirmPhoneAction>;
    /**  Create a single ConfirmPhoneActionHistoryRecord item.  */
    createConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>;
    /**  Create multiple ConfirmPhoneActionHistoryRecord items.  */
    createConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>;
    /**  Create multiple ConfirmPhoneAction items.  */
    createConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>;
    /**  Create a single User item.  */
    createUser?: Maybe<User>;
    /**  Create a single UserHistoryRecord item.  */
    createUserHistoryRecord?: Maybe<UserHistoryRecord>;
    /**  Create multiple UserHistoryRecord items.  */
    createUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
    /**  Create multiple User items.  */
    createUsers?: Maybe<Array<Maybe<User>>>;
    /**  Delete a single ConfirmPhoneAction item by ID.  */
    deleteConfirmPhoneAction?: Maybe<ConfirmPhoneAction>;
    /**  Delete a single ConfirmPhoneActionHistoryRecord item by ID.  */
    deleteConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>;
    /**  Delete multiple ConfirmPhoneActionHistoryRecord items by ID.  */
    deleteConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>;
    /**  Delete multiple ConfirmPhoneAction items by ID.  */
    deleteConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>;
    /**  Delete a single User item by ID.  */
    deleteUser?: Maybe<User>;
    /**  Delete a single UserHistoryRecord item by ID.  */
    deleteUserHistoryRecord?: Maybe<UserHistoryRecord>;
    /**  Delete multiple UserHistoryRecord items by ID.  */
    deleteUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
    /**  Delete multiple User items by ID.  */
    deleteUsers?: Maybe<Array<Maybe<User>>>;
    registerNewUser?: Maybe<User>;
    startConfirmPhoneAction?: Maybe<StartConfirmPhoneActionOutput>;
    unauthenticateUser?: Maybe<UnauthenticateUserOutput>;
    updateAuthenticatedUser?: Maybe<User>;
    /**  Update a single ConfirmPhoneAction item by ID.  */
    updateConfirmPhoneAction?: Maybe<ConfirmPhoneAction>;
    /**  Update a single ConfirmPhoneActionHistoryRecord item by ID.  */
    updateConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>;
    /**  Update multiple ConfirmPhoneActionHistoryRecord items by ID.  */
    updateConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>;
    /**  Update multiple ConfirmPhoneAction items by ID.  */
    updateConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>;
    /**  Update a single User item by ID.  */
    updateUser?: Maybe<User>;
    /**  Update a single UserHistoryRecord item by ID.  */
    updateUserHistoryRecord?: Maybe<UserHistoryRecord>;
    /**  Update multiple UserHistoryRecord items by ID.  */
    updateUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
    /**  Update multiple User items by ID.  */
    updateUsers?: Maybe<Array<Maybe<User>>>;
}


export type MutationAuthenticateUserWithPasswordArgs = {
    email?: InputMaybe<Scalars['String']['input']>;
    password?: InputMaybe<Scalars['String']['input']>;
}


export type MutationAuthenticateUserWithPhoneAndPasswordArgs = {
    data: AuthenticateUserWithPhoneAndPasswordInput;
}


export type MutationCompleteConfirmPhoneActionArgs = {
    data: CompleteConfirmPhoneActionInput;
}


export type MutationCreateConfirmPhoneActionArgs = {
    data?: InputMaybe<ConfirmPhoneActionCreateInput>;
}


export type MutationCreateConfirmPhoneActionHistoryRecordArgs = {
    data?: InputMaybe<ConfirmPhoneActionHistoryRecordCreateInput>;
}


export type MutationCreateConfirmPhoneActionHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordsCreateInput>>>;
}


export type MutationCreateConfirmPhoneActionsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionsCreateInput>>>;
}


export type MutationCreateUserArgs = {
    data?: InputMaybe<UserCreateInput>;
}


export type MutationCreateUserHistoryRecordArgs = {
    data?: InputMaybe<UserHistoryRecordCreateInput>;
}


export type MutationCreateUserHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<UserHistoryRecordsCreateInput>>>;
}


export type MutationCreateUsersArgs = {
    data?: InputMaybe<Array<InputMaybe<UsersCreateInput>>>;
}


export type MutationDeleteConfirmPhoneActionArgs = {
    id: Scalars['ID']['input'];
}


export type MutationDeleteConfirmPhoneActionHistoryRecordArgs = {
    id: Scalars['ID']['input'];
}


export type MutationDeleteConfirmPhoneActionHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>;
}


export type MutationDeleteConfirmPhoneActionsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>;
}


export type MutationDeleteUserArgs = {
    id: Scalars['ID']['input'];
}


export type MutationDeleteUserHistoryRecordArgs = {
    id: Scalars['ID']['input'];
}


export type MutationDeleteUserHistoryRecordsArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>;
}


export type MutationDeleteUsersArgs = {
    ids?: InputMaybe<Array<Scalars['ID']['input']>>;
}


export type MutationRegisterNewUserArgs = {
    data: RegisterNewUserInput;
}


export type MutationStartConfirmPhoneActionArgs = {
    data: StartConfirmPhoneActionInput;
}


export type MutationUpdateAuthenticatedUserArgs = {
    data?: InputMaybe<UserUpdateInput>;
}


export type MutationUpdateConfirmPhoneActionArgs = {
    data?: InputMaybe<ConfirmPhoneActionUpdateInput>;
    id: Scalars['ID']['input'];
}


export type MutationUpdateConfirmPhoneActionHistoryRecordArgs = {
    data?: InputMaybe<ConfirmPhoneActionHistoryRecordUpdateInput>;
    id: Scalars['ID']['input'];
}


export type MutationUpdateConfirmPhoneActionHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionHistoryRecordsUpdateInput>>>;
}


export type MutationUpdateConfirmPhoneActionsArgs = {
    data?: InputMaybe<Array<InputMaybe<ConfirmPhoneActionsUpdateInput>>>;
}


export type MutationUpdateUserArgs = {
    data?: InputMaybe<UserUpdateInput>;
    id: Scalars['ID']['input'];
}


export type MutationUpdateUserHistoryRecordArgs = {
    data?: InputMaybe<UserHistoryRecordUpdateInput>;
    id: Scalars['ID']['input'];
}


export type MutationUpdateUserHistoryRecordsArgs = {
    data?: InputMaybe<Array<InputMaybe<UserHistoryRecordsUpdateInput>>>;
}


export type MutationUpdateUsersArgs = {
    data?: InputMaybe<Array<InputMaybe<UsersUpdateInput>>>;
}

export type Query = {
    __typename?: 'Query';
    /**  Search for the ConfirmPhoneAction item with the matching ID.  */
    ConfirmPhoneAction?: Maybe<ConfirmPhoneAction>;
    /**  Search for the ConfirmPhoneActionHistoryRecord item with the matching ID.  */
    ConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>;
    /**  Search for the User item with the matching ID.  */
    User?: Maybe<User>;
    /**  Search for the UserHistoryRecord item with the matching ID.  */
    UserHistoryRecord?: Maybe<UserHistoryRecord>;
    /**  Retrieve the meta-data for the ConfirmPhoneActionHistoryRecord list.  */
    _ConfirmPhoneActionHistoryRecordsMeta?: Maybe<_ListMeta>;
    /**  Retrieve the meta-data for the ConfirmPhoneAction list.  */
    _ConfirmPhoneActionsMeta?: Maybe<_ListMeta>;
    /**  Retrieve the meta-data for the UserHistoryRecord list.  */
    _UserHistoryRecordsMeta?: Maybe<_ListMeta>;
    /**  Retrieve the meta-data for the User list.  */
    _UsersMeta?: Maybe<_ListMeta>;
    /**  Perform a meta-query on all ConfirmPhoneActionHistoryRecord items which match the where clause.  */
    _allConfirmPhoneActionHistoryRecordsMeta?: Maybe<_QueryMeta>;
    /**  Perform a meta-query on all ConfirmPhoneAction items which match the where clause.  */
    _allConfirmPhoneActionsMeta?: Maybe<_QueryMeta>;
    /**  Perform a meta-query on all UserHistoryRecord items which match the where clause.  */
    _allUserHistoryRecordsMeta?: Maybe<_QueryMeta>;
    /**  Perform a meta-query on all User items which match the where clause.  */
    _allUsersMeta?: Maybe<_QueryMeta>;
    /**  Retrieve the meta-data for all lists.  */
    _ksListsMeta?: Maybe<Array<Maybe<_ListMeta>>>;
    /**  Search for all ConfirmPhoneActionHistoryRecord items which match the where clause.  */
    allConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>;
    /**  Search for all ConfirmPhoneAction items which match the where clause.  */
    allConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>;
    /**  Search for all UserHistoryRecord items which match the where clause.  */
    allUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
    /**  Search for all User items which match the where clause.  */
    allUsers?: Maybe<Array<Maybe<User>>>;
    /** The version of the Keystone application serving this API. */
    appVersion?: Maybe<Scalars['String']['output']>;
    authenticatedUser?: Maybe<User>;
}


export type QueryConfirmPhoneActionArgs = {
    where: ConfirmPhoneActionWhereUniqueInput;
}


export type QueryConfirmPhoneActionHistoryRecordArgs = {
    where: ConfirmPhoneActionHistoryRecordWhereUniqueInput;
}


export type QueryUserArgs = {
    where: UserWhereUniqueInput;
}


export type QueryUserHistoryRecordArgs = {
    where: UserHistoryRecordWhereUniqueInput;
}


export type Query_AllConfirmPhoneActionHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<Scalars['String']['input']>;
    search?: InputMaybe<Scalars['String']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    sortBy?: InputMaybe<Array<SortConfirmPhoneActionHistoryRecordsBy>>;
    where?: InputMaybe<ConfirmPhoneActionHistoryRecordWhereInput>;
}


export type Query_AllConfirmPhoneActionsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<Scalars['String']['input']>;
    search?: InputMaybe<Scalars['String']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    sortBy?: InputMaybe<Array<SortConfirmPhoneActionsBy>>;
    where?: InputMaybe<ConfirmPhoneActionWhereInput>;
}


export type Query_AllUserHistoryRecordsMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<Scalars['String']['input']>;
    search?: InputMaybe<Scalars['String']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    sortBy?: InputMaybe<Array<SortUserHistoryRecordsBy>>;
    where?: InputMaybe<UserHistoryRecordWhereInput>;
}


export type Query_AllUsersMetaArgs = {
    first?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<Scalars['String']['input']>;
    search?: InputMaybe<Scalars['String']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    sortBy?: InputMaybe<Array<SortUsersBy>>;
    where?: InputMaybe<UserWhereInput>;
}


export type Query_KsListsMetaArgs = {
    where?: InputMaybe<_KsListsMetaInput>;
}


export type QueryAllConfirmPhoneActionHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<Scalars['String']['input']>;
    search?: InputMaybe<Scalars['String']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    sortBy?: InputMaybe<Array<SortConfirmPhoneActionHistoryRecordsBy>>;
    where?: InputMaybe<ConfirmPhoneActionHistoryRecordWhereInput>;
}


export type QueryAllConfirmPhoneActionsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<Scalars['String']['input']>;
    search?: InputMaybe<Scalars['String']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    sortBy?: InputMaybe<Array<SortConfirmPhoneActionsBy>>;
    where?: InputMaybe<ConfirmPhoneActionWhereInput>;
}


export type QueryAllUserHistoryRecordsArgs = {
    first?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<Scalars['String']['input']>;
    search?: InputMaybe<Scalars['String']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    sortBy?: InputMaybe<Array<SortUserHistoryRecordsBy>>;
    where?: InputMaybe<UserHistoryRecordWhereInput>;
}


export type QueryAllUsersArgs = {
    first?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<Scalars['String']['input']>;
    search?: InputMaybe<Scalars['String']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    sortBy?: InputMaybe<Array<SortUsersBy>>;
    where?: InputMaybe<UserWhereInput>;
}

export type RegisterNewUserInput = {
    confirmPhoneActionId: Scalars['String']['input'];
    dv: Scalars['Int']['input'];
    name: Scalars['String']['input'];
    password: Scalars['String']['input'];
    sender: SenderFieldInput;
}

export type SenderField = {
    __typename?: 'SenderField';
    dv: Scalars['Int']['output'];
    fingerprint: Scalars['String']['output'];
}

export type SenderFieldInput = {
    dv: Scalars['Int']['input'];
    fingerprint: Scalars['String']['input'];
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

export type StartConfirmPhoneActionInput = {
    dv: Scalars['Int']['input'];
    phone: Scalars['String']['input'];
    sender: SenderFieldInput;
}

export type StartConfirmPhoneActionOutput = {
    __typename?: 'StartConfirmPhoneActionOutput';
    actionId: Scalars['String']['output'];
    phone: Scalars['String']['output'];
}

/**  Account of individual developer or development company.  */
export type User = {
    __typename?: 'User';
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the User List config, or
   *  2. As an alias to the field set on 'labelField' in the User List config, or
   *  3. As an alias to a 'name' field on the User List (if one exists), or
   *  4. As an alias to the 'id' field on the User List.
   */
    _label_?: Maybe<Scalars['String']['output']>;
    createdAt?: Maybe<Scalars['String']['output']>;
    /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    createdBy?: Maybe<User>;
    deletedAt?: Maybe<Scalars['String']['output']>;
    /**  Data structure Version  */
    dv?: Maybe<Scalars['Int']['output']>;
    /**  User email. Currently used only for internal Keystone mutations.  */
    email?: Maybe<Scalars['String']['output']>;
    id: Scalars['ID']['output'];
    /**  Provides a superuser access to any schema data  */
    isAdmin?: Maybe<Scalars['Boolean']['output']>;
    /**  Provide access to admin-panel, where different task can be performed  */
    isSupport?: Maybe<Scalars['Boolean']['output']>;
    /**  Name. If impersonal account should be a company name  */
    name?: Maybe<Scalars['String']['output']>;
    newId?: Maybe<Scalars['String']['output']>;
    /**  User password used for authentication. Self-update only field  */
    password_is_set?: Maybe<Scalars['Boolean']['output']>;
    /**  User phone. Required for authentication, used as main contact info  */
    phone?: Maybe<Scalars['String']['output']>;
    /**  Client-side device identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
    sender?: Maybe<SenderField>;
    updatedAt?: Maybe<Scalars['String']['output']>;
    /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
    updatedBy?: Maybe<User>;
    v?: Maybe<Scalars['Int']['output']>;
}

export type UserCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdBy?: InputMaybe<UserRelateToOneInput>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    email?: InputMaybe<Scalars['String']['input']>;
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
    isSupport?: InputMaybe<Scalars['Boolean']['input']>;
    name?: InputMaybe<Scalars['String']['input']>;
    newId?: InputMaybe<Scalars['String']['input']>;
    password?: InputMaybe<Scalars['String']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<SenderFieldInput>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedBy?: InputMaybe<UserRelateToOneInput>;
    v?: InputMaybe<Scalars['Int']['input']>;
}

/**  A keystone list  */
export type UserHistoryRecord = {
    __typename?: 'UserHistoryRecord';
    /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the UserHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the UserHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the UserHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the UserHistoryRecord List.
   */
    _label_?: Maybe<Scalars['String']['output']>;
    createdAt?: Maybe<Scalars['String']['output']>;
    createdBy?: Maybe<Scalars['String']['output']>;
    deletedAt?: Maybe<Scalars['String']['output']>;
    dv?: Maybe<Scalars['Int']['output']>;
    email?: Maybe<Scalars['String']['output']>;
    history_action?: Maybe<UserHistoryRecordHistoryActionType>;
    history_date?: Maybe<Scalars['String']['output']>;
    history_id?: Maybe<Scalars['String']['output']>;
    id: Scalars['ID']['output'];
    isAdmin?: Maybe<Scalars['Boolean']['output']>;
    isSupport?: Maybe<Scalars['Boolean']['output']>;
    name?: Maybe<Scalars['String']['output']>;
    newId?: Maybe<Scalars['JSON']['output']>;
    password?: Maybe<Scalars['String']['output']>;
    phone?: Maybe<Scalars['String']['output']>;
    sender?: Maybe<Scalars['JSON']['output']>;
    updatedAt?: Maybe<Scalars['String']['output']>;
    updatedBy?: Maybe<Scalars['String']['output']>;
    v?: Maybe<Scalars['Int']['output']>;
}

export type UserHistoryRecordCreateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdBy?: InputMaybe<Scalars['String']['input']>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    email?: InputMaybe<Scalars['String']['input']>;
    history_action?: InputMaybe<UserHistoryRecordHistoryActionType>;
    history_date?: InputMaybe<Scalars['String']['input']>;
    history_id?: InputMaybe<Scalars['String']['input']>;
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
    isSupport?: InputMaybe<Scalars['Boolean']['input']>;
    name?: InputMaybe<Scalars['String']['input']>;
    newId?: InputMaybe<Scalars['JSON']['input']>;
    password?: InputMaybe<Scalars['String']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<Scalars['JSON']['input']>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedBy?: InputMaybe<Scalars['String']['input']>;
    v?: InputMaybe<Scalars['Int']['input']>;
}

export enum UserHistoryRecordHistoryActionType {
    C = 'c',
    D = 'd',
    U = 'u',
}

export type UserHistoryRecordUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdBy?: InputMaybe<Scalars['String']['input']>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    email?: InputMaybe<Scalars['String']['input']>;
    history_action?: InputMaybe<UserHistoryRecordHistoryActionType>;
    history_date?: InputMaybe<Scalars['String']['input']>;
    history_id?: InputMaybe<Scalars['String']['input']>;
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
    isSupport?: InputMaybe<Scalars['Boolean']['input']>;
    name?: InputMaybe<Scalars['String']['input']>;
    newId?: InputMaybe<Scalars['JSON']['input']>;
    password?: InputMaybe<Scalars['String']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<Scalars['JSON']['input']>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedBy?: InputMaybe<Scalars['String']['input']>;
    v?: InputMaybe<Scalars['Int']['input']>;
}

export type UserHistoryRecordWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<UserHistoryRecordWhereInput>>>;
    OR?: InputMaybe<Array<InputMaybe<UserHistoryRecordWhereInput>>>;
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdAt_gt?: InputMaybe<Scalars['String']['input']>;
    createdAt_gte?: InputMaybe<Scalars['String']['input']>;
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdAt_lt?: InputMaybe<Scalars['String']['input']>;
    createdAt_lte?: InputMaybe<Scalars['String']['input']>;
    createdAt_not?: InputMaybe<Scalars['String']['input']>;
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdBy?: InputMaybe<Scalars['String']['input']>;
    createdBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdBy_not?: InputMaybe<Scalars['String']['input']>;
    createdBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>;
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>;
    deletedAt_not?: InputMaybe<Scalars['String']['input']>;
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    dv_gt?: InputMaybe<Scalars['Int']['input']>;
    dv_gte?: InputMaybe<Scalars['Int']['input']>;
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    dv_lt?: InputMaybe<Scalars['Int']['input']>;
    dv_lte?: InputMaybe<Scalars['Int']['input']>;
    dv_not?: InputMaybe<Scalars['Int']['input']>;
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    email?: InputMaybe<Scalars['String']['input']>;
    email_contains?: InputMaybe<Scalars['String']['input']>;
    email_contains_i?: InputMaybe<Scalars['String']['input']>;
    email_ends_with?: InputMaybe<Scalars['String']['input']>;
    email_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    email_i?: InputMaybe<Scalars['String']['input']>;
    email_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    email_not?: InputMaybe<Scalars['String']['input']>;
    email_not_contains?: InputMaybe<Scalars['String']['input']>;
    email_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    email_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    email_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    email_not_i?: InputMaybe<Scalars['String']['input']>;
    email_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    email_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    email_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    email_starts_with?: InputMaybe<Scalars['String']['input']>;
    email_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    history_action?: InputMaybe<UserHistoryRecordHistoryActionType>;
    history_action_in?: InputMaybe<Array<InputMaybe<UserHistoryRecordHistoryActionType>>>;
    history_action_not?: InputMaybe<UserHistoryRecordHistoryActionType>;
    history_action_not_in?: InputMaybe<Array<InputMaybe<UserHistoryRecordHistoryActionType>>>;
    history_date?: InputMaybe<Scalars['String']['input']>;
    history_date_gt?: InputMaybe<Scalars['String']['input']>;
    history_date_gte?: InputMaybe<Scalars['String']['input']>;
    history_date_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    history_date_lt?: InputMaybe<Scalars['String']['input']>;
    history_date_lte?: InputMaybe<Scalars['String']['input']>;
    history_date_not?: InputMaybe<Scalars['String']['input']>;
    history_date_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    history_id?: InputMaybe<Scalars['String']['input']>;
    history_id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    history_id_not?: InputMaybe<Scalars['String']['input']>;
    history_id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    id?: InputMaybe<Scalars['ID']['input']>;
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
    id_not?: InputMaybe<Scalars['ID']['input']>;
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
    isAdmin_not?: InputMaybe<Scalars['Boolean']['input']>;
    isSupport?: InputMaybe<Scalars['Boolean']['input']>;
    isSupport_not?: InputMaybe<Scalars['Boolean']['input']>;
    name?: InputMaybe<Scalars['String']['input']>;
    name_contains?: InputMaybe<Scalars['String']['input']>;
    name_contains_i?: InputMaybe<Scalars['String']['input']>;
    name_ends_with?: InputMaybe<Scalars['String']['input']>;
    name_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    name_i?: InputMaybe<Scalars['String']['input']>;
    name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    name_not?: InputMaybe<Scalars['String']['input']>;
    name_not_contains?: InputMaybe<Scalars['String']['input']>;
    name_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    name_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    name_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    name_not_i?: InputMaybe<Scalars['String']['input']>;
    name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    name_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    name_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    name_starts_with?: InputMaybe<Scalars['String']['input']>;
    name_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    newId?: InputMaybe<Scalars['JSON']['input']>;
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
    newId_not?: InputMaybe<Scalars['JSON']['input']>;
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
    password?: InputMaybe<Scalars['String']['input']>;
    password_contains?: InputMaybe<Scalars['String']['input']>;
    password_contains_i?: InputMaybe<Scalars['String']['input']>;
    password_ends_with?: InputMaybe<Scalars['String']['input']>;
    password_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    password_i?: InputMaybe<Scalars['String']['input']>;
    password_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    password_not?: InputMaybe<Scalars['String']['input']>;
    password_not_contains?: InputMaybe<Scalars['String']['input']>;
    password_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    password_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    password_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    password_not_i?: InputMaybe<Scalars['String']['input']>;
    password_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    password_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    password_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    password_starts_with?: InputMaybe<Scalars['String']['input']>;
    password_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    phone_contains?: InputMaybe<Scalars['String']['input']>;
    phone_contains_i?: InputMaybe<Scalars['String']['input']>;
    phone_ends_with?: InputMaybe<Scalars['String']['input']>;
    phone_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_i?: InputMaybe<Scalars['String']['input']>;
    phone_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    phone_not?: InputMaybe<Scalars['String']['input']>;
    phone_not_contains?: InputMaybe<Scalars['String']['input']>;
    phone_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    phone_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    phone_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    phone_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_starts_with?: InputMaybe<Scalars['String']['input']>;
    phone_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<Scalars['JSON']['input']>;
    sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
    sender_not?: InputMaybe<Scalars['JSON']['input']>;
    sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>;
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>;
    updatedAt_not?: InputMaybe<Scalars['String']['input']>;
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedBy?: InputMaybe<Scalars['String']['input']>;
    updatedBy_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedBy_not?: InputMaybe<Scalars['String']['input']>;
    updatedBy_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    v?: InputMaybe<Scalars['Int']['input']>;
    v_gt?: InputMaybe<Scalars['Int']['input']>;
    v_gte?: InputMaybe<Scalars['Int']['input']>;
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    v_lt?: InputMaybe<Scalars['Int']['input']>;
    v_lte?: InputMaybe<Scalars['Int']['input']>;
    v_not?: InputMaybe<Scalars['Int']['input']>;
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
}

export type UserHistoryRecordWhereUniqueInput = {
    id: Scalars['ID']['input'];
}

export type UserHistoryRecordsCreateInput = {
    data?: InputMaybe<UserHistoryRecordCreateInput>;
}

export type UserHistoryRecordsUpdateInput = {
    data?: InputMaybe<UserHistoryRecordUpdateInput>;
    id: Scalars['ID']['input'];
}

export type UserRelateToOneInput = {
    connect?: InputMaybe<UserWhereUniqueInput>;
    create?: InputMaybe<UserCreateInput>;
    disconnect?: InputMaybe<UserWhereUniqueInput>;
    disconnectAll?: InputMaybe<Scalars['Boolean']['input']>;
}

export type UserUpdateInput = {
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdBy?: InputMaybe<UserRelateToOneInput>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    email?: InputMaybe<Scalars['String']['input']>;
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
    isSupport?: InputMaybe<Scalars['Boolean']['input']>;
    name?: InputMaybe<Scalars['String']['input']>;
    newId?: InputMaybe<Scalars['String']['input']>;
    password?: InputMaybe<Scalars['String']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<SenderFieldInput>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedBy?: InputMaybe<UserRelateToOneInput>;
    v?: InputMaybe<Scalars['Int']['input']>;
}

export type UserWhereInput = {
    AND?: InputMaybe<Array<InputMaybe<UserWhereInput>>>;
    OR?: InputMaybe<Array<InputMaybe<UserWhereInput>>>;
    createdAt?: InputMaybe<Scalars['String']['input']>;
    createdAt_gt?: InputMaybe<Scalars['String']['input']>;
    createdAt_gte?: InputMaybe<Scalars['String']['input']>;
    createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdAt_lt?: InputMaybe<Scalars['String']['input']>;
    createdAt_lte?: InputMaybe<Scalars['String']['input']>;
    createdAt_not?: InputMaybe<Scalars['String']['input']>;
    createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    createdBy?: InputMaybe<UserWhereInput>;
    createdBy_is_null?: InputMaybe<Scalars['Boolean']['input']>;
    deletedAt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_gt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_gte?: InputMaybe<Scalars['String']['input']>;
    deletedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    deletedAt_lt?: InputMaybe<Scalars['String']['input']>;
    deletedAt_lte?: InputMaybe<Scalars['String']['input']>;
    deletedAt_not?: InputMaybe<Scalars['String']['input']>;
    deletedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    dv?: InputMaybe<Scalars['Int']['input']>;
    dv_gt?: InputMaybe<Scalars['Int']['input']>;
    dv_gte?: InputMaybe<Scalars['Int']['input']>;
    dv_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    dv_lt?: InputMaybe<Scalars['Int']['input']>;
    dv_lte?: InputMaybe<Scalars['Int']['input']>;
    dv_not?: InputMaybe<Scalars['Int']['input']>;
    dv_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    email?: InputMaybe<Scalars['String']['input']>;
    email_contains?: InputMaybe<Scalars['String']['input']>;
    email_contains_i?: InputMaybe<Scalars['String']['input']>;
    email_ends_with?: InputMaybe<Scalars['String']['input']>;
    email_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    email_i?: InputMaybe<Scalars['String']['input']>;
    email_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    email_not?: InputMaybe<Scalars['String']['input']>;
    email_not_contains?: InputMaybe<Scalars['String']['input']>;
    email_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    email_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    email_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    email_not_i?: InputMaybe<Scalars['String']['input']>;
    email_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    email_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    email_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    email_starts_with?: InputMaybe<Scalars['String']['input']>;
    email_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    id?: InputMaybe<Scalars['ID']['input']>;
    id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
    id_not?: InputMaybe<Scalars['ID']['input']>;
    id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
    isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
    isAdmin_not?: InputMaybe<Scalars['Boolean']['input']>;
    isSupport?: InputMaybe<Scalars['Boolean']['input']>;
    isSupport_not?: InputMaybe<Scalars['Boolean']['input']>;
    name?: InputMaybe<Scalars['String']['input']>;
    name_contains?: InputMaybe<Scalars['String']['input']>;
    name_contains_i?: InputMaybe<Scalars['String']['input']>;
    name_ends_with?: InputMaybe<Scalars['String']['input']>;
    name_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    name_i?: InputMaybe<Scalars['String']['input']>;
    name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    name_not?: InputMaybe<Scalars['String']['input']>;
    name_not_contains?: InputMaybe<Scalars['String']['input']>;
    name_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    name_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    name_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    name_not_i?: InputMaybe<Scalars['String']['input']>;
    name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    name_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    name_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    name_starts_with?: InputMaybe<Scalars['String']['input']>;
    name_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    newId?: InputMaybe<Scalars['String']['input']>;
    newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    newId_not?: InputMaybe<Scalars['String']['input']>;
    newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    password_is_set?: InputMaybe<Scalars['Boolean']['input']>;
    phone?: InputMaybe<Scalars['String']['input']>;
    phone_contains?: InputMaybe<Scalars['String']['input']>;
    phone_contains_i?: InputMaybe<Scalars['String']['input']>;
    phone_ends_with?: InputMaybe<Scalars['String']['input']>;
    phone_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_i?: InputMaybe<Scalars['String']['input']>;
    phone_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    phone_not?: InputMaybe<Scalars['String']['input']>;
    phone_not_contains?: InputMaybe<Scalars['String']['input']>;
    phone_not_contains_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_ends_with?: InputMaybe<Scalars['String']['input']>;
    phone_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_i?: InputMaybe<Scalars['String']['input']>;
    phone_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    phone_not_starts_with?: InputMaybe<Scalars['String']['input']>;
    phone_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    phone_starts_with?: InputMaybe<Scalars['String']['input']>;
    phone_starts_with_i?: InputMaybe<Scalars['String']['input']>;
    sender?: InputMaybe<SenderFieldInput>;
    sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
    sender_not?: InputMaybe<SenderFieldInput>;
    sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
    updatedAt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_gt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_gte?: InputMaybe<Scalars['String']['input']>;
    updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedAt_lt?: InputMaybe<Scalars['String']['input']>;
    updatedAt_lte?: InputMaybe<Scalars['String']['input']>;
    updatedAt_not?: InputMaybe<Scalars['String']['input']>;
    updatedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
    updatedBy?: InputMaybe<UserWhereInput>;
    updatedBy_is_null?: InputMaybe<Scalars['Boolean']['input']>;
    v?: InputMaybe<Scalars['Int']['input']>;
    v_gt?: InputMaybe<Scalars['Int']['input']>;
    v_gte?: InputMaybe<Scalars['Int']['input']>;
    v_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
    v_lt?: InputMaybe<Scalars['Int']['input']>;
    v_lte?: InputMaybe<Scalars['Int']['input']>;
    v_not?: InputMaybe<Scalars['Int']['input']>;
    v_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
}

export type UserWhereUniqueInput = {
    id: Scalars['ID']['input'];
}

export type UsersCreateInput = {
    data?: InputMaybe<UserCreateInput>;
}

export type UsersUpdateInput = {
    data?: InputMaybe<UserUpdateInput>;
    id: Scalars['ID']['input'];
}

export type _ListAccess = {
    __typename?: '_ListAccess';
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'auth' operations.
   */
    auth?: Maybe<Scalars['JSON']['output']>;
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'create' operations.
   * NOTE: 'create' can only return a Boolean.
   * It is not possible to specify a declarative Where clause for this
   * operation
   */
    create?: Maybe<Scalars['Boolean']['output']>;
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'delete' operations.
   */
    delete?: Maybe<Scalars['JSON']['output']>;
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'read' operations.
   */
    read?: Maybe<Scalars['JSON']['output']>;
    /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'update' operations.
   */
    update?: Maybe<Scalars['JSON']['output']>;
}

export type _ListInputTypes = {
    __typename?: '_ListInputTypes';
    /** Create mutation input type name */
    createInput?: Maybe<Scalars['String']['output']>;
    /** Create many mutation input type name */
    createManyInput?: Maybe<Scalars['String']['output']>;
    /** Update mutation name input */
    updateInput?: Maybe<Scalars['String']['output']>;
    /** Update many mutation name input */
    updateManyInput?: Maybe<Scalars['String']['output']>;
    /** Input type for matching multiple items */
    whereInput?: Maybe<Scalars['String']['output']>;
    /** Input type for matching a unique item */
    whereUniqueInput?: Maybe<Scalars['String']['output']>;
}

export type _ListMeta = {
    __typename?: '_ListMeta';
    /** Access control configuration for the currently authenticated request */
    access?: Maybe<_ListAccess>;
    /** The list's user-facing description */
    description?: Maybe<Scalars['String']['output']>;
    /** The Keystone list key */
    key?: Maybe<Scalars['String']['output']>;
    /** The list's display name in the Admin UI */
    label?: Maybe<Scalars['String']['output']>;
    /**
   * The Keystone List name
   * @deprecated Use `key` instead
   */
    name?: Maybe<Scalars['String']['output']>;
    /** The list's data path */
    path?: Maybe<Scalars['String']['output']>;
    /** The list's plural display name */
    plural?: Maybe<Scalars['String']['output']>;
    /** Information on the generated GraphQL schema */
    schema?: Maybe<_ListSchema>;
    /** The list's singular display name */
    singular?: Maybe<Scalars['String']['output']>;
}

export type _ListMutations = {
    __typename?: '_ListMutations';
    /** Create mutation name */
    create?: Maybe<Scalars['String']['output']>;
    /** Create many mutation name */
    createMany?: Maybe<Scalars['String']['output']>;
    /** Delete mutation name */
    delete?: Maybe<Scalars['String']['output']>;
    /** Delete many mutation name */
    deleteMany?: Maybe<Scalars['String']['output']>;
    /** Update mutation name */
    update?: Maybe<Scalars['String']['output']>;
    /** Update many mutation name */
    updateMany?: Maybe<Scalars['String']['output']>;
}

export type _ListQueries = {
    __typename?: '_ListQueries';
    /** Single-item query name */
    item?: Maybe<Scalars['String']['output']>;
    /** All-items query name */
    list?: Maybe<Scalars['String']['output']>;
    /** List metadata query name */
    meta?: Maybe<Scalars['String']['output']>;
}

export type _ListSchema = {
    __typename?: '_ListSchema';
    /** Information about fields defined on this list */
    fields?: Maybe<Array<Maybe<_ListSchemaFields>>>;
    /** Top-level GraphQL input types */
    inputTypes?: Maybe<_ListInputTypes>;
    /** Top-level GraphQL mutation names */
    mutations?: Maybe<_ListMutations>;
    /**
   * Top level GraphQL query names which either return this type, or
   * provide aggregate information about this type
   */
    queries?: Maybe<_ListQueries>;
    /**
   * Information about fields on other types which return this type, or
   * provide aggregate information about this type
   */
    relatedFields?: Maybe<Array<Maybe<_ListSchemaRelatedFields>>>;
    /** The typename as used in GraphQL queries */
    type?: Maybe<Scalars['String']['output']>;
}


export type _ListSchemaFieldsArgs = {
    where?: InputMaybe<_ListSchemaFieldsInput>;
}

export type _ListSchemaFields = {
    __typename?: '_ListSchemaFields';
    /**
   * The name of the field in its list
   * @deprecated Use `path` instead
   */
    name?: Maybe<Scalars['String']['output']>;
    /** The path of the field in its list */
    path?: Maybe<Scalars['String']['output']>;
    /** The field type (ie, Checkbox, Text, etc) */
    type?: Maybe<Scalars['String']['output']>;
}

export type _ListSchemaFieldsInput = {
    type?: InputMaybe<Scalars['String']['input']>;
}

export type _ListSchemaRelatedFields = {
    __typename?: '_ListSchemaRelatedFields';
    /** A list of GraphQL field names */
    fields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
    /** The typename as used in GraphQL queries */
    type?: Maybe<Scalars['String']['output']>;
}

export type _QueryMeta = {
    __typename?: '_QueryMeta';
    count?: Maybe<Scalars['Int']['output']>;
}

export type _KsListsMetaInput = {
    /** Whether this is an auxiliary helper list */
    auxiliary?: InputMaybe<Scalars['Boolean']['input']>;
    key?: InputMaybe<Scalars['String']['input']>;
}

export type AuthenticateUserOutput = {
    __typename?: 'authenticateUserOutput';
    /**  Retrieve information on the newly authenticated User here.  */
    item?: Maybe<User>;
    /**  Used to make subsequent authenticated requests by setting this token in a header: 'Authorization: Bearer <token>'.  */
    token?: Maybe<Scalars['String']['output']>;
}

export type UnauthenticateUserOutput = {
    __typename?: 'unauthenticateUserOutput';
    /**
   * `true` when unauthentication succeeds.
   * NOTE: unauthentication always succeeds when the request has an invalid or missing authentication token.
   */
    success?: Maybe<Scalars['Boolean']['output']>;
}

export type AuthenticatedUserQueryVariables = Exact<{ [key: string]: never; }>


export type AuthenticatedUserQuery = { __typename?: 'Query', authenticatedUser?: { __typename?: 'User', id: string, name?: string | null, phone?: string | null, isAdmin?: boolean | null, isSupport?: boolean | null } | null }

export type SignInMutationVariables = Exact<{
    phone: Scalars['String']['input'];
    password: Scalars['String']['input'];
}>


export type SignInMutation = { __typename?: 'Mutation', authenticateUserWithPhoneAndPassword?: { __typename?: 'AuthenticateUserWithPhoneAndPasswordOutput', item: { __typename?: 'User', id: string } } | null }

export type SignOutMutationVariables = Exact<{ [key: string]: never; }>


export type SignOutMutation = { __typename?: 'Mutation', unauthenticateUser?: { __typename?: 'unauthenticateUserOutput', success?: boolean | null } | null }

export type StartConfirmPhoneActionMutationVariables = Exact<{
    data: StartConfirmPhoneActionInput;
}>


export type StartConfirmPhoneActionMutation = { __typename?: 'Mutation', startConfirmPhoneAction?: { __typename?: 'StartConfirmPhoneActionOutput', actionId: string, phone: string } | null }

export type CompleteConfirmPhoneActionMutationVariables = Exact<{
    data: CompleteConfirmPhoneActionInput;
}>


export type CompleteConfirmPhoneActionMutation = { __typename?: 'Mutation', completeConfirmPhoneAction?: { __typename?: 'CompleteConfirmPhoneActionOutput', status: string } | null }


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
export type AuthenticatedUserQueryHookResult = ReturnType<typeof useAuthenticatedUserQuery>
export type AuthenticatedUserLazyQueryHookResult = ReturnType<typeof useAuthenticatedUserLazyQuery>
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