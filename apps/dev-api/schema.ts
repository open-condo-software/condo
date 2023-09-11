export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};


export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
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
  _label_?: Maybe<Scalars['String']>;
  /**  Confirmation code. Generated inside one of action-creators, such as startConfirmPhoneAction  */
  code?: Maybe<Scalars['String']>;
  /**  Verifies number verification. If the number has been recently verified (before ConfirmPhoneAction expired), then knowing the ID ConfirmPhoneAction allows to register the user.  */
  isVerified?: Maybe<Scalars['Boolean']>;
  /**  Action expiration time. After the expiration time, it will not be possible to register a user using this action.  */
  expiresAt?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  createdBy?: Maybe<User>;
  /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side device identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
};

export type ConfirmPhoneActionCreateInput = {
  code?: Maybe<Scalars['String']>;
  isVerified?: Maybe<Scalars['Boolean']>;
  expiresAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<SenderFieldInput>;
};

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
  _label_?: Maybe<Scalars['String']>;
  code?: Maybe<Scalars['String']>;
  isVerified?: Maybe<Scalars['Boolean']>;
  expiresAt?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ConfirmPhoneActionHistoryRecordCreateInput = {
  code?: Maybe<Scalars['String']>;
  isVerified?: Maybe<Scalars['Boolean']>;
  expiresAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum ConfirmPhoneActionHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type ConfirmPhoneActionHistoryRecordUpdateInput = {
  code?: Maybe<Scalars['String']>;
  isVerified?: Maybe<Scalars['Boolean']>;
  expiresAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ConfirmPhoneActionHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecordWhereInput>>>;
  code?: Maybe<Scalars['String']>;
  code_not?: Maybe<Scalars['String']>;
  code_contains?: Maybe<Scalars['String']>;
  code_not_contains?: Maybe<Scalars['String']>;
  code_starts_with?: Maybe<Scalars['String']>;
  code_not_starts_with?: Maybe<Scalars['String']>;
  code_ends_with?: Maybe<Scalars['String']>;
  code_not_ends_with?: Maybe<Scalars['String']>;
  code_i?: Maybe<Scalars['String']>;
  code_not_i?: Maybe<Scalars['String']>;
  code_contains_i?: Maybe<Scalars['String']>;
  code_not_contains_i?: Maybe<Scalars['String']>;
  code_starts_with_i?: Maybe<Scalars['String']>;
  code_not_starts_with_i?: Maybe<Scalars['String']>;
  code_ends_with_i?: Maybe<Scalars['String']>;
  code_not_ends_with_i?: Maybe<Scalars['String']>;
  code_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  code_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isVerified?: Maybe<Scalars['Boolean']>;
  isVerified_not?: Maybe<Scalars['Boolean']>;
  expiresAt?: Maybe<Scalars['String']>;
  expiresAt_not?: Maybe<Scalars['String']>;
  expiresAt_lt?: Maybe<Scalars['String']>;
  expiresAt_lte?: Maybe<Scalars['String']>;
  expiresAt_gt?: Maybe<Scalars['String']>;
  expiresAt_gte?: Maybe<Scalars['String']>;
  expiresAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  v?: Maybe<Scalars['Int']>;
  v_not?: Maybe<Scalars['Int']>;
  v_lt?: Maybe<Scalars['Int']>;
  v_lte?: Maybe<Scalars['Int']>;
  v_gt?: Maybe<Scalars['Int']>;
  v_gte?: Maybe<Scalars['Int']>;
  v_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  v_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  createdAt?: Maybe<Scalars['String']>;
  createdAt_not?: Maybe<Scalars['String']>;
  createdAt_lt?: Maybe<Scalars['String']>;
  createdAt_lte?: Maybe<Scalars['String']>;
  createdAt_gt?: Maybe<Scalars['String']>;
  createdAt_gte?: Maybe<Scalars['String']>;
  createdAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedAt?: Maybe<Scalars['String']>;
  updatedAt_not?: Maybe<Scalars['String']>;
  updatedAt_lt?: Maybe<Scalars['String']>;
  updatedAt_lte?: Maybe<Scalars['String']>;
  updatedAt_gt?: Maybe<Scalars['String']>;
  updatedAt_gte?: Maybe<Scalars['String']>;
  updatedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdBy?: Maybe<Scalars['String']>;
  createdBy_not?: Maybe<Scalars['String']>;
  createdBy_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdBy_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedBy?: Maybe<Scalars['String']>;
  updatedBy_not?: Maybe<Scalars['String']>;
  updatedBy_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedBy_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deletedAt?: Maybe<Scalars['String']>;
  deletedAt_not?: Maybe<Scalars['String']>;
  deletedAt_lt?: Maybe<Scalars['String']>;
  deletedAt_lte?: Maybe<Scalars['String']>;
  deletedAt_gt?: Maybe<Scalars['String']>;
  deletedAt_gte?: Maybe<Scalars['String']>;
  deletedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deletedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  newId?: Maybe<Scalars['JSON']>;
  newId_not?: Maybe<Scalars['JSON']>;
  newId_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  newId_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  dv?: Maybe<Scalars['Int']>;
  dv_not?: Maybe<Scalars['Int']>;
  dv_lt?: Maybe<Scalars['Int']>;
  dv_lte?: Maybe<Scalars['Int']>;
  dv_gt?: Maybe<Scalars['Int']>;
  dv_gte?: Maybe<Scalars['Int']>;
  dv_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  dv_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  sender?: Maybe<Scalars['JSON']>;
  sender_not?: Maybe<Scalars['JSON']>;
  sender_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  sender_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type ConfirmPhoneActionHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type ConfirmPhoneActionHistoryRecordsCreateInput = {
  data?: Maybe<ConfirmPhoneActionHistoryRecordCreateInput>;
};

export type ConfirmPhoneActionHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<ConfirmPhoneActionHistoryRecordUpdateInput>;
};

export type ConfirmPhoneActionUpdateInput = {
  code?: Maybe<Scalars['String']>;
  isVerified?: Maybe<Scalars['Boolean']>;
  expiresAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<SenderFieldInput>;
};

export type ConfirmPhoneActionWhereInput = {
  AND?: Maybe<Array<Maybe<ConfirmPhoneActionWhereInput>>>;
  OR?: Maybe<Array<Maybe<ConfirmPhoneActionWhereInput>>>;
  code?: Maybe<Scalars['String']>;
  code_not?: Maybe<Scalars['String']>;
  code_contains?: Maybe<Scalars['String']>;
  code_not_contains?: Maybe<Scalars['String']>;
  code_starts_with?: Maybe<Scalars['String']>;
  code_not_starts_with?: Maybe<Scalars['String']>;
  code_ends_with?: Maybe<Scalars['String']>;
  code_not_ends_with?: Maybe<Scalars['String']>;
  code_i?: Maybe<Scalars['String']>;
  code_not_i?: Maybe<Scalars['String']>;
  code_contains_i?: Maybe<Scalars['String']>;
  code_not_contains_i?: Maybe<Scalars['String']>;
  code_starts_with_i?: Maybe<Scalars['String']>;
  code_not_starts_with_i?: Maybe<Scalars['String']>;
  code_ends_with_i?: Maybe<Scalars['String']>;
  code_not_ends_with_i?: Maybe<Scalars['String']>;
  code_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  code_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isVerified?: Maybe<Scalars['Boolean']>;
  isVerified_not?: Maybe<Scalars['Boolean']>;
  expiresAt?: Maybe<Scalars['String']>;
  expiresAt_not?: Maybe<Scalars['String']>;
  expiresAt_lt?: Maybe<Scalars['String']>;
  expiresAt_lte?: Maybe<Scalars['String']>;
  expiresAt_gt?: Maybe<Scalars['String']>;
  expiresAt_gte?: Maybe<Scalars['String']>;
  expiresAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  v?: Maybe<Scalars['Int']>;
  v_not?: Maybe<Scalars['Int']>;
  v_lt?: Maybe<Scalars['Int']>;
  v_lte?: Maybe<Scalars['Int']>;
  v_gt?: Maybe<Scalars['Int']>;
  v_gte?: Maybe<Scalars['Int']>;
  v_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  v_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  createdAt?: Maybe<Scalars['String']>;
  createdAt_not?: Maybe<Scalars['String']>;
  createdAt_lt?: Maybe<Scalars['String']>;
  createdAt_lte?: Maybe<Scalars['String']>;
  createdAt_gt?: Maybe<Scalars['String']>;
  createdAt_gte?: Maybe<Scalars['String']>;
  createdAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedAt?: Maybe<Scalars['String']>;
  updatedAt_not?: Maybe<Scalars['String']>;
  updatedAt_lt?: Maybe<Scalars['String']>;
  updatedAt_lte?: Maybe<Scalars['String']>;
  updatedAt_gt?: Maybe<Scalars['String']>;
  updatedAt_gte?: Maybe<Scalars['String']>;
  updatedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdBy?: Maybe<UserWhereInput>;
  createdBy_is_null?: Maybe<Scalars['Boolean']>;
  updatedBy?: Maybe<UserWhereInput>;
  updatedBy_is_null?: Maybe<Scalars['Boolean']>;
  deletedAt?: Maybe<Scalars['String']>;
  deletedAt_not?: Maybe<Scalars['String']>;
  deletedAt_lt?: Maybe<Scalars['String']>;
  deletedAt_lte?: Maybe<Scalars['String']>;
  deletedAt_gt?: Maybe<Scalars['String']>;
  deletedAt_gte?: Maybe<Scalars['String']>;
  deletedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deletedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  newId?: Maybe<Scalars['String']>;
  newId_not?: Maybe<Scalars['String']>;
  newId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  newId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  dv?: Maybe<Scalars['Int']>;
  dv_not?: Maybe<Scalars['Int']>;
  dv_lt?: Maybe<Scalars['Int']>;
  dv_lte?: Maybe<Scalars['Int']>;
  dv_gt?: Maybe<Scalars['Int']>;
  dv_gte?: Maybe<Scalars['Int']>;
  dv_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  dv_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  sender?: Maybe<SenderFieldInput>;
  sender_not?: Maybe<SenderFieldInput>;
  sender_in?: Maybe<Array<Maybe<SenderFieldInput>>>;
  sender_not_in?: Maybe<Array<Maybe<SenderFieldInput>>>;
};

export type ConfirmPhoneActionWhereUniqueInput = {
  id: Scalars['ID'];
};

export type ConfirmPhoneActionsCreateInput = {
  data?: Maybe<ConfirmPhoneActionCreateInput>;
};

export type ConfirmPhoneActionsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<ConfirmPhoneActionUpdateInput>;
};


