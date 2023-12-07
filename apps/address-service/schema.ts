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
  _label_?: Maybe<Scalars['String']>;
  /**  The normalized address itself in one string  */
  address?: Maybe<Scalars['String']>;
  /**  The unique key of the address  */
  key?: Maybe<Scalars['String']>;
  /**  Some additional data for building  */
  meta?: Maybe<Scalars['JSON']>;
  /**  The list of overrides for address meta.data field  */
  overrides?: Maybe<Scalars['JSON']>;
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
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
};

export type AddressCreateInput = {
  address?: Maybe<Scalars['String']>;
  key?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  overrides?: Maybe<Scalars['JSON']>;
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
export type AddressHistoryRecord = {
  __typename?: 'AddressHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the AddressHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  key?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  overrides?: Maybe<Scalars['JSON']>;
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
  history_action?: Maybe<AddressHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type AddressHistoryRecordCreateInput = {
  address?: Maybe<Scalars['String']>;
  key?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  overrides?: Maybe<Scalars['JSON']>;
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
  history_action?: Maybe<AddressHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum AddressHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type AddressHistoryRecordUpdateInput = {
  address?: Maybe<Scalars['String']>;
  key?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  overrides?: Maybe<Scalars['JSON']>;
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
  history_action?: Maybe<AddressHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type AddressHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<AddressHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<AddressHistoryRecordWhereInput>>>;
  address?: Maybe<Scalars['String']>;
  address_not?: Maybe<Scalars['String']>;
  address_contains?: Maybe<Scalars['String']>;
  address_not_contains?: Maybe<Scalars['String']>;
  address_starts_with?: Maybe<Scalars['String']>;
  address_not_starts_with?: Maybe<Scalars['String']>;
  address_ends_with?: Maybe<Scalars['String']>;
  address_not_ends_with?: Maybe<Scalars['String']>;
  address_i?: Maybe<Scalars['String']>;
  address_not_i?: Maybe<Scalars['String']>;
  address_contains_i?: Maybe<Scalars['String']>;
  address_not_contains_i?: Maybe<Scalars['String']>;
  address_starts_with_i?: Maybe<Scalars['String']>;
  address_not_starts_with_i?: Maybe<Scalars['String']>;
  address_ends_with_i?: Maybe<Scalars['String']>;
  address_not_ends_with_i?: Maybe<Scalars['String']>;
  address_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  address_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  key?: Maybe<Scalars['String']>;
  key_not?: Maybe<Scalars['String']>;
  key_contains?: Maybe<Scalars['String']>;
  key_not_contains?: Maybe<Scalars['String']>;
  key_starts_with?: Maybe<Scalars['String']>;
  key_not_starts_with?: Maybe<Scalars['String']>;
  key_ends_with?: Maybe<Scalars['String']>;
  key_not_ends_with?: Maybe<Scalars['String']>;
  key_i?: Maybe<Scalars['String']>;
  key_not_i?: Maybe<Scalars['String']>;
  key_contains_i?: Maybe<Scalars['String']>;
  key_not_contains_i?: Maybe<Scalars['String']>;
  key_starts_with_i?: Maybe<Scalars['String']>;
  key_not_starts_with_i?: Maybe<Scalars['String']>;
  key_ends_with_i?: Maybe<Scalars['String']>;
  key_not_ends_with_i?: Maybe<Scalars['String']>;
  key_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  key_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  overrides?: Maybe<Scalars['JSON']>;
  overrides_not?: Maybe<Scalars['JSON']>;
  overrides_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  overrides_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  history_action?: Maybe<AddressHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<AddressHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<AddressHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<AddressHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type AddressHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type AddressHistoryRecordsCreateInput = {
  data?: Maybe<AddressHistoryRecordCreateInput>;
};

export type AddressHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<AddressHistoryRecordUpdateInput>;
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
  _label_?: Maybe<Scalars['String']>;
  /**  The country  */
  country?: Maybe<Scalars['String']>;
  /**  The region  */
  region?: Maybe<Scalars['JSON']>;
  /**  Some area  */
  area?: Maybe<Scalars['JSON']>;
  /**  The city name  */
  city?: Maybe<Scalars['JSON']>;
  /**  The district within the city name  */
  cityDistrict?: Maybe<Scalars['JSON']>;
  /**  The settlement name  */
  settlement?: Maybe<Scalars['JSON']>;
  /**  The street name itself  */
  street?: Maybe<Scalars['JSON']>;
  /**  The number of the building  */
  house?: Maybe<Scalars['JSON']>;
  /**  Some part of the building  */
  block?: Maybe<Scalars['JSON']>;
  /**  The autogenerated keywords for searching  */
  keywords?: Maybe<Scalars['String']>;
  /**  Additional data  */
  meta?: Maybe<Scalars['JSON']>;
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
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
};

export type AddressInjectionCreateInput = {
  country?: Maybe<Scalars['String']>;
  region?: Maybe<Scalars['JSON']>;
  area?: Maybe<Scalars['JSON']>;
  city?: Maybe<Scalars['JSON']>;
  cityDistrict?: Maybe<Scalars['JSON']>;
  settlement?: Maybe<Scalars['JSON']>;
  street?: Maybe<Scalars['JSON']>;
  house?: Maybe<Scalars['JSON']>;
  block?: Maybe<Scalars['JSON']>;
  keywords?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
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
export type AddressInjectionHistoryRecord = {
  __typename?: 'AddressInjectionHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressInjectionHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressInjectionHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the AddressInjectionHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressInjectionHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  country?: Maybe<Scalars['String']>;
  region?: Maybe<Scalars['JSON']>;
  area?: Maybe<Scalars['JSON']>;
  city?: Maybe<Scalars['JSON']>;
  cityDistrict?: Maybe<Scalars['JSON']>;
  settlement?: Maybe<Scalars['JSON']>;
  street?: Maybe<Scalars['JSON']>;
  house?: Maybe<Scalars['JSON']>;
  block?: Maybe<Scalars['JSON']>;
  keywords?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
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
  history_action?: Maybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type AddressInjectionHistoryRecordCreateInput = {
  country?: Maybe<Scalars['String']>;
  region?: Maybe<Scalars['JSON']>;
  area?: Maybe<Scalars['JSON']>;
  city?: Maybe<Scalars['JSON']>;
  cityDistrict?: Maybe<Scalars['JSON']>;
  settlement?: Maybe<Scalars['JSON']>;
  street?: Maybe<Scalars['JSON']>;
  house?: Maybe<Scalars['JSON']>;
  block?: Maybe<Scalars['JSON']>;
  keywords?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
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
  history_action?: Maybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum AddressInjectionHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type AddressInjectionHistoryRecordUpdateInput = {
  country?: Maybe<Scalars['String']>;
  region?: Maybe<Scalars['JSON']>;
  area?: Maybe<Scalars['JSON']>;
  city?: Maybe<Scalars['JSON']>;
  cityDistrict?: Maybe<Scalars['JSON']>;
  settlement?: Maybe<Scalars['JSON']>;
  street?: Maybe<Scalars['JSON']>;
  house?: Maybe<Scalars['JSON']>;
  block?: Maybe<Scalars['JSON']>;
  keywords?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
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
  history_action?: Maybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type AddressInjectionHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<AddressInjectionHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<AddressInjectionHistoryRecordWhereInput>>>;
  country?: Maybe<Scalars['String']>;
  country_not?: Maybe<Scalars['String']>;
  country_contains?: Maybe<Scalars['String']>;
  country_not_contains?: Maybe<Scalars['String']>;
  country_starts_with?: Maybe<Scalars['String']>;
  country_not_starts_with?: Maybe<Scalars['String']>;
  country_ends_with?: Maybe<Scalars['String']>;
  country_not_ends_with?: Maybe<Scalars['String']>;
  country_i?: Maybe<Scalars['String']>;
  country_not_i?: Maybe<Scalars['String']>;
  country_contains_i?: Maybe<Scalars['String']>;
  country_not_contains_i?: Maybe<Scalars['String']>;
  country_starts_with_i?: Maybe<Scalars['String']>;
  country_not_starts_with_i?: Maybe<Scalars['String']>;
  country_ends_with_i?: Maybe<Scalars['String']>;
  country_not_ends_with_i?: Maybe<Scalars['String']>;
  country_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  country_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  region?: Maybe<Scalars['JSON']>;
  region_not?: Maybe<Scalars['JSON']>;
  region_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  region_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  area?: Maybe<Scalars['JSON']>;
  area_not?: Maybe<Scalars['JSON']>;
  area_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  area_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  city?: Maybe<Scalars['JSON']>;
  city_not?: Maybe<Scalars['JSON']>;
  city_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  city_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  cityDistrict?: Maybe<Scalars['JSON']>;
  cityDistrict_not?: Maybe<Scalars['JSON']>;
  cityDistrict_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  cityDistrict_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  settlement?: Maybe<Scalars['JSON']>;
  settlement_not?: Maybe<Scalars['JSON']>;
  settlement_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  settlement_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  street?: Maybe<Scalars['JSON']>;
  street_not?: Maybe<Scalars['JSON']>;
  street_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  street_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  house?: Maybe<Scalars['JSON']>;
  house_not?: Maybe<Scalars['JSON']>;
  house_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  house_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  block?: Maybe<Scalars['JSON']>;
  block_not?: Maybe<Scalars['JSON']>;
  block_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  block_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  keywords?: Maybe<Scalars['String']>;
  keywords_not?: Maybe<Scalars['String']>;
  keywords_contains?: Maybe<Scalars['String']>;
  keywords_not_contains?: Maybe<Scalars['String']>;
  keywords_starts_with?: Maybe<Scalars['String']>;
  keywords_not_starts_with?: Maybe<Scalars['String']>;
  keywords_ends_with?: Maybe<Scalars['String']>;
  keywords_not_ends_with?: Maybe<Scalars['String']>;
  keywords_i?: Maybe<Scalars['String']>;
  keywords_not_i?: Maybe<Scalars['String']>;
  keywords_contains_i?: Maybe<Scalars['String']>;
  keywords_not_contains_i?: Maybe<Scalars['String']>;
  keywords_starts_with_i?: Maybe<Scalars['String']>;
  keywords_not_starts_with_i?: Maybe<Scalars['String']>;
  keywords_ends_with_i?: Maybe<Scalars['String']>;
  keywords_not_ends_with_i?: Maybe<Scalars['String']>;
  keywords_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  keywords_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  history_action?: Maybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<AddressInjectionHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<AddressInjectionHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<AddressInjectionHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type AddressInjectionHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type AddressInjectionHistoryRecordsCreateInput = {
  data?: Maybe<AddressInjectionHistoryRecordCreateInput>;
};

export type AddressInjectionHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<AddressInjectionHistoryRecordUpdateInput>;
};

export type AddressInjectionUpdateInput = {
  country?: Maybe<Scalars['String']>;
  region?: Maybe<Scalars['JSON']>;
  area?: Maybe<Scalars['JSON']>;
  city?: Maybe<Scalars['JSON']>;
  cityDistrict?: Maybe<Scalars['JSON']>;
  settlement?: Maybe<Scalars['JSON']>;
  street?: Maybe<Scalars['JSON']>;
  house?: Maybe<Scalars['JSON']>;
  block?: Maybe<Scalars['JSON']>;
  keywords?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
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

export type AddressInjectionWhereInput = {
  AND?: Maybe<Array<Maybe<AddressInjectionWhereInput>>>;
  OR?: Maybe<Array<Maybe<AddressInjectionWhereInput>>>;
  country?: Maybe<Scalars['String']>;
  country_not?: Maybe<Scalars['String']>;
  country_contains?: Maybe<Scalars['String']>;
  country_not_contains?: Maybe<Scalars['String']>;
  country_starts_with?: Maybe<Scalars['String']>;
  country_not_starts_with?: Maybe<Scalars['String']>;
  country_ends_with?: Maybe<Scalars['String']>;
  country_not_ends_with?: Maybe<Scalars['String']>;
  country_i?: Maybe<Scalars['String']>;
  country_not_i?: Maybe<Scalars['String']>;
  country_contains_i?: Maybe<Scalars['String']>;
  country_not_contains_i?: Maybe<Scalars['String']>;
  country_starts_with_i?: Maybe<Scalars['String']>;
  country_not_starts_with_i?: Maybe<Scalars['String']>;
  country_ends_with_i?: Maybe<Scalars['String']>;
  country_not_ends_with_i?: Maybe<Scalars['String']>;
  country_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  country_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  region?: Maybe<Scalars['JSON']>;
  region_not?: Maybe<Scalars['JSON']>;
  region_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  region_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  area?: Maybe<Scalars['JSON']>;
  area_not?: Maybe<Scalars['JSON']>;
  area_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  area_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  city?: Maybe<Scalars['JSON']>;
  city_not?: Maybe<Scalars['JSON']>;
  city_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  city_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  cityDistrict?: Maybe<Scalars['JSON']>;
  cityDistrict_not?: Maybe<Scalars['JSON']>;
  cityDistrict_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  cityDistrict_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  settlement?: Maybe<Scalars['JSON']>;
  settlement_not?: Maybe<Scalars['JSON']>;
  settlement_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  settlement_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  street?: Maybe<Scalars['JSON']>;
  street_not?: Maybe<Scalars['JSON']>;
  street_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  street_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  house?: Maybe<Scalars['JSON']>;
  house_not?: Maybe<Scalars['JSON']>;
  house_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  house_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  block?: Maybe<Scalars['JSON']>;
  block_not?: Maybe<Scalars['JSON']>;
  block_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  block_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  keywords?: Maybe<Scalars['String']>;
  keywords_not?: Maybe<Scalars['String']>;
  keywords_contains?: Maybe<Scalars['String']>;
  keywords_not_contains?: Maybe<Scalars['String']>;
  keywords_starts_with?: Maybe<Scalars['String']>;
  keywords_not_starts_with?: Maybe<Scalars['String']>;
  keywords_ends_with?: Maybe<Scalars['String']>;
  keywords_not_ends_with?: Maybe<Scalars['String']>;
  keywords_i?: Maybe<Scalars['String']>;
  keywords_not_i?: Maybe<Scalars['String']>;
  keywords_contains_i?: Maybe<Scalars['String']>;
  keywords_not_contains_i?: Maybe<Scalars['String']>;
  keywords_starts_with_i?: Maybe<Scalars['String']>;
  keywords_not_starts_with_i?: Maybe<Scalars['String']>;
  keywords_ends_with_i?: Maybe<Scalars['String']>;
  keywords_not_ends_with_i?: Maybe<Scalars['String']>;
  keywords_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  keywords_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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

export type AddressInjectionWhereUniqueInput = {
  id: Scalars['ID'];
};

export type AddressInjectionsCreateInput = {
  data?: Maybe<AddressInjectionCreateInput>;
};

export type AddressInjectionsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<AddressInjectionUpdateInput>;
};

export type AddressRelateToOneInput = {
  create?: Maybe<AddressCreateInput>;
  connect?: Maybe<AddressWhereUniqueInput>;
  disconnect?: Maybe<AddressWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
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
  _label_?: Maybe<Scalars['String']>;
  /**  The string the address was found by (address origin)  */
  source?: Maybe<Scalars['String']>;
  /**  The address which was found by the source address  */
  address?: Maybe<Address>;
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
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
};

export type AddressSourceCreateInput = {
  source?: Maybe<Scalars['String']>;
  address?: Maybe<AddressRelateToOneInput>;
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
export type AddressSourceHistoryRecord = {
  __typename?: 'AddressSourceHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the AddressSourceHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the AddressSourceHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the AddressSourceHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the AddressSourceHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  source?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
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
  history_action?: Maybe<AddressSourceHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type AddressSourceHistoryRecordCreateInput = {
  source?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
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
  history_action?: Maybe<AddressSourceHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum AddressSourceHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type AddressSourceHistoryRecordUpdateInput = {
  source?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
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
  history_action?: Maybe<AddressSourceHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type AddressSourceHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<AddressSourceHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<AddressSourceHistoryRecordWhereInput>>>;
  source?: Maybe<Scalars['String']>;
  source_not?: Maybe<Scalars['String']>;
  source_contains?: Maybe<Scalars['String']>;
  source_not_contains?: Maybe<Scalars['String']>;
  source_starts_with?: Maybe<Scalars['String']>;
  source_not_starts_with?: Maybe<Scalars['String']>;
  source_ends_with?: Maybe<Scalars['String']>;
  source_not_ends_with?: Maybe<Scalars['String']>;
  source_i?: Maybe<Scalars['String']>;
  source_not_i?: Maybe<Scalars['String']>;
  source_contains_i?: Maybe<Scalars['String']>;
  source_not_contains_i?: Maybe<Scalars['String']>;
  source_starts_with_i?: Maybe<Scalars['String']>;
  source_not_starts_with_i?: Maybe<Scalars['String']>;
  source_ends_with_i?: Maybe<Scalars['String']>;
  source_not_ends_with_i?: Maybe<Scalars['String']>;
  source_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  source_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  address?: Maybe<Scalars['String']>;
  address_not?: Maybe<Scalars['String']>;
  address_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  address_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_action?: Maybe<AddressSourceHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<AddressSourceHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<AddressSourceHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<AddressSourceHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type AddressSourceHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type AddressSourceHistoryRecordsCreateInput = {
  data?: Maybe<AddressSourceHistoryRecordCreateInput>;
};

export type AddressSourceHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<AddressSourceHistoryRecordUpdateInput>;
};

export type AddressSourceUpdateInput = {
  source?: Maybe<Scalars['String']>;
  address?: Maybe<AddressRelateToOneInput>;
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

export type AddressSourceWhereInput = {
  AND?: Maybe<Array<Maybe<AddressSourceWhereInput>>>;
  OR?: Maybe<Array<Maybe<AddressSourceWhereInput>>>;
  source?: Maybe<Scalars['String']>;
  source_not?: Maybe<Scalars['String']>;
  source_contains?: Maybe<Scalars['String']>;
  source_not_contains?: Maybe<Scalars['String']>;
  source_starts_with?: Maybe<Scalars['String']>;
  source_not_starts_with?: Maybe<Scalars['String']>;
  source_ends_with?: Maybe<Scalars['String']>;
  source_not_ends_with?: Maybe<Scalars['String']>;
  source_i?: Maybe<Scalars['String']>;
  source_not_i?: Maybe<Scalars['String']>;
  source_contains_i?: Maybe<Scalars['String']>;
  source_not_contains_i?: Maybe<Scalars['String']>;
  source_starts_with_i?: Maybe<Scalars['String']>;
  source_not_starts_with_i?: Maybe<Scalars['String']>;
  source_ends_with_i?: Maybe<Scalars['String']>;
  source_not_ends_with_i?: Maybe<Scalars['String']>;
  source_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  source_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  address?: Maybe<AddressWhereInput>;
  address_is_null?: Maybe<Scalars['Boolean']>;
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

export type AddressSourceWhereUniqueInput = {
  id: Scalars['ID'];
};

export type AddressSourcesCreateInput = {
  data?: Maybe<AddressSourceCreateInput>;
};

export type AddressSourcesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<AddressSourceUpdateInput>;
};

export type AddressUpdateInput = {
  address?: Maybe<Scalars['String']>;
  key?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  overrides?: Maybe<Scalars['JSON']>;
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

export type AddressWhereInput = {
  AND?: Maybe<Array<Maybe<AddressWhereInput>>>;
  OR?: Maybe<Array<Maybe<AddressWhereInput>>>;
  address?: Maybe<Scalars['String']>;
  address_not?: Maybe<Scalars['String']>;
  address_contains?: Maybe<Scalars['String']>;
  address_not_contains?: Maybe<Scalars['String']>;
  address_starts_with?: Maybe<Scalars['String']>;
  address_not_starts_with?: Maybe<Scalars['String']>;
  address_ends_with?: Maybe<Scalars['String']>;
  address_not_ends_with?: Maybe<Scalars['String']>;
  address_i?: Maybe<Scalars['String']>;
  address_not_i?: Maybe<Scalars['String']>;
  address_contains_i?: Maybe<Scalars['String']>;
  address_not_contains_i?: Maybe<Scalars['String']>;
  address_starts_with_i?: Maybe<Scalars['String']>;
  address_not_starts_with_i?: Maybe<Scalars['String']>;
  address_ends_with_i?: Maybe<Scalars['String']>;
  address_not_ends_with_i?: Maybe<Scalars['String']>;
  address_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  address_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  key?: Maybe<Scalars['String']>;
  key_not?: Maybe<Scalars['String']>;
  key_contains?: Maybe<Scalars['String']>;
  key_not_contains?: Maybe<Scalars['String']>;
  key_starts_with?: Maybe<Scalars['String']>;
  key_not_starts_with?: Maybe<Scalars['String']>;
  key_ends_with?: Maybe<Scalars['String']>;
  key_not_ends_with?: Maybe<Scalars['String']>;
  key_i?: Maybe<Scalars['String']>;
  key_not_i?: Maybe<Scalars['String']>;
  key_contains_i?: Maybe<Scalars['String']>;
  key_not_contains_i?: Maybe<Scalars['String']>;
  key_starts_with_i?: Maybe<Scalars['String']>;
  key_not_starts_with_i?: Maybe<Scalars['String']>;
  key_ends_with_i?: Maybe<Scalars['String']>;
  key_not_ends_with_i?: Maybe<Scalars['String']>;
  key_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  key_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  overrides?: Maybe<Scalars['JSON']>;
  overrides_not?: Maybe<Scalars['JSON']>;
  overrides_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  overrides_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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

export type AddressWhereUniqueInput = {
  id: Scalars['ID'];
};

export type AddressesCreateInput = {
  data?: Maybe<AddressCreateInput>;
};

export type AddressesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<AddressUpdateInput>;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}


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
  /**  Create a single AddressHistoryRecord item.  */
  createAddressHistoryRecord?: Maybe<AddressHistoryRecord>;
  /**  Create multiple AddressHistoryRecord items.  */
  createAddressHistoryRecords?: Maybe<Array<Maybe<AddressHistoryRecord>>>;
  /**  Update a single AddressHistoryRecord item by ID.  */
  updateAddressHistoryRecord?: Maybe<AddressHistoryRecord>;
  /**  Update multiple AddressHistoryRecord items by ID.  */
  updateAddressHistoryRecords?: Maybe<Array<Maybe<AddressHistoryRecord>>>;
  /**  Delete a single AddressHistoryRecord item by ID.  */
  deleteAddressHistoryRecord?: Maybe<AddressHistoryRecord>;
  /**  Delete multiple AddressHistoryRecord items by ID.  */
  deleteAddressHistoryRecords?: Maybe<Array<Maybe<AddressHistoryRecord>>>;
  /**  Create a single Address item.  */
  createAddress?: Maybe<Address>;
  /**  Create multiple Address items.  */
  createAddresses?: Maybe<Array<Maybe<Address>>>;
  /**  Update a single Address item by ID.  */
  updateAddress?: Maybe<Address>;
  /**  Update multiple Address items by ID.  */
  updateAddresses?: Maybe<Array<Maybe<Address>>>;
  /**  Delete a single Address item by ID.  */
  deleteAddress?: Maybe<Address>;
  /**  Delete multiple Address items by ID.  */
  deleteAddresses?: Maybe<Array<Maybe<Address>>>;
  /**  Create a single AddressInjectionHistoryRecord item.  */
  createAddressInjectionHistoryRecord?: Maybe<AddressInjectionHistoryRecord>;
  /**  Create multiple AddressInjectionHistoryRecord items.  */
  createAddressInjectionHistoryRecords?: Maybe<Array<Maybe<AddressInjectionHistoryRecord>>>;
  /**  Update a single AddressInjectionHistoryRecord item by ID.  */
  updateAddressInjectionHistoryRecord?: Maybe<AddressInjectionHistoryRecord>;
  /**  Update multiple AddressInjectionHistoryRecord items by ID.  */
  updateAddressInjectionHistoryRecords?: Maybe<Array<Maybe<AddressInjectionHistoryRecord>>>;
  /**  Delete a single AddressInjectionHistoryRecord item by ID.  */
  deleteAddressInjectionHistoryRecord?: Maybe<AddressInjectionHistoryRecord>;
  /**  Delete multiple AddressInjectionHistoryRecord items by ID.  */
  deleteAddressInjectionHistoryRecords?: Maybe<Array<Maybe<AddressInjectionHistoryRecord>>>;
  /**  Create a single AddressInjection item.  */
  createAddressInjection?: Maybe<AddressInjection>;
  /**  Create multiple AddressInjection items.  */
  createAddressInjections?: Maybe<Array<Maybe<AddressInjection>>>;
  /**  Update a single AddressInjection item by ID.  */
  updateAddressInjection?: Maybe<AddressInjection>;
  /**  Update multiple AddressInjection items by ID.  */
  updateAddressInjections?: Maybe<Array<Maybe<AddressInjection>>>;
  /**  Delete a single AddressInjection item by ID.  */
  deleteAddressInjection?: Maybe<AddressInjection>;
  /**  Delete multiple AddressInjection items by ID.  */
  deleteAddressInjections?: Maybe<Array<Maybe<AddressInjection>>>;
  /**  Create a single AddressSourceHistoryRecord item.  */
  createAddressSourceHistoryRecord?: Maybe<AddressSourceHistoryRecord>;
  /**  Create multiple AddressSourceHistoryRecord items.  */
  createAddressSourceHistoryRecords?: Maybe<Array<Maybe<AddressSourceHistoryRecord>>>;
  /**  Update a single AddressSourceHistoryRecord item by ID.  */
  updateAddressSourceHistoryRecord?: Maybe<AddressSourceHistoryRecord>;
  /**  Update multiple AddressSourceHistoryRecord items by ID.  */
  updateAddressSourceHistoryRecords?: Maybe<Array<Maybe<AddressSourceHistoryRecord>>>;
  /**  Delete a single AddressSourceHistoryRecord item by ID.  */
  deleteAddressSourceHistoryRecord?: Maybe<AddressSourceHistoryRecord>;
  /**  Delete multiple AddressSourceHistoryRecord items by ID.  */
  deleteAddressSourceHistoryRecords?: Maybe<Array<Maybe<AddressSourceHistoryRecord>>>;
  /**  Create a single AddressSource item.  */
  createAddressSource?: Maybe<AddressSource>;
  /**  Create multiple AddressSource items.  */
  createAddressSources?: Maybe<Array<Maybe<AddressSource>>>;
  /**  Update a single AddressSource item by ID.  */
  updateAddressSource?: Maybe<AddressSource>;
  /**  Update multiple AddressSource items by ID.  */
  updateAddressSources?: Maybe<Array<Maybe<AddressSource>>>;
  /**  Delete a single AddressSource item by ID.  */
  deleteAddressSource?: Maybe<AddressSource>;
  /**  Delete multiple AddressSource items by ID.  */
  deleteAddressSources?: Maybe<Array<Maybe<AddressSource>>>;
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


export type MutationCreateAddressHistoryRecordArgs = {
  data?: Maybe<AddressHistoryRecordCreateInput>;
};


export type MutationCreateAddressHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<AddressHistoryRecordsCreateInput>>>;
};


export type MutationUpdateAddressHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<AddressHistoryRecordUpdateInput>;
};


export type MutationUpdateAddressHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<AddressHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteAddressHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteAddressHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateAddressArgs = {
  data?: Maybe<AddressCreateInput>;
};


export type MutationCreateAddressesArgs = {
  data?: Maybe<Array<Maybe<AddressesCreateInput>>>;
};


export type MutationUpdateAddressArgs = {
  id: Scalars['ID'];
  data?: Maybe<AddressUpdateInput>;
};


export type MutationUpdateAddressesArgs = {
  data?: Maybe<Array<Maybe<AddressesUpdateInput>>>;
};


export type MutationDeleteAddressArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteAddressesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateAddressInjectionHistoryRecordArgs = {
  data?: Maybe<AddressInjectionHistoryRecordCreateInput>;
};


export type MutationCreateAddressInjectionHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<AddressInjectionHistoryRecordsCreateInput>>>;
};


export type MutationUpdateAddressInjectionHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<AddressInjectionHistoryRecordUpdateInput>;
};


export type MutationUpdateAddressInjectionHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<AddressInjectionHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteAddressInjectionHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteAddressInjectionHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateAddressInjectionArgs = {
  data?: Maybe<AddressInjectionCreateInput>;
};


export type MutationCreateAddressInjectionsArgs = {
  data?: Maybe<Array<Maybe<AddressInjectionsCreateInput>>>;
};


export type MutationUpdateAddressInjectionArgs = {
  id: Scalars['ID'];
  data?: Maybe<AddressInjectionUpdateInput>;
};


export type MutationUpdateAddressInjectionsArgs = {
  data?: Maybe<Array<Maybe<AddressInjectionsUpdateInput>>>;
};


export type MutationDeleteAddressInjectionArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteAddressInjectionsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateAddressSourceHistoryRecordArgs = {
  data?: Maybe<AddressSourceHistoryRecordCreateInput>;
};


export type MutationCreateAddressSourceHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<AddressSourceHistoryRecordsCreateInput>>>;
};


export type MutationUpdateAddressSourceHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<AddressSourceHistoryRecordUpdateInput>;
};


export type MutationUpdateAddressSourceHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<AddressSourceHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteAddressSourceHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteAddressSourceHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateAddressSourceArgs = {
  data?: Maybe<AddressSourceCreateInput>;
};


export type MutationCreateAddressSourcesArgs = {
  data?: Maybe<Array<Maybe<AddressSourcesCreateInput>>>;
};


export type MutationUpdateAddressSourceArgs = {
  id: Scalars['ID'];
  data?: Maybe<AddressSourceUpdateInput>;
};


export type MutationUpdateAddressSourcesArgs = {
  data?: Maybe<Array<Maybe<AddressSourcesUpdateInput>>>;
};


export type MutationDeleteAddressSourceArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteAddressSourcesArgs = {
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
  /**  Search for all AddressHistoryRecord items which match the where clause.  */
  allAddressHistoryRecords?: Maybe<Array<Maybe<AddressHistoryRecord>>>;
  /**  Search for the AddressHistoryRecord item with the matching ID.  */
  AddressHistoryRecord?: Maybe<AddressHistoryRecord>;
  /**  Perform a meta-query on all AddressHistoryRecord items which match the where clause.  */
  _allAddressHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the AddressHistoryRecord list.  */
  _AddressHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all Address items which match the where clause.  */
  allAddresses?: Maybe<Array<Maybe<Address>>>;
  /**  Search for the Address item with the matching ID.  */
  Address?: Maybe<Address>;
  /**  Perform a meta-query on all Address items which match the where clause.  */
  _allAddressesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the Address list.  */
  _AddressesMeta?: Maybe<_ListMeta>;
  /**  Search for all AddressInjectionHistoryRecord items which match the where clause.  */
  allAddressInjectionHistoryRecords?: Maybe<Array<Maybe<AddressInjectionHistoryRecord>>>;
  /**  Search for the AddressInjectionHistoryRecord item with the matching ID.  */
  AddressInjectionHistoryRecord?: Maybe<AddressInjectionHistoryRecord>;
  /**  Perform a meta-query on all AddressInjectionHistoryRecord items which match the where clause.  */
  _allAddressInjectionHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the AddressInjectionHistoryRecord list.  */
  _AddressInjectionHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all AddressInjection items which match the where clause.  */
  allAddressInjections?: Maybe<Array<Maybe<AddressInjection>>>;
  /**  Search for the AddressInjection item with the matching ID.  */
  AddressInjection?: Maybe<AddressInjection>;
  /**  Perform a meta-query on all AddressInjection items which match the where clause.  */
  _allAddressInjectionsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the AddressInjection list.  */
  _AddressInjectionsMeta?: Maybe<_ListMeta>;
  /**  Search for all AddressSourceHistoryRecord items which match the where clause.  */
  allAddressSourceHistoryRecords?: Maybe<Array<Maybe<AddressSourceHistoryRecord>>>;
  /**  Search for the AddressSourceHistoryRecord item with the matching ID.  */
  AddressSourceHistoryRecord?: Maybe<AddressSourceHistoryRecord>;
  /**  Perform a meta-query on all AddressSourceHistoryRecord items which match the where clause.  */
  _allAddressSourceHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the AddressSourceHistoryRecord list.  */
  _AddressSourceHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all AddressSource items which match the where clause.  */
  allAddressSources?: Maybe<Array<Maybe<AddressSource>>>;
  /**  Search for the AddressSource item with the matching ID.  */
  AddressSource?: Maybe<AddressSource>;
  /**  Perform a meta-query on all AddressSource items which match the where clause.  */
  _allAddressSourcesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the AddressSource list.  */
  _AddressSourcesMeta?: Maybe<_ListMeta>;
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


export type QueryAllAddressHistoryRecordsArgs = {
  where?: Maybe<AddressHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAddressHistoryRecordArgs = {
  where: AddressHistoryRecordWhereUniqueInput;
};


export type Query_AllAddressHistoryRecordsMetaArgs = {
  where?: Maybe<AddressHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllAddressesArgs = {
  where?: Maybe<AddressWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAddressArgs = {
  where: AddressWhereUniqueInput;
};


export type Query_AllAddressesMetaArgs = {
  where?: Maybe<AddressWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllAddressInjectionHistoryRecordsArgs = {
  where?: Maybe<AddressInjectionHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressInjectionHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAddressInjectionHistoryRecordArgs = {
  where: AddressInjectionHistoryRecordWhereUniqueInput;
};


export type Query_AllAddressInjectionHistoryRecordsMetaArgs = {
  where?: Maybe<AddressInjectionHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressInjectionHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllAddressInjectionsArgs = {
  where?: Maybe<AddressInjectionWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressInjectionsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAddressInjectionArgs = {
  where: AddressInjectionWhereUniqueInput;
};


export type Query_AllAddressInjectionsMetaArgs = {
  where?: Maybe<AddressInjectionWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressInjectionsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllAddressSourceHistoryRecordsArgs = {
  where?: Maybe<AddressSourceHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressSourceHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAddressSourceHistoryRecordArgs = {
  where: AddressSourceHistoryRecordWhereUniqueInput;
};


export type Query_AllAddressSourceHistoryRecordsMetaArgs = {
  where?: Maybe<AddressSourceHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressSourceHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllAddressSourcesArgs = {
  where?: Maybe<AddressSourceWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressSourcesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAddressSourceArgs = {
  where: AddressSourceWhereUniqueInput;
};


export type Query_AllAddressSourcesMetaArgs = {
  where?: Maybe<AddressSourceWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortAddressSourcesBy>>;
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

export enum SortAddressHistoryRecordsBy {
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
  KeyAsc = 'key_ASC',
  KeyDesc = 'key_DESC',
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

export enum SortAddressInjectionHistoryRecordsBy {
  CountryAsc = 'country_ASC',
  CountryDesc = 'country_DESC',
  KeywordsAsc = 'keywords_ASC',
  KeywordsDesc = 'keywords_DESC',
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

export enum SortAddressInjectionsBy {
  CountryAsc = 'country_ASC',
  CountryDesc = 'country_DESC',
  KeywordsAsc = 'keywords_ASC',
  KeywordsDesc = 'keywords_DESC',
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

export enum SortAddressSourceHistoryRecordsBy {
  SourceAsc = 'source_ASC',
  SourceDesc = 'source_DESC',
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

export enum SortAddressSourcesBy {
  SourceAsc = 'source_ASC',
  SourceDesc = 'source_DESC',
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
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

export enum SortAddressesBy {
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
  KeyAsc = 'key_ASC',
  KeyDesc = 'key_DESC',
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
  IsAdminAsc = 'isAdmin_ASC',
  IsAdminDesc = 'isAdmin_DESC',
  IsSupportAsc = 'isSupport_ASC',
  IsSupportDesc = 'isSupport_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  PasswordAsc = 'password_ASC',
  PasswordDesc = 'password_DESC',
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
  IsAdminAsc = 'isAdmin_ASC',
  IsAdminDesc = 'isAdmin_DESC',
  IsSupportAsc = 'isSupport_ASC',
  IsSupportDesc = 'isSupport_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
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
  _label_?: Maybe<Scalars['String']>;
  /**  The user's name  */
  name?: Maybe<Scalars['String']>;
  /**  Whether the user admin or not  */
  isAdmin?: Maybe<Scalars['Boolean']>;
  /**  Whether the user support or not  */
  isSupport?: Maybe<Scalars['Boolean']>;
  /**  The user's email  */
  email?: Maybe<Scalars['String']>;
  /**  The user's password  */
  password_is_set?: Maybe<Scalars['Boolean']>;
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
  /**  Client-side device identification used for the anti-fraud detection. Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<SenderField>;
};

export type UserCreateInput = {
  name?: Maybe<Scalars['String']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
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
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
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
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
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
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
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
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
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
  password_is_set?: Maybe<Scalars['Boolean']>;
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
