export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** File, that could be loaded through new file server or by legacy way */
  FileMeta: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  /** The `Upload` scalar type represents a file upload. */
  Upload: { input: any; output: any; }
};

export type ActualizeAddressesFailuresOutput = {
  __typename?: 'ActualizeAddressesFailuresOutput';
  addressId: Scalars['ID']['output'];
  errorMessage: Scalars['String']['output'];
};

export type ActualizeAddressesInput = {
  addresses: Array<AddressWhereUniqueInput>;
  dv: Scalars['Int']['input'];
  sender: SenderFieldInput;
};

export type ActualizeAddressesOutput = {
  __typename?: 'ActualizeAddressesOutput';
  failures: Array<Maybe<ActualizeAddressesFailuresOutput>>;
  successIds: Array<Maybe<Scalars['ID']['output']>>;
};

/**  A model containing data on the particular building's address  */
export type Address = {
  __typename?: 'Address';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the Address List config, or
   *  2. As an alias to the field set on 'labelField' in the Address List config, or
   *  3. As an alias to a 'name' field on the Address List (if one exists), or
   *  4. As an alias to the 'id' field on the Address List.
   */
  _label_?: Maybe<Scalars['String']['output']>;
  /**  The normalized address itself in one string  */
  address?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  createdBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']['output']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  /**  The unique key of the address  */
  key?: Maybe<Scalars['String']['output']>;
  /**  Some additional data for building  */
  meta?: Maybe<Scalars['JSON']['output']>;
  newId?: Maybe<Scalars['String']['output']>;
  /**  The list of overrides for address meta.data field  */
  overrides?: Maybe<Scalars['JSON']['output']>;
  /**  Points to the existing address that owns a conflicting heuristic. Used to flag potential duplicates for manual review.  */
  possibleDuplicateOf?: Maybe<Address>;
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  updatedBy?: Maybe<User>;
  v?: Maybe<Scalars['Int']['output']>;
};

export type AddressCreateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<UserRelateToOneInput>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['String']['input']>;
  overrides?: InputMaybe<Scalars['JSON']['input']>;
  possibleDuplicateOf?: InputMaybe<AddressRelateToOneInput>;
  sender?: InputMaybe<SenderFieldInput>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

/**  A model storing provider-generated heuristic identifiers for cross-provider address deduplication  */
export type AddressHeuristic = {
  __typename?: 'AddressHeuristic';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressHeuristic List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressHeuristic List config, or
   *  3. As an alias to a 'name' field on the AddressHeuristic List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressHeuristic List.
   */
  _label_?: Maybe<Scalars['String']['output']>;
  /**  The address this heuristic belongs to  */
  address?: Maybe<Address>;
  createdAt?: Maybe<Scalars['String']['output']>;
  /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  createdBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']['output']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']['output']>;
  /**  Allows disabling a heuristic while investigating issues without deleting it  */
  enabled?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  /**  Latitude for coordinate-type heuristics. Enables efficient range queries.  */
  latitude?: Maybe<Scalars['String']['output']>;
  /**  Longitude for coordinate-type heuristics. Enables efficient range queries.  */
  longitude?: Maybe<Scalars['String']['output']>;
  /**  Provider-specific quality indicators (e.g. qc_geo for coordinates)  */
  meta?: Maybe<Scalars['JSON']['output']>;
  newId?: Maybe<Scalars['String']['output']>;
  /**  Provider name that generated this heuristic (consistent with Address.meta.provider.name)  */
  provider?: Maybe<AddressHeuristicProviderType>;
  /**  Reliability score, higher means more reliable  */
  reliability?: Maybe<Scalars['Int']['output']>;
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
  /**  The heuristic type (e.g. fias_id, coordinates, google_place_id, fallback)  */
  type?: Maybe<AddressHeuristicTypeType>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  updatedBy?: Maybe<User>;
  v?: Maybe<Scalars['Int']['output']>;
  /**  The heuristic identifier value  */
  value?: Maybe<Scalars['String']['output']>;
};