export type Mutation = {
  __typename?: 'Mutation';
  /**  Create a single UserHistoryRecord item.  */
  createUserHistoryRecord?: Maybe<UserHistoryRecord>;
  /**  Create multiple UserHistoryRecord items.  */
  createUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
  /**  Update a single UserHistoryRecord item by ID.  */
  updateUserHistoryRecord?: Maybe<UserHistoryRecord>;
  /**  Update multiple UserHistoryRecord items by ID.  */
  updateUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
  /**  Delete a single UserHistoryRecord item by ID.  */
  deleteUserHistoryRecord?: Maybe<UserHistoryRecord>;
  /**  Delete multiple UserHistoryRecord items by ID.  */
  deleteUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
  /**  Create a single User item.  */
  createUser?: Maybe<User>;
  /**  Create multiple User items.  */
  createUsers?: Maybe<Array<Maybe<User>>>;
  /**  Update a single User item by ID.  */
  updateUser?: Maybe<User>;
  /**  Update multiple User items by ID.  */
  updateUsers?: Maybe<Array<Maybe<User>>>;
  /**  Delete a single User item by ID.  */
  deleteUser?: Maybe<User>;
  /**  Delete multiple User items by ID.  */
  deleteUsers?: Maybe<Array<Maybe<User>>>;
  /**  Create a single ConfirmPhoneActionHistoryRecord item.  */
  createConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>;
  /**  Create multiple ConfirmPhoneActionHistoryRecord items.  */
  createConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>;
  /**  Update a single ConfirmPhoneActionHistoryRecord item by ID.  */
  updateConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>;
  /**  Update multiple ConfirmPhoneActionHistoryRecord items by ID.  */
  updateConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>;
  /**  Delete a single ConfirmPhoneActionHistoryRecord item by ID.  */
  deleteConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>;
  /**  Delete multiple ConfirmPhoneActionHistoryRecord items by ID.  */
  deleteConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>;
  /**  Create a single ConfirmPhoneAction item.  */
  createConfirmPhoneAction?: Maybe<ConfirmPhoneAction>;
  /**  Create multiple ConfirmPhoneAction items.  */
  createConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>;
  /**  Update a single ConfirmPhoneAction item by ID.  */
  updateConfirmPhoneAction?: Maybe<ConfirmPhoneAction>;
  /**  Update multiple ConfirmPhoneAction items by ID.  */
  updateConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>;
  /**  Delete a single ConfirmPhoneAction item by ID.  */
  deleteConfirmPhoneAction?: Maybe<ConfirmPhoneAction>;
  /**  Delete multiple ConfirmPhoneAction items by ID.  */
  deleteConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>;
  /**  Authenticate and generate a token for a User with the Password Authentication Strategy.  */
  authenticateUserWithPassword?: Maybe<AuthenticateUserOutput>;
  unauthenticateUser?: Maybe<UnauthenticateUserOutput>;
  updateAuthenticatedUser?: Maybe<User>;
};


