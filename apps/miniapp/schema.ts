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


export type Mutation = {
  __typename?: 'Mutation';
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
  /**  Authenticate and generate a token for a User with the Password Authentication Strategy.  */
  authenticateUserWithPassword?: Maybe<AuthenticateUserOutput>;
  unauthenticateUser?: Maybe<UnauthenticateUserOutput>;
  updateAuthenticatedUser?: Maybe<User>;
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


export type MutationAuthenticateUserWithPasswordArgs = {
  email?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
};


export type MutationUpdateAuthenticatedUserArgs = {
  data?: Maybe<UserUpdateInput>;
};

export type Query = {
  __typename?: 'Query';
  /**  Search for all User items which match the where clause.  */
  allUsers?: Maybe<Array<Maybe<User>>>;
  /**  Search for the User item with the matching ID.  */
  User?: Maybe<User>;
  /**  Perform a meta-query on all User items which match the where clause.  */
  _allUsersMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the User list.  */
  _UsersMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for all lists.  */
  _ksListsMeta?: Maybe<Array<Maybe<_ListMeta>>>;
  /** The version of the Keystone application serving this API. */
  appVersion?: Maybe<Scalars['String']>;
  authenticatedUser?: Maybe<User>;
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

export enum SortUsersBy {
  VAsc = 'v_ASC',
  VDesc = 'v_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  IsAdminAsc = 'isAdmin_ASC',
  IsAdminDesc = 'isAdmin_DESC',
  IsSupportAsc = 'isSupport_ASC',
  IsSupportDesc = 'isSupport_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  IsLocalAsc = 'isLocal_ASC',
  IsLocalDesc = 'isLocal_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
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


/**  condo.User (exported from condo API)  */
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
  /**  condo.User.v  */
  v?: Maybe<Scalars['Int']>;
  /**  condo.User.name  */
  name?: Maybe<Scalars['String']>;
  /**  condo.User.type  */
  type?: Maybe<UserTypeType>;
  /**  condo.User.isAdmin  */
  isAdmin?: Maybe<Scalars['Boolean']>;
  /**  condo.User.isSupport  */
  isSupport?: Maybe<Scalars['Boolean']>;
  /**  condo.User.email  */
  email?: Maybe<Scalars['String']>;
  /**  Is this a local user (not from oidc auth). We use such users for test purposes. Usecase: you need to check the app locally without the OIDC server or you need to run tests  */
  isLocal?: Maybe<Scalars['Boolean']>;
  /**  Password. Update only (for local auth without oidc). Check the `isLocal` field docs  */
  password_is_set?: Maybe<Scalars['Boolean']>;
  /**  Current organization id  */
  organizationId?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
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
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
};

export type UserCreateInput = {
  v?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  type?: Maybe<UserTypeType>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  isLocal?: Maybe<Scalars['Boolean']>;
  password?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<SenderFieldInput>;
};

export type UserRelateToOneInput = {
  create?: Maybe<UserCreateInput>;
  connect?: Maybe<UserWhereUniqueInput>;
  disconnect?: Maybe<UserWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export enum UserTypeType {
  Staff = 'staff',
  Resident = 'resident',
  Service = 'service'
}

export type UserUpdateInput = {
  v?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  type?: Maybe<UserTypeType>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  isLocal?: Maybe<Scalars['Boolean']>;
  password?: Maybe<Scalars['String']>;
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
  v?: Maybe<Scalars['Int']>;
  v_not?: Maybe<Scalars['Int']>;
  v_lt?: Maybe<Scalars['Int']>;
  v_lte?: Maybe<Scalars['Int']>;
  v_gt?: Maybe<Scalars['Int']>;
  v_gte?: Maybe<Scalars['Int']>;
  v_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  v_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
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
  type?: Maybe<UserTypeType>;
  type_not?: Maybe<UserTypeType>;
  type_in?: Maybe<Array<Maybe<UserTypeType>>>;
  type_not_in?: Maybe<Array<Maybe<UserTypeType>>>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isAdmin_not?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  isSupport_not?: Maybe<Scalars['Boolean']>;
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
  isLocal?: Maybe<Scalars['Boolean']>;
  isLocal_not?: Maybe<Scalars['Boolean']>;
  password_is_set?: Maybe<Scalars['Boolean']>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
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