export type AddressHeuristicCreateInput = {
  address?: InputMaybe<AddressRelateToOneInput>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<UserRelateToOneInput>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<AddressHeuristicProviderType>;
  reliability?: InputMaybe<Scalars['Int']['input']>;
  sender?: InputMaybe<SenderFieldInput>;
  type?: InputMaybe<AddressHeuristicTypeType>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

/**  A keystone list  */
export type AddressHeuristicHistoryRecord = {
  __typename?: 'AddressHeuristicHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressHeuristicHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressHeuristicHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the AddressHeuristicHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressHeuristicHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']['output']>;
  address?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['String']['output']>;
  dv?: Maybe<Scalars['Int']['output']>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  history_action?: Maybe<AddressHeuristicHistoryRecordHistoryActionType>;
  history_date?: Maybe<Scalars['String']['output']>;
  history_id?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['String']['output']>;
  longitude?: Maybe<Scalars['String']['output']>;
  meta?: Maybe<Scalars['JSON']['output']>;
  newId?: Maybe<Scalars['JSON']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  reliability?: Maybe<Scalars['Int']['output']>;
  sender?: Maybe<Scalars['JSON']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
  v?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type AddressHeuristicHistoryRecordCreateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  history_action?: InputMaybe<AddressHeuristicHistoryRecordHistoryActionType>;
  history_date?: InputMaybe<Scalars['String']['input']>;
  history_id?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  reliability?: InputMaybe<Scalars['Int']['input']>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export enum AddressHeuristicHistoryRecordHistoryActionType {
  C = 'c',
  D = 'd',
  U = 'u'
}

export type AddressHeuristicHistoryRecordUpdateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  history_action?: InputMaybe<AddressHeuristicHistoryRecordHistoryActionType>;
  history_date?: InputMaybe<Scalars['String']['input']>;
  history_id?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  reliability?: InputMaybe<Scalars['Int']['input']>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type AddressHeuristicHistoryRecordWhereInput = {
  AND?: InputMaybe<Array<InputMaybe<AddressHeuristicHistoryRecordWhereInput>>>;
  OR?: InputMaybe<Array<InputMaybe<AddressHeuristicHistoryRecordWhereInput>>>;
  address?: InputMaybe<Scalars['String']['input']>;
  address_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  address_not?: InputMaybe<Scalars['String']['input']>;
  address_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  enabled_not?: InputMaybe<Scalars['Boolean']['input']>;
  history_action?: InputMaybe<AddressHeuristicHistoryRecordHistoryActionType>;
  history_action_in?: InputMaybe<Array<InputMaybe<AddressHeuristicHistoryRecordHistoryActionType>>>;
  history_action_not?: InputMaybe<AddressHeuristicHistoryRecordHistoryActionType>;
  history_action_not_in?: InputMaybe<Array<InputMaybe<AddressHeuristicHistoryRecordHistoryActionType>>>;
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
  latitude?: InputMaybe<Scalars['String']['input']>;
  latitude_gt?: InputMaybe<Scalars['String']['input']>;
  latitude_gte?: InputMaybe<Scalars['String']['input']>;
  latitude_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  latitude_lt?: InputMaybe<Scalars['String']['input']>;
  latitude_lte?: InputMaybe<Scalars['String']['input']>;
  latitude_not?: InputMaybe<Scalars['String']['input']>;
  latitude_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  longitude?: InputMaybe<Scalars['String']['input']>;
  longitude_gt?: InputMaybe<Scalars['String']['input']>;
  longitude_gte?: InputMaybe<Scalars['String']['input']>;
  longitude_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  longitude_lt?: InputMaybe<Scalars['String']['input']>;
  longitude_lte?: InputMaybe<Scalars['String']['input']>;
  longitude_not?: InputMaybe<Scalars['String']['input']>;
  longitude_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  meta_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  meta_not?: InputMaybe<Scalars['JSON']['input']>;
  meta_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId_not?: InputMaybe<Scalars['JSON']['input']>;
  newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  provider?: InputMaybe<Scalars['String']['input']>;
  provider_contains?: InputMaybe<Scalars['String']['input']>;
  provider_contains_i?: InputMaybe<Scalars['String']['input']>;
  provider_ends_with?: InputMaybe<Scalars['String']['input']>;
  provider_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  provider_i?: InputMaybe<Scalars['String']['input']>;
  provider_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  provider_not?: InputMaybe<Scalars['String']['input']>;
  provider_not_contains?: InputMaybe<Scalars['String']['input']>;
  provider_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  provider_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  provider_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  provider_not_i?: InputMaybe<Scalars['String']['input']>;
  provider_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  provider_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  provider_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  provider_starts_with?: InputMaybe<Scalars['String']['input']>;
  provider_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  reliability?: InputMaybe<Scalars['Int']['input']>;
  reliability_gt?: InputMaybe<Scalars['Int']['input']>;
  reliability_gte?: InputMaybe<Scalars['Int']['input']>;
  reliability_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  reliability_lt?: InputMaybe<Scalars['Int']['input']>;
  reliability_lte?: InputMaybe<Scalars['Int']['input']>;
  reliability_not?: InputMaybe<Scalars['Int']['input']>;
  reliability_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  sender_not?: InputMaybe<Scalars['JSON']['input']>;
  sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  type?: InputMaybe<Scalars['String']['input']>;
  type_contains?: InputMaybe<Scalars['String']['input']>;
  type_contains_i?: InputMaybe<Scalars['String']['input']>;
  type_ends_with?: InputMaybe<Scalars['String']['input']>;
  type_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  type_i?: InputMaybe<Scalars['String']['input']>;
  type_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type_not?: InputMaybe<Scalars['String']['input']>;
  type_not_contains?: InputMaybe<Scalars['String']['input']>;
  type_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  type_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  type_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  type_not_i?: InputMaybe<Scalars['String']['input']>;
  type_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  type_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  type_starts_with?: InputMaybe<Scalars['String']['input']>;
  type_starts_with_i?: InputMaybe<Scalars['String']['input']>;
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
  value?: InputMaybe<Scalars['String']['input']>;
  value_contains?: InputMaybe<Scalars['String']['input']>;
  value_contains_i?: InputMaybe<Scalars['String']['input']>;
  value_ends_with?: InputMaybe<Scalars['String']['input']>;
  value_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  value_i?: InputMaybe<Scalars['String']['input']>;
  value_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  value_not?: InputMaybe<Scalars['String']['input']>;
  value_not_contains?: InputMaybe<Scalars['String']['input']>;
  value_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  value_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  value_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  value_not_i?: InputMaybe<Scalars['String']['input']>;
  value_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  value_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  value_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  value_starts_with?: InputMaybe<Scalars['String']['input']>;
  value_starts_with_i?: InputMaybe<Scalars['String']['input']>;
};

export type AddressHeuristicHistoryRecordWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type AddressHeuristicHistoryRecordsCreateInput = {
  data?: InputMaybe<AddressHeuristicHistoryRecordCreateInput>;
};

export type AddressHeuristicHistoryRecordsUpdateInput = {
  data?: InputMaybe<AddressHeuristicHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};

export enum AddressHeuristicProviderType {
  Dadata = 'dadata',
  Google = 'google',
  Injections = 'injections',
  Pullenti = 'pullenti',
  Yandex = 'yandex'
}

export enum AddressHeuristicTypeType {
  Coordinates = 'coordinates',
  Fallback = 'fallback',
  FiasId = 'fias_id',
  GooglePlaceId = 'google_place_id'
}

export type AddressHeuristicUpdateInput = {
  address?: InputMaybe<AddressRelateToOneInput>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<UserRelateToOneInput>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<AddressHeuristicProviderType>;
  reliability?: InputMaybe<Scalars['Int']['input']>;
  sender?: InputMaybe<SenderFieldInput>;
  type?: InputMaybe<AddressHeuristicTypeType>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type AddressHeuristicWhereInput = {
  AND?: InputMaybe<Array<InputMaybe<AddressHeuristicWhereInput>>>;
  OR?: InputMaybe<Array<InputMaybe<AddressHeuristicWhereInput>>>;
  address?: InputMaybe<AddressWhereInput>;
  address_is_null?: InputMaybe<Scalars['Boolean']['input']>;
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
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  enabled_not?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  latitude?: InputMaybe<Scalars['String']['input']>;
  latitude_gt?: InputMaybe<Scalars['String']['input']>;
  latitude_gte?: InputMaybe<Scalars['String']['input']>;
  latitude_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  latitude_lt?: InputMaybe<Scalars['String']['input']>;
  latitude_lte?: InputMaybe<Scalars['String']['input']>;
  latitude_not?: InputMaybe<Scalars['String']['input']>;
  latitude_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  longitude?: InputMaybe<Scalars['String']['input']>;
  longitude_gt?: InputMaybe<Scalars['String']['input']>;
  longitude_gte?: InputMaybe<Scalars['String']['input']>;
  longitude_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  longitude_lt?: InputMaybe<Scalars['String']['input']>;
  longitude_lte?: InputMaybe<Scalars['String']['input']>;
  longitude_not?: InputMaybe<Scalars['String']['input']>;
  longitude_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  meta_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  meta_not?: InputMaybe<Scalars['JSON']['input']>;
  meta_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId?: InputMaybe<Scalars['String']['input']>;
  newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  newId_not?: InputMaybe<Scalars['String']['input']>;
  newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  provider?: InputMaybe<AddressHeuristicProviderType>;
  provider_in?: InputMaybe<Array<InputMaybe<AddressHeuristicProviderType>>>;
  provider_not?: InputMaybe<AddressHeuristicProviderType>;
  provider_not_in?: InputMaybe<Array<InputMaybe<AddressHeuristicProviderType>>>;
  reliability?: InputMaybe<Scalars['Int']['input']>;
  reliability_gt?: InputMaybe<Scalars['Int']['input']>;
  reliability_gte?: InputMaybe<Scalars['Int']['input']>;
  reliability_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  reliability_lt?: InputMaybe<Scalars['Int']['input']>;
  reliability_lte?: InputMaybe<Scalars['Int']['input']>;
  reliability_not?: InputMaybe<Scalars['Int']['input']>;
  reliability_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  sender?: InputMaybe<SenderFieldInput>;
  sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
  sender_not?: InputMaybe<SenderFieldInput>;
  sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
  type?: InputMaybe<AddressHeuristicTypeType>;
  type_in?: InputMaybe<Array<InputMaybe<AddressHeuristicTypeType>>>;
  type_not?: InputMaybe<AddressHeuristicTypeType>;
  type_not_in?: InputMaybe<Array<InputMaybe<AddressHeuristicTypeType>>>;
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
  value?: InputMaybe<Scalars['String']['input']>;
  value_contains?: InputMaybe<Scalars['String']['input']>;
  value_contains_i?: InputMaybe<Scalars['String']['input']>;
  value_ends_with?: InputMaybe<Scalars['String']['input']>;
  value_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  value_i?: InputMaybe<Scalars['String']['input']>;
  value_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  value_not?: InputMaybe<Scalars['String']['input']>;
  value_not_contains?: InputMaybe<Scalars['String']['input']>;
  value_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  value_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  value_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  value_not_i?: InputMaybe<Scalars['String']['input']>;
  value_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  value_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  value_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  value_starts_with?: InputMaybe<Scalars['String']['input']>;
  value_starts_with_i?: InputMaybe<Scalars['String']['input']>;
};

export type AddressHeuristicWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type AddressHeuristicsCreateInput = {
  data?: InputMaybe<AddressHeuristicCreateInput>;
};

export type AddressHeuristicsUpdateInput = {
  data?: InputMaybe<AddressHeuristicUpdateInput>;
  id: Scalars['ID']['input'];
};

/**  A keystone list  */
export type AddressHistoryRecord = {
  __typename?: 'AddressHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the AddressHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']['output']>;
  address?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['String']['output']>;
  dv?: Maybe<Scalars['Int']['output']>;
  history_action?: Maybe<AddressHistoryRecordHistoryActionType>;
  history_date?: Maybe<Scalars['String']['output']>;
  history_id?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  key?: Maybe<Scalars['String']['output']>;
  meta?: Maybe<Scalars['JSON']['output']>;
  newId?: Maybe<Scalars['JSON']['output']>;
  overrides?: Maybe<Scalars['JSON']['output']>;
  possibleDuplicateOf?: Maybe<Scalars['String']['output']>;
  sender?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
  v?: Maybe<Scalars['Int']['output']>;
};

export type AddressHistoryRecordCreateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  history_action?: InputMaybe<AddressHistoryRecordHistoryActionType>;
  history_date?: InputMaybe<Scalars['String']['input']>;
  history_id?: InputMaybe<Scalars['String']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  overrides?: InputMaybe<Scalars['JSON']['input']>;
  possibleDuplicateOf?: InputMaybe<Scalars['String']['input']>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export enum AddressHistoryRecordHistoryActionType {
  C = 'c',
  D = 'd',
  U = 'u'
}

export type AddressHistoryRecordUpdateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  history_action?: InputMaybe<AddressHistoryRecordHistoryActionType>;
  history_date?: InputMaybe<Scalars['String']['input']>;
  history_id?: InputMaybe<Scalars['String']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  overrides?: InputMaybe<Scalars['JSON']['input']>;
  possibleDuplicateOf?: InputMaybe<Scalars['String']['input']>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export type AddressHistoryRecordWhereInput = {
  AND?: InputMaybe<Array<InputMaybe<AddressHistoryRecordWhereInput>>>;
  OR?: InputMaybe<Array<InputMaybe<AddressHistoryRecordWhereInput>>>;
  address?: InputMaybe<Scalars['String']['input']>;
  address_contains?: InputMaybe<Scalars['String']['input']>;
  address_contains_i?: InputMaybe<Scalars['String']['input']>;
  address_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  address_i?: InputMaybe<Scalars['String']['input']>;
  address_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  address_not?: InputMaybe<Scalars['String']['input']>;
  address_not_contains?: InputMaybe<Scalars['String']['input']>;
  address_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  address_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  address_not_i?: InputMaybe<Scalars['String']['input']>;
  address_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  address_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  address_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  address_starts_with?: InputMaybe<Scalars['String']['input']>;
  address_starts_with_i?: InputMaybe<Scalars['String']['input']>;
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
  history_action?: InputMaybe<AddressHistoryRecordHistoryActionType>;
  history_action_in?: InputMaybe<Array<InputMaybe<AddressHistoryRecordHistoryActionType>>>;
  history_action_not?: InputMaybe<AddressHistoryRecordHistoryActionType>;
  history_action_not_in?: InputMaybe<Array<InputMaybe<AddressHistoryRecordHistoryActionType>>>;
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
  key?: InputMaybe<Scalars['String']['input']>;
  key_contains?: InputMaybe<Scalars['String']['input']>;
  key_contains_i?: InputMaybe<Scalars['String']['input']>;
  key_ends_with?: InputMaybe<Scalars['String']['input']>;
  key_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  key_i?: InputMaybe<Scalars['String']['input']>;
  key_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  key_not?: InputMaybe<Scalars['String']['input']>;
  key_not_contains?: InputMaybe<Scalars['String']['input']>;
  key_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  key_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  key_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  key_not_i?: InputMaybe<Scalars['String']['input']>;
  key_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  key_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  key_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  key_starts_with?: InputMaybe<Scalars['String']['input']>;
  key_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  meta_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  meta_not?: InputMaybe<Scalars['JSON']['input']>;
  meta_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId_not?: InputMaybe<Scalars['JSON']['input']>;
  newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  overrides?: InputMaybe<Scalars['JSON']['input']>;
  overrides_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  overrides_not?: InputMaybe<Scalars['JSON']['input']>;
  overrides_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  possibleDuplicateOf?: InputMaybe<Scalars['String']['input']>;
  possibleDuplicateOf_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  possibleDuplicateOf_not?: InputMaybe<Scalars['String']['input']>;
  possibleDuplicateOf_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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
};

export type AddressHistoryRecordWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type AddressHistoryRecordsCreateInput = {
  data?: InputMaybe<AddressHistoryRecordCreateInput>;
};

export type AddressHistoryRecordsUpdateInput = {
  data?: InputMaybe<AddressHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};

/**  Addresses that do not exist in external providers  */
export type AddressInjection = {
  __typename?: 'AddressInjection';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressInjection List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressInjection List config, or
   *  3. As an alias to a 'name' field on the AddressInjection List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressInjection List.
   */
  _label_?: Maybe<Scalars['String']['output']>;
  /**  Some area  */
  area?: Maybe<Scalars['JSON']['output']>;
  /**  Some part of the building  */
  block?: Maybe<Scalars['JSON']['output']>;
  /**  The city name  */
  city?: Maybe<Scalars['JSON']['output']>;
  /**  The district within the city name  */
  cityDistrict?: Maybe<Scalars['JSON']['output']>;
  /**  The country  */
  country?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  createdBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']['output']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']['output']>;
  /**  The number of the building  */
  house?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  /**  The autogenerated keywords for searching  */
  keywords?: Maybe<Scalars['String']['output']>;
  /**  Additional data  */
  meta?: Maybe<Scalars['JSON']['output']>;
  newId?: Maybe<Scalars['String']['output']>;
  /**  The region  */
  region?: Maybe<Scalars['JSON']['output']>;
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
  /**  The settlement name  */
  settlement?: Maybe<Scalars['JSON']['output']>;
  /**  The street name itself  */
  street?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  updatedBy?: Maybe<User>;
  v?: Maybe<Scalars['Int']['output']>;
};