export type MutationCreateUserHistoryRecordArgs = {
  data?: Maybe<UserHistoryRecordCreateInput>;
};


export type MutationCreateUserHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<UserHistoryRecordsCreateInput>>>;
};


export type MutationUpdateUserHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<UserHistoryRecordUpdateInput>;
};


export type MutationUpdateUserHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<UserHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteUserHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteUserHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateUserArgs = {
  data?: Maybe<UserCreateInput>;
};


export type MutationCreateUsersArgs = {
  data?: Maybe<Array<Maybe<UsersCreateInput>>>;
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID'];
  data?: Maybe<UserUpdateInput>;
};


export type MutationUpdateUsersArgs = {
  data?: Maybe<Array<Maybe<UsersUpdateInput>>>;
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteUsersArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateConfirmPhoneActionHistoryRecordArgs = {
  data?: Maybe<ConfirmPhoneActionHistoryRecordCreateInput>;
};


export type MutationCreateConfirmPhoneActionHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecordsCreateInput>>>;
};


export type MutationUpdateConfirmPhoneActionHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<ConfirmPhoneActionHistoryRecordUpdateInput>;
};


export type MutationUpdateConfirmPhoneActionHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteConfirmPhoneActionHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteConfirmPhoneActionHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateConfirmPhoneActionArgs = {
  data?: Maybe<ConfirmPhoneActionCreateInput>;
};


export type MutationCreateConfirmPhoneActionsArgs = {
  data?: Maybe<Array<Maybe<ConfirmPhoneActionsCreateInput>>>;
};


export type MutationUpdateConfirmPhoneActionArgs = {
  id: Scalars['ID'];
  data?: Maybe<ConfirmPhoneActionUpdateInput>;
};


export type MutationUpdateConfirmPhoneActionsArgs = {
  data?: Maybe<Array<Maybe<ConfirmPhoneActionsUpdateInput>>>;
};


export type MutationDeleteConfirmPhoneActionArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteConfirmPhoneActionsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationAuthenticateUserWithPasswordArgs = {
  email?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
};


export type MutationUpdateAuthenticatedUserArgs = {
  data?: Maybe<UserUpdateInput>;
};

export type Query = {
  __typename?: 'Query';
  /**  Search for all UserHistoryRecord items which match the where clause.  */
  allUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
  /**  Search for the UserHistoryRecord item with the matching ID.  */
  UserHistoryRecord?: Maybe<UserHistoryRecord>;
  /**  Perform a meta-query on all UserHistoryRecord items which match the where clause.  */
  _allUserHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the UserHistoryRecord list.  */
  _UserHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all User items which match the where clause.  */
  allUsers?: Maybe<Array<Maybe<User>>>;
  /**  Search for the User item with the matching ID.  */
  User?: Maybe<User>;
  /**  Perform a meta-query on all User items which match the where clause.  */
  _allUsersMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the User list.  */
  _UsersMeta?: Maybe<_ListMeta>;
  /**  Search for all ConfirmPhoneActionHistoryRecord items which match the where clause.  */
  allConfirmPhoneActionHistoryRecords?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecord>>>;
  /**  Search for the ConfirmPhoneActionHistoryRecord item with the matching ID.  */
  ConfirmPhoneActionHistoryRecord?: Maybe<ConfirmPhoneActionHistoryRecord>;
  /**  Perform a meta-query on all ConfirmPhoneActionHistoryRecord items which match the where clause.  */
  _allConfirmPhoneActionHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the ConfirmPhoneActionHistoryRecord list.  */
  _ConfirmPhoneActionHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all ConfirmPhoneAction items which match the where clause.  */
  allConfirmPhoneActions?: Maybe<Array<Maybe<ConfirmPhoneAction>>>;
  /**  Search for the ConfirmPhoneAction item with the matching ID.  */
  ConfirmPhoneAction?: Maybe<ConfirmPhoneAction>;
  /**  Perform a meta-query on all ConfirmPhoneAction items which match the where clause.  */
  _allConfirmPhoneActionsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the ConfirmPhoneAction list.  */
  _ConfirmPhoneActionsMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for all lists.  */
  _ksListsMeta?: Maybe<Array<Maybe<_ListMeta>>>;
  /** The version of the Keystone application serving this API. */
  appVersion?: Maybe<Scalars['String']>;
  authenticatedUser?: Maybe<User>;
};