export type AddressInjectionCreateInput = {
  area?: InputMaybe<Scalars['JSON']['input']>;
  block?: InputMaybe<Scalars['JSON']['input']>;
  city?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict?: InputMaybe<Scalars['JSON']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<UserRelateToOneInput>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  house?: InputMaybe<Scalars['JSON']['input']>;
  keywords?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['JSON']['input']>;
  sender?: InputMaybe<SenderFieldInput>;
  settlement?: InputMaybe<Scalars['JSON']['input']>;
  street?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

/**  A keystone list  */
export type AddressInjectionHistoryRecord = {
  __typename?: 'AddressInjectionHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressInjectionHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressInjectionHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the AddressInjectionHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressInjectionHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']['output']>;
  area?: Maybe<Scalars['JSON']['output']>;
  block?: Maybe<Scalars['JSON']['output']>;
  city?: Maybe<Scalars['JSON']['output']>;
  cityDistrict?: Maybe<Scalars['JSON']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['String']['output']>;
  dv?: Maybe<Scalars['Int']['output']>;
  history_action?: Maybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_date?: Maybe<Scalars['String']['output']>;
  history_id?: Maybe<Scalars['String']['output']>;
  house?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  keywords?: Maybe<Scalars['String']['output']>;
  meta?: Maybe<Scalars['JSON']['output']>;
  newId?: Maybe<Scalars['JSON']['output']>;
  region?: Maybe<Scalars['JSON']['output']>;
  sender?: Maybe<Scalars['JSON']['output']>;
  settlement?: Maybe<Scalars['JSON']['output']>;
  street?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
  v?: Maybe<Scalars['Int']['output']>;
};

export type AddressInjectionHistoryRecordCreateInput = {
  area?: InputMaybe<Scalars['JSON']['input']>;
  block?: InputMaybe<Scalars['JSON']['input']>;
  city?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict?: InputMaybe<Scalars['JSON']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  history_action?: InputMaybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_date?: InputMaybe<Scalars['String']['input']>;
  history_id?: InputMaybe<Scalars['String']['input']>;
  house?: InputMaybe<Scalars['JSON']['input']>;
  keywords?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  region?: InputMaybe<Scalars['JSON']['input']>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  settlement?: InputMaybe<Scalars['JSON']['input']>;
  street?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export enum AddressInjectionHistoryRecordHistoryActionType {
  C = 'c',
  D = 'd',
  U = 'u'
}

export type AddressInjectionHistoryRecordUpdateInput = {
  area?: InputMaybe<Scalars['JSON']['input']>;
  block?: InputMaybe<Scalars['JSON']['input']>;
  city?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict?: InputMaybe<Scalars['JSON']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  history_action?: InputMaybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_date?: InputMaybe<Scalars['String']['input']>;
  history_id?: InputMaybe<Scalars['String']['input']>;
  house?: InputMaybe<Scalars['JSON']['input']>;
  keywords?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  region?: InputMaybe<Scalars['JSON']['input']>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  settlement?: InputMaybe<Scalars['JSON']['input']>;
  street?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export type AddressInjectionHistoryRecordWhereInput = {
  AND?: InputMaybe<Array<InputMaybe<AddressInjectionHistoryRecordWhereInput>>>;
  OR?: InputMaybe<Array<InputMaybe<AddressInjectionHistoryRecordWhereInput>>>;
  area?: InputMaybe<Scalars['JSON']['input']>;
  area_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  area_not?: InputMaybe<Scalars['JSON']['input']>;
  area_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  block?: InputMaybe<Scalars['JSON']['input']>;
  block_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  block_not?: InputMaybe<Scalars['JSON']['input']>;
  block_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  city?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  cityDistrict_not?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  city_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  city_not?: InputMaybe<Scalars['JSON']['input']>;
  city_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  country?: InputMaybe<Scalars['String']['input']>;
  country_contains?: InputMaybe<Scalars['String']['input']>;
  country_contains_i?: InputMaybe<Scalars['String']['input']>;
  country_ends_with?: InputMaybe<Scalars['String']['input']>;
  country_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  country_i?: InputMaybe<Scalars['String']['input']>;
  country_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  country_not?: InputMaybe<Scalars['String']['input']>;
  country_not_contains?: InputMaybe<Scalars['String']['input']>;
  country_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  country_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  country_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  country_not_i?: InputMaybe<Scalars['String']['input']>;
  country_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  country_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  country_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  country_starts_with?: InputMaybe<Scalars['String']['input']>;
  country_starts_with_i?: InputMaybe<Scalars['String']['input']>;
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
  history_action?: InputMaybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_action_in?: InputMaybe<Array<InputMaybe<AddressInjectionHistoryRecordHistoryActionType>>>;
  history_action_not?: InputMaybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_action_not_in?: InputMaybe<Array<InputMaybe<AddressInjectionHistoryRecordHistoryActionType>>>;
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
  house?: InputMaybe<Scalars['JSON']['input']>;
  house_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  house_not?: InputMaybe<Scalars['JSON']['input']>;
  house_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  keywords?: InputMaybe<Scalars['String']['input']>;
  keywords_contains?: InputMaybe<Scalars['String']['input']>;
  keywords_contains_i?: InputMaybe<Scalars['String']['input']>;
  keywords_ends_with?: InputMaybe<Scalars['String']['input']>;
  keywords_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  keywords_i?: InputMaybe<Scalars['String']['input']>;
  keywords_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  keywords_not?: InputMaybe<Scalars['String']['input']>;
  keywords_not_contains?: InputMaybe<Scalars['String']['input']>;
  keywords_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  keywords_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  keywords_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  keywords_not_i?: InputMaybe<Scalars['String']['input']>;
  keywords_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  keywords_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  keywords_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  keywords_starts_with?: InputMaybe<Scalars['String']['input']>;
  keywords_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  meta_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  meta_not?: InputMaybe<Scalars['JSON']['input']>;
  meta_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId_not?: InputMaybe<Scalars['JSON']['input']>;
  newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  region?: InputMaybe<Scalars['JSON']['input']>;
  region_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  region_not?: InputMaybe<Scalars['JSON']['input']>;
  region_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  sender_not?: InputMaybe<Scalars['JSON']['input']>;
  sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  settlement?: InputMaybe<Scalars['JSON']['input']>;
  settlement_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  settlement_not?: InputMaybe<Scalars['JSON']['input']>;
  settlement_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  street?: InputMaybe<Scalars['JSON']['input']>;
  street_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  street_not?: InputMaybe<Scalars['JSON']['input']>;
  street_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
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
};

export type AddressInjectionHistoryRecordWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type AddressInjectionHistoryRecordsCreateInput = {
  data?: InputMaybe<AddressInjectionHistoryRecordCreateInput>;
};

export type AddressInjectionHistoryRecordsUpdateInput = {
  data?: InputMaybe<AddressInjectionHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};

export type AddressInjectionUpdateInput = {
  area?: InputMaybe<Scalars['JSON']['input']>;
  block?: InputMaybe<Scalars['JSON']['input']>;
  city?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict?: InputMaybe<Scalars['JSON']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<UserRelateToOneInput>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  house?: InputMaybe<Scalars['JSON']['input']>;
  keywords?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['JSON']['input']>;
  sender?: InputMaybe<SenderFieldInput>;
  settlement?: InputMaybe<Scalars['JSON']['input']>;
  street?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export type AddressInjectionWhereInput = {
  AND?: InputMaybe<Array<InputMaybe<AddressInjectionWhereInput>>>;
  OR?: InputMaybe<Array<InputMaybe<AddressInjectionWhereInput>>>;
  area?: InputMaybe<Scalars['JSON']['input']>;
  area_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  area_not?: InputMaybe<Scalars['JSON']['input']>;
  area_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  block?: InputMaybe<Scalars['JSON']['input']>;
  block_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  block_not?: InputMaybe<Scalars['JSON']['input']>;
  block_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  city?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  cityDistrict_not?: InputMaybe<Scalars['JSON']['input']>;
  cityDistrict_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  city_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  city_not?: InputMaybe<Scalars['JSON']['input']>;
  city_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  country?: InputMaybe<Scalars['String']['input']>;
  country_contains?: InputMaybe<Scalars['String']['input']>;
  country_contains_i?: InputMaybe<Scalars['String']['input']>;
  country_ends_with?: InputMaybe<Scalars['String']['input']>;
  country_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  country_i?: InputMaybe<Scalars['String']['input']>;
  country_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  country_not?: InputMaybe<Scalars['String']['input']>;
  country_not_contains?: InputMaybe<Scalars['String']['input']>;
  country_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  country_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  country_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  country_not_i?: InputMaybe<Scalars['String']['input']>;
  country_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  country_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  country_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  country_starts_with?: InputMaybe<Scalars['String']['input']>;
  country_starts_with_i?: InputMaybe<Scalars['String']['input']>;
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
  house?: InputMaybe<Scalars['JSON']['input']>;
  house_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  house_not?: InputMaybe<Scalars['JSON']['input']>;
  house_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  keywords?: InputMaybe<Scalars['String']['input']>;
  keywords_contains?: InputMaybe<Scalars['String']['input']>;
  keywords_contains_i?: InputMaybe<Scalars['String']['input']>;
  keywords_ends_with?: InputMaybe<Scalars['String']['input']>;
  keywords_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  keywords_i?: InputMaybe<Scalars['String']['input']>;
  keywords_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  keywords_not?: InputMaybe<Scalars['String']['input']>;
  keywords_not_contains?: InputMaybe<Scalars['String']['input']>;
  keywords_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  keywords_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  keywords_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  keywords_not_i?: InputMaybe<Scalars['String']['input']>;
  keywords_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  keywords_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  keywords_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  keywords_starts_with?: InputMaybe<Scalars['String']['input']>;
  keywords_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  meta_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  meta_not?: InputMaybe<Scalars['JSON']['input']>;
  meta_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId?: InputMaybe<Scalars['String']['input']>;
  newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  newId_not?: InputMaybe<Scalars['String']['input']>;
  newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  region?: InputMaybe<Scalars['JSON']['input']>;
  region_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  region_not?: InputMaybe<Scalars['JSON']['input']>;
  region_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  sender?: InputMaybe<SenderFieldInput>;
  sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
  sender_not?: InputMaybe<SenderFieldInput>;
  sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
  settlement?: InputMaybe<Scalars['JSON']['input']>;
  settlement_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  settlement_not?: InputMaybe<Scalars['JSON']['input']>;
  settlement_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  street?: InputMaybe<Scalars['JSON']['input']>;
  street_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  street_not?: InputMaybe<Scalars['JSON']['input']>;
  street_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
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
};

export type AddressInjectionWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type AddressInjectionsCreateInput = {
  data?: InputMaybe<AddressInjectionCreateInput>;
};

export type AddressInjectionsUpdateInput = {
  data?: InputMaybe<AddressInjectionUpdateInput>;
  id: Scalars['ID']['input'];
};

export type AddressRelateToOneInput = {
  connect?: InputMaybe<AddressWhereUniqueInput>;
  create?: InputMaybe<AddressCreateInput>;
  disconnect?: InputMaybe<AddressWhereUniqueInput>;
  disconnectAll?: InputMaybe<Scalars['Boolean']['input']>;
};

/**  A model containing data on the particular building's address origin  */
export type AddressSource = {
  __typename?: 'AddressSource';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressSource List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressSource List config, or
   *  3. As an alias to a 'name' field on the AddressSource List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressSource List.
   */
  _label_?: Maybe<Scalars['String']['output']>;
  /**  The address which was found by the source address  */
  address?: Maybe<Address>;
  createdAt?: Maybe<Scalars['String']['output']>;
  /**  Identifies a user, which has created this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  createdBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']['output']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  newId?: Maybe<Scalars['String']['output']>;
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
  /**  The string the address was found by (address origin)  */
  source?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  updatedBy?: Maybe<User>;
  v?: Maybe<Scalars['Int']['output']>;
};

export type AddressSourceCreateInput = {
  address?: InputMaybe<AddressRelateToOneInput>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<UserRelateToOneInput>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  newId?: InputMaybe<Scalars['String']['input']>;
  sender?: InputMaybe<SenderFieldInput>;
  source?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

/**  A keystone list  */
export type AddressSourceHistoryRecord = {
  __typename?: 'AddressSourceHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressSourceHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressSourceHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the AddressSourceHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressSourceHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']['output']>;
  address?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['String']['output']>;
  dv?: Maybe<Scalars['Int']['output']>;
  history_action?: Maybe<AddressSourceHistoryRecordHistoryActionType>;
  history_date?: Maybe<Scalars['String']['output']>;
  history_id?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  newId?: Maybe<Scalars['JSON']['output']>;
  sender?: Maybe<Scalars['JSON']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
  v?: Maybe<Scalars['Int']['output']>;
};

export type AddressSourceHistoryRecordCreateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  history_action?: InputMaybe<AddressSourceHistoryRecordHistoryActionType>;
  history_date?: InputMaybe<Scalars['String']['input']>;
  history_id?: InputMaybe<Scalars['String']['input']>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export enum AddressSourceHistoryRecordHistoryActionType {
  C = 'c',
  D = 'd',
  U = 'u'
}

export type AddressSourceHistoryRecordUpdateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  history_action?: InputMaybe<AddressSourceHistoryRecordHistoryActionType>;
  history_date?: InputMaybe<Scalars['String']['input']>;
  history_id?: InputMaybe<Scalars['String']['input']>;
  newId?: InputMaybe<Scalars['JSON']['input']>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export type AddressSourceHistoryRecordWhereInput = {
  AND?: InputMaybe<Array<InputMaybe<AddressSourceHistoryRecordWhereInput>>>;
  OR?: InputMaybe<Array<InputMaybe<AddressSourceHistoryRecordWhereInput>>>;
  address?: InputMaybe<Scalars['String']['input']>;
  address_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  address_not?: InputMaybe<Scalars['String']['input']>;
  address_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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
  history_action?: InputMaybe<AddressSourceHistoryRecordHistoryActionType>;
  history_action_in?: InputMaybe<Array<InputMaybe<AddressSourceHistoryRecordHistoryActionType>>>;
  history_action_not?: InputMaybe<AddressSourceHistoryRecordHistoryActionType>;
  history_action_not_in?: InputMaybe<Array<InputMaybe<AddressSourceHistoryRecordHistoryActionType>>>;
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
  newId?: InputMaybe<Scalars['JSON']['input']>;
  newId_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId_not?: InputMaybe<Scalars['JSON']['input']>;
  newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  sender?: InputMaybe<Scalars['JSON']['input']>;
  sender_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  sender_not?: InputMaybe<Scalars['JSON']['input']>;
  sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  source?: InputMaybe<Scalars['String']['input']>;
  source_contains?: InputMaybe<Scalars['String']['input']>;
  source_contains_i?: InputMaybe<Scalars['String']['input']>;
  source_ends_with?: InputMaybe<Scalars['String']['input']>;
  source_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  source_i?: InputMaybe<Scalars['String']['input']>;
  source_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  source_not?: InputMaybe<Scalars['String']['input']>;
  source_not_contains?: InputMaybe<Scalars['String']['input']>;
  source_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  source_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  source_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  source_not_i?: InputMaybe<Scalars['String']['input']>;
  source_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  source_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  source_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  source_starts_with?: InputMaybe<Scalars['String']['input']>;
  source_starts_with_i?: InputMaybe<Scalars['String']['input']>;
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
};

export type AddressSourceHistoryRecordWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type AddressSourceHistoryRecordsCreateInput = {
  data?: InputMaybe<AddressSourceHistoryRecordCreateInput>;
};

export type AddressSourceHistoryRecordsUpdateInput = {
  data?: InputMaybe<AddressSourceHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};

export type AddressSourceUpdateInput = {
  address?: InputMaybe<AddressRelateToOneInput>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<UserRelateToOneInput>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  newId?: InputMaybe<Scalars['String']['input']>;
  sender?: InputMaybe<SenderFieldInput>;
  source?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export type AddressSourceWhereInput = {
  AND?: InputMaybe<Array<InputMaybe<AddressSourceWhereInput>>>;
  OR?: InputMaybe<Array<InputMaybe<AddressSourceWhereInput>>>;
  address?: InputMaybe<AddressWhereInput>;
  address_is_null?: InputMaybe<Scalars['Boolean']['input']>;
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
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  newId?: InputMaybe<Scalars['String']['input']>;
  newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  newId_not?: InputMaybe<Scalars['String']['input']>;
  newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sender?: InputMaybe<SenderFieldInput>;
  sender_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
  sender_not?: InputMaybe<SenderFieldInput>;
  sender_not_in?: InputMaybe<Array<InputMaybe<SenderFieldInput>>>;
  source?: InputMaybe<Scalars['String']['input']>;
  source_contains?: InputMaybe<Scalars['String']['input']>;
  source_contains_i?: InputMaybe<Scalars['String']['input']>;
  source_ends_with?: InputMaybe<Scalars['String']['input']>;
  source_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  source_i?: InputMaybe<Scalars['String']['input']>;
  source_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  source_not?: InputMaybe<Scalars['String']['input']>;
  source_not_contains?: InputMaybe<Scalars['String']['input']>;
  source_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  source_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  source_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  source_not_i?: InputMaybe<Scalars['String']['input']>;
  source_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  source_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  source_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  source_starts_with?: InputMaybe<Scalars['String']['input']>;
  source_starts_with_i?: InputMaybe<Scalars['String']['input']>;
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
};

export type AddressSourceWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type AddressSourcesCreateInput = {
  data?: InputMaybe<AddressSourceCreateInput>;
};

export type AddressSourcesUpdateInput = {
  data?: InputMaybe<AddressSourceUpdateInput>;
  id: Scalars['ID']['input'];
};

export type AddressUpdateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<UserRelateToOneInput>;
  deletedAt?: InputMaybe<Scalars['String']['input']>;
  dv?: InputMaybe<Scalars['Int']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  newId?: InputMaybe<Scalars['String']['input']>;
  overrides?: InputMaybe<Scalars['JSON']['input']>;
  possibleDuplicateOf?: InputMaybe<AddressRelateToOneInput>;
  sender?: InputMaybe<SenderFieldInput>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export type AddressWhereInput = {
  AND?: InputMaybe<Array<InputMaybe<AddressWhereInput>>>;
  OR?: InputMaybe<Array<InputMaybe<AddressWhereInput>>>;
  address?: InputMaybe<Scalars['String']['input']>;
  address_contains?: InputMaybe<Scalars['String']['input']>;
  address_contains_i?: InputMaybe<Scalars['String']['input']>;
  address_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  address_i?: InputMaybe<Scalars['String']['input']>;
  address_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  address_not?: InputMaybe<Scalars['String']['input']>;
  address_not_contains?: InputMaybe<Scalars['String']['input']>;
  address_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  address_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  address_not_i?: InputMaybe<Scalars['String']['input']>;
  address_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  address_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  address_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  address_starts_with?: InputMaybe<Scalars['String']['input']>;
  address_starts_with_i?: InputMaybe<Scalars['String']['input']>;
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
  id?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  key?: InputMaybe<Scalars['String']['input']>;
  key_contains?: InputMaybe<Scalars['String']['input']>;
  key_contains_i?: InputMaybe<Scalars['String']['input']>;
  key_ends_with?: InputMaybe<Scalars['String']['input']>;
  key_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  key_i?: InputMaybe<Scalars['String']['input']>;
  key_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  key_not?: InputMaybe<Scalars['String']['input']>;
  key_not_contains?: InputMaybe<Scalars['String']['input']>;
  key_not_contains_i?: InputMaybe<Scalars['String']['input']>;
  key_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  key_not_ends_with_i?: InputMaybe<Scalars['String']['input']>;
  key_not_i?: InputMaybe<Scalars['String']['input']>;
  key_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  key_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  key_not_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  key_starts_with?: InputMaybe<Scalars['String']['input']>;
  key_starts_with_i?: InputMaybe<Scalars['String']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  meta_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  meta_not?: InputMaybe<Scalars['JSON']['input']>;
  meta_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  newId?: InputMaybe<Scalars['String']['input']>;
  newId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  newId_not?: InputMaybe<Scalars['String']['input']>;
  newId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  overrides?: InputMaybe<Scalars['JSON']['input']>;
  overrides_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  overrides_not?: InputMaybe<Scalars['JSON']['input']>;
  overrides_not_in?: InputMaybe<Array<InputMaybe<Scalars['JSON']['input']>>>;
  possibleDuplicateOf?: InputMaybe<AddressWhereInput>;
  possibleDuplicateOf_is_null?: InputMaybe<Scalars['Boolean']['input']>;
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
};

export type AddressWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type AddressesCreateInput = {
  data?: InputMaybe<AddressCreateInput>;
};

export type AddressesUpdateInput = {
  data?: InputMaybe<AddressUpdateInput>;
  id: Scalars['ID']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  actualizeAddresses?: Maybe<ActualizeAddressesOutput>;
  /**  Authenticate and generate a token for a User with the Password Authentication Strategy.  */
  authenticateUserWithPassword?: Maybe<AuthenticateUserOutput>;
  /**  Create a single Address item.  */
  createAddress?: Maybe<Address>;
  /**  Create a single AddressHeuristic item.  */
  createAddressHeuristic?: Maybe<AddressHeuristic>;
  /**  Create a single AddressHeuristicHistoryRecord item.  */
  createAddressHeuristicHistoryRecord?: Maybe<AddressHeuristicHistoryRecord>;
  /**  Create multiple AddressHeuristicHistoryRecord items.  */
  createAddressHeuristicHistoryRecords?: Maybe<Array<Maybe<AddressHeuristicHistoryRecord>>>;
  /**  Create multiple AddressHeuristic items.  */
  createAddressHeuristics?: Maybe<Array<Maybe<AddressHeuristic>>>;
  /**  Create a single AddressHistoryRecord item.  */
  createAddressHistoryRecord?: Maybe<AddressHistoryRecord>;
  /**  Create multiple AddressHistoryRecord items.  */
  createAddressHistoryRecords?: Maybe<Array<Maybe<AddressHistoryRecord>>>;
  /**  Create a single AddressInjection item.  */
  createAddressInjection?: Maybe<AddressInjection>;
  /**  Create a single AddressInjectionHistoryRecord item.  */
  createAddressInjectionHistoryRecord?: Maybe<AddressInjectionHistoryRecord>;
  /**  Create multiple AddressInjectionHistoryRecord items.  */
  createAddressInjectionHistoryRecords?: Maybe<Array<Maybe<AddressInjectionHistoryRecord>>>;
  /**  Create multiple AddressInjection items.  */
  createAddressInjections?: Maybe<Array<Maybe<AddressInjection>>>;
  /**  Create a single AddressSource item.  */
  createAddressSource?: Maybe<AddressSource>;
  /**  Create a single AddressSourceHistoryRecord item.  */
  createAddressSourceHistoryRecord?: Maybe<AddressSourceHistoryRecord>;
  /**  Create multiple AddressSourceHistoryRecord items.  */
  createAddressSourceHistoryRecords?: Maybe<Array<Maybe<AddressSourceHistoryRecord>>>;
  /**  Create multiple AddressSource items.  */
  createAddressSources?: Maybe<Array<Maybe<AddressSource>>>;
  /**  Create multiple Address items.  */
  createAddresses?: Maybe<Array<Maybe<Address>>>;
  /**  Create a single User item.  */
  createUser?: Maybe<User>;
  /**  Create a single UserHistoryRecord item.  */
  createUserHistoryRecord?: Maybe<UserHistoryRecord>;
  /**  Create multiple UserHistoryRecord items.  */
  createUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
  /**  Create multiple User items.  */
  createUsers?: Maybe<Array<Maybe<User>>>;
  /**  Delete a single Address item by ID.  */
  deleteAddress?: Maybe<Address>;
  /**  Delete a single AddressHeuristic item by ID.  */
  deleteAddressHeuristic?: Maybe<AddressHeuristic>;
  /**  Delete a single AddressHeuristicHistoryRecord item by ID.  */
  deleteAddressHeuristicHistoryRecord?: Maybe<AddressHeuristicHistoryRecord>;
  /**  Delete multiple AddressHeuristicHistoryRecord items by ID.  */
  deleteAddressHeuristicHistoryRecords?: Maybe<Array<Maybe<AddressHeuristicHistoryRecord>>>;
  /**  Delete multiple AddressHeuristic items by ID.  */
  deleteAddressHeuristics?: Maybe<Array<Maybe<AddressHeuristic>>>;
  /**  Delete a single AddressHistoryRecord item by ID.  */
  deleteAddressHistoryRecord?: Maybe<AddressHistoryRecord>;
  /**  Delete multiple AddressHistoryRecord items by ID.  */
  deleteAddressHistoryRecords?: Maybe<Array<Maybe<AddressHistoryRecord>>>;
  /**  Delete a single AddressInjection item by ID.  */
  deleteAddressInjection?: Maybe<AddressInjection>;
  /**  Delete a single AddressInjectionHistoryRecord item by ID.  */
  deleteAddressInjectionHistoryRecord?: Maybe<AddressInjectionHistoryRecord>;
  /**  Delete multiple AddressInjectionHistoryRecord items by ID.  */
  deleteAddressInjectionHistoryRecords?: Maybe<Array<Maybe<AddressInjectionHistoryRecord>>>;
  /**  Delete multiple AddressInjection items by ID.  */
  deleteAddressInjections?: Maybe<Array<Maybe<AddressInjection>>>;
  /**  Delete a single AddressSource item by ID.  */
  deleteAddressSource?: Maybe<AddressSource>;
  /**  Delete a single AddressSourceHistoryRecord item by ID.  */
  deleteAddressSourceHistoryRecord?: Maybe<AddressSourceHistoryRecord>;
  /**  Delete multiple AddressSourceHistoryRecord items by ID.  */
  deleteAddressSourceHistoryRecords?: Maybe<Array<Maybe<AddressSourceHistoryRecord>>>;
  /**  Delete multiple AddressSource items by ID.  */
  deleteAddressSources?: Maybe<Array<Maybe<AddressSource>>>;
  /**  Delete multiple Address items by ID.  */
  deleteAddresses?: Maybe<Array<Maybe<Address>>>;
  /**  Delete a single User item by ID.  */
  deleteUser?: Maybe<User>;
  /**  Delete a single UserHistoryRecord item by ID.  */
  deleteUserHistoryRecord?: Maybe<UserHistoryRecord>;
  /**  Delete multiple UserHistoryRecord items by ID.  */
  deleteUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
  /**  Delete multiple User items by ID.  */
  deleteUsers?: Maybe<Array<Maybe<User>>>;
  resolveAddressDuplicate?: Maybe<ResolveAddressDuplicateOutput>;
  unauthenticateUser?: Maybe<UnauthenticateUserOutput>;
  /**  Update a single Address item by ID.  */
  updateAddress?: Maybe<Address>;
  /**  Update a single AddressHeuristic item by ID.  */
  updateAddressHeuristic?: Maybe<AddressHeuristic>;
  /**  Update a single AddressHeuristicHistoryRecord item by ID.  */
  updateAddressHeuristicHistoryRecord?: Maybe<AddressHeuristicHistoryRecord>;
  /**  Update multiple AddressHeuristicHistoryRecord items by ID.  */
  updateAddressHeuristicHistoryRecords?: Maybe<Array<Maybe<AddressHeuristicHistoryRecord>>>;
  /**  Update multiple AddressHeuristic items by ID.  */
  updateAddressHeuristics?: Maybe<Array<Maybe<AddressHeuristic>>>;
  /**  Update a single AddressHistoryRecord item by ID.  */
  updateAddressHistoryRecord?: Maybe<AddressHistoryRecord>;
  /**  Update multiple AddressHistoryRecord items by ID.  */
  updateAddressHistoryRecords?: Maybe<Array<Maybe<AddressHistoryRecord>>>;
  /**  Update a single AddressInjection item by ID.  */
  updateAddressInjection?: Maybe<AddressInjection>;
  /**  Update a single AddressInjectionHistoryRecord item by ID.  */
  updateAddressInjectionHistoryRecord?: Maybe<AddressInjectionHistoryRecord>;
  /**  Update multiple AddressInjectionHistoryRecord items by ID.  */
  updateAddressInjectionHistoryRecords?: Maybe<Array<Maybe<AddressInjectionHistoryRecord>>>;
  /**  Update multiple AddressInjection items by ID.  */
  updateAddressInjections?: Maybe<Array<Maybe<AddressInjection>>>;
  /**  Update a single AddressSource item by ID.  */
  updateAddressSource?: Maybe<AddressSource>;
  /**  Update a single AddressSourceHistoryRecord item by ID.  */
  updateAddressSourceHistoryRecord?: Maybe<AddressSourceHistoryRecord>;
  /**  Update multiple AddressSourceHistoryRecord items by ID.  */
  updateAddressSourceHistoryRecords?: Maybe<Array<Maybe<AddressSourceHistoryRecord>>>;
  /**  Update multiple AddressSource items by ID.  */
  updateAddressSources?: Maybe<Array<Maybe<AddressSource>>>;
  /**  Update multiple Address items by ID.  */
  updateAddresses?: Maybe<Array<Maybe<Address>>>;
  updateAuthenticatedUser?: Maybe<User>;
  /**  Update a single User item by ID.  */
  updateUser?: Maybe<User>;
  /**  Update a single UserHistoryRecord item by ID.  */
  updateUserHistoryRecord?: Maybe<UserHistoryRecord>;
  /**  Update multiple UserHistoryRecord items by ID.  */
  updateUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
  /**  Update multiple User items by ID.  */
  updateUsers?: Maybe<Array<Maybe<User>>>;
};


export type MutationActualizeAddressesArgs = {
  data: ActualizeAddressesInput;
};


export type MutationAuthenticateUserWithPasswordArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateAddressArgs = {
  data?: InputMaybe<AddressCreateInput>;
};


export type MutationCreateAddressHeuristicArgs = {
  data?: InputMaybe<AddressHeuristicCreateInput>;
};


export type MutationCreateAddressHeuristicHistoryRecordArgs = {
  data?: InputMaybe<AddressHeuristicHistoryRecordCreateInput>;
};


export type MutationCreateAddressHeuristicHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressHeuristicHistoryRecordsCreateInput>>>;
};


export type MutationCreateAddressHeuristicsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressHeuristicsCreateInput>>>;
};


export type MutationCreateAddressHistoryRecordArgs = {
  data?: InputMaybe<AddressHistoryRecordCreateInput>;
};


export type MutationCreateAddressHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressHistoryRecordsCreateInput>>>;
};


export type MutationCreateAddressInjectionArgs = {
  data?: InputMaybe<AddressInjectionCreateInput>;
};


export type MutationCreateAddressInjectionHistoryRecordArgs = {
  data?: InputMaybe<AddressInjectionHistoryRecordCreateInput>;
};


export type MutationCreateAddressInjectionHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressInjectionHistoryRecordsCreateInput>>>;
};


export type MutationCreateAddressInjectionsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressInjectionsCreateInput>>>;
};


export type MutationCreateAddressSourceArgs = {
  data?: InputMaybe<AddressSourceCreateInput>;
};


export type MutationCreateAddressSourceHistoryRecordArgs = {
  data?: InputMaybe<AddressSourceHistoryRecordCreateInput>;
};


export type MutationCreateAddressSourceHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressSourceHistoryRecordsCreateInput>>>;
};


export type MutationCreateAddressSourcesArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressSourcesCreateInput>>>;
};


export type MutationCreateAddressesArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressesCreateInput>>>;
};


export type MutationCreateUserArgs = {
  data?: InputMaybe<UserCreateInput>;
};


export type MutationCreateUserHistoryRecordArgs = {
  data?: InputMaybe<UserHistoryRecordCreateInput>;
};


export type MutationCreateUserHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<UserHistoryRecordsCreateInput>>>;
};


export type MutationCreateUsersArgs = {
  data?: InputMaybe<Array<InputMaybe<UsersCreateInput>>>;
};


export type MutationDeleteAddressArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAddressHeuristicArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAddressHeuristicHistoryRecordArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAddressHeuristicHistoryRecordsArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationDeleteAddressHeuristicsArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationDeleteAddressHistoryRecordArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAddressHistoryRecordsArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationDeleteAddressInjectionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAddressInjectionHistoryRecordArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAddressInjectionHistoryRecordsArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationDeleteAddressInjectionsArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationDeleteAddressSourceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAddressSourceHistoryRecordArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAddressSourceHistoryRecordsArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationDeleteAddressSourcesArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationDeleteAddressesArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserHistoryRecordArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserHistoryRecordsArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationDeleteUsersArgs = {
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationResolveAddressDuplicateArgs = {
  data: ResolveAddressDuplicateInput;
};


export type MutationUpdateAddressArgs = {
  data?: InputMaybe<AddressUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressHeuristicArgs = {
  data?: InputMaybe<AddressHeuristicUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressHeuristicHistoryRecordArgs = {
  data?: InputMaybe<AddressHeuristicHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressHeuristicHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressHeuristicHistoryRecordsUpdateInput>>>;
};


export type MutationUpdateAddressHeuristicsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressHeuristicsUpdateInput>>>;
};


export type MutationUpdateAddressHistoryRecordArgs = {
  data?: InputMaybe<AddressHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressHistoryRecordsUpdateInput>>>;
};


export type MutationUpdateAddressInjectionArgs = {
  data?: InputMaybe<AddressInjectionUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressInjectionHistoryRecordArgs = {
  data?: InputMaybe<AddressInjectionHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressInjectionHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressInjectionHistoryRecordsUpdateInput>>>;
};


export type MutationUpdateAddressInjectionsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressInjectionsUpdateInput>>>;
};


export type MutationUpdateAddressSourceArgs = {
  data?: InputMaybe<AddressSourceUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressSourceHistoryRecordArgs = {
  data?: InputMaybe<AddressSourceHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAddressSourceHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressSourceHistoryRecordsUpdateInput>>>;
};


export type MutationUpdateAddressSourcesArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressSourcesUpdateInput>>>;
};


export type MutationUpdateAddressesArgs = {
  data?: InputMaybe<Array<InputMaybe<AddressesUpdateInput>>>;
};


export type MutationUpdateAuthenticatedUserArgs = {
  data?: InputMaybe<UserUpdateInput>;
};


export type MutationUpdateUserArgs = {
  data?: InputMaybe<UserUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateUserHistoryRecordArgs = {
  data?: InputMaybe<UserHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateUserHistoryRecordsArgs = {
  data?: InputMaybe<Array<InputMaybe<UserHistoryRecordsUpdateInput>>>;
};


export type MutationUpdateUsersArgs = {
  data?: InputMaybe<Array<InputMaybe<UsersUpdateInput>>>;
};

export type Query = {
  __typename?: 'Query';
  /**  Search for the Address item with the matching ID.  */
  Address?: Maybe<Address>;
  /**  Search for the AddressHeuristic item with the matching ID.  */
  AddressHeuristic?: Maybe<AddressHeuristic>;
  /**  Search for the AddressHeuristicHistoryRecord item with the matching ID.  */
  AddressHeuristicHistoryRecord?: Maybe<AddressHeuristicHistoryRecord>;
  /**  Search for the AddressHistoryRecord item with the matching ID.  */
  AddressHistoryRecord?: Maybe<AddressHistoryRecord>;
  /**  Search for the AddressInjection item with the matching ID.  */
  AddressInjection?: Maybe<AddressInjection>;
  /**  Search for the AddressInjectionHistoryRecord item with the matching ID.  */
  AddressInjectionHistoryRecord?: Maybe<AddressInjectionHistoryRecord>;
  /**  Search for the AddressSource item with the matching ID.  */
  AddressSource?: Maybe<AddressSource>;
  /**  Search for the AddressSourceHistoryRecord item with the matching ID.  */
  AddressSourceHistoryRecord?: Maybe<AddressSourceHistoryRecord>;
  /**  Search for the User item with the matching ID.  */
  User?: Maybe<User>;
  /**  Search for the UserHistoryRecord item with the matching ID.  */
  UserHistoryRecord?: Maybe<UserHistoryRecord>;
  /**  Retrieve the meta-data for the AddressHeuristicHistoryRecord list.  */
  _AddressHeuristicHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for the AddressHeuristic list.  */
  _AddressHeuristicsMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for the AddressHistoryRecord list.  */
  _AddressHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for the AddressInjectionHistoryRecord list.  */
  _AddressInjectionHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for the AddressInjection list.  */
  _AddressInjectionsMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for the AddressSourceHistoryRecord list.  */
  _AddressSourceHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for the AddressSource list.  */
  _AddressSourcesMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for the Address list.  */
  _AddressesMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for the UserHistoryRecord list.  */
  _UserHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for the User list.  */
  _UsersMeta?: Maybe<_ListMeta>;
  /**  Perform a meta-query on all AddressHeuristicHistoryRecord items which match the where clause.  */
  _allAddressHeuristicHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Perform a meta-query on all AddressHeuristic items which match the where clause.  */
  _allAddressHeuristicsMeta?: Maybe<_QueryMeta>;
  /**  Perform a meta-query on all AddressHistoryRecord items which match the where clause.  */
  _allAddressHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Perform a meta-query on all AddressInjectionHistoryRecord items which match the where clause.  */
  _allAddressInjectionHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Perform a meta-query on all AddressInjection items which match the where clause.  */
  _allAddressInjectionsMeta?: Maybe<_QueryMeta>;
  /**  Perform a meta-query on all AddressSourceHistoryRecord items which match the where clause.  */
  _allAddressSourceHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Perform a meta-query on all AddressSource items which match the where clause.  */
  _allAddressSourcesMeta?: Maybe<_QueryMeta>;
  /**  Perform a meta-query on all Address items which match the where clause.  */
  _allAddressesMeta?: Maybe<_QueryMeta>;
  /**  Perform a meta-query on all UserHistoryRecord items which match the where clause.  */
  _allUserHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Perform a meta-query on all User items which match the where clause.  */
  _allUsersMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for all lists.  */
  _ksListsMeta?: Maybe<Array<Maybe<_ListMeta>>>;
  /**  Search for all AddressHeuristicHistoryRecord items which match the where clause.  */
  allAddressHeuristicHistoryRecords?: Maybe<Array<Maybe<AddressHeuristicHistoryRecord>>>;
  /**  Search for all AddressHeuristic items which match the where clause.  */
  allAddressHeuristics?: Maybe<Array<Maybe<AddressHeuristic>>>;
  /**  Search for all AddressHistoryRecord items which match the where clause.  */
  allAddressHistoryRecords?: Maybe<Array<Maybe<AddressHistoryRecord>>>;
  /**  Search for all AddressInjectionHistoryRecord items which match the where clause.  */
  allAddressInjectionHistoryRecords?: Maybe<Array<Maybe<AddressInjectionHistoryRecord>>>;
  /**  Search for all AddressInjection items which match the where clause.  */
  allAddressInjections?: Maybe<Array<Maybe<AddressInjection>>>;
  /**  Search for all AddressSourceHistoryRecord items which match the where clause.  */
  allAddressSourceHistoryRecords?: Maybe<Array<Maybe<AddressSourceHistoryRecord>>>;
  /**  Search for all AddressSource items which match the where clause.  */
  allAddressSources?: Maybe<Array<Maybe<AddressSource>>>;
  /**  Search for all Address items which match the where clause.  */
  allAddresses?: Maybe<Array<Maybe<Address>>>;
  /**  Search for all UserHistoryRecord items which match the where clause.  */
  allUserHistoryRecords?: Maybe<Array<Maybe<UserHistoryRecord>>>;
  /**  Search for all User items which match the where clause.  */
  allUsers?: Maybe<Array<Maybe<User>>>;
  /** The version of the Keystone application serving this API. */
  appVersion?: Maybe<Scalars['String']['output']>;
  authenticatedUser?: Maybe<User>;
};


export type QueryAddressArgs = {
  where: AddressWhereUniqueInput;
};


export type QueryAddressHeuristicArgs = {
  where: AddressHeuristicWhereUniqueInput;
};


export type QueryAddressHeuristicHistoryRecordArgs = {
  where: AddressHeuristicHistoryRecordWhereUniqueInput;
};


export type QueryAddressHistoryRecordArgs = {
  where: AddressHistoryRecordWhereUniqueInput;
};


export type QueryAddressInjectionArgs = {
  where: AddressInjectionWhereUniqueInput;
};


export type QueryAddressInjectionHistoryRecordArgs = {
  where: AddressInjectionHistoryRecordWhereUniqueInput;
};


export type QueryAddressSourceArgs = {
  where: AddressSourceWhereUniqueInput;
};


export type QueryAddressSourceHistoryRecordArgs = {
  where: AddressSourceHistoryRecordWhereUniqueInput;
};


export type QueryUserArgs = {
  where: UserWhereUniqueInput;
};


export type QueryUserHistoryRecordArgs = {
  where: UserHistoryRecordWhereUniqueInput;
};


export type Query_AllAddressHeuristicHistoryRecordsMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressHeuristicHistoryRecordsBy>>;
  where?: InputMaybe<AddressHeuristicHistoryRecordWhereInput>;
};


export type Query_AllAddressHeuristicsMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressHeuristicsBy>>;
  where?: InputMaybe<AddressHeuristicWhereInput>;
};


export type Query_AllAddressHistoryRecordsMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressHistoryRecordsBy>>;
  where?: InputMaybe<AddressHistoryRecordWhereInput>;
};


export type Query_AllAddressInjectionHistoryRecordsMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressInjectionHistoryRecordsBy>>;
  where?: InputMaybe<AddressInjectionHistoryRecordWhereInput>;
};