export type QueryAllUserHistoryRecordsArgs = {
  where?: Maybe<UserHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortUserHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryUserHistoryRecordArgs = {
  where: UserHistoryRecordWhereUniqueInput;
};


export type Query_AllUserHistoryRecordsMetaArgs = {
  where?: Maybe<UserHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortUserHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllUsersArgs = {
  where?: Maybe<UserWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortUsersBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryUserArgs = {
  where: UserWhereUniqueInput;
};


export type Query_AllUsersMetaArgs = {
  where?: Maybe<UserWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortUsersBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllConfirmPhoneActionHistoryRecordsArgs = {
  where?: Maybe<ConfirmPhoneActionHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortConfirmPhoneActionHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryConfirmPhoneActionHistoryRecordArgs = {
  where: ConfirmPhoneActionHistoryRecordWhereUniqueInput;
};


export type Query_AllConfirmPhoneActionHistoryRecordsMetaArgs = {
  where?: Maybe<ConfirmPhoneActionHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortConfirmPhoneActionHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllConfirmPhoneActionsArgs = {
  where?: Maybe<ConfirmPhoneActionWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortConfirmPhoneActionsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryConfirmPhoneActionArgs = {
  where: ConfirmPhoneActionWhereUniqueInput;
};


export type Query_AllConfirmPhoneActionsMetaArgs = {
  where?: Maybe<ConfirmPhoneActionWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortConfirmPhoneActionsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type Query_KsListsMetaArgs = {
  where?: Maybe<_KsListsMetaInput>;
};

export type SenderField = {
  __typename?: 'SenderField';
  dv: Scalars['Int'];
  fingerprint: Scalars['String'];
};

export type SenderFieldInput = {
  dv: Scalars['Int'];
  fingerprint: Scalars['String'];
};

export enum SortConfirmPhoneActionHistoryRecordsBy {
  CodeAsc = 'code_ASC',
  CodeDesc = 'code_DESC',
  IsVerifiedAsc = 'isVerified_ASC',
  IsVerifiedDesc = 'isVerified_DESC',
  ExpiresAtAsc = 'expiresAt_ASC',
  ExpiresAtDesc = 'expiresAt_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC',
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortConfirmPhoneActionsBy {
  CodeAsc = 'code_ASC',
  CodeDesc = 'code_DESC',
  IsVerifiedAsc = 'isVerified_ASC',
  IsVerifiedDesc = 'isVerified_DESC',
  ExpiresAtAsc = 'expiresAt_ASC',
  ExpiresAtDesc = 'expiresAt_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC',
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  CreatedByAsc = 'createdBy_ASC',
  CreatedByDesc = 'createdBy_DESC',
  UpdatedByAsc = 'updatedBy_ASC',
  UpdatedByDesc = 'updatedBy_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC'
}

export enum SortUserHistoryRecordsBy {
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  PasswordAsc = 'password_ASC',
  PasswordDesc = 'password_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  IsAdminAsc = 'isAdmin_ASC',
  IsAdminDesc = 'isAdmin_DESC',
  IsSupportAsc = 'isSupport_ASC',
  IsSupportDesc = 'isSupport_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC',
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortUsersBy {
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  IsAdminAsc = 'isAdmin_ASC',
  IsAdminDesc = 'isAdmin_DESC',
  IsSupportAsc = 'isSupport_ASC',
  IsSupportDesc = 'isSupport_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC',
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  CreatedByAsc = 'createdBy_ASC',
  CreatedByDesc = 'createdBy_DESC',
  UpdatedByAsc = 'updatedBy_ASC',
  UpdatedByDesc = 'updatedBy_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC'
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
  _label_?: Maybe<Scalars['String']>;
  /**  Name. If impersonal account should be a company name  */
  name?: Maybe<Scalars['String']>;
  /**  User password used for authentication. Self-update only field  */
  password_is_set?: Maybe<Scalars['Boolean']>;
  /**  User phone. Required for authentication, used as main contact info  */
  phone?: Maybe<Scalars['String']>;
  /**  User email. Currently used only for internal Keystone mutations.  */
  email?: Maybe<Scalars['String']>;
  /**  Provides a superuser access to any schema data  */
  isAdmin?: Maybe<Scalars['Boolean']>;
  /**  Provide access to admin-panel, where different task can be performed  */
  isSupport?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  createdBy?: Maybe<User>;
  /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side device identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
};

export type UserCreateInput = {
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<SenderFieldInput>;
};

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
  _label_?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<UserHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type UserHistoryRecordCreateInput = {
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<UserHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum UserHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type UserHistoryRecordUpdateInput = {
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<UserHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type UserHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<UserHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<UserHistoryRecordWhereInput>>>;
  name?: Maybe<Scalars['String']>;
  name_not?: Maybe<Scalars['String']>;
  name_contains?: Maybe<Scalars['String']>;
  name_not_contains?: Maybe<Scalars['String']>;
  name_starts_with?: Maybe<Scalars['String']>;
  name_not_starts_with?: Maybe<Scalars['String']>;
  name_ends_with?: Maybe<Scalars['String']>;
  name_not_ends_with?: Maybe<Scalars['String']>;
  name_i?: Maybe<Scalars['String']>;
  name_not_i?: Maybe<Scalars['String']>;
  name_contains_i?: Maybe<Scalars['String']>;
  name_not_contains_i?: Maybe<Scalars['String']>;
  name_starts_with_i?: Maybe<Scalars['String']>;
  name_not_starts_with_i?: Maybe<Scalars['String']>;
  name_ends_with_i?: Maybe<Scalars['String']>;
  name_not_ends_with_i?: Maybe<Scalars['String']>;
  name_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  name_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  password?: Maybe<Scalars['String']>;
  password_not?: Maybe<Scalars['String']>;
  password_contains?: Maybe<Scalars['String']>;
  password_not_contains?: Maybe<Scalars['String']>;
  password_starts_with?: Maybe<Scalars['String']>;
  password_not_starts_with?: Maybe<Scalars['String']>;
  password_ends_with?: Maybe<Scalars['String']>;
  password_not_ends_with?: Maybe<Scalars['String']>;
  password_i?: Maybe<Scalars['String']>;
  password_not_i?: Maybe<Scalars['String']>;
  password_contains_i?: Maybe<Scalars['String']>;
  password_not_contains_i?: Maybe<Scalars['String']>;
  password_starts_with_i?: Maybe<Scalars['String']>;
  password_not_starts_with_i?: Maybe<Scalars['String']>;
  password_ends_with_i?: Maybe<Scalars['String']>;
  password_not_ends_with_i?: Maybe<Scalars['String']>;
  password_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  password_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  phone?: Maybe<Scalars['String']>;
  phone_not?: Maybe<Scalars['String']>;
  phone_contains?: Maybe<Scalars['String']>;
  phone_not_contains?: Maybe<Scalars['String']>;
  phone_starts_with?: Maybe<Scalars['String']>;
  phone_not_starts_with?: Maybe<Scalars['String']>;
  phone_ends_with?: Maybe<Scalars['String']>;
  phone_not_ends_with?: Maybe<Scalars['String']>;
  phone_i?: Maybe<Scalars['String']>;
  phone_not_i?: Maybe<Scalars['String']>;
  phone_contains_i?: Maybe<Scalars['String']>;
  phone_not_contains_i?: Maybe<Scalars['String']>;
  phone_starts_with_i?: Maybe<Scalars['String']>;
  phone_not_starts_with_i?: Maybe<Scalars['String']>;
  phone_ends_with_i?: Maybe<Scalars['String']>;
  phone_not_ends_with_i?: Maybe<Scalars['String']>;
  phone_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  phone_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  email?: Maybe<Scalars['String']>;
  email_not?: Maybe<Scalars['String']>;
  email_contains?: Maybe<Scalars['String']>;
  email_not_contains?: Maybe<Scalars['String']>;
  email_starts_with?: Maybe<Scalars['String']>;
  email_not_starts_with?: Maybe<Scalars['String']>;
  email_ends_with?: Maybe<Scalars['String']>;
  email_not_ends_with?: Maybe<Scalars['String']>;
  email_i?: Maybe<Scalars['String']>;
  email_not_i?: Maybe<Scalars['String']>;
  email_contains_i?: Maybe<Scalars['String']>;
  email_not_contains_i?: Maybe<Scalars['String']>;
  email_starts_with_i?: Maybe<Scalars['String']>;
  email_not_starts_with_i?: Maybe<Scalars['String']>;
  email_ends_with_i?: Maybe<Scalars['String']>;
  email_not_ends_with_i?: Maybe<Scalars['String']>;
  email_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  email_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isAdmin_not?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  isSupport_not?: Maybe<Scalars['Boolean']>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  v?: Maybe<Scalars['Int']>;
  v_not?: Maybe<Scalars['Int']>;
  v_lt?: Maybe<Scalars['Int']>;
  v_lte?: Maybe<Scalars['Int']>;
  v_gt?: Maybe<Scalars['Int']>;
  v_gte?: Maybe<Scalars['Int']>;
  v_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  v_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  createdAt?: Maybe<Scalars['String']>;
  createdAt_not?: Maybe<Scalars['String']>;
  createdAt_lt?: Maybe<Scalars['String']>;
  createdAt_lte?: Maybe<Scalars['String']>;
  createdAt_gt?: Maybe<Scalars['String']>;
  createdAt_gte?: Maybe<Scalars['String']>;
  createdAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedAt?: Maybe<Scalars['String']>;
  updatedAt_not?: Maybe<Scalars['String']>;
  updatedAt_lt?: Maybe<Scalars['String']>;
  updatedAt_lte?: Maybe<Scalars['String']>;
  updatedAt_gt?: Maybe<Scalars['String']>;
  updatedAt_gte?: Maybe<Scalars['String']>;
  updatedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdBy?: Maybe<Scalars['String']>;
  createdBy_not?: Maybe<Scalars['String']>;
  createdBy_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdBy_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedBy?: Maybe<Scalars['String']>;
  updatedBy_not?: Maybe<Scalars['String']>;
  updatedBy_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedBy_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deletedAt?: Maybe<Scalars['String']>;
  deletedAt_not?: Maybe<Scalars['String']>;
  deletedAt_lt?: Maybe<Scalars['String']>;
  deletedAt_lte?: Maybe<Scalars['String']>;
  deletedAt_gt?: Maybe<Scalars['String']>;
  deletedAt_gte?: Maybe<Scalars['String']>;
  deletedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deletedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  newId?: Maybe<Scalars['JSON']>;
  newId_not?: Maybe<Scalars['JSON']>;
  newId_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  newId_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  dv?: Maybe<Scalars['Int']>;
  dv_not?: Maybe<Scalars['Int']>;
  dv_lt?: Maybe<Scalars['Int']>;
  dv_lte?: Maybe<Scalars['Int']>;
  dv_gt?: Maybe<Scalars['Int']>;
  dv_gte?: Maybe<Scalars['Int']>;
  dv_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  dv_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  sender?: Maybe<Scalars['JSON']>;
  sender_not?: Maybe<Scalars['JSON']>;
  sender_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  sender_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<UserHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<UserHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<UserHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<UserHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type UserHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type UserHistoryRecordsCreateInput = {
  data?: Maybe<UserHistoryRecordCreateInput>;
};

export type UserHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<UserHistoryRecordUpdateInput>;
};

export type UserRelateToOneInput = {
  create?: Maybe<UserCreateInput>;
  connect?: Maybe<UserWhereUniqueInput>;
  disconnect?: Maybe<UserWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type UserUpdateInput = {
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<SenderFieldInput>;
};

export type UserWhereInput = {
  AND?: Maybe<Array<Maybe<UserWhereInput>>>;
  OR?: Maybe<Array<Maybe<UserWhereInput>>>;
  name?: Maybe<Scalars['String']>;
  name_not?: Maybe<Scalars['String']>;
  name_contains?: Maybe<Scalars['String']>;
  name_not_contains?: Maybe<Scalars['String']>;
  name_starts_with?: Maybe<Scalars['String']>;
  name_not_starts_with?: Maybe<Scalars['String']>;
  name_ends_with?: Maybe<Scalars['String']>;
  name_not_ends_with?: Maybe<Scalars['String']>;
  name_i?: Maybe<Scalars['String']>;
  name_not_i?: Maybe<Scalars['String']>;
  name_contains_i?: Maybe<Scalars['String']>;
  name_not_contains_i?: Maybe<Scalars['String']>;
  name_starts_with_i?: Maybe<Scalars['String']>;
  name_not_starts_with_i?: Maybe<Scalars['String']>;
  name_ends_with_i?: Maybe<Scalars['String']>;
  name_not_ends_with_i?: Maybe<Scalars['String']>;
  name_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  name_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  password_is_set?: Maybe<Scalars['Boolean']>;
  phone?: Maybe<Scalars['String']>;
  phone_not?: Maybe<Scalars['String']>;
  phone_contains?: Maybe<Scalars['String']>;
  phone_not_contains?: Maybe<Scalars['String']>;
  phone_starts_with?: Maybe<Scalars['String']>;
  phone_not_starts_with?: Maybe<Scalars['String']>;
  phone_ends_with?: Maybe<Scalars['String']>;
  phone_not_ends_with?: Maybe<Scalars['String']>;
  phone_i?: Maybe<Scalars['String']>;
  phone_not_i?: Maybe<Scalars['String']>;
  phone_contains_i?: Maybe<Scalars['String']>;
  phone_not_contains_i?: Maybe<Scalars['String']>;
  phone_starts_with_i?: Maybe<Scalars['String']>;
  phone_not_starts_with_i?: Maybe<Scalars['String']>;
  phone_ends_with_i?: Maybe<Scalars['String']>;
  phone_not_ends_with_i?: Maybe<Scalars['String']>;
  phone_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  phone_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  email?: Maybe<Scalars['String']>;
  email_not?: Maybe<Scalars['String']>;
  email_contains?: Maybe<Scalars['String']>;
  email_not_contains?: Maybe<Scalars['String']>;
  email_starts_with?: Maybe<Scalars['String']>;
  email_not_starts_with?: Maybe<Scalars['String']>;
  email_ends_with?: Maybe<Scalars['String']>;
  email_not_ends_with?: Maybe<Scalars['String']>;
  email_i?: Maybe<Scalars['String']>;
  email_not_i?: Maybe<Scalars['String']>;
  email_contains_i?: Maybe<Scalars['String']>;
  email_not_contains_i?: Maybe<Scalars['String']>;
  email_starts_with_i?: Maybe<Scalars['String']>;
  email_not_starts_with_i?: Maybe<Scalars['String']>;
  email_ends_with_i?: Maybe<Scalars['String']>;
  email_not_ends_with_i?: Maybe<Scalars['String']>;
  email_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  email_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isAdmin_not?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  isSupport_not?: Maybe<Scalars['Boolean']>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  v?: Maybe<Scalars['Int']>;
  v_not?: Maybe<Scalars['Int']>;
  v_lt?: Maybe<Scalars['Int']>;
  v_lte?: Maybe<Scalars['Int']>;
  v_gt?: Maybe<Scalars['Int']>;
  v_gte?: Maybe<Scalars['Int']>;
  v_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  v_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  createdAt?: Maybe<Scalars['String']>;
  createdAt_not?: Maybe<Scalars['String']>;
  createdAt_lt?: Maybe<Scalars['String']>;
  createdAt_lte?: Maybe<Scalars['String']>;
  createdAt_gt?: Maybe<Scalars['String']>;
  createdAt_gte?: Maybe<Scalars['String']>;
  createdAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedAt?: Maybe<Scalars['String']>;
  updatedAt_not?: Maybe<Scalars['String']>;
  updatedAt_lt?: Maybe<Scalars['String']>;
  updatedAt_lte?: Maybe<Scalars['String']>;
  updatedAt_gt?: Maybe<Scalars['String']>;
  updatedAt_gte?: Maybe<Scalars['String']>;
  updatedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  updatedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  createdBy?: Maybe<UserWhereInput>;
  createdBy_is_null?: Maybe<Scalars['Boolean']>;
  updatedBy?: Maybe<UserWhereInput>;
  updatedBy_is_null?: Maybe<Scalars['Boolean']>;
  deletedAt?: Maybe<Scalars['String']>;
  deletedAt_not?: Maybe<Scalars['String']>;
  deletedAt_lt?: Maybe<Scalars['String']>;
  deletedAt_lte?: Maybe<Scalars['String']>;
  deletedAt_gt?: Maybe<Scalars['String']>;
  deletedAt_gte?: Maybe<Scalars['String']>;
  deletedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deletedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  newId?: Maybe<Scalars['String']>;
  newId_not?: Maybe<Scalars['String']>;
  newId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  newId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  dv?: Maybe<Scalars['Int']>;
  dv_not?: Maybe<Scalars['Int']>;
  dv_lt?: Maybe<Scalars['Int']>;
  dv_lte?: Maybe<Scalars['Int']>;
  dv_gt?: Maybe<Scalars['Int']>;
  dv_gte?: Maybe<Scalars['Int']>;
  dv_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  dv_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  sender?: Maybe<SenderFieldInput>;
  sender_not?: Maybe<SenderFieldInput>;
  sender_in?: Maybe<Array<Maybe<SenderFieldInput>>>;
  sender_not_in?: Maybe<Array<Maybe<SenderFieldInput>>>;
};

export type UserWhereUniqueInput = {
  id: Scalars['ID'];
};

export type UsersCreateInput = {
  data?: Maybe<UserCreateInput>;
};

export type UsersUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<UserUpdateInput>;
};

export type _ListAccess = {
  __typename?: '_ListAccess';
  /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'create' operations.
   * NOTE: 'create' can only return a Boolean.
   * It is not possible to specify a declarative Where clause for this
   * operation
   */
  create?: Maybe<Scalars['Boolean']>;
  /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'read' operations.
   */
  read?: Maybe<Scalars['JSON']>;
  /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'update' operations.
   */
  update?: Maybe<Scalars['JSON']>;
  /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'delete' operations.
   */
  delete?: Maybe<Scalars['JSON']>;
  /**
   * Access Control settings for the currently logged in (or anonymous)
   * user when performing 'auth' operations.
   */
  auth?: Maybe<Scalars['JSON']>;
};

export type _ListInputTypes = {
  __typename?: '_ListInputTypes';
  /** Input type for matching multiple items */
  whereInput?: Maybe<Scalars['String']>;
  /** Input type for matching a unique item */
  whereUniqueInput?: Maybe<Scalars['String']>;
  /** Create mutation input type name */
  createInput?: Maybe<Scalars['String']>;
  /** Create many mutation input type name */
  createManyInput?: Maybe<Scalars['String']>;
  /** Update mutation name input */
  updateInput?: Maybe<Scalars['String']>;
  /** Update many mutation name input */
  updateManyInput?: Maybe<Scalars['String']>;
};

export type _ListMeta = {
  __typename?: '_ListMeta';
  /** The Keystone list key */
  key?: Maybe<Scalars['String']>;
  /**
   * The Keystone List name
   * @deprecated Use `key` instead
   */
  name?: Maybe<Scalars['String']>;
  /** The list's user-facing description */
  description?: Maybe<Scalars['String']>;
  /** The list's display name in the Admin UI */
  label?: Maybe<Scalars['String']>;
  /** The list's singular display name */
  singular?: Maybe<Scalars['String']>;
  /** The list's plural display name */
  plural?: Maybe<Scalars['String']>;
  /** The list's data path */
  path?: Maybe<Scalars['String']>;
  /** Access control configuration for the currently authenticated request */
  access?: Maybe<_ListAccess>;
  /** Information on the generated GraphQL schema */
  schema?: Maybe<_ListSchema>;
};

export type _ListMutations = {
  __typename?: '_ListMutations';
  /** Create mutation name */
  create?: Maybe<Scalars['String']>;
  /** Create many mutation name */
  createMany?: Maybe<Scalars['String']>;
  /** Update mutation name */
  update?: Maybe<Scalars['String']>;
  /** Update many mutation name */
  updateMany?: Maybe<Scalars['String']>;
  /** Delete mutation name */
  delete?: Maybe<Scalars['String']>;
  /** Delete many mutation name */
  deleteMany?: Maybe<Scalars['String']>;
};

export type _ListQueries = {
  __typename?: '_ListQueries';
  /** Single-item query name */
  item?: Maybe<Scalars['String']>;
  /** All-items query name */
  list?: Maybe<Scalars['String']>;
  /** List metadata query name */
  meta?: Maybe<Scalars['String']>;
};

export type _ListSchema = {
  __typename?: '_ListSchema';
  /** The typename as used in GraphQL queries */
  type?: Maybe<Scalars['String']>;
  /**
   * Top level GraphQL query names which either return this type, or
   * provide aggregate information about this type
   */
  queries?: Maybe<_ListQueries>;
  /** Top-level GraphQL mutation names */
  mutations?: Maybe<_ListMutations>;
  /** Top-level GraphQL input types */
  inputTypes?: Maybe<_ListInputTypes>;
  /** Information about fields defined on this list */
  fields?: Maybe<Array<Maybe<_ListSchemaFields>>>;
  /**
   * Information about fields on other types which return this type, or
   * provide aggregate information about this type
   */
  relatedFields?: Maybe<Array<Maybe<_ListSchemaRelatedFields>>>;
};


export type _ListSchemaFieldsArgs = {
  where?: Maybe<_ListSchemaFieldsInput>;
};

export type _ListSchemaFields = {
  __typename?: '_ListSchemaFields';
  /** The path of the field in its list */
  path?: Maybe<Scalars['String']>;
  /**
   * The name of the field in its list
   * @deprecated Use `path` instead
   */
  name?: Maybe<Scalars['String']>;
  /** The field type (ie, Checkbox, Text, etc) */
  type?: Maybe<Scalars['String']>;
};

export type _ListSchemaFieldsInput = {
  type?: Maybe<Scalars['String']>;
};

export type _ListSchemaRelatedFields = {
  __typename?: '_ListSchemaRelatedFields';
  /** The typename as used in GraphQL queries */
  type?: Maybe<Scalars['String']>;
  /** A list of GraphQL field names */
  fields?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type _QueryMeta = {
  __typename?: '_QueryMeta';
  count?: Maybe<Scalars['Int']>;
};

export type _KsListsMetaInput = {
  key?: Maybe<Scalars['String']>;
  /** Whether this is an auxiliary helper list */
  auxiliary?: Maybe<Scalars['Boolean']>;
};

export type AuthenticateUserOutput = {
  __typename?: 'authenticateUserOutput';
  /**  Used to make subsequent authenticated requests by setting this token in a header: 'Authorization: Bearer <token>'.  */
  token?: Maybe<Scalars['String']>;
  /**  Retrieve information on the newly authenticated User here.  */
  item?: Maybe<User>;
};

export type UnauthenticateUserOutput = {
  __typename?: 'unauthenticateUserOutput';
  /**
   * `true` when unauthentication succeeds.
   * NOTE: unauthentication always succeeds when the request has an invalid or missing authentication token.
   */
  success?: Maybe<Scalars['Boolean']>;
};