export type Query_AllAddressInjectionsMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressInjectionsBy>>;
  where?: InputMaybe<AddressInjectionWhereInput>;
};


export type Query_AllAddressSourceHistoryRecordsMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressSourceHistoryRecordsBy>>;
  where?: InputMaybe<AddressSourceHistoryRecordWhereInput>;
};


export type Query_AllAddressSourcesMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressSourcesBy>>;
  where?: InputMaybe<AddressSourceWhereInput>;
};


export type Query_AllAddressesMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressesBy>>;
  where?: InputMaybe<AddressWhereInput>;
};


export type Query_AllUserHistoryRecordsMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortUserHistoryRecordsBy>>;
  where?: InputMaybe<UserHistoryRecordWhereInput>;
};


export type Query_AllUsersMetaArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortUsersBy>>;
  where?: InputMaybe<UserWhereInput>;
};


export type Query_KsListsMetaArgs = {
  where?: InputMaybe<_KsListsMetaInput>;
};


export type QueryAllAddressHeuristicHistoryRecordsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressHeuristicHistoryRecordsBy>>;
  where?: InputMaybe<AddressHeuristicHistoryRecordWhereInput>;
};


export type QueryAllAddressHeuristicsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressHeuristicsBy>>;
  where?: InputMaybe<AddressHeuristicWhereInput>;
};


export type QueryAllAddressHistoryRecordsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressHistoryRecordsBy>>;
  where?: InputMaybe<AddressHistoryRecordWhereInput>;
};


export type QueryAllAddressInjectionHistoryRecordsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressInjectionHistoryRecordsBy>>;
  where?: InputMaybe<AddressInjectionHistoryRecordWhereInput>;
};


export type QueryAllAddressInjectionsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressInjectionsBy>>;
  where?: InputMaybe<AddressInjectionWhereInput>;
};


export type QueryAllAddressSourceHistoryRecordsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressSourceHistoryRecordsBy>>;
  where?: InputMaybe<AddressSourceHistoryRecordWhereInput>;
};


export type QueryAllAddressSourcesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressSourcesBy>>;
  where?: InputMaybe<AddressSourceWhereInput>;
};


export type QueryAllAddressesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortAddressesBy>>;
  where?: InputMaybe<AddressWhereInput>;
};


export type QueryAllUserHistoryRecordsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortUserHistoryRecordsBy>>;
  where?: InputMaybe<UserHistoryRecordWhereInput>;
};


export type QueryAllUsersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Array<SortUsersBy>>;
  where?: InputMaybe<UserWhereInput>;
};

export type ResolveAddressDuplicateInput = {
  action: Scalars['String']['input'];
  addressId: Scalars['ID']['input'];
  dv: Scalars['Int']['input'];
  sender: SenderFieldInput;
  winnerId?: InputMaybe<Scalars['ID']['input']>;
};

export type ResolveAddressDuplicateOutput = {
  __typename?: 'ResolveAddressDuplicateOutput';
  status: Scalars['String']['output'];
};

export type SenderField = {
  __typename?: 'SenderField';
  dv: Scalars['Int']['output'];
  fingerprint: Scalars['String']['output'];
};

export type SenderFieldInput = {
  dv: Scalars['Int']['input'];
  fingerprint: Scalars['String']['input'];
};

export enum SortAddressHeuristicHistoryRecordsBy {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  EnabledAsc = 'enabled_ASC',
  EnabledDesc = 'enabled_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC',
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  LatitudeAsc = 'latitude_ASC',
  LatitudeDesc = 'latitude_DESC',
  LongitudeAsc = 'longitude_ASC',
  LongitudeDesc = 'longitude_DESC',
  ProviderAsc = 'provider_ASC',
  ProviderDesc = 'provider_DESC',
  ReliabilityAsc = 'reliability_ASC',
  ReliabilityDesc = 'reliability_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC',
  ValueAsc = 'value_ASC',
  ValueDesc = 'value_DESC'
}

export enum SortAddressHeuristicsBy {
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  CreatedByAsc = 'createdBy_ASC',
  CreatedByDesc = 'createdBy_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  EnabledAsc = 'enabled_ASC',
  EnabledDesc = 'enabled_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  LatitudeAsc = 'latitude_ASC',
  LatitudeDesc = 'latitude_DESC',
  LongitudeAsc = 'longitude_ASC',
  LongitudeDesc = 'longitude_DESC',
  ProviderAsc = 'provider_ASC',
  ProviderDesc = 'provider_DESC',
  ReliabilityAsc = 'reliability_ASC',
  ReliabilityDesc = 'reliability_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  UpdatedByAsc = 'updatedBy_ASC',
  UpdatedByDesc = 'updatedBy_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC',
  ValueAsc = 'value_ASC',
  ValueDesc = 'value_DESC'
}

export enum SortAddressHistoryRecordsBy {
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
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
  KeyAsc = 'key_ASC',
  KeyDesc = 'key_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC'
}

export enum SortAddressInjectionHistoryRecordsBy {
  CountryAsc = 'country_ASC',
  CountryDesc = 'country_DESC',
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
  KeywordsAsc = 'keywords_ASC',
  KeywordsDesc = 'keywords_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC'
}

export enum SortAddressInjectionsBy {
  CountryAsc = 'country_ASC',
  CountryDesc = 'country_DESC',
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
  KeywordsAsc = 'keywords_ASC',
  KeywordsDesc = 'keywords_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  UpdatedByAsc = 'updatedBy_ASC',
  UpdatedByDesc = 'updatedBy_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC'
}

export enum SortAddressSourceHistoryRecordsBy {
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
  SourceAsc = 'source_ASC',
  SourceDesc = 'source_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC'
}

export enum SortAddressSourcesBy {
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
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
  SourceAsc = 'source_ASC',
  SourceDesc = 'source_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  UpdatedByAsc = 'updatedBy_ASC',
  UpdatedByDesc = 'updatedBy_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC'
}

export enum SortAddressesBy {
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
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
  KeyAsc = 'key_ASC',
  KeyDesc = 'key_DESC',
  PossibleDuplicateOfAsc = 'possibleDuplicateOf_ASC',
  PossibleDuplicateOfDesc = 'possibleDuplicateOf_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  UpdatedByAsc = 'updatedBy_ASC',
  UpdatedByDesc = 'updatedBy_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC'
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
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC'
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
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  UpdatedByAsc = 'updatedBy_ASC',
  UpdatedByDesc = 'updatedBy_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC'
}

/**  Users authorized by oidc auth  */
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
  /**  The user's email  */
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /**  Whether the user admin or not  */
  isAdmin?: Maybe<Scalars['Boolean']['output']>;
  /**  Whether the user support or not  */
  isSupport?: Maybe<Scalars['Boolean']['output']>;
  /**  The user's name  */
  name?: Maybe<Scalars['String']['output']>;
  newId?: Maybe<Scalars['String']['output']>;
  /**  The user's password  */
  password_is_set?: Maybe<Scalars['Boolean']['output']>;
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  /**  Identifies a user, which has updated this record. It is a technical connection, that can represent real users, as well as automated systems (bots, scripts). This field should not participate in business logic.  */
  updatedBy?: Maybe<User>;
  v?: Maybe<Scalars['Int']['output']>;
};

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
  sender?: InputMaybe<SenderFieldInput>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
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
  sender?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
  v?: Maybe<Scalars['Int']['output']>;
};

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
  sender?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

export enum UserHistoryRecordHistoryActionType {
  C = 'c',
  D = 'd',
  U = 'u'
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
  sender?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<Scalars['String']['input']>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

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
};

export type UserHistoryRecordWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type UserHistoryRecordsCreateInput = {
  data?: InputMaybe<UserHistoryRecordCreateInput>;
};

export type UserHistoryRecordsUpdateInput = {
  data?: InputMaybe<UserHistoryRecordUpdateInput>;
  id: Scalars['ID']['input'];
};

export type UserRelateToOneInput = {
  connect?: InputMaybe<UserWhereUniqueInput>;
  create?: InputMaybe<UserCreateInput>;
  disconnect?: InputMaybe<UserWhereUniqueInput>;
  disconnectAll?: InputMaybe<Scalars['Boolean']['input']>;
};

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
  sender?: InputMaybe<SenderFieldInput>;
  updatedAt?: InputMaybe<Scalars['String']['input']>;
  updatedBy?: InputMaybe<UserRelateToOneInput>;
  v?: InputMaybe<Scalars['Int']['input']>;
};

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
};

export type UserWhereUniqueInput = {
  id: Scalars['ID']['input'];
};

export type UsersCreateInput = {
  data?: InputMaybe<UserCreateInput>;
};

export type UsersUpdateInput = {
  data?: InputMaybe<UserUpdateInput>;
  id: Scalars['ID']['input'];
};

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
};

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
};

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
};

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
};

export type _ListQueries = {
  __typename?: '_ListQueries';
  /** Single-item query name */
  item?: Maybe<Scalars['String']['output']>;
  /** All-items query name */
  list?: Maybe<Scalars['String']['output']>;
  /** List metadata query name */
  meta?: Maybe<Scalars['String']['output']>;
};

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
};


export type _ListSchemaFieldsArgs = {
  where?: InputMaybe<_ListSchemaFieldsInput>;
};

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
};

export type _ListSchemaFieldsInput = {
  type?: InputMaybe<Scalars['String']['input']>;
};

export type _ListSchemaRelatedFields = {
  __typename?: '_ListSchemaRelatedFields';
  /** A list of GraphQL field names */
  fields?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The typename as used in GraphQL queries */
  type?: Maybe<Scalars['String']['output']>;
};

export type _QueryMeta = {
  __typename?: '_QueryMeta';
  count?: Maybe<Scalars['Int']['output']>;
};

export type _KsListsMetaInput = {
  /** Whether this is an auxiliary helper list */
  auxiliary?: InputMaybe<Scalars['Boolean']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
};

export type AuthenticateUserOutput = {
  __typename?: 'authenticateUserOutput';
  /**  Retrieve information on the newly authenticated User here.  */
  item?: Maybe<User>;
  /**  Used to make subsequent authenticated requests by setting this token in a header: 'Authorization: Bearer <token>'.  */
  token?: Maybe<Scalars['String']['output']>;
};

export type UnauthenticateUserOutput = {
  __typename?: 'unauthenticateUserOutput';
  /**
   * `true` when unauthentication succeeds.
   * NOTE: unauthentication always succeeds when the request has an invalid or missing authentication token.
   */
  success?: Maybe<Scalars['Boolean']['output']>;
};
