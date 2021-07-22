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


export type AcceptOrRejectOrganizationInviteInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  isRejected?: Maybe<Scalars['Boolean']>;
  isAccepted?: Maybe<Scalars['Boolean']>;
};

export type AuthenticateUserWithPhoneAndPasswordInput = {
  phone: Scalars['String'];
  password: Scalars['String'];
};

export type AuthenticateUserWithPhoneAndPasswordOutput = {
  __typename?: 'AuthenticateUserWithPhoneAndPasswordOutput';
  item?: Maybe<User>;
  token: Scalars['String'];
};

/**  All `account` objects from `billing data source`. In close account cases, these objects should be soft deleted  */
export type BillingAccount = {
  __typename?: 'BillingAccount';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingAccount List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingAccount List config, or
   *  3. As an alias to a 'name' field on the BillingAccount List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingAccount List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Integration context  */
  context?: Maybe<BillingIntegrationOrganizationContext>;
  /**  `billing data source` local object ID. Used only for the internal needs of the `integration component`  */
  importId?: Maybe<Scalars['String']>;
  /**  Raw non-structured data obtained from the `billing data source`. Used only for the internal needs of the `integration component`.  */
  raw?: Maybe<Scalars['JSON']>;
  /**  Billing property  */
  property?: Maybe<BillingProperty>;
  /**  A well-known universal identifier that allows you to identify the same objects in different systems. It may differ in different countries. Example: for Russia, the dom.gosuslugi.ru account number is used  */
  globalId?: Maybe<Scalars['String']>;
  /**  Account number  */
  number?: Maybe<Scalars['String']>;
  /**  Flat number / door number of an apartment building (property)  */
  unitName?: Maybe<Scalars['String']>;
  /**  Structured metadata obtained from the `billing data source`. Some of this data is required for use in the `receipt template`. Examples of data keys: `property unit number`, `floor`, `entrance`, `is parking`  */
  meta?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingAccountCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<BillingPropertyRelateToOneInput>;
  globalId?: Maybe<Scalars['String']>;
  number?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type BillingAccountHistoryRecord = {
  __typename?: 'BillingAccountHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingAccountHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingAccountHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingAccountHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingAccountHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  globalId?: Maybe<Scalars['String']>;
  number?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingAccountHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingAccountHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  globalId?: Maybe<Scalars['String']>;
  number?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingAccountHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingAccountHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingAccountHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  globalId?: Maybe<Scalars['String']>;
  number?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingAccountHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingAccountHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingAccountHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingAccountHistoryRecordWhereInput>>>;
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
  context?: Maybe<Scalars['String']>;
  context_not?: Maybe<Scalars['String']>;
  context_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  context_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  property?: Maybe<Scalars['String']>;
  property_not?: Maybe<Scalars['String']>;
  property_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  globalId?: Maybe<Scalars['String']>;
  globalId_not?: Maybe<Scalars['String']>;
  globalId_contains?: Maybe<Scalars['String']>;
  globalId_not_contains?: Maybe<Scalars['String']>;
  globalId_starts_with?: Maybe<Scalars['String']>;
  globalId_not_starts_with?: Maybe<Scalars['String']>;
  globalId_ends_with?: Maybe<Scalars['String']>;
  globalId_not_ends_with?: Maybe<Scalars['String']>;
  globalId_i?: Maybe<Scalars['String']>;
  globalId_not_i?: Maybe<Scalars['String']>;
  globalId_contains_i?: Maybe<Scalars['String']>;
  globalId_not_contains_i?: Maybe<Scalars['String']>;
  globalId_starts_with_i?: Maybe<Scalars['String']>;
  globalId_not_starts_with_i?: Maybe<Scalars['String']>;
  globalId_ends_with_i?: Maybe<Scalars['String']>;
  globalId_not_ends_with_i?: Maybe<Scalars['String']>;
  globalId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  globalId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  number?: Maybe<Scalars['String']>;
  number_not?: Maybe<Scalars['String']>;
  number_contains?: Maybe<Scalars['String']>;
  number_not_contains?: Maybe<Scalars['String']>;
  number_starts_with?: Maybe<Scalars['String']>;
  number_not_starts_with?: Maybe<Scalars['String']>;
  number_ends_with?: Maybe<Scalars['String']>;
  number_not_ends_with?: Maybe<Scalars['String']>;
  number_i?: Maybe<Scalars['String']>;
  number_not_i?: Maybe<Scalars['String']>;
  number_contains_i?: Maybe<Scalars['String']>;
  number_not_contains_i?: Maybe<Scalars['String']>;
  number_starts_with_i?: Maybe<Scalars['String']>;
  number_not_starts_with_i?: Maybe<Scalars['String']>;
  number_ends_with_i?: Maybe<Scalars['String']>;
  number_not_ends_with_i?: Maybe<Scalars['String']>;
  number_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  number_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName?: Maybe<Scalars['String']>;
  unitName_not?: Maybe<Scalars['String']>;
  unitName_contains?: Maybe<Scalars['String']>;
  unitName_not_contains?: Maybe<Scalars['String']>;
  unitName_starts_with?: Maybe<Scalars['String']>;
  unitName_not_starts_with?: Maybe<Scalars['String']>;
  unitName_ends_with?: Maybe<Scalars['String']>;
  unitName_not_ends_with?: Maybe<Scalars['String']>;
  unitName_i?: Maybe<Scalars['String']>;
  unitName_not_i?: Maybe<Scalars['String']>;
  unitName_contains_i?: Maybe<Scalars['String']>;
  unitName_not_contains_i?: Maybe<Scalars['String']>;
  unitName_starts_with_i?: Maybe<Scalars['String']>;
  unitName_not_starts_with_i?: Maybe<Scalars['String']>;
  unitName_ends_with_i?: Maybe<Scalars['String']>;
  unitName_not_ends_with_i?: Maybe<Scalars['String']>;
  unitName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingAccountHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingAccountHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingAccountHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingAccountHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingAccountHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingAccountHistoryRecordsCreateInput = {
  data?: Maybe<BillingAccountHistoryRecordCreateInput>;
};

export type BillingAccountHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountHistoryRecordUpdateInput>;
};

/**  All `personal meter` (non `whole-building meter`) objects from `billing data source`. In case of the meter can measure several resources we create a separate object for each resource  */
export type BillingAccountMeter = {
  __typename?: 'BillingAccountMeter';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingAccountMeter List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingAccountMeter List config, or
   *  3. As an alias to a 'name' field on the BillingAccountMeter List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingAccountMeter List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Integration context  */
  context?: Maybe<BillingIntegrationOrganizationContext>;
  /**  `billing data source` local object ID. Used only for the internal needs of the `integration component`  */
  importId?: Maybe<Scalars['String']>;
  /**  Raw non-structured data obtained from the `billing data source`. Used only for the internal needs of the `integration component`.  */
  raw?: Maybe<Scalars['JSON']>;
  /**  Billing property  */
  property?: Maybe<BillingProperty>;
  /**  Billing account  */
  account?: Maybe<BillingAccount>;
  /**  Meter resource types  */
  resource?: Maybe<BillingMeterResource>;
  /**  Structured metadata obtained from the `billing data source`. Some of this data is required for use in the `receipt template`. Examples of data keys: `sealing date`, `install date`, `verification date`, `serial number`, `units of measurement`  */
  meta?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingAccountMeterCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<BillingPropertyRelateToOneInput>;
  account?: Maybe<BillingAccountRelateToOneInput>;
  resource?: Maybe<BillingMeterResourceRelateToOneInput>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type BillingAccountMeterHistoryRecord = {
  __typename?: 'BillingAccountMeterHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingAccountMeterHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingAccountMeterHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingAccountMeterHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingAccountMeterHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  account?: Maybe<Scalars['String']>;
  resource?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingAccountMeterHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingAccountMeterHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  account?: Maybe<Scalars['String']>;
  resource?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingAccountMeterHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingAccountMeterHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingAccountMeterHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  account?: Maybe<Scalars['String']>;
  resource?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingAccountMeterHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingAccountMeterHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecordWhereInput>>>;
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
  context?: Maybe<Scalars['String']>;
  context_not?: Maybe<Scalars['String']>;
  context_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  context_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  property?: Maybe<Scalars['String']>;
  property_not?: Maybe<Scalars['String']>;
  property_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  account?: Maybe<Scalars['String']>;
  account_not?: Maybe<Scalars['String']>;
  account_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  account_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  resource?: Maybe<Scalars['String']>;
  resource_not?: Maybe<Scalars['String']>;
  resource_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  resource_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingAccountMeterHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingAccountMeterHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingAccountMeterHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingAccountMeterHistoryRecordsCreateInput = {
  data?: Maybe<BillingAccountMeterHistoryRecordCreateInput>;
};

export type BillingAccountMeterHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountMeterHistoryRecordUpdateInput>;
};

/**  Meter reading. In a multi-tariff meter case, we store all values in one object  */
export type BillingAccountMeterReading = {
  __typename?: 'BillingAccountMeterReading';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingAccountMeterReading List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingAccountMeterReading List config, or
   *  3. As an alias to a 'name' field on the BillingAccountMeterReading List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingAccountMeterReading List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Integration context  */
  context?: Maybe<BillingIntegrationOrganizationContext>;
  /**  `billing data source` local object ID. Used only for the internal needs of the `integration component`  */
  importId?: Maybe<Scalars['String']>;
  /**  Raw non-structured data obtained from the `billing data source`. Used only for the internal needs of the `integration component`.  */
  raw?: Maybe<Scalars['JSON']>;
  /**  Billing property  */
  property?: Maybe<BillingProperty>;
  /**  Billing account  */
  account?: Maybe<BillingAccount>;
  /**  Billing account meter  */
  meter?: Maybe<BillingAccountMeter>;
  /**  Period date: Generated on template 01_<month>_<year>  */
  period?: Maybe<Scalars['String']>;
  /**  Meter reading value of tariff 1  */
  value1?: Maybe<Scalars['Int']>;
  /**  Meter reading value of tariff 2  */
  value2?: Maybe<Scalars['Int']>;
  /**  Meter reading value of tariff 3  */
  value3?: Maybe<Scalars['Int']>;
  /**  Date of reading  */
  date?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingAccountMeterReadingCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<BillingPropertyRelateToOneInput>;
  account?: Maybe<BillingAccountRelateToOneInput>;
  meter?: Maybe<BillingAccountMeterRelateToOneInput>;
  period?: Maybe<Scalars['String']>;
  value1?: Maybe<Scalars['Int']>;
  value2?: Maybe<Scalars['Int']>;
  value3?: Maybe<Scalars['Int']>;
  date?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type BillingAccountMeterReadingHistoryRecord = {
  __typename?: 'BillingAccountMeterReadingHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingAccountMeterReadingHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingAccountMeterReadingHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingAccountMeterReadingHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingAccountMeterReadingHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  account?: Maybe<Scalars['String']>;
  meter?: Maybe<Scalars['String']>;
  period?: Maybe<Scalars['String']>;
  value1?: Maybe<Scalars['Int']>;
  value2?: Maybe<Scalars['Int']>;
  value3?: Maybe<Scalars['Int']>;
  date?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingAccountMeterReadingHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingAccountMeterReadingHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  account?: Maybe<Scalars['String']>;
  meter?: Maybe<Scalars['String']>;
  period?: Maybe<Scalars['String']>;
  value1?: Maybe<Scalars['Int']>;
  value2?: Maybe<Scalars['Int']>;
  value3?: Maybe<Scalars['Int']>;
  date?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingAccountMeterReadingHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingAccountMeterReadingHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingAccountMeterReadingHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  account?: Maybe<Scalars['String']>;
  meter?: Maybe<Scalars['String']>;
  period?: Maybe<Scalars['String']>;
  value1?: Maybe<Scalars['Int']>;
  value2?: Maybe<Scalars['Int']>;
  value3?: Maybe<Scalars['Int']>;
  date?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingAccountMeterReadingHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingAccountMeterReadingHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecordWhereInput>>>;
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
  context?: Maybe<Scalars['String']>;
  context_not?: Maybe<Scalars['String']>;
  context_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  context_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  property?: Maybe<Scalars['String']>;
  property_not?: Maybe<Scalars['String']>;
  property_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  account?: Maybe<Scalars['String']>;
  account_not?: Maybe<Scalars['String']>;
  account_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  account_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meter?: Maybe<Scalars['String']>;
  meter_not?: Maybe<Scalars['String']>;
  meter_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meter_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  period?: Maybe<Scalars['String']>;
  period_not?: Maybe<Scalars['String']>;
  period_lt?: Maybe<Scalars['String']>;
  period_lte?: Maybe<Scalars['String']>;
  period_gt?: Maybe<Scalars['String']>;
  period_gte?: Maybe<Scalars['String']>;
  period_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  period_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  value1?: Maybe<Scalars['Int']>;
  value1_not?: Maybe<Scalars['Int']>;
  value1_lt?: Maybe<Scalars['Int']>;
  value1_lte?: Maybe<Scalars['Int']>;
  value1_gt?: Maybe<Scalars['Int']>;
  value1_gte?: Maybe<Scalars['Int']>;
  value1_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value1_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value2?: Maybe<Scalars['Int']>;
  value2_not?: Maybe<Scalars['Int']>;
  value2_lt?: Maybe<Scalars['Int']>;
  value2_lte?: Maybe<Scalars['Int']>;
  value2_gt?: Maybe<Scalars['Int']>;
  value2_gte?: Maybe<Scalars['Int']>;
  value2_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value2_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value3?: Maybe<Scalars['Int']>;
  value3_not?: Maybe<Scalars['Int']>;
  value3_lt?: Maybe<Scalars['Int']>;
  value3_lte?: Maybe<Scalars['Int']>;
  value3_gt?: Maybe<Scalars['Int']>;
  value3_gte?: Maybe<Scalars['Int']>;
  value3_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value3_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  date?: Maybe<Scalars['String']>;
  date_not?: Maybe<Scalars['String']>;
  date_lt?: Maybe<Scalars['String']>;
  date_lte?: Maybe<Scalars['String']>;
  date_gt?: Maybe<Scalars['String']>;
  date_gte?: Maybe<Scalars['String']>;
  date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingAccountMeterReadingHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingAccountMeterReadingHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingAccountMeterReadingHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingAccountMeterReadingHistoryRecordsCreateInput = {
  data?: Maybe<BillingAccountMeterReadingHistoryRecordCreateInput>;
};

export type BillingAccountMeterReadingHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountMeterReadingHistoryRecordUpdateInput>;
};

export type BillingAccountMeterReadingUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<BillingPropertyRelateToOneInput>;
  account?: Maybe<BillingAccountRelateToOneInput>;
  meter?: Maybe<BillingAccountMeterRelateToOneInput>;
  period?: Maybe<Scalars['String']>;
  value1?: Maybe<Scalars['Int']>;
  value2?: Maybe<Scalars['Int']>;
  value3?: Maybe<Scalars['Int']>;
  date?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingAccountMeterReadingWhereInput = {
  AND?: Maybe<Array<Maybe<BillingAccountMeterReadingWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingAccountMeterReadingWhereInput>>>;
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
  context?: Maybe<BillingIntegrationOrganizationContextWhereInput>;
  context_is_null?: Maybe<Scalars['Boolean']>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  property?: Maybe<BillingPropertyWhereInput>;
  property_is_null?: Maybe<Scalars['Boolean']>;
  account?: Maybe<BillingAccountWhereInput>;
  account_is_null?: Maybe<Scalars['Boolean']>;
  meter?: Maybe<BillingAccountMeterWhereInput>;
  meter_is_null?: Maybe<Scalars['Boolean']>;
  period?: Maybe<Scalars['String']>;
  period_not?: Maybe<Scalars['String']>;
  period_lt?: Maybe<Scalars['String']>;
  period_lte?: Maybe<Scalars['String']>;
  period_gt?: Maybe<Scalars['String']>;
  period_gte?: Maybe<Scalars['String']>;
  period_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  period_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  value1?: Maybe<Scalars['Int']>;
  value1_not?: Maybe<Scalars['Int']>;
  value1_lt?: Maybe<Scalars['Int']>;
  value1_lte?: Maybe<Scalars['Int']>;
  value1_gt?: Maybe<Scalars['Int']>;
  value1_gte?: Maybe<Scalars['Int']>;
  value1_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value1_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value2?: Maybe<Scalars['Int']>;
  value2_not?: Maybe<Scalars['Int']>;
  value2_lt?: Maybe<Scalars['Int']>;
  value2_lte?: Maybe<Scalars['Int']>;
  value2_gt?: Maybe<Scalars['Int']>;
  value2_gte?: Maybe<Scalars['Int']>;
  value2_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value2_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value3?: Maybe<Scalars['Int']>;
  value3_not?: Maybe<Scalars['Int']>;
  value3_lt?: Maybe<Scalars['Int']>;
  value3_lte?: Maybe<Scalars['Int']>;
  value3_gt?: Maybe<Scalars['Int']>;
  value3_gte?: Maybe<Scalars['Int']>;
  value3_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  value3_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  date?: Maybe<Scalars['String']>;
  date_not?: Maybe<Scalars['String']>;
  date_lt?: Maybe<Scalars['String']>;
  date_lte?: Maybe<Scalars['String']>;
  date_gt?: Maybe<Scalars['String']>;
  date_gte?: Maybe<Scalars['String']>;
  date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type BillingAccountMeterReadingWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingAccountMeterReadingsCreateInput = {
  data?: Maybe<BillingAccountMeterReadingCreateInput>;
};

export type BillingAccountMeterReadingsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountMeterReadingUpdateInput>;
};

export type BillingAccountMeterRelateToOneInput = {
  create?: Maybe<BillingAccountMeterCreateInput>;
  connect?: Maybe<BillingAccountMeterWhereUniqueInput>;
  disconnect?: Maybe<BillingAccountMeterWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type BillingAccountMeterUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<BillingPropertyRelateToOneInput>;
  account?: Maybe<BillingAccountRelateToOneInput>;
  resource?: Maybe<BillingMeterResourceRelateToOneInput>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingAccountMeterWhereInput = {
  AND?: Maybe<Array<Maybe<BillingAccountMeterWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingAccountMeterWhereInput>>>;
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
  context?: Maybe<BillingIntegrationOrganizationContextWhereInput>;
  context_is_null?: Maybe<Scalars['Boolean']>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  property?: Maybe<BillingPropertyWhereInput>;
  property_is_null?: Maybe<Scalars['Boolean']>;
  account?: Maybe<BillingAccountWhereInput>;
  account_is_null?: Maybe<Scalars['Boolean']>;
  resource?: Maybe<BillingMeterResourceWhereInput>;
  resource_is_null?: Maybe<Scalars['Boolean']>;
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
};

export type BillingAccountMeterWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingAccountMetersCreateInput = {
  data?: Maybe<BillingAccountMeterCreateInput>;
};

export type BillingAccountMetersUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountMeterUpdateInput>;
};

export type BillingAccountRelateToOneInput = {
  create?: Maybe<BillingAccountCreateInput>;
  connect?: Maybe<BillingAccountWhereUniqueInput>;
  disconnect?: Maybe<BillingAccountWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type BillingAccountUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  property?: Maybe<BillingPropertyRelateToOneInput>;
  globalId?: Maybe<Scalars['String']>;
  number?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingAccountWhereInput = {
  AND?: Maybe<Array<Maybe<BillingAccountWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingAccountWhereInput>>>;
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
  context?: Maybe<BillingIntegrationOrganizationContextWhereInput>;
  context_is_null?: Maybe<Scalars['Boolean']>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  property?: Maybe<BillingPropertyWhereInput>;
  property_is_null?: Maybe<Scalars['Boolean']>;
  globalId?: Maybe<Scalars['String']>;
  globalId_not?: Maybe<Scalars['String']>;
  globalId_contains?: Maybe<Scalars['String']>;
  globalId_not_contains?: Maybe<Scalars['String']>;
  globalId_starts_with?: Maybe<Scalars['String']>;
  globalId_not_starts_with?: Maybe<Scalars['String']>;
  globalId_ends_with?: Maybe<Scalars['String']>;
  globalId_not_ends_with?: Maybe<Scalars['String']>;
  globalId_i?: Maybe<Scalars['String']>;
  globalId_not_i?: Maybe<Scalars['String']>;
  globalId_contains_i?: Maybe<Scalars['String']>;
  globalId_not_contains_i?: Maybe<Scalars['String']>;
  globalId_starts_with_i?: Maybe<Scalars['String']>;
  globalId_not_starts_with_i?: Maybe<Scalars['String']>;
  globalId_ends_with_i?: Maybe<Scalars['String']>;
  globalId_not_ends_with_i?: Maybe<Scalars['String']>;
  globalId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  globalId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  number?: Maybe<Scalars['String']>;
  number_not?: Maybe<Scalars['String']>;
  number_contains?: Maybe<Scalars['String']>;
  number_not_contains?: Maybe<Scalars['String']>;
  number_starts_with?: Maybe<Scalars['String']>;
  number_not_starts_with?: Maybe<Scalars['String']>;
  number_ends_with?: Maybe<Scalars['String']>;
  number_not_ends_with?: Maybe<Scalars['String']>;
  number_i?: Maybe<Scalars['String']>;
  number_not_i?: Maybe<Scalars['String']>;
  number_contains_i?: Maybe<Scalars['String']>;
  number_not_contains_i?: Maybe<Scalars['String']>;
  number_starts_with_i?: Maybe<Scalars['String']>;
  number_not_starts_with_i?: Maybe<Scalars['String']>;
  number_ends_with_i?: Maybe<Scalars['String']>;
  number_not_ends_with_i?: Maybe<Scalars['String']>;
  number_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  number_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName?: Maybe<Scalars['String']>;
  unitName_not?: Maybe<Scalars['String']>;
  unitName_contains?: Maybe<Scalars['String']>;
  unitName_not_contains?: Maybe<Scalars['String']>;
  unitName_starts_with?: Maybe<Scalars['String']>;
  unitName_not_starts_with?: Maybe<Scalars['String']>;
  unitName_ends_with?: Maybe<Scalars['String']>;
  unitName_not_ends_with?: Maybe<Scalars['String']>;
  unitName_i?: Maybe<Scalars['String']>;
  unitName_not_i?: Maybe<Scalars['String']>;
  unitName_contains_i?: Maybe<Scalars['String']>;
  unitName_not_contains_i?: Maybe<Scalars['String']>;
  unitName_starts_with_i?: Maybe<Scalars['String']>;
  unitName_not_starts_with_i?: Maybe<Scalars['String']>;
  unitName_ends_with_i?: Maybe<Scalars['String']>;
  unitName_not_ends_with_i?: Maybe<Scalars['String']>;
  unitName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type BillingAccountWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingAccountsCreateInput = {
  data?: Maybe<BillingAccountCreateInput>;
};

export type BillingAccountsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountUpdateInput>;
};

/**  Identification of the `integration component` which responsible for getting data from the `billing data source` and delivering the data to `this API`. Examples: tap-1c, ...   */
export type BillingIntegration = {
  __typename?: 'BillingIntegration';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingIntegration List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingIntegration List config, or
   *  3. As an alias to a 'name' field on the BillingIntegration List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingIntegration List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  The name of the `integration component` that the developer remembers  */
  name?: Maybe<Scalars['String']>;
  accessRights: Array<BillingIntegrationAccessRight>;
  _accessRightsMeta?: Maybe<_QueryMeta>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};


/**  Identification of the `integration component` which responsible for getting data from the `billing data source` and delivering the data to `this API`. Examples: tap-1c, ...   */
export type BillingIntegrationAccessRightsArgs = {
  where?: Maybe<BillingIntegrationAccessRightWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationAccessRightsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


/**  Identification of the `integration component` which responsible for getting data from the `billing data source` and delivering the data to `this API`. Examples: tap-1c, ...   */
export type BillingIntegration_AccessRightsMetaArgs = {
  where?: Maybe<BillingIntegrationAccessRightWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationAccessRightsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};

/**  Link between billing integrations and users. The existence of the object means that there is user has access to integration  */
export type BillingIntegrationAccessRight = {
  __typename?: 'BillingIntegrationAccessRight';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingIntegrationAccessRight List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingIntegrationAccessRight List config, or
   *  3. As an alias to a 'name' field on the BillingIntegrationAccessRight List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingIntegrationAccessRight List.
   */
  _label_?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Integration  */
  integration?: Maybe<BillingIntegration>;
  /**  User  */
  user?: Maybe<User>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
};

export type BillingIntegrationAccessRightCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<BillingIntegrationRelateToOneInput>;
  user?: Maybe<UserRelateToOneInput>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
};

/**  A keystone list  */
export type BillingIntegrationAccessRightHistoryRecord = {
  __typename?: 'BillingIntegrationAccessRightHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingIntegrationAccessRightHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingIntegrationAccessRightHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingIntegrationAccessRightHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingIntegrationAccessRightHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingIntegrationAccessRightHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingIntegrationAccessRightHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingIntegrationAccessRightHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingIntegrationAccessRightHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingIntegrationAccessRightHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingIntegrationAccessRightHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingIntegrationAccessRightHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecordWhereInput>>>;
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
  integration?: Maybe<Scalars['String']>;
  integration_not?: Maybe<Scalars['String']>;
  integration_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  integration_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user?: Maybe<Scalars['String']>;
  user_not?: Maybe<Scalars['String']>;
  user_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingIntegrationAccessRightHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingIntegrationAccessRightHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingIntegrationAccessRightHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingIntegrationAccessRightHistoryRecordsCreateInput = {
  data?: Maybe<BillingIntegrationAccessRightHistoryRecordCreateInput>;
};

export type BillingIntegrationAccessRightHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationAccessRightHistoryRecordUpdateInput>;
};

export type BillingIntegrationAccessRightRelateToManyInput = {
  create?: Maybe<Array<Maybe<BillingIntegrationAccessRightCreateInput>>>;
  connect?: Maybe<Array<Maybe<BillingIntegrationAccessRightWhereUniqueInput>>>;
  disconnect?: Maybe<Array<Maybe<BillingIntegrationAccessRightWhereUniqueInput>>>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type BillingIntegrationAccessRightUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<BillingIntegrationRelateToOneInput>;
  user?: Maybe<UserRelateToOneInput>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
};

export type BillingIntegrationAccessRightWhereInput = {
  AND?: Maybe<Array<Maybe<BillingIntegrationAccessRightWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingIntegrationAccessRightWhereInput>>>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
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
  integration?: Maybe<BillingIntegrationWhereInput>;
  integration_is_null?: Maybe<Scalars['Boolean']>;
  user?: Maybe<UserWhereInput>;
  user_is_null?: Maybe<Scalars['Boolean']>;
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
};

export type BillingIntegrationAccessRightWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingIntegrationAccessRightsCreateInput = {
  data?: Maybe<BillingIntegrationAccessRightCreateInput>;
};

export type BillingIntegrationAccessRightsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationAccessRightUpdateInput>;
};

export type BillingIntegrationCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  accessRights?: Maybe<BillingIntegrationAccessRightRelateToManyInput>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type BillingIntegrationHistoryRecord = {
  __typename?: 'BillingIntegrationHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingIntegrationHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingIntegrationHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingIntegrationHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingIntegrationHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingIntegrationHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingIntegrationHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingIntegrationHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingIntegrationHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingIntegrationHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingIntegrationHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingIntegrationHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingIntegrationHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingIntegrationHistoryRecordWhereInput>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingIntegrationHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingIntegrationHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingIntegrationHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingIntegrationHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingIntegrationHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingIntegrationHistoryRecordsCreateInput = {
  data?: Maybe<BillingIntegrationHistoryRecordCreateInput>;
};

export type BillingIntegrationHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationHistoryRecordUpdateInput>;
};

/**  Important `integration component` log records. Sometimes you need to report some errors/problems related to the integration process. The target audience of these messages is the client of our API platform. You should avoid repeating the same messages. The existence of the message means that some problems were occurred during the integration process and the client should the user must take some actions to eliminate them  */
export type BillingIntegrationLog = {
  __typename?: 'BillingIntegrationLog';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingIntegrationLog List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingIntegrationLog List config, or
   *  3. As an alias to a 'name' field on the BillingIntegrationLog List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingIntegrationLog List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Integration context  */
  context?: Maybe<BillingIntegrationOrganizationContext>;
  /**  Message type. Our clients can use different languages. Sometimes we need to change the text message for the client. The settings for the message texts are in the integration. Ex: WRONG_AUTH_CREDENTIALS  */
  type?: Maybe<Scalars['String']>;
  /**  Client understandable message. May be overridden by integration settings for some message types  */
  message?: Maybe<Scalars['String']>;
  /**  The message metadata. Context variables for generating messages. Examples of data keys: ``  */
  meta?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingIntegrationLogCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  type?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingIntegrationLogUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  type?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingIntegrationLogWhereInput = {
  AND?: Maybe<Array<Maybe<BillingIntegrationLogWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingIntegrationLogWhereInput>>>;
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
  context?: Maybe<BillingIntegrationOrganizationContextWhereInput>;
  context_is_null?: Maybe<Scalars['Boolean']>;
  type?: Maybe<Scalars['String']>;
  type_not?: Maybe<Scalars['String']>;
  type_contains?: Maybe<Scalars['String']>;
  type_not_contains?: Maybe<Scalars['String']>;
  type_starts_with?: Maybe<Scalars['String']>;
  type_not_starts_with?: Maybe<Scalars['String']>;
  type_ends_with?: Maybe<Scalars['String']>;
  type_not_ends_with?: Maybe<Scalars['String']>;
  type_i?: Maybe<Scalars['String']>;
  type_not_i?: Maybe<Scalars['String']>;
  type_contains_i?: Maybe<Scalars['String']>;
  type_not_contains_i?: Maybe<Scalars['String']>;
  type_starts_with_i?: Maybe<Scalars['String']>;
  type_not_starts_with_i?: Maybe<Scalars['String']>;
  type_ends_with_i?: Maybe<Scalars['String']>;
  type_not_ends_with_i?: Maybe<Scalars['String']>;
  type_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  message?: Maybe<Scalars['String']>;
  message_not?: Maybe<Scalars['String']>;
  message_contains?: Maybe<Scalars['String']>;
  message_not_contains?: Maybe<Scalars['String']>;
  message_starts_with?: Maybe<Scalars['String']>;
  message_not_starts_with?: Maybe<Scalars['String']>;
  message_ends_with?: Maybe<Scalars['String']>;
  message_not_ends_with?: Maybe<Scalars['String']>;
  message_i?: Maybe<Scalars['String']>;
  message_not_i?: Maybe<Scalars['String']>;
  message_contains_i?: Maybe<Scalars['String']>;
  message_not_contains_i?: Maybe<Scalars['String']>;
  message_starts_with_i?: Maybe<Scalars['String']>;
  message_not_starts_with_i?: Maybe<Scalars['String']>;
  message_ends_with_i?: Maybe<Scalars['String']>;
  message_not_ends_with_i?: Maybe<Scalars['String']>;
  message_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  message_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type BillingIntegrationLogWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingIntegrationLogsCreateInput = {
  data?: Maybe<BillingIntegrationLogCreateInput>;
};

export type BillingIntegrationLogsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationLogUpdateInput>;
};

/**  Integration state and settings for all organizations. The existence of this object means that there is a configured integration between the `billing data source` and `this API`  */
export type BillingIntegrationOrganizationContext = {
  __typename?: 'BillingIntegrationOrganizationContext';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingIntegrationOrganizationContext List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingIntegrationOrganizationContext List config, or
   *  3. As an alias to a 'name' field on the BillingIntegrationOrganizationContext List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingIntegrationOrganizationContext List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  ID of the integration that is configured to receive data for the organization  */
  integration?: Maybe<BillingIntegration>;
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  /**  Settings that are required to get data from the `billing data source`. It can also contain fine-tuning optional integration settings. The data structure depends on the integration and defined there  */
  settings?: Maybe<Scalars['JSON']>;
  /**  The current state of the integration process. Some integration need to store past state or data related to cache files/folders for past state. The data structure depends on the integration and defined there  */
  state?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingIntegrationOrganizationContextCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<BillingIntegrationRelateToOneInput>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  settings?: Maybe<Scalars['JSON']>;
  state?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type BillingIntegrationOrganizationContextHistoryRecord = {
  __typename?: 'BillingIntegrationOrganizationContextHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingIntegrationOrganizationContextHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingIntegrationOrganizationContextHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingIntegrationOrganizationContextHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingIntegrationOrganizationContextHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<Scalars['String']>;
  organization?: Maybe<Scalars['String']>;
  settings?: Maybe<Scalars['JSON']>;
  state?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingIntegrationOrganizationContextHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingIntegrationOrganizationContextHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<Scalars['String']>;
  organization?: Maybe<Scalars['String']>;
  settings?: Maybe<Scalars['JSON']>;
  state?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingIntegrationOrganizationContextHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingIntegrationOrganizationContextHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingIntegrationOrganizationContextHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<Scalars['String']>;
  organization?: Maybe<Scalars['String']>;
  settings?: Maybe<Scalars['JSON']>;
  state?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingIntegrationOrganizationContextHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingIntegrationOrganizationContextHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecordWhereInput>>>;
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
  integration?: Maybe<Scalars['String']>;
  integration_not?: Maybe<Scalars['String']>;
  integration_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  integration_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  settings?: Maybe<Scalars['JSON']>;
  settings_not?: Maybe<Scalars['JSON']>;
  settings_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  settings_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  state?: Maybe<Scalars['JSON']>;
  state_not?: Maybe<Scalars['JSON']>;
  state_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  state_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingIntegrationOrganizationContextHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingIntegrationOrganizationContextHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingIntegrationOrganizationContextHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingIntegrationOrganizationContextHistoryRecordsCreateInput = {
  data?: Maybe<BillingIntegrationOrganizationContextHistoryRecordCreateInput>;
};

export type BillingIntegrationOrganizationContextHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationOrganizationContextHistoryRecordUpdateInput>;
};

export type BillingIntegrationOrganizationContextRelateToOneInput = {
  create?: Maybe<BillingIntegrationOrganizationContextCreateInput>;
  connect?: Maybe<BillingIntegrationOrganizationContextWhereUniqueInput>;
  disconnect?: Maybe<BillingIntegrationOrganizationContextWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type BillingIntegrationOrganizationContextUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  integration?: Maybe<BillingIntegrationRelateToOneInput>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  settings?: Maybe<Scalars['JSON']>;
  state?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingIntegrationOrganizationContextWhereInput = {
  AND?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextWhereInput>>>;
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
  integration?: Maybe<BillingIntegrationWhereInput>;
  integration_is_null?: Maybe<Scalars['Boolean']>;
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  settings?: Maybe<Scalars['JSON']>;
  settings_not?: Maybe<Scalars['JSON']>;
  settings_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  settings_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  state?: Maybe<Scalars['JSON']>;
  state_not?: Maybe<Scalars['JSON']>;
  state_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  state_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
};

export type BillingIntegrationOrganizationContextWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingIntegrationOrganizationContextsCreateInput = {
  data?: Maybe<BillingIntegrationOrganizationContextCreateInput>;
};

export type BillingIntegrationOrganizationContextsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationOrganizationContextUpdateInput>;
};

export type BillingIntegrationRelateToOneInput = {
  create?: Maybe<BillingIntegrationCreateInput>;
  connect?: Maybe<BillingIntegrationWhereUniqueInput>;
  disconnect?: Maybe<BillingIntegrationWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type BillingIntegrationUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  accessRights?: Maybe<BillingIntegrationAccessRightRelateToManyInput>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingIntegrationWhereInput = {
  AND?: Maybe<Array<Maybe<BillingIntegrationWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingIntegrationWhereInput>>>;
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
  /**  condition must be true for all nodes  */
  accessRights_every?: Maybe<BillingIntegrationAccessRightWhereInput>;
  /**  condition must be true for at least 1 node  */
  accessRights_some?: Maybe<BillingIntegrationAccessRightWhereInput>;
  /**  condition must be false for all nodes  */
  accessRights_none?: Maybe<BillingIntegrationAccessRightWhereInput>;
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
};

export type BillingIntegrationWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingIntegrationsCreateInput = {
  data?: Maybe<BillingIntegrationCreateInput>;
};

export type BillingIntegrationsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationUpdateInput>;
};

/**  Meter `resource types`  */
export type BillingMeterResource = {
  __typename?: 'BillingMeterResource';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingMeterResource List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingMeterResource List config, or
   *  3. As an alias to a 'name' field on the BillingMeterResource List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingMeterResource List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  The name of the `resource types`  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingMeterResourceCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type BillingMeterResourceHistoryRecord = {
  __typename?: 'BillingMeterResourceHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingMeterResourceHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingMeterResourceHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingMeterResourceHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingMeterResourceHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingMeterResourceHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingMeterResourceHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingMeterResourceHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingMeterResourceHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingMeterResourceHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingMeterResourceHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingMeterResourceHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecordWhereInput>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingMeterResourceHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingMeterResourceHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingMeterResourceHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingMeterResourceHistoryRecordsCreateInput = {
  data?: Maybe<BillingMeterResourceHistoryRecordCreateInput>;
};

export type BillingMeterResourceHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingMeterResourceHistoryRecordUpdateInput>;
};

export type BillingMeterResourceRelateToOneInput = {
  create?: Maybe<BillingMeterResourceCreateInput>;
  connect?: Maybe<BillingMeterResourceWhereUniqueInput>;
  disconnect?: Maybe<BillingMeterResourceWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type BillingMeterResourceUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingMeterResourceWhereInput = {
  AND?: Maybe<Array<Maybe<BillingMeterResourceWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingMeterResourceWhereInput>>>;
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
};

export type BillingMeterResourceWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingMeterResourcesCreateInput = {
  data?: Maybe<BillingMeterResourceCreateInput>;
};

export type BillingMeterResourcesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingMeterResourceUpdateInput>;
};

/**  An organization which can accept payments from the BillingAccount  */
export type BillingOrganization = {
  __typename?: 'BillingOrganization';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingOrganization List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingOrganization List config, or
   *  3. As an alias to a 'name' field on the BillingOrganization List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingOrganization List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Integration context  */
  context?: Maybe<BillingIntegrationOrganizationContext>;
  /**  Taxpayer Identification Number. In Russia: INN  */
  tin?: Maybe<Scalars['String']>;
  /**   Industrial Enterprise Classification. In Russia: KPP  */
  iec?: Maybe<Scalars['String']>;
  /**  Bank Identification Code. In Russia: BIK  */
  bic?: Maybe<Scalars['String']>;
  /**  Number of the checking account of organization  */
  checkNumber?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingOrganizationCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  tin?: Maybe<Scalars['String']>;
  iec?: Maybe<Scalars['String']>;
  bic?: Maybe<Scalars['String']>;
  checkNumber?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type BillingOrganizationHistoryRecord = {
  __typename?: 'BillingOrganizationHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingOrganizationHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingOrganizationHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingOrganizationHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingOrganizationHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  tin?: Maybe<Scalars['String']>;
  iec?: Maybe<Scalars['String']>;
  bic?: Maybe<Scalars['String']>;
  checkNumber?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingOrganizationHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingOrganizationHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  tin?: Maybe<Scalars['String']>;
  iec?: Maybe<Scalars['String']>;
  bic?: Maybe<Scalars['String']>;
  checkNumber?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingOrganizationHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingOrganizationHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingOrganizationHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  tin?: Maybe<Scalars['String']>;
  iec?: Maybe<Scalars['String']>;
  bic?: Maybe<Scalars['String']>;
  checkNumber?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingOrganizationHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingOrganizationHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingOrganizationHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingOrganizationHistoryRecordWhereInput>>>;
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
  context?: Maybe<Scalars['String']>;
  context_not?: Maybe<Scalars['String']>;
  context_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  context_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  tin?: Maybe<Scalars['String']>;
  tin_not?: Maybe<Scalars['String']>;
  tin_contains?: Maybe<Scalars['String']>;
  tin_not_contains?: Maybe<Scalars['String']>;
  tin_starts_with?: Maybe<Scalars['String']>;
  tin_not_starts_with?: Maybe<Scalars['String']>;
  tin_ends_with?: Maybe<Scalars['String']>;
  tin_not_ends_with?: Maybe<Scalars['String']>;
  tin_i?: Maybe<Scalars['String']>;
  tin_not_i?: Maybe<Scalars['String']>;
  tin_contains_i?: Maybe<Scalars['String']>;
  tin_not_contains_i?: Maybe<Scalars['String']>;
  tin_starts_with_i?: Maybe<Scalars['String']>;
  tin_not_starts_with_i?: Maybe<Scalars['String']>;
  tin_ends_with_i?: Maybe<Scalars['String']>;
  tin_not_ends_with_i?: Maybe<Scalars['String']>;
  tin_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  tin_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  iec?: Maybe<Scalars['String']>;
  iec_not?: Maybe<Scalars['String']>;
  iec_contains?: Maybe<Scalars['String']>;
  iec_not_contains?: Maybe<Scalars['String']>;
  iec_starts_with?: Maybe<Scalars['String']>;
  iec_not_starts_with?: Maybe<Scalars['String']>;
  iec_ends_with?: Maybe<Scalars['String']>;
  iec_not_ends_with?: Maybe<Scalars['String']>;
  iec_i?: Maybe<Scalars['String']>;
  iec_not_i?: Maybe<Scalars['String']>;
  iec_contains_i?: Maybe<Scalars['String']>;
  iec_not_contains_i?: Maybe<Scalars['String']>;
  iec_starts_with_i?: Maybe<Scalars['String']>;
  iec_not_starts_with_i?: Maybe<Scalars['String']>;
  iec_ends_with_i?: Maybe<Scalars['String']>;
  iec_not_ends_with_i?: Maybe<Scalars['String']>;
  iec_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  iec_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  bic?: Maybe<Scalars['String']>;
  bic_not?: Maybe<Scalars['String']>;
  bic_contains?: Maybe<Scalars['String']>;
  bic_not_contains?: Maybe<Scalars['String']>;
  bic_starts_with?: Maybe<Scalars['String']>;
  bic_not_starts_with?: Maybe<Scalars['String']>;
  bic_ends_with?: Maybe<Scalars['String']>;
  bic_not_ends_with?: Maybe<Scalars['String']>;
  bic_i?: Maybe<Scalars['String']>;
  bic_not_i?: Maybe<Scalars['String']>;
  bic_contains_i?: Maybe<Scalars['String']>;
  bic_not_contains_i?: Maybe<Scalars['String']>;
  bic_starts_with_i?: Maybe<Scalars['String']>;
  bic_not_starts_with_i?: Maybe<Scalars['String']>;
  bic_ends_with_i?: Maybe<Scalars['String']>;
  bic_not_ends_with_i?: Maybe<Scalars['String']>;
  bic_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  bic_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  checkNumber?: Maybe<Scalars['String']>;
  checkNumber_not?: Maybe<Scalars['String']>;
  checkNumber_contains?: Maybe<Scalars['String']>;
  checkNumber_not_contains?: Maybe<Scalars['String']>;
  checkNumber_starts_with?: Maybe<Scalars['String']>;
  checkNumber_not_starts_with?: Maybe<Scalars['String']>;
  checkNumber_ends_with?: Maybe<Scalars['String']>;
  checkNumber_not_ends_with?: Maybe<Scalars['String']>;
  checkNumber_i?: Maybe<Scalars['String']>;
  checkNumber_not_i?: Maybe<Scalars['String']>;
  checkNumber_contains_i?: Maybe<Scalars['String']>;
  checkNumber_not_contains_i?: Maybe<Scalars['String']>;
  checkNumber_starts_with_i?: Maybe<Scalars['String']>;
  checkNumber_not_starts_with_i?: Maybe<Scalars['String']>;
  checkNumber_ends_with_i?: Maybe<Scalars['String']>;
  checkNumber_not_ends_with_i?: Maybe<Scalars['String']>;
  checkNumber_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  checkNumber_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingOrganizationHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingOrganizationHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingOrganizationHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingOrganizationHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingOrganizationHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingOrganizationHistoryRecordsCreateInput = {
  data?: Maybe<BillingOrganizationHistoryRecordCreateInput>;
};

export type BillingOrganizationHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingOrganizationHistoryRecordUpdateInput>;
};

export type BillingOrganizationRelateToOneInput = {
  create?: Maybe<BillingOrganizationCreateInput>;
  connect?: Maybe<BillingOrganizationWhereUniqueInput>;
  disconnect?: Maybe<BillingOrganizationWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type BillingOrganizationUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  tin?: Maybe<Scalars['String']>;
  iec?: Maybe<Scalars['String']>;
  bic?: Maybe<Scalars['String']>;
  checkNumber?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingOrganizationWhereInput = {
  AND?: Maybe<Array<Maybe<BillingOrganizationWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingOrganizationWhereInput>>>;
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
  context?: Maybe<BillingIntegrationOrganizationContextWhereInput>;
  context_is_null?: Maybe<Scalars['Boolean']>;
  tin?: Maybe<Scalars['String']>;
  tin_not?: Maybe<Scalars['String']>;
  tin_contains?: Maybe<Scalars['String']>;
  tin_not_contains?: Maybe<Scalars['String']>;
  tin_starts_with?: Maybe<Scalars['String']>;
  tin_not_starts_with?: Maybe<Scalars['String']>;
  tin_ends_with?: Maybe<Scalars['String']>;
  tin_not_ends_with?: Maybe<Scalars['String']>;
  tin_i?: Maybe<Scalars['String']>;
  tin_not_i?: Maybe<Scalars['String']>;
  tin_contains_i?: Maybe<Scalars['String']>;
  tin_not_contains_i?: Maybe<Scalars['String']>;
  tin_starts_with_i?: Maybe<Scalars['String']>;
  tin_not_starts_with_i?: Maybe<Scalars['String']>;
  tin_ends_with_i?: Maybe<Scalars['String']>;
  tin_not_ends_with_i?: Maybe<Scalars['String']>;
  tin_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  tin_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  iec?: Maybe<Scalars['String']>;
  iec_not?: Maybe<Scalars['String']>;
  iec_contains?: Maybe<Scalars['String']>;
  iec_not_contains?: Maybe<Scalars['String']>;
  iec_starts_with?: Maybe<Scalars['String']>;
  iec_not_starts_with?: Maybe<Scalars['String']>;
  iec_ends_with?: Maybe<Scalars['String']>;
  iec_not_ends_with?: Maybe<Scalars['String']>;
  iec_i?: Maybe<Scalars['String']>;
  iec_not_i?: Maybe<Scalars['String']>;
  iec_contains_i?: Maybe<Scalars['String']>;
  iec_not_contains_i?: Maybe<Scalars['String']>;
  iec_starts_with_i?: Maybe<Scalars['String']>;
  iec_not_starts_with_i?: Maybe<Scalars['String']>;
  iec_ends_with_i?: Maybe<Scalars['String']>;
  iec_not_ends_with_i?: Maybe<Scalars['String']>;
  iec_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  iec_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  bic?: Maybe<Scalars['String']>;
  bic_not?: Maybe<Scalars['String']>;
  bic_contains?: Maybe<Scalars['String']>;
  bic_not_contains?: Maybe<Scalars['String']>;
  bic_starts_with?: Maybe<Scalars['String']>;
  bic_not_starts_with?: Maybe<Scalars['String']>;
  bic_ends_with?: Maybe<Scalars['String']>;
  bic_not_ends_with?: Maybe<Scalars['String']>;
  bic_i?: Maybe<Scalars['String']>;
  bic_not_i?: Maybe<Scalars['String']>;
  bic_contains_i?: Maybe<Scalars['String']>;
  bic_not_contains_i?: Maybe<Scalars['String']>;
  bic_starts_with_i?: Maybe<Scalars['String']>;
  bic_not_starts_with_i?: Maybe<Scalars['String']>;
  bic_ends_with_i?: Maybe<Scalars['String']>;
  bic_not_ends_with_i?: Maybe<Scalars['String']>;
  bic_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  bic_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  checkNumber?: Maybe<Scalars['String']>;
  checkNumber_not?: Maybe<Scalars['String']>;
  checkNumber_contains?: Maybe<Scalars['String']>;
  checkNumber_not_contains?: Maybe<Scalars['String']>;
  checkNumber_starts_with?: Maybe<Scalars['String']>;
  checkNumber_not_starts_with?: Maybe<Scalars['String']>;
  checkNumber_ends_with?: Maybe<Scalars['String']>;
  checkNumber_not_ends_with?: Maybe<Scalars['String']>;
  checkNumber_i?: Maybe<Scalars['String']>;
  checkNumber_not_i?: Maybe<Scalars['String']>;
  checkNumber_contains_i?: Maybe<Scalars['String']>;
  checkNumber_not_contains_i?: Maybe<Scalars['String']>;
  checkNumber_starts_with_i?: Maybe<Scalars['String']>;
  checkNumber_not_starts_with_i?: Maybe<Scalars['String']>;
  checkNumber_ends_with_i?: Maybe<Scalars['String']>;
  checkNumber_not_ends_with_i?: Maybe<Scalars['String']>;
  checkNumber_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  checkNumber_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type BillingOrganizationWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingOrganizationsCreateInput = {
  data?: Maybe<BillingOrganizationCreateInput>;
};

export type BillingOrganizationsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingOrganizationUpdateInput>;
};

export type BillingPropertiesCreateInput = {
  data?: Maybe<BillingPropertyCreateInput>;
};

export type BillingPropertiesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingPropertyUpdateInput>;
};

/**  All `property` objects from `billing data source`  */
export type BillingProperty = {
  __typename?: 'BillingProperty';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingProperty List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingProperty List config, or
   *  3. As an alias to a 'name' field on the BillingProperty List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingProperty List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Integration context  */
  context?: Maybe<BillingIntegrationOrganizationContext>;
  /**  `billing data source` local object ID. Used only for the internal needs of the `integration component`  */
  importId?: Maybe<Scalars['String']>;
  /**  Raw non-structured data obtained from the `billing data source`. Used only for the internal needs of the `integration component`.  */
  raw?: Maybe<Scalars['JSON']>;
  /**  A well-known universal identifier that allows you to identify the same objects in different systems. It may differ in different countries. Example: for Russia, the FIAS ID is used  */
  globalId?: Maybe<Scalars['String']>;
  /**  The non-modified address from the `billing data source`. Used in `receipt template`  */
  address?: Maybe<Scalars['String']>;
  /**  Structured metadata obtained from the `billing data source`. Some of this data is required for use in the `receipt template`. Examples of data keys: `total space of building`, `property beginning of exploitation year`, `has cultural heritage status`, `number of underground floors`, `number of above-ground floors`  */
  meta?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingPropertyCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  globalId?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type BillingPropertyHistoryRecord = {
  __typename?: 'BillingPropertyHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingPropertyHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingPropertyHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingPropertyHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingPropertyHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  globalId?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingPropertyHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingPropertyHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  globalId?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingPropertyHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingPropertyHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingPropertyHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  globalId?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingPropertyHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingPropertyHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingPropertyHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingPropertyHistoryRecordWhereInput>>>;
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
  context?: Maybe<Scalars['String']>;
  context_not?: Maybe<Scalars['String']>;
  context_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  context_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  globalId?: Maybe<Scalars['String']>;
  globalId_not?: Maybe<Scalars['String']>;
  globalId_contains?: Maybe<Scalars['String']>;
  globalId_not_contains?: Maybe<Scalars['String']>;
  globalId_starts_with?: Maybe<Scalars['String']>;
  globalId_not_starts_with?: Maybe<Scalars['String']>;
  globalId_ends_with?: Maybe<Scalars['String']>;
  globalId_not_ends_with?: Maybe<Scalars['String']>;
  globalId_i?: Maybe<Scalars['String']>;
  globalId_not_i?: Maybe<Scalars['String']>;
  globalId_contains_i?: Maybe<Scalars['String']>;
  globalId_not_contains_i?: Maybe<Scalars['String']>;
  globalId_starts_with_i?: Maybe<Scalars['String']>;
  globalId_not_starts_with_i?: Maybe<Scalars['String']>;
  globalId_ends_with_i?: Maybe<Scalars['String']>;
  globalId_not_ends_with_i?: Maybe<Scalars['String']>;
  globalId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  globalId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingPropertyHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingPropertyHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingPropertyHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingPropertyHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingPropertyHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingPropertyHistoryRecordsCreateInput = {
  data?: Maybe<BillingPropertyHistoryRecordCreateInput>;
};

export type BillingPropertyHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingPropertyHistoryRecordUpdateInput>;
};

export type BillingPropertyRelateToOneInput = {
  create?: Maybe<BillingPropertyCreateInput>;
  connect?: Maybe<BillingPropertyWhereUniqueInput>;
  disconnect?: Maybe<BillingPropertyWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type BillingPropertyUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  globalId?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingPropertyWhereInput = {
  AND?: Maybe<Array<Maybe<BillingPropertyWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingPropertyWhereInput>>>;
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
  context?: Maybe<BillingIntegrationOrganizationContextWhereInput>;
  context_is_null?: Maybe<Scalars['Boolean']>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  globalId?: Maybe<Scalars['String']>;
  globalId_not?: Maybe<Scalars['String']>;
  globalId_contains?: Maybe<Scalars['String']>;
  globalId_not_contains?: Maybe<Scalars['String']>;
  globalId_starts_with?: Maybe<Scalars['String']>;
  globalId_not_starts_with?: Maybe<Scalars['String']>;
  globalId_ends_with?: Maybe<Scalars['String']>;
  globalId_not_ends_with?: Maybe<Scalars['String']>;
  globalId_i?: Maybe<Scalars['String']>;
  globalId_not_i?: Maybe<Scalars['String']>;
  globalId_contains_i?: Maybe<Scalars['String']>;
  globalId_not_contains_i?: Maybe<Scalars['String']>;
  globalId_starts_with_i?: Maybe<Scalars['String']>;
  globalId_not_starts_with_i?: Maybe<Scalars['String']>;
  globalId_ends_with_i?: Maybe<Scalars['String']>;
  globalId_not_ends_with_i?: Maybe<Scalars['String']>;
  globalId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  globalId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type BillingPropertyWhereUniqueInput = {
  id: Scalars['ID'];
};

/**  Account monthly invoice document  */
export type BillingReceipt = {
  __typename?: 'BillingReceipt';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingReceipt List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingReceipt List config, or
   *  3. As an alias to a 'name' field on the BillingReceipt List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingReceipt List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Integration context  */
  context?: Maybe<BillingIntegrationOrganizationContext>;
  /**  Billing property  */
  property?: Maybe<BillingProperty>;
  /**  Billing organization  */
  recipient?: Maybe<BillingOrganization>;
  /**  Billing account  */
  account?: Maybe<BillingAccount>;
  /**  `billing data source` local object ID. Used only for the internal needs of the `integration component`  */
  importId?: Maybe<Scalars['String']>;
  /**  Period date: Generated on template 01_<month>_<year>  */
  period?: Maybe<Scalars['String']>;
  /**  A number to print on the payment document.  */
  printableNumber?: Maybe<Scalars['String']>;
  /**  Raw non-structured data obtained from the `billing data source`. Used only for the internal needs of the `integration component`.  */
  raw?: Maybe<Scalars['JSON']>;
  /**  Total sum to pay. Usually counts as the sum of all services. Detail level 1.  */
  toPay?: Maybe<Scalars['String']>;
  /**  Sum to pay details. Detail level 2  */
  toPayDetails?: Maybe<Scalars['JSON']>;
  /**  Structured items in the receipt obtained from the `billing data source`. Amount of payment is required for use in the `receipt template`.  */
  services?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingReceiptCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  property?: Maybe<BillingPropertyRelateToOneInput>;
  recipient?: Maybe<BillingOrganizationRelateToOneInput>;
  account?: Maybe<BillingAccountRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  period?: Maybe<Scalars['String']>;
  printableNumber?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  toPay?: Maybe<Scalars['String']>;
  toPayDetails?: Maybe<Scalars['JSON']>;
  services?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type BillingReceiptHistoryRecord = {
  __typename?: 'BillingReceiptHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the BillingReceiptHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the BillingReceiptHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the BillingReceiptHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the BillingReceiptHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  property?: Maybe<Scalars['String']>;
  recipient?: Maybe<Scalars['String']>;
  account?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  period?: Maybe<Scalars['String']>;
  printableNumber?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  toPay?: Maybe<Scalars['String']>;
  toPayDetails?: Maybe<Scalars['JSON']>;
  services?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingReceiptHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingReceiptHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  property?: Maybe<Scalars['String']>;
  recipient?: Maybe<Scalars['String']>;
  account?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  period?: Maybe<Scalars['String']>;
  printableNumber?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  toPay?: Maybe<Scalars['String']>;
  toPayDetails?: Maybe<Scalars['JSON']>;
  services?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingReceiptHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum BillingReceiptHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type BillingReceiptHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<Scalars['String']>;
  property?: Maybe<Scalars['String']>;
  recipient?: Maybe<Scalars['String']>;
  account?: Maybe<Scalars['String']>;
  importId?: Maybe<Scalars['String']>;
  period?: Maybe<Scalars['String']>;
  printableNumber?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  toPay?: Maybe<Scalars['String']>;
  toPayDetails?: Maybe<Scalars['JSON']>;
  services?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<BillingReceiptHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type BillingReceiptHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<BillingReceiptHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingReceiptHistoryRecordWhereInput>>>;
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
  context?: Maybe<Scalars['String']>;
  context_not?: Maybe<Scalars['String']>;
  context_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  context_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property?: Maybe<Scalars['String']>;
  property_not?: Maybe<Scalars['String']>;
  property_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  recipient?: Maybe<Scalars['String']>;
  recipient_not?: Maybe<Scalars['String']>;
  recipient_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  recipient_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  account?: Maybe<Scalars['String']>;
  account_not?: Maybe<Scalars['String']>;
  account_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  account_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  period?: Maybe<Scalars['String']>;
  period_not?: Maybe<Scalars['String']>;
  period_lt?: Maybe<Scalars['String']>;
  period_lte?: Maybe<Scalars['String']>;
  period_gt?: Maybe<Scalars['String']>;
  period_gte?: Maybe<Scalars['String']>;
  period_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  period_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  printableNumber?: Maybe<Scalars['String']>;
  printableNumber_not?: Maybe<Scalars['String']>;
  printableNumber_contains?: Maybe<Scalars['String']>;
  printableNumber_not_contains?: Maybe<Scalars['String']>;
  printableNumber_starts_with?: Maybe<Scalars['String']>;
  printableNumber_not_starts_with?: Maybe<Scalars['String']>;
  printableNumber_ends_with?: Maybe<Scalars['String']>;
  printableNumber_not_ends_with?: Maybe<Scalars['String']>;
  printableNumber_i?: Maybe<Scalars['String']>;
  printableNumber_not_i?: Maybe<Scalars['String']>;
  printableNumber_contains_i?: Maybe<Scalars['String']>;
  printableNumber_not_contains_i?: Maybe<Scalars['String']>;
  printableNumber_starts_with_i?: Maybe<Scalars['String']>;
  printableNumber_not_starts_with_i?: Maybe<Scalars['String']>;
  printableNumber_ends_with_i?: Maybe<Scalars['String']>;
  printableNumber_not_ends_with_i?: Maybe<Scalars['String']>;
  printableNumber_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  printableNumber_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  toPay?: Maybe<Scalars['String']>;
  toPay_not?: Maybe<Scalars['String']>;
  toPay_contains?: Maybe<Scalars['String']>;
  toPay_not_contains?: Maybe<Scalars['String']>;
  toPay_starts_with?: Maybe<Scalars['String']>;
  toPay_not_starts_with?: Maybe<Scalars['String']>;
  toPay_ends_with?: Maybe<Scalars['String']>;
  toPay_not_ends_with?: Maybe<Scalars['String']>;
  toPay_i?: Maybe<Scalars['String']>;
  toPay_not_i?: Maybe<Scalars['String']>;
  toPay_contains_i?: Maybe<Scalars['String']>;
  toPay_not_contains_i?: Maybe<Scalars['String']>;
  toPay_starts_with_i?: Maybe<Scalars['String']>;
  toPay_not_starts_with_i?: Maybe<Scalars['String']>;
  toPay_ends_with_i?: Maybe<Scalars['String']>;
  toPay_not_ends_with_i?: Maybe<Scalars['String']>;
  toPay_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  toPay_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  toPayDetails?: Maybe<Scalars['JSON']>;
  toPayDetails_not?: Maybe<Scalars['JSON']>;
  toPayDetails_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  toPayDetails_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  services?: Maybe<Scalars['JSON']>;
  services_not?: Maybe<Scalars['JSON']>;
  services_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  services_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<BillingReceiptHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<BillingReceiptHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<BillingReceiptHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<BillingReceiptHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type BillingReceiptHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingReceiptHistoryRecordsCreateInput = {
  data?: Maybe<BillingReceiptHistoryRecordCreateInput>;
};

export type BillingReceiptHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingReceiptHistoryRecordUpdateInput>;
};

export type BillingReceiptUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  context?: Maybe<BillingIntegrationOrganizationContextRelateToOneInput>;
  property?: Maybe<BillingPropertyRelateToOneInput>;
  recipient?: Maybe<BillingOrganizationRelateToOneInput>;
  account?: Maybe<BillingAccountRelateToOneInput>;
  importId?: Maybe<Scalars['String']>;
  period?: Maybe<Scalars['String']>;
  printableNumber?: Maybe<Scalars['String']>;
  raw?: Maybe<Scalars['JSON']>;
  toPay?: Maybe<Scalars['String']>;
  toPayDetails?: Maybe<Scalars['JSON']>;
  services?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type BillingReceiptWhereInput = {
  AND?: Maybe<Array<Maybe<BillingReceiptWhereInput>>>;
  OR?: Maybe<Array<Maybe<BillingReceiptWhereInput>>>;
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
  context?: Maybe<BillingIntegrationOrganizationContextWhereInput>;
  context_is_null?: Maybe<Scalars['Boolean']>;
  property?: Maybe<BillingPropertyWhereInput>;
  property_is_null?: Maybe<Scalars['Boolean']>;
  recipient?: Maybe<BillingOrganizationWhereInput>;
  recipient_is_null?: Maybe<Scalars['Boolean']>;
  account?: Maybe<BillingAccountWhereInput>;
  account_is_null?: Maybe<Scalars['Boolean']>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  period?: Maybe<Scalars['String']>;
  period_not?: Maybe<Scalars['String']>;
  period_lt?: Maybe<Scalars['String']>;
  period_lte?: Maybe<Scalars['String']>;
  period_gt?: Maybe<Scalars['String']>;
  period_gte?: Maybe<Scalars['String']>;
  period_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  period_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  printableNumber?: Maybe<Scalars['String']>;
  printableNumber_not?: Maybe<Scalars['String']>;
  printableNumber_contains?: Maybe<Scalars['String']>;
  printableNumber_not_contains?: Maybe<Scalars['String']>;
  printableNumber_starts_with?: Maybe<Scalars['String']>;
  printableNumber_not_starts_with?: Maybe<Scalars['String']>;
  printableNumber_ends_with?: Maybe<Scalars['String']>;
  printableNumber_not_ends_with?: Maybe<Scalars['String']>;
  printableNumber_i?: Maybe<Scalars['String']>;
  printableNumber_not_i?: Maybe<Scalars['String']>;
  printableNumber_contains_i?: Maybe<Scalars['String']>;
  printableNumber_not_contains_i?: Maybe<Scalars['String']>;
  printableNumber_starts_with_i?: Maybe<Scalars['String']>;
  printableNumber_not_starts_with_i?: Maybe<Scalars['String']>;
  printableNumber_ends_with_i?: Maybe<Scalars['String']>;
  printableNumber_not_ends_with_i?: Maybe<Scalars['String']>;
  printableNumber_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  printableNumber_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  raw?: Maybe<Scalars['JSON']>;
  raw_not?: Maybe<Scalars['JSON']>;
  raw_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  raw_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  toPay?: Maybe<Scalars['String']>;
  toPay_not?: Maybe<Scalars['String']>;
  toPay_contains?: Maybe<Scalars['String']>;
  toPay_not_contains?: Maybe<Scalars['String']>;
  toPay_starts_with?: Maybe<Scalars['String']>;
  toPay_not_starts_with?: Maybe<Scalars['String']>;
  toPay_ends_with?: Maybe<Scalars['String']>;
  toPay_not_ends_with?: Maybe<Scalars['String']>;
  toPay_i?: Maybe<Scalars['String']>;
  toPay_not_i?: Maybe<Scalars['String']>;
  toPay_contains_i?: Maybe<Scalars['String']>;
  toPay_not_contains_i?: Maybe<Scalars['String']>;
  toPay_starts_with_i?: Maybe<Scalars['String']>;
  toPay_not_starts_with_i?: Maybe<Scalars['String']>;
  toPay_ends_with_i?: Maybe<Scalars['String']>;
  toPay_not_ends_with_i?: Maybe<Scalars['String']>;
  toPay_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  toPay_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  toPayDetails?: Maybe<Scalars['JSON']>;
  toPayDetails_not?: Maybe<Scalars['JSON']>;
  toPayDetails_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  toPayDetails_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  services?: Maybe<Scalars['JSON']>;
  services_not?: Maybe<Scalars['JSON']>;
  services_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  services_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
};

export type BillingReceiptWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BillingReceiptsCreateInput = {
  data?: Maybe<BillingReceiptCreateInput>;
};

export type BillingReceiptsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<BillingReceiptUpdateInput>;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

export type ChangePasswordWithTokenInput = {
  token: Scalars['String'];
  password: Scalars['String'];
};

export type ChangePasswordWithTokenOutput = {
  __typename?: 'ChangePasswordWithTokenOutput';
  status: Scalars['String'];
};

export type ChangePhoneNumberResidentUserInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  token: Scalars['String'];
};

export type ChangePhoneNumberResidentUserOutput = {
  __typename?: 'ChangePhoneNumberResidentUserOutput';
  status: Scalars['String'];
};

export type CheckPasswordRecoveryTokenInput = {
  token: Scalars['String'];
};

export type CheckPasswordRecoveryTokenOutput = {
  __typename?: 'CheckPasswordRecoveryTokenOutput';
  status: Scalars['String'];
};

export type CompleteConfirmPhoneActionInput = {
  token: Scalars['String'];
  smsCode: Scalars['Int'];
  captcha: Scalars['String'];
};

export type CompleteConfirmPhoneActionOutput = {
  __typename?: 'CompleteConfirmPhoneActionOutput';
  status: Scalars['String'];
};

/**  User confirm phone actions is used before registration starts  */
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
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Phone. In international E.164 format without spaces  */
  phone?: Maybe<Scalars['String']>;
  /**  Unique token to complete confirmation  */
  token?: Maybe<Scalars['String']>;
  /**  Last sms code sent to user  */
  smsCode?: Maybe<Scalars['Int']>;
  /**  Time when sms code was requested  */
  smsCodeRequestedAt?: Maybe<Scalars['String']>;
  /**  Time when sms code becomes not valid  */
  smsCodeExpiresAt?: Maybe<Scalars['String']>;
  /**  Number of times sms code input from user failed  */
  retries?: Maybe<Scalars['Int']>;
  /**  Phone verification flag. User verify phone by access to secret sms message  */
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  /**  DateTime when confirm phone action was started  */
  requestedAt?: Maybe<Scalars['String']>;
  /**  When confirm phone action becomes invalid  */
  expiresAt?: Maybe<Scalars['String']>;
  /**  When confirm phone action was completed  */
  completedAt?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type ConfirmPhoneActionCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  phone?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  smsCode?: Maybe<Scalars['Int']>;
  smsCodeRequestedAt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt?: Maybe<Scalars['String']>;
  retries?: Maybe<Scalars['Int']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  completedAt?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
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
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  phone?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  smsCode?: Maybe<Scalars['Int']>;
  smsCodeRequestedAt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt?: Maybe<Scalars['String']>;
  retries?: Maybe<Scalars['Int']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  completedAt?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ConfirmPhoneActionHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  phone?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  smsCode?: Maybe<Scalars['Int']>;
  smsCodeRequestedAt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt?: Maybe<Scalars['String']>;
  retries?: Maybe<Scalars['Int']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  completedAt?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
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
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  phone?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  smsCode?: Maybe<Scalars['Int']>;
  smsCodeRequestedAt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt?: Maybe<Scalars['String']>;
  retries?: Maybe<Scalars['Int']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  completedAt?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ConfirmPhoneActionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ConfirmPhoneActionHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<ConfirmPhoneActionHistoryRecordWhereInput>>>;
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
  token?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_contains?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
  token_i?: Maybe<Scalars['String']>;
  token_not_i?: Maybe<Scalars['String']>;
  token_contains_i?: Maybe<Scalars['String']>;
  token_not_contains_i?: Maybe<Scalars['String']>;
  token_starts_with_i?: Maybe<Scalars['String']>;
  token_not_starts_with_i?: Maybe<Scalars['String']>;
  token_ends_with_i?: Maybe<Scalars['String']>;
  token_not_ends_with_i?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  token_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  smsCode?: Maybe<Scalars['Int']>;
  smsCode_not?: Maybe<Scalars['Int']>;
  smsCode_lt?: Maybe<Scalars['Int']>;
  smsCode_lte?: Maybe<Scalars['Int']>;
  smsCode_gt?: Maybe<Scalars['Int']>;
  smsCode_gte?: Maybe<Scalars['Int']>;
  smsCode_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  smsCode_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  smsCodeRequestedAt?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_not?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_lt?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_lte?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_gt?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_gte?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  smsCodeRequestedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  smsCodeExpiresAt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_not?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_lt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_lte?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_gt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_gte?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  smsCodeExpiresAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  retries?: Maybe<Scalars['Int']>;
  retries_not?: Maybe<Scalars['Int']>;
  retries_lt?: Maybe<Scalars['Int']>;
  retries_lte?: Maybe<Scalars['Int']>;
  retries_gt?: Maybe<Scalars['Int']>;
  retries_gte?: Maybe<Scalars['Int']>;
  retries_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  retries_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  isPhoneVerified_not?: Maybe<Scalars['Boolean']>;
  requestedAt?: Maybe<Scalars['String']>;
  requestedAt_not?: Maybe<Scalars['String']>;
  requestedAt_lt?: Maybe<Scalars['String']>;
  requestedAt_lte?: Maybe<Scalars['String']>;
  requestedAt_gt?: Maybe<Scalars['String']>;
  requestedAt_gte?: Maybe<Scalars['String']>;
  requestedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  requestedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt?: Maybe<Scalars['String']>;
  expiresAt_not?: Maybe<Scalars['String']>;
  expiresAt_lt?: Maybe<Scalars['String']>;
  expiresAt_lte?: Maybe<Scalars['String']>;
  expiresAt_gt?: Maybe<Scalars['String']>;
  expiresAt_gte?: Maybe<Scalars['String']>;
  expiresAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  completedAt?: Maybe<Scalars['String']>;
  completedAt_not?: Maybe<Scalars['String']>;
  completedAt_lt?: Maybe<Scalars['String']>;
  completedAt_lte?: Maybe<Scalars['String']>;
  completedAt_gt?: Maybe<Scalars['String']>;
  completedAt_gte?: Maybe<Scalars['String']>;
  completedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  completedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
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
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  phone?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  smsCode?: Maybe<Scalars['Int']>;
  smsCodeRequestedAt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt?: Maybe<Scalars['String']>;
  retries?: Maybe<Scalars['Int']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  completedAt?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type ConfirmPhoneActionWhereInput = {
  AND?: Maybe<Array<Maybe<ConfirmPhoneActionWhereInput>>>;
  OR?: Maybe<Array<Maybe<ConfirmPhoneActionWhereInput>>>;
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
  token?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_contains?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
  token_i?: Maybe<Scalars['String']>;
  token_not_i?: Maybe<Scalars['String']>;
  token_contains_i?: Maybe<Scalars['String']>;
  token_not_contains_i?: Maybe<Scalars['String']>;
  token_starts_with_i?: Maybe<Scalars['String']>;
  token_not_starts_with_i?: Maybe<Scalars['String']>;
  token_ends_with_i?: Maybe<Scalars['String']>;
  token_not_ends_with_i?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  token_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  smsCode?: Maybe<Scalars['Int']>;
  smsCode_not?: Maybe<Scalars['Int']>;
  smsCode_lt?: Maybe<Scalars['Int']>;
  smsCode_lte?: Maybe<Scalars['Int']>;
  smsCode_gt?: Maybe<Scalars['Int']>;
  smsCode_gte?: Maybe<Scalars['Int']>;
  smsCode_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  smsCode_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  smsCodeRequestedAt?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_not?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_lt?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_lte?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_gt?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_gte?: Maybe<Scalars['String']>;
  smsCodeRequestedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  smsCodeRequestedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  smsCodeExpiresAt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_not?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_lt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_lte?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_gt?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_gte?: Maybe<Scalars['String']>;
  smsCodeExpiresAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  smsCodeExpiresAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  retries?: Maybe<Scalars['Int']>;
  retries_not?: Maybe<Scalars['Int']>;
  retries_lt?: Maybe<Scalars['Int']>;
  retries_lte?: Maybe<Scalars['Int']>;
  retries_gt?: Maybe<Scalars['Int']>;
  retries_gte?: Maybe<Scalars['Int']>;
  retries_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  retries_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  isPhoneVerified_not?: Maybe<Scalars['Boolean']>;
  requestedAt?: Maybe<Scalars['String']>;
  requestedAt_not?: Maybe<Scalars['String']>;
  requestedAt_lt?: Maybe<Scalars['String']>;
  requestedAt_lte?: Maybe<Scalars['String']>;
  requestedAt_gt?: Maybe<Scalars['String']>;
  requestedAt_gte?: Maybe<Scalars['String']>;
  requestedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  requestedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt?: Maybe<Scalars['String']>;
  expiresAt_not?: Maybe<Scalars['String']>;
  expiresAt_lt?: Maybe<Scalars['String']>;
  expiresAt_lte?: Maybe<Scalars['String']>;
  expiresAt_gt?: Maybe<Scalars['String']>;
  expiresAt_gte?: Maybe<Scalars['String']>;
  expiresAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  completedAt?: Maybe<Scalars['String']>;
  completedAt_not?: Maybe<Scalars['String']>;
  completedAt_lt?: Maybe<Scalars['String']>;
  completedAt_lte?: Maybe<Scalars['String']>;
  completedAt_gt?: Maybe<Scalars['String']>;
  completedAt_gte?: Maybe<Scalars['String']>;
  completedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  completedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
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

/**  Contact information of a person. Currently it will be related to a ticket, but in the future, it will be associated with more things  */
export type Contact = {
  __typename?: 'Contact';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the Contact List config, or
   *  2. As an alias to the field set on 'labelField' in the Contact List config, or
   *  3. As an alias to a 'name' field on the Contact List (if one exists), or
   *  4. As an alias to the 'id' field on the Contact List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  /**  Property, that is a subject of an issue, reported by this person in first ticket. Meaning of this field will be revised in the future  */
  property?: Maybe<Property>;
  /**  Property unit, that is a subject of an issue, reported by this person in first ticket. Meaning of this field will be revised in the future  */
  unitName?: Maybe<Scalars['String']>;
  /**  Normalized contact email of this person  */
  email?: Maybe<Scalars['String']>;
  /**  Normalized contact phone of this person in E.164 format without spaces  */
  phone?: Maybe<Scalars['String']>;
  /**  Name or full name of this person  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type ContactCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  property?: Maybe<PropertyRelateToOneInput>;
  unitName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type ContactHistoryRecord = {
  __typename?: 'ContactHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ContactHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the ContactHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the ContactHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the ContactHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  property?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ContactHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ContactHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  property?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ContactHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum ContactHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type ContactHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  property?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ContactHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ContactHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<ContactHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<ContactHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property?: Maybe<Scalars['String']>;
  property_not?: Maybe<Scalars['String']>;
  property_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName?: Maybe<Scalars['String']>;
  unitName_not?: Maybe<Scalars['String']>;
  unitName_contains?: Maybe<Scalars['String']>;
  unitName_not_contains?: Maybe<Scalars['String']>;
  unitName_starts_with?: Maybe<Scalars['String']>;
  unitName_not_starts_with?: Maybe<Scalars['String']>;
  unitName_ends_with?: Maybe<Scalars['String']>;
  unitName_not_ends_with?: Maybe<Scalars['String']>;
  unitName_i?: Maybe<Scalars['String']>;
  unitName_not_i?: Maybe<Scalars['String']>;
  unitName_contains_i?: Maybe<Scalars['String']>;
  unitName_not_contains_i?: Maybe<Scalars['String']>;
  unitName_starts_with_i?: Maybe<Scalars['String']>;
  unitName_not_starts_with_i?: Maybe<Scalars['String']>;
  unitName_ends_with_i?: Maybe<Scalars['String']>;
  unitName_not_ends_with_i?: Maybe<Scalars['String']>;
  unitName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<ContactHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<ContactHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<ContactHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<ContactHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type ContactHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type ContactHistoryRecordsCreateInput = {
  data?: Maybe<ContactHistoryRecordCreateInput>;
};

export type ContactHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<ContactHistoryRecordUpdateInput>;
};

export type ContactRelateToOneInput = {
  create?: Maybe<ContactCreateInput>;
  connect?: Maybe<ContactWhereUniqueInput>;
  disconnect?: Maybe<ContactWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type ContactUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  property?: Maybe<PropertyRelateToOneInput>;
  unitName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type ContactWhereInput = {
  AND?: Maybe<Array<Maybe<ContactWhereInput>>>;
  OR?: Maybe<Array<Maybe<ContactWhereInput>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  property?: Maybe<PropertyWhereInput>;
  property_is_null?: Maybe<Scalars['Boolean']>;
  unitName?: Maybe<Scalars['String']>;
  unitName_not?: Maybe<Scalars['String']>;
  unitName_contains?: Maybe<Scalars['String']>;
  unitName_not_contains?: Maybe<Scalars['String']>;
  unitName_starts_with?: Maybe<Scalars['String']>;
  unitName_not_starts_with?: Maybe<Scalars['String']>;
  unitName_ends_with?: Maybe<Scalars['String']>;
  unitName_not_ends_with?: Maybe<Scalars['String']>;
  unitName_i?: Maybe<Scalars['String']>;
  unitName_not_i?: Maybe<Scalars['String']>;
  unitName_contains_i?: Maybe<Scalars['String']>;
  unitName_not_contains_i?: Maybe<Scalars['String']>;
  unitName_starts_with_i?: Maybe<Scalars['String']>;
  unitName_not_starts_with_i?: Maybe<Scalars['String']>;
  unitName_ends_with_i?: Maybe<Scalars['String']>;
  unitName_not_ends_with_i?: Maybe<Scalars['String']>;
  unitName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type ContactWhereUniqueInput = {
  id: Scalars['ID'];
};

export type ContactsCreateInput = {
  data?: Maybe<ContactCreateInput>;
};

export type ContactsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<ContactUpdateInput>;
};

export type ExportTicketsToExcelInput = {
  where: TicketWhereInput;
  sortBy?: Maybe<Array<SortTicketsBy>>;
  timeZone: Scalars['String'];
};

export type ExportTicketsToExcelOutput = {
  __typename?: 'ExportTicketsToExcelOutput';
  status: Scalars['String'];
  linkToFile: Scalars['String'];
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

/**  Forgot password actions is used for anonymous user password recovery procedure  */
export type ForgotPasswordAction = {
  __typename?: 'ForgotPasswordAction';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ForgotPasswordAction List config, or
   *  2. As an alias to the field set on 'labelField' in the ForgotPasswordAction List config, or
   *  3. As an alias to a 'name' field on the ForgotPasswordAction List (if one exists), or
   *  4. As an alias to the 'id' field on the ForgotPasswordAction List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the user. The object will be deleted if the user ceases to exist  */
  user?: Maybe<User>;
  /**  Unique token to complete confirmation  */
  token?: Maybe<Scalars['String']>;
  /**  DateTime when confirm phone action was started  */
  requestedAt?: Maybe<Scalars['String']>;
  /**  When password recovery action becomes invalid  */
  expiresAt?: Maybe<Scalars['String']>;
  /**  When password recovery action was completed  */
  usedAt?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type ForgotPasswordActionCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<UserRelateToOneInput>;
  token?: Maybe<Scalars['String']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  usedAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type ForgotPasswordActionHistoryRecord = {
  __typename?: 'ForgotPasswordActionHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ForgotPasswordActionHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the ForgotPasswordActionHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the ForgotPasswordActionHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the ForgotPasswordActionHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  usedAt?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ForgotPasswordActionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ForgotPasswordActionHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  usedAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ForgotPasswordActionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum ForgotPasswordActionHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type ForgotPasswordActionHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  usedAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ForgotPasswordActionHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ForgotPasswordActionHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecordWhereInput>>>;
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
  user?: Maybe<Scalars['String']>;
  user_not?: Maybe<Scalars['String']>;
  user_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  token?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_contains?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
  token_i?: Maybe<Scalars['String']>;
  token_not_i?: Maybe<Scalars['String']>;
  token_contains_i?: Maybe<Scalars['String']>;
  token_not_contains_i?: Maybe<Scalars['String']>;
  token_starts_with_i?: Maybe<Scalars['String']>;
  token_not_starts_with_i?: Maybe<Scalars['String']>;
  token_ends_with_i?: Maybe<Scalars['String']>;
  token_not_ends_with_i?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  token_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  requestedAt?: Maybe<Scalars['String']>;
  requestedAt_not?: Maybe<Scalars['String']>;
  requestedAt_lt?: Maybe<Scalars['String']>;
  requestedAt_lte?: Maybe<Scalars['String']>;
  requestedAt_gt?: Maybe<Scalars['String']>;
  requestedAt_gte?: Maybe<Scalars['String']>;
  requestedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  requestedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt?: Maybe<Scalars['String']>;
  expiresAt_not?: Maybe<Scalars['String']>;
  expiresAt_lt?: Maybe<Scalars['String']>;
  expiresAt_lte?: Maybe<Scalars['String']>;
  expiresAt_gt?: Maybe<Scalars['String']>;
  expiresAt_gte?: Maybe<Scalars['String']>;
  expiresAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  usedAt?: Maybe<Scalars['String']>;
  usedAt_not?: Maybe<Scalars['String']>;
  usedAt_lt?: Maybe<Scalars['String']>;
  usedAt_lte?: Maybe<Scalars['String']>;
  usedAt_gt?: Maybe<Scalars['String']>;
  usedAt_gte?: Maybe<Scalars['String']>;
  usedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  usedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<ForgotPasswordActionHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<ForgotPasswordActionHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type ForgotPasswordActionHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type ForgotPasswordActionHistoryRecordsCreateInput = {
  data?: Maybe<ForgotPasswordActionHistoryRecordCreateInput>;
};

export type ForgotPasswordActionHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<ForgotPasswordActionHistoryRecordUpdateInput>;
};

export type ForgotPasswordActionUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<UserRelateToOneInput>;
  token?: Maybe<Scalars['String']>;
  requestedAt?: Maybe<Scalars['String']>;
  expiresAt?: Maybe<Scalars['String']>;
  usedAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type ForgotPasswordActionWhereInput = {
  AND?: Maybe<Array<Maybe<ForgotPasswordActionWhereInput>>>;
  OR?: Maybe<Array<Maybe<ForgotPasswordActionWhereInput>>>;
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
  user?: Maybe<UserWhereInput>;
  user_is_null?: Maybe<Scalars['Boolean']>;
  token?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_contains?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
  token_i?: Maybe<Scalars['String']>;
  token_not_i?: Maybe<Scalars['String']>;
  token_contains_i?: Maybe<Scalars['String']>;
  token_not_contains_i?: Maybe<Scalars['String']>;
  token_starts_with_i?: Maybe<Scalars['String']>;
  token_not_starts_with_i?: Maybe<Scalars['String']>;
  token_ends_with_i?: Maybe<Scalars['String']>;
  token_not_ends_with_i?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  token_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  requestedAt?: Maybe<Scalars['String']>;
  requestedAt_not?: Maybe<Scalars['String']>;
  requestedAt_lt?: Maybe<Scalars['String']>;
  requestedAt_lte?: Maybe<Scalars['String']>;
  requestedAt_gt?: Maybe<Scalars['String']>;
  requestedAt_gte?: Maybe<Scalars['String']>;
  requestedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  requestedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt?: Maybe<Scalars['String']>;
  expiresAt_not?: Maybe<Scalars['String']>;
  expiresAt_lt?: Maybe<Scalars['String']>;
  expiresAt_lte?: Maybe<Scalars['String']>;
  expiresAt_gt?: Maybe<Scalars['String']>;
  expiresAt_gte?: Maybe<Scalars['String']>;
  expiresAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  expiresAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  usedAt?: Maybe<Scalars['String']>;
  usedAt_not?: Maybe<Scalars['String']>;
  usedAt_lt?: Maybe<Scalars['String']>;
  usedAt_lte?: Maybe<Scalars['String']>;
  usedAt_gt?: Maybe<Scalars['String']>;
  usedAt_gte?: Maybe<Scalars['String']>;
  usedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  usedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type ForgotPasswordActionWhereUniqueInput = {
  id: Scalars['ID'];
};

export type ForgotPasswordActionsCreateInput = {
  data?: Maybe<ForgotPasswordActionCreateInput>;
};

export type ForgotPasswordActionsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<ForgotPasswordActionUpdateInput>;
};

export type GetPhoneByConfirmPhoneActionTokenInput = {
  token: Scalars['String'];
  captcha: Scalars['String'];
};

export type GetPhoneByConfirmPhoneActionTokenOutput = {
  __typename?: 'GetPhoneByConfirmPhoneActionTokenOutput';
  phone: Scalars['String'];
  isPhoneVerified: Scalars['Boolean'];
};

export type InviteNewOrganizationEmployeeInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  organization: OrganizationWhereUniqueInput;
  email: Scalars['String'];
  phone?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  role?: Maybe<OrganizationEmployeeWhereUniqueInput>;
  position?: Maybe<Scalars['String']>;
};


/**  Notification message  */
export type Message = {
  __typename?: 'Message';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the Message List config, or
   *  2. As an alias to the field set on 'labelField' in the Message List config, or
   *  3. As an alias to a 'name' field on the Message List (if one exists), or
   *  4. As an alias to the 'id' field on the Message List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  This message is related to some organization. Organization can manage their messages  */
  organization?: Maybe<Organization>;
  /**  to User  */
  user?: Maybe<User>;
  /**  to Phone  */
  phone?: Maybe<Scalars['String']>;
  /**  to Email  */
  email?: Maybe<Scalars['String']>;
  /**  Message status  */
  lang?: Maybe<MessageLangType>;
  /**  Message type  */
  type?: Maybe<Scalars['String']>;
  /**  Message context  */
  meta?: Maybe<Scalars['JSON']>;
  /**  Message status  */
  status?: Maybe<MessageStatusType>;
  /**  Task processing metadata. Just for debug purpose. You can see exactly what and where the message was sent  */
  processingMeta?: Maybe<Scalars['JSON']>;
  /**  Delivered at time  */
  deliveredAt?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type MessageCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  user?: Maybe<UserRelateToOneInput>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  lang?: Maybe<MessageLangType>;
  type?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  status?: Maybe<MessageStatusType>;
  processingMeta?: Maybe<Scalars['JSON']>;
  deliveredAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type MessageHistoryRecord = {
  __typename?: 'MessageHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the MessageHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the MessageHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the MessageHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the MessageHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  lang?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  status?: Maybe<Scalars['String']>;
  processingMeta?: Maybe<Scalars['JSON']>;
  deliveredAt?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<MessageHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type MessageHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  lang?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  status?: Maybe<Scalars['String']>;
  processingMeta?: Maybe<Scalars['JSON']>;
  deliveredAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<MessageHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum MessageHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type MessageHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  lang?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  status?: Maybe<Scalars['String']>;
  processingMeta?: Maybe<Scalars['JSON']>;
  deliveredAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<MessageHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type MessageHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<MessageHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<MessageHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user?: Maybe<Scalars['String']>;
  user_not?: Maybe<Scalars['String']>;
  user_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  lang?: Maybe<Scalars['String']>;
  lang_not?: Maybe<Scalars['String']>;
  lang_contains?: Maybe<Scalars['String']>;
  lang_not_contains?: Maybe<Scalars['String']>;
  lang_starts_with?: Maybe<Scalars['String']>;
  lang_not_starts_with?: Maybe<Scalars['String']>;
  lang_ends_with?: Maybe<Scalars['String']>;
  lang_not_ends_with?: Maybe<Scalars['String']>;
  lang_i?: Maybe<Scalars['String']>;
  lang_not_i?: Maybe<Scalars['String']>;
  lang_contains_i?: Maybe<Scalars['String']>;
  lang_not_contains_i?: Maybe<Scalars['String']>;
  lang_starts_with_i?: Maybe<Scalars['String']>;
  lang_not_starts_with_i?: Maybe<Scalars['String']>;
  lang_ends_with_i?: Maybe<Scalars['String']>;
  lang_not_ends_with_i?: Maybe<Scalars['String']>;
  lang_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  lang_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type?: Maybe<Scalars['String']>;
  type_not?: Maybe<Scalars['String']>;
  type_contains?: Maybe<Scalars['String']>;
  type_not_contains?: Maybe<Scalars['String']>;
  type_starts_with?: Maybe<Scalars['String']>;
  type_not_starts_with?: Maybe<Scalars['String']>;
  type_ends_with?: Maybe<Scalars['String']>;
  type_not_ends_with?: Maybe<Scalars['String']>;
  type_i?: Maybe<Scalars['String']>;
  type_not_i?: Maybe<Scalars['String']>;
  type_contains_i?: Maybe<Scalars['String']>;
  type_not_contains_i?: Maybe<Scalars['String']>;
  type_starts_with_i?: Maybe<Scalars['String']>;
  type_not_starts_with_i?: Maybe<Scalars['String']>;
  type_ends_with_i?: Maybe<Scalars['String']>;
  type_not_ends_with_i?: Maybe<Scalars['String']>;
  type_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  status?: Maybe<Scalars['String']>;
  status_not?: Maybe<Scalars['String']>;
  status_contains?: Maybe<Scalars['String']>;
  status_not_contains?: Maybe<Scalars['String']>;
  status_starts_with?: Maybe<Scalars['String']>;
  status_not_starts_with?: Maybe<Scalars['String']>;
  status_ends_with?: Maybe<Scalars['String']>;
  status_not_ends_with?: Maybe<Scalars['String']>;
  status_i?: Maybe<Scalars['String']>;
  status_not_i?: Maybe<Scalars['String']>;
  status_contains_i?: Maybe<Scalars['String']>;
  status_not_contains_i?: Maybe<Scalars['String']>;
  status_starts_with_i?: Maybe<Scalars['String']>;
  status_not_starts_with_i?: Maybe<Scalars['String']>;
  status_ends_with_i?: Maybe<Scalars['String']>;
  status_not_ends_with_i?: Maybe<Scalars['String']>;
  status_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  status_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  processingMeta?: Maybe<Scalars['JSON']>;
  processingMeta_not?: Maybe<Scalars['JSON']>;
  processingMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  processingMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  deliveredAt?: Maybe<Scalars['String']>;
  deliveredAt_not?: Maybe<Scalars['String']>;
  deliveredAt_lt?: Maybe<Scalars['String']>;
  deliveredAt_lte?: Maybe<Scalars['String']>;
  deliveredAt_gt?: Maybe<Scalars['String']>;
  deliveredAt_gte?: Maybe<Scalars['String']>;
  deliveredAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deliveredAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<MessageHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<MessageHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<MessageHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<MessageHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type MessageHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type MessageHistoryRecordsCreateInput = {
  data?: Maybe<MessageHistoryRecordCreateInput>;
};

export type MessageHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<MessageHistoryRecordUpdateInput>;
};

export enum MessageLangType {
  Ru = 'ru',
  En = 'en'
}

export enum MessageStatusType {
  Sending = 'sending',
  Resending = 'resending',
  Processing = 'processing',
  Error = 'error',
  Delivered = 'delivered',
  Canceled = 'canceled'
}

export type MessageUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  user?: Maybe<UserRelateToOneInput>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  lang?: Maybe<MessageLangType>;
  type?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
  status?: Maybe<MessageStatusType>;
  processingMeta?: Maybe<Scalars['JSON']>;
  deliveredAt?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type MessageWhereInput = {
  AND?: Maybe<Array<Maybe<MessageWhereInput>>>;
  OR?: Maybe<Array<Maybe<MessageWhereInput>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  user?: Maybe<UserWhereInput>;
  user_is_null?: Maybe<Scalars['Boolean']>;
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
  lang?: Maybe<MessageLangType>;
  lang_not?: Maybe<MessageLangType>;
  lang_in?: Maybe<Array<Maybe<MessageLangType>>>;
  lang_not_in?: Maybe<Array<Maybe<MessageLangType>>>;
  type?: Maybe<Scalars['String']>;
  type_not?: Maybe<Scalars['String']>;
  type_contains?: Maybe<Scalars['String']>;
  type_not_contains?: Maybe<Scalars['String']>;
  type_starts_with?: Maybe<Scalars['String']>;
  type_not_starts_with?: Maybe<Scalars['String']>;
  type_ends_with?: Maybe<Scalars['String']>;
  type_not_ends_with?: Maybe<Scalars['String']>;
  type_i?: Maybe<Scalars['String']>;
  type_not_i?: Maybe<Scalars['String']>;
  type_contains_i?: Maybe<Scalars['String']>;
  type_not_contains_i?: Maybe<Scalars['String']>;
  type_starts_with_i?: Maybe<Scalars['String']>;
  type_not_starts_with_i?: Maybe<Scalars['String']>;
  type_ends_with_i?: Maybe<Scalars['String']>;
  type_not_ends_with_i?: Maybe<Scalars['String']>;
  type_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  status?: Maybe<MessageStatusType>;
  status_not?: Maybe<MessageStatusType>;
  status_in?: Maybe<Array<Maybe<MessageStatusType>>>;
  status_not_in?: Maybe<Array<Maybe<MessageStatusType>>>;
  processingMeta?: Maybe<Scalars['JSON']>;
  processingMeta_not?: Maybe<Scalars['JSON']>;
  processingMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  processingMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  deliveredAt?: Maybe<Scalars['String']>;
  deliveredAt_not?: Maybe<Scalars['String']>;
  deliveredAt_lt?: Maybe<Scalars['String']>;
  deliveredAt_lte?: Maybe<Scalars['String']>;
  deliveredAt_gt?: Maybe<Scalars['String']>;
  deliveredAt_gte?: Maybe<Scalars['String']>;
  deliveredAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deliveredAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type MessageWhereUniqueInput = {
  id: Scalars['ID'];
};

export type MessagesCreateInput = {
  data?: Maybe<MessageCreateInput>;
};

export type MessagesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<MessageUpdateInput>;
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
  /**  Create a single ForgotPasswordActionHistoryRecord item.  */
  createForgotPasswordActionHistoryRecord?: Maybe<ForgotPasswordActionHistoryRecord>;
  /**  Create multiple ForgotPasswordActionHistoryRecord items.  */
  createForgotPasswordActionHistoryRecords?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecord>>>;
  /**  Update a single ForgotPasswordActionHistoryRecord item by ID.  */
  updateForgotPasswordActionHistoryRecord?: Maybe<ForgotPasswordActionHistoryRecord>;
  /**  Update multiple ForgotPasswordActionHistoryRecord items by ID.  */
  updateForgotPasswordActionHistoryRecords?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecord>>>;
  /**  Delete a single ForgotPasswordActionHistoryRecord item by ID.  */
  deleteForgotPasswordActionHistoryRecord?: Maybe<ForgotPasswordActionHistoryRecord>;
  /**  Delete multiple ForgotPasswordActionHistoryRecord items by ID.  */
  deleteForgotPasswordActionHistoryRecords?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecord>>>;
  /**  Create a single ForgotPasswordAction item.  */
  createForgotPasswordAction?: Maybe<ForgotPasswordAction>;
  /**  Create multiple ForgotPasswordAction items.  */
  createForgotPasswordActions?: Maybe<Array<Maybe<ForgotPasswordAction>>>;
  /**  Update a single ForgotPasswordAction item by ID.  */
  updateForgotPasswordAction?: Maybe<ForgotPasswordAction>;
  /**  Update multiple ForgotPasswordAction items by ID.  */
  updateForgotPasswordActions?: Maybe<Array<Maybe<ForgotPasswordAction>>>;
  /**  Delete a single ForgotPasswordAction item by ID.  */
  deleteForgotPasswordAction?: Maybe<ForgotPasswordAction>;
  /**  Delete multiple ForgotPasswordAction items by ID.  */
  deleteForgotPasswordActions?: Maybe<Array<Maybe<ForgotPasswordAction>>>;
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
  /**  Create a single OrganizationHistoryRecord item.  */
  createOrganizationHistoryRecord?: Maybe<OrganizationHistoryRecord>;
  /**  Create multiple OrganizationHistoryRecord items.  */
  createOrganizationHistoryRecords?: Maybe<Array<Maybe<OrganizationHistoryRecord>>>;
  /**  Update a single OrganizationHistoryRecord item by ID.  */
  updateOrganizationHistoryRecord?: Maybe<OrganizationHistoryRecord>;
  /**  Update multiple OrganizationHistoryRecord items by ID.  */
  updateOrganizationHistoryRecords?: Maybe<Array<Maybe<OrganizationHistoryRecord>>>;
  /**  Delete a single OrganizationHistoryRecord item by ID.  */
  deleteOrganizationHistoryRecord?: Maybe<OrganizationHistoryRecord>;
  /**  Delete multiple OrganizationHistoryRecord items by ID.  */
  deleteOrganizationHistoryRecords?: Maybe<Array<Maybe<OrganizationHistoryRecord>>>;
  /**  Create a single Organization item.  */
  createOrganization?: Maybe<Organization>;
  /**  Create multiple Organization items.  */
  createOrganizations?: Maybe<Array<Maybe<Organization>>>;
  /**  Update a single Organization item by ID.  */
  updateOrganization?: Maybe<Organization>;
  /**  Update multiple Organization items by ID.  */
  updateOrganizations?: Maybe<Array<Maybe<Organization>>>;
  /**  Delete a single Organization item by ID.  */
  deleteOrganization?: Maybe<Organization>;
  /**  Delete multiple Organization items by ID.  */
  deleteOrganizations?: Maybe<Array<Maybe<Organization>>>;
  /**  Create a single OrganizationEmployeeHistoryRecord item.  */
  createOrganizationEmployeeHistoryRecord?: Maybe<OrganizationEmployeeHistoryRecord>;
  /**  Create multiple OrganizationEmployeeHistoryRecord items.  */
  createOrganizationEmployeeHistoryRecords?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecord>>>;
  /**  Update a single OrganizationEmployeeHistoryRecord item by ID.  */
  updateOrganizationEmployeeHistoryRecord?: Maybe<OrganizationEmployeeHistoryRecord>;
  /**  Update multiple OrganizationEmployeeHistoryRecord items by ID.  */
  updateOrganizationEmployeeHistoryRecords?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecord>>>;
  /**  Delete a single OrganizationEmployeeHistoryRecord item by ID.  */
  deleteOrganizationEmployeeHistoryRecord?: Maybe<OrganizationEmployeeHistoryRecord>;
  /**  Delete multiple OrganizationEmployeeHistoryRecord items by ID.  */
  deleteOrganizationEmployeeHistoryRecords?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecord>>>;
  /**  Create a single OrganizationEmployee item.  */
  createOrganizationEmployee?: Maybe<OrganizationEmployee>;
  /**  Create multiple OrganizationEmployee items.  */
  createOrganizationEmployees?: Maybe<Array<Maybe<OrganizationEmployee>>>;
  /**  Update a single OrganizationEmployee item by ID.  */
  updateOrganizationEmployee?: Maybe<OrganizationEmployee>;
  /**  Update multiple OrganizationEmployee items by ID.  */
  updateOrganizationEmployees?: Maybe<Array<Maybe<OrganizationEmployee>>>;
  /**  Delete a single OrganizationEmployee item by ID.  */
  deleteOrganizationEmployee?: Maybe<OrganizationEmployee>;
  /**  Delete multiple OrganizationEmployee items by ID.  */
  deleteOrganizationEmployees?: Maybe<Array<Maybe<OrganizationEmployee>>>;
  /**  Create a single OrganizationEmployeeRoleHistoryRecord item.  */
  createOrganizationEmployeeRoleHistoryRecord?: Maybe<OrganizationEmployeeRoleHistoryRecord>;
  /**  Create multiple OrganizationEmployeeRoleHistoryRecord items.  */
  createOrganizationEmployeeRoleHistoryRecords?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecord>>>;
  /**  Update a single OrganizationEmployeeRoleHistoryRecord item by ID.  */
  updateOrganizationEmployeeRoleHistoryRecord?: Maybe<OrganizationEmployeeRoleHistoryRecord>;
  /**  Update multiple OrganizationEmployeeRoleHistoryRecord items by ID.  */
  updateOrganizationEmployeeRoleHistoryRecords?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecord>>>;
  /**  Delete a single OrganizationEmployeeRoleHistoryRecord item by ID.  */
  deleteOrganizationEmployeeRoleHistoryRecord?: Maybe<OrganizationEmployeeRoleHistoryRecord>;
  /**  Delete multiple OrganizationEmployeeRoleHistoryRecord items by ID.  */
  deleteOrganizationEmployeeRoleHistoryRecords?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecord>>>;
  /**  Create a single OrganizationEmployeeRole item.  */
  createOrganizationEmployeeRole?: Maybe<OrganizationEmployeeRole>;
  /**  Create multiple OrganizationEmployeeRole items.  */
  createOrganizationEmployeeRoles?: Maybe<Array<Maybe<OrganizationEmployeeRole>>>;
  /**  Update a single OrganizationEmployeeRole item by ID.  */
  updateOrganizationEmployeeRole?: Maybe<OrganizationEmployeeRole>;
  /**  Update multiple OrganizationEmployeeRole items by ID.  */
  updateOrganizationEmployeeRoles?: Maybe<Array<Maybe<OrganizationEmployeeRole>>>;
  /**  Delete a single OrganizationEmployeeRole item by ID.  */
  deleteOrganizationEmployeeRole?: Maybe<OrganizationEmployeeRole>;
  /**  Delete multiple OrganizationEmployeeRole items by ID.  */
  deleteOrganizationEmployeeRoles?: Maybe<Array<Maybe<OrganizationEmployeeRole>>>;
  /**  Create a single PropertyHistoryRecord item.  */
  createPropertyHistoryRecord?: Maybe<PropertyHistoryRecord>;
  /**  Create multiple PropertyHistoryRecord items.  */
  createPropertyHistoryRecords?: Maybe<Array<Maybe<PropertyHistoryRecord>>>;
  /**  Update a single PropertyHistoryRecord item by ID.  */
  updatePropertyHistoryRecord?: Maybe<PropertyHistoryRecord>;
  /**  Update multiple PropertyHistoryRecord items by ID.  */
  updatePropertyHistoryRecords?: Maybe<Array<Maybe<PropertyHistoryRecord>>>;
  /**  Delete a single PropertyHistoryRecord item by ID.  */
  deletePropertyHistoryRecord?: Maybe<PropertyHistoryRecord>;
  /**  Delete multiple PropertyHistoryRecord items by ID.  */
  deletePropertyHistoryRecords?: Maybe<Array<Maybe<PropertyHistoryRecord>>>;
  /**  Create a single Property item.  */
  createProperty?: Maybe<Property>;
  /**  Create multiple Property items.  */
  createProperties?: Maybe<Array<Maybe<Property>>>;
  /**  Update a single Property item by ID.  */
  updateProperty?: Maybe<Property>;
  /**  Update multiple Property items by ID.  */
  updateProperties?: Maybe<Array<Maybe<Property>>>;
  /**  Delete a single Property item by ID.  */
  deleteProperty?: Maybe<Property>;
  /**  Delete multiple Property items by ID.  */
  deleteProperties?: Maybe<Array<Maybe<Property>>>;
  /**  Create a single BillingIntegrationHistoryRecord item.  */
  createBillingIntegrationHistoryRecord?: Maybe<BillingIntegrationHistoryRecord>;
  /**  Create multiple BillingIntegrationHistoryRecord items.  */
  createBillingIntegrationHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationHistoryRecord>>>;
  /**  Update a single BillingIntegrationHistoryRecord item by ID.  */
  updateBillingIntegrationHistoryRecord?: Maybe<BillingIntegrationHistoryRecord>;
  /**  Update multiple BillingIntegrationHistoryRecord items by ID.  */
  updateBillingIntegrationHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationHistoryRecord>>>;
  /**  Delete a single BillingIntegrationHistoryRecord item by ID.  */
  deleteBillingIntegrationHistoryRecord?: Maybe<BillingIntegrationHistoryRecord>;
  /**  Delete multiple BillingIntegrationHistoryRecord items by ID.  */
  deleteBillingIntegrationHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationHistoryRecord>>>;
  /**  Create a single BillingIntegration item.  */
  createBillingIntegration?: Maybe<BillingIntegration>;
  /**  Create multiple BillingIntegration items.  */
  createBillingIntegrations?: Maybe<Array<Maybe<BillingIntegration>>>;
  /**  Update a single BillingIntegration item by ID.  */
  updateBillingIntegration?: Maybe<BillingIntegration>;
  /**  Update multiple BillingIntegration items by ID.  */
  updateBillingIntegrations?: Maybe<Array<Maybe<BillingIntegration>>>;
  /**  Delete a single BillingIntegration item by ID.  */
  deleteBillingIntegration?: Maybe<BillingIntegration>;
  /**  Delete multiple BillingIntegration items by ID.  */
  deleteBillingIntegrations?: Maybe<Array<Maybe<BillingIntegration>>>;
  /**  Create a single BillingIntegrationAccessRightHistoryRecord item.  */
  createBillingIntegrationAccessRightHistoryRecord?: Maybe<BillingIntegrationAccessRightHistoryRecord>;
  /**  Create multiple BillingIntegrationAccessRightHistoryRecord items.  */
  createBillingIntegrationAccessRightHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecord>>>;
  /**  Update a single BillingIntegrationAccessRightHistoryRecord item by ID.  */
  updateBillingIntegrationAccessRightHistoryRecord?: Maybe<BillingIntegrationAccessRightHistoryRecord>;
  /**  Update multiple BillingIntegrationAccessRightHistoryRecord items by ID.  */
  updateBillingIntegrationAccessRightHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecord>>>;
  /**  Delete a single BillingIntegrationAccessRightHistoryRecord item by ID.  */
  deleteBillingIntegrationAccessRightHistoryRecord?: Maybe<BillingIntegrationAccessRightHistoryRecord>;
  /**  Delete multiple BillingIntegrationAccessRightHistoryRecord items by ID.  */
  deleteBillingIntegrationAccessRightHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecord>>>;
  /**  Create a single BillingIntegrationAccessRight item.  */
  createBillingIntegrationAccessRight?: Maybe<BillingIntegrationAccessRight>;
  /**  Create multiple BillingIntegrationAccessRight items.  */
  createBillingIntegrationAccessRights?: Maybe<Array<Maybe<BillingIntegrationAccessRight>>>;
  /**  Update a single BillingIntegrationAccessRight item by ID.  */
  updateBillingIntegrationAccessRight?: Maybe<BillingIntegrationAccessRight>;
  /**  Update multiple BillingIntegrationAccessRight items by ID.  */
  updateBillingIntegrationAccessRights?: Maybe<Array<Maybe<BillingIntegrationAccessRight>>>;
  /**  Delete a single BillingIntegrationAccessRight item by ID.  */
  deleteBillingIntegrationAccessRight?: Maybe<BillingIntegrationAccessRight>;
  /**  Delete multiple BillingIntegrationAccessRight items by ID.  */
  deleteBillingIntegrationAccessRights?: Maybe<Array<Maybe<BillingIntegrationAccessRight>>>;
  /**  Create a single BillingIntegrationOrganizationContextHistoryRecord item.  */
  createBillingIntegrationOrganizationContextHistoryRecord?: Maybe<BillingIntegrationOrganizationContextHistoryRecord>;
  /**  Create multiple BillingIntegrationOrganizationContextHistoryRecord items.  */
  createBillingIntegrationOrganizationContextHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecord>>>;
  /**  Update a single BillingIntegrationOrganizationContextHistoryRecord item by ID.  */
  updateBillingIntegrationOrganizationContextHistoryRecord?: Maybe<BillingIntegrationOrganizationContextHistoryRecord>;
  /**  Update multiple BillingIntegrationOrganizationContextHistoryRecord items by ID.  */
  updateBillingIntegrationOrganizationContextHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecord>>>;
  /**  Delete a single BillingIntegrationOrganizationContextHistoryRecord item by ID.  */
  deleteBillingIntegrationOrganizationContextHistoryRecord?: Maybe<BillingIntegrationOrganizationContextHistoryRecord>;
  /**  Delete multiple BillingIntegrationOrganizationContextHistoryRecord items by ID.  */
  deleteBillingIntegrationOrganizationContextHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecord>>>;
  /**  Create a single BillingIntegrationOrganizationContext item.  */
  createBillingIntegrationOrganizationContext?: Maybe<BillingIntegrationOrganizationContext>;
  /**  Create multiple BillingIntegrationOrganizationContext items.  */
  createBillingIntegrationOrganizationContexts?: Maybe<Array<Maybe<BillingIntegrationOrganizationContext>>>;
  /**  Update a single BillingIntegrationOrganizationContext item by ID.  */
  updateBillingIntegrationOrganizationContext?: Maybe<BillingIntegrationOrganizationContext>;
  /**  Update multiple BillingIntegrationOrganizationContext items by ID.  */
  updateBillingIntegrationOrganizationContexts?: Maybe<Array<Maybe<BillingIntegrationOrganizationContext>>>;
  /**  Delete a single BillingIntegrationOrganizationContext item by ID.  */
  deleteBillingIntegrationOrganizationContext?: Maybe<BillingIntegrationOrganizationContext>;
  /**  Delete multiple BillingIntegrationOrganizationContext items by ID.  */
  deleteBillingIntegrationOrganizationContexts?: Maybe<Array<Maybe<BillingIntegrationOrganizationContext>>>;
  /**  Create a single BillingIntegrationLog item.  */
  createBillingIntegrationLog?: Maybe<BillingIntegrationLog>;
  /**  Create multiple BillingIntegrationLog items.  */
  createBillingIntegrationLogs?: Maybe<Array<Maybe<BillingIntegrationLog>>>;
  /**  Update a single BillingIntegrationLog item by ID.  */
  updateBillingIntegrationLog?: Maybe<BillingIntegrationLog>;
  /**  Update multiple BillingIntegrationLog items by ID.  */
  updateBillingIntegrationLogs?: Maybe<Array<Maybe<BillingIntegrationLog>>>;
  /**  Delete a single BillingIntegrationLog item by ID.  */
  deleteBillingIntegrationLog?: Maybe<BillingIntegrationLog>;
  /**  Delete multiple BillingIntegrationLog items by ID.  */
  deleteBillingIntegrationLogs?: Maybe<Array<Maybe<BillingIntegrationLog>>>;
  /**  Create a single BillingPropertyHistoryRecord item.  */
  createBillingPropertyHistoryRecord?: Maybe<BillingPropertyHistoryRecord>;
  /**  Create multiple BillingPropertyHistoryRecord items.  */
  createBillingPropertyHistoryRecords?: Maybe<Array<Maybe<BillingPropertyHistoryRecord>>>;
  /**  Update a single BillingPropertyHistoryRecord item by ID.  */
  updateBillingPropertyHistoryRecord?: Maybe<BillingPropertyHistoryRecord>;
  /**  Update multiple BillingPropertyHistoryRecord items by ID.  */
  updateBillingPropertyHistoryRecords?: Maybe<Array<Maybe<BillingPropertyHistoryRecord>>>;
  /**  Delete a single BillingPropertyHistoryRecord item by ID.  */
  deleteBillingPropertyHistoryRecord?: Maybe<BillingPropertyHistoryRecord>;
  /**  Delete multiple BillingPropertyHistoryRecord items by ID.  */
  deleteBillingPropertyHistoryRecords?: Maybe<Array<Maybe<BillingPropertyHistoryRecord>>>;
  /**  Create a single BillingProperty item.  */
  createBillingProperty?: Maybe<BillingProperty>;
  /**  Create multiple BillingProperty items.  */
  createBillingProperties?: Maybe<Array<Maybe<BillingProperty>>>;
  /**  Update a single BillingProperty item by ID.  */
  updateBillingProperty?: Maybe<BillingProperty>;
  /**  Update multiple BillingProperty items by ID.  */
  updateBillingProperties?: Maybe<Array<Maybe<BillingProperty>>>;
  /**  Delete a single BillingProperty item by ID.  */
  deleteBillingProperty?: Maybe<BillingProperty>;
  /**  Delete multiple BillingProperty items by ID.  */
  deleteBillingProperties?: Maybe<Array<Maybe<BillingProperty>>>;
  /**  Create a single BillingAccountHistoryRecord item.  */
  createBillingAccountHistoryRecord?: Maybe<BillingAccountHistoryRecord>;
  /**  Create multiple BillingAccountHistoryRecord items.  */
  createBillingAccountHistoryRecords?: Maybe<Array<Maybe<BillingAccountHistoryRecord>>>;
  /**  Update a single BillingAccountHistoryRecord item by ID.  */
  updateBillingAccountHistoryRecord?: Maybe<BillingAccountHistoryRecord>;
  /**  Update multiple BillingAccountHistoryRecord items by ID.  */
  updateBillingAccountHistoryRecords?: Maybe<Array<Maybe<BillingAccountHistoryRecord>>>;
  /**  Delete a single BillingAccountHistoryRecord item by ID.  */
  deleteBillingAccountHistoryRecord?: Maybe<BillingAccountHistoryRecord>;
  /**  Delete multiple BillingAccountHistoryRecord items by ID.  */
  deleteBillingAccountHistoryRecords?: Maybe<Array<Maybe<BillingAccountHistoryRecord>>>;
  /**  Create a single BillingAccount item.  */
  createBillingAccount?: Maybe<BillingAccount>;
  /**  Create multiple BillingAccount items.  */
  createBillingAccounts?: Maybe<Array<Maybe<BillingAccount>>>;
  /**  Update a single BillingAccount item by ID.  */
  updateBillingAccount?: Maybe<BillingAccount>;
  /**  Update multiple BillingAccount items by ID.  */
  updateBillingAccounts?: Maybe<Array<Maybe<BillingAccount>>>;
  /**  Delete a single BillingAccount item by ID.  */
  deleteBillingAccount?: Maybe<BillingAccount>;
  /**  Delete multiple BillingAccount items by ID.  */
  deleteBillingAccounts?: Maybe<Array<Maybe<BillingAccount>>>;
  /**  Create a single BillingMeterResourceHistoryRecord item.  */
  createBillingMeterResourceHistoryRecord?: Maybe<BillingMeterResourceHistoryRecord>;
  /**  Create multiple BillingMeterResourceHistoryRecord items.  */
  createBillingMeterResourceHistoryRecords?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecord>>>;
  /**  Update a single BillingMeterResourceHistoryRecord item by ID.  */
  updateBillingMeterResourceHistoryRecord?: Maybe<BillingMeterResourceHistoryRecord>;
  /**  Update multiple BillingMeterResourceHistoryRecord items by ID.  */
  updateBillingMeterResourceHistoryRecords?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecord>>>;
  /**  Delete a single BillingMeterResourceHistoryRecord item by ID.  */
  deleteBillingMeterResourceHistoryRecord?: Maybe<BillingMeterResourceHistoryRecord>;
  /**  Delete multiple BillingMeterResourceHistoryRecord items by ID.  */
  deleteBillingMeterResourceHistoryRecords?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecord>>>;
  /**  Create a single BillingMeterResource item.  */
  createBillingMeterResource?: Maybe<BillingMeterResource>;
  /**  Create multiple BillingMeterResource items.  */
  createBillingMeterResources?: Maybe<Array<Maybe<BillingMeterResource>>>;
  /**  Update a single BillingMeterResource item by ID.  */
  updateBillingMeterResource?: Maybe<BillingMeterResource>;
  /**  Update multiple BillingMeterResource items by ID.  */
  updateBillingMeterResources?: Maybe<Array<Maybe<BillingMeterResource>>>;
  /**  Delete a single BillingMeterResource item by ID.  */
  deleteBillingMeterResource?: Maybe<BillingMeterResource>;
  /**  Delete multiple BillingMeterResource items by ID.  */
  deleteBillingMeterResources?: Maybe<Array<Maybe<BillingMeterResource>>>;
  /**  Create a single BillingAccountMeterHistoryRecord item.  */
  createBillingAccountMeterHistoryRecord?: Maybe<BillingAccountMeterHistoryRecord>;
  /**  Create multiple BillingAccountMeterHistoryRecord items.  */
  createBillingAccountMeterHistoryRecords?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecord>>>;
  /**  Update a single BillingAccountMeterHistoryRecord item by ID.  */
  updateBillingAccountMeterHistoryRecord?: Maybe<BillingAccountMeterHistoryRecord>;
  /**  Update multiple BillingAccountMeterHistoryRecord items by ID.  */
  updateBillingAccountMeterHistoryRecords?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecord>>>;
  /**  Delete a single BillingAccountMeterHistoryRecord item by ID.  */
  deleteBillingAccountMeterHistoryRecord?: Maybe<BillingAccountMeterHistoryRecord>;
  /**  Delete multiple BillingAccountMeterHistoryRecord items by ID.  */
  deleteBillingAccountMeterHistoryRecords?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecord>>>;
  /**  Create a single BillingAccountMeter item.  */
  createBillingAccountMeter?: Maybe<BillingAccountMeter>;
  /**  Create multiple BillingAccountMeter items.  */
  createBillingAccountMeters?: Maybe<Array<Maybe<BillingAccountMeter>>>;
  /**  Update a single BillingAccountMeter item by ID.  */
  updateBillingAccountMeter?: Maybe<BillingAccountMeter>;
  /**  Update multiple BillingAccountMeter items by ID.  */
  updateBillingAccountMeters?: Maybe<Array<Maybe<BillingAccountMeter>>>;
  /**  Delete a single BillingAccountMeter item by ID.  */
  deleteBillingAccountMeter?: Maybe<BillingAccountMeter>;
  /**  Delete multiple BillingAccountMeter items by ID.  */
  deleteBillingAccountMeters?: Maybe<Array<Maybe<BillingAccountMeter>>>;
  /**  Create a single BillingAccountMeterReadingHistoryRecord item.  */
  createBillingAccountMeterReadingHistoryRecord?: Maybe<BillingAccountMeterReadingHistoryRecord>;
  /**  Create multiple BillingAccountMeterReadingHistoryRecord items.  */
  createBillingAccountMeterReadingHistoryRecords?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecord>>>;
  /**  Update a single BillingAccountMeterReadingHistoryRecord item by ID.  */
  updateBillingAccountMeterReadingHistoryRecord?: Maybe<BillingAccountMeterReadingHistoryRecord>;
  /**  Update multiple BillingAccountMeterReadingHistoryRecord items by ID.  */
  updateBillingAccountMeterReadingHistoryRecords?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecord>>>;
  /**  Delete a single BillingAccountMeterReadingHistoryRecord item by ID.  */
  deleteBillingAccountMeterReadingHistoryRecord?: Maybe<BillingAccountMeterReadingHistoryRecord>;
  /**  Delete multiple BillingAccountMeterReadingHistoryRecord items by ID.  */
  deleteBillingAccountMeterReadingHistoryRecords?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecord>>>;
  /**  Create a single BillingAccountMeterReading item.  */
  createBillingAccountMeterReading?: Maybe<BillingAccountMeterReading>;
  /**  Create multiple BillingAccountMeterReading items.  */
  createBillingAccountMeterReadings?: Maybe<Array<Maybe<BillingAccountMeterReading>>>;
  /**  Update a single BillingAccountMeterReading item by ID.  */
  updateBillingAccountMeterReading?: Maybe<BillingAccountMeterReading>;
  /**  Update multiple BillingAccountMeterReading items by ID.  */
  updateBillingAccountMeterReadings?: Maybe<Array<Maybe<BillingAccountMeterReading>>>;
  /**  Delete a single BillingAccountMeterReading item by ID.  */
  deleteBillingAccountMeterReading?: Maybe<BillingAccountMeterReading>;
  /**  Delete multiple BillingAccountMeterReading items by ID.  */
  deleteBillingAccountMeterReadings?: Maybe<Array<Maybe<BillingAccountMeterReading>>>;
  /**  Create a single BillingReceiptHistoryRecord item.  */
  createBillingReceiptHistoryRecord?: Maybe<BillingReceiptHistoryRecord>;
  /**  Create multiple BillingReceiptHistoryRecord items.  */
  createBillingReceiptHistoryRecords?: Maybe<Array<Maybe<BillingReceiptHistoryRecord>>>;
  /**  Update a single BillingReceiptHistoryRecord item by ID.  */
  updateBillingReceiptHistoryRecord?: Maybe<BillingReceiptHistoryRecord>;
  /**  Update multiple BillingReceiptHistoryRecord items by ID.  */
  updateBillingReceiptHistoryRecords?: Maybe<Array<Maybe<BillingReceiptHistoryRecord>>>;
  /**  Delete a single BillingReceiptHistoryRecord item by ID.  */
  deleteBillingReceiptHistoryRecord?: Maybe<BillingReceiptHistoryRecord>;
  /**  Delete multiple BillingReceiptHistoryRecord items by ID.  */
  deleteBillingReceiptHistoryRecords?: Maybe<Array<Maybe<BillingReceiptHistoryRecord>>>;
  /**  Create a single BillingReceipt item.  */
  createBillingReceipt?: Maybe<BillingReceipt>;
  /**  Create multiple BillingReceipt items.  */
  createBillingReceipts?: Maybe<Array<Maybe<BillingReceipt>>>;
  /**  Update a single BillingReceipt item by ID.  */
  updateBillingReceipt?: Maybe<BillingReceipt>;
  /**  Update multiple BillingReceipt items by ID.  */
  updateBillingReceipts?: Maybe<Array<Maybe<BillingReceipt>>>;
  /**  Delete a single BillingReceipt item by ID.  */
  deleteBillingReceipt?: Maybe<BillingReceipt>;
  /**  Delete multiple BillingReceipt items by ID.  */
  deleteBillingReceipts?: Maybe<Array<Maybe<BillingReceipt>>>;
  /**  Create a single BillingOrganizationHistoryRecord item.  */
  createBillingOrganizationHistoryRecord?: Maybe<BillingOrganizationHistoryRecord>;
  /**  Create multiple BillingOrganizationHistoryRecord items.  */
  createBillingOrganizationHistoryRecords?: Maybe<Array<Maybe<BillingOrganizationHistoryRecord>>>;
  /**  Update a single BillingOrganizationHistoryRecord item by ID.  */
  updateBillingOrganizationHistoryRecord?: Maybe<BillingOrganizationHistoryRecord>;
  /**  Update multiple BillingOrganizationHistoryRecord items by ID.  */
  updateBillingOrganizationHistoryRecords?: Maybe<Array<Maybe<BillingOrganizationHistoryRecord>>>;
  /**  Delete a single BillingOrganizationHistoryRecord item by ID.  */
  deleteBillingOrganizationHistoryRecord?: Maybe<BillingOrganizationHistoryRecord>;
  /**  Delete multiple BillingOrganizationHistoryRecord items by ID.  */
  deleteBillingOrganizationHistoryRecords?: Maybe<Array<Maybe<BillingOrganizationHistoryRecord>>>;
  /**  Create a single BillingOrganization item.  */
  createBillingOrganization?: Maybe<BillingOrganization>;
  /**  Create multiple BillingOrganization items.  */
  createBillingOrganizations?: Maybe<Array<Maybe<BillingOrganization>>>;
  /**  Update a single BillingOrganization item by ID.  */
  updateBillingOrganization?: Maybe<BillingOrganization>;
  /**  Update multiple BillingOrganization items by ID.  */
  updateBillingOrganizations?: Maybe<Array<Maybe<BillingOrganization>>>;
  /**  Delete a single BillingOrganization item by ID.  */
  deleteBillingOrganization?: Maybe<BillingOrganization>;
  /**  Delete multiple BillingOrganization items by ID.  */
  deleteBillingOrganizations?: Maybe<Array<Maybe<BillingOrganization>>>;
  /**  Create a single TicketHistoryRecord item.  */
  createTicketHistoryRecord?: Maybe<TicketHistoryRecord>;
  /**  Create multiple TicketHistoryRecord items.  */
  createTicketHistoryRecords?: Maybe<Array<Maybe<TicketHistoryRecord>>>;
  /**  Update a single TicketHistoryRecord item by ID.  */
  updateTicketHistoryRecord?: Maybe<TicketHistoryRecord>;
  /**  Update multiple TicketHistoryRecord items by ID.  */
  updateTicketHistoryRecords?: Maybe<Array<Maybe<TicketHistoryRecord>>>;
  /**  Delete a single TicketHistoryRecord item by ID.  */
  deleteTicketHistoryRecord?: Maybe<TicketHistoryRecord>;
  /**  Delete multiple TicketHistoryRecord items by ID.  */
  deleteTicketHistoryRecords?: Maybe<Array<Maybe<TicketHistoryRecord>>>;
  /**  Create a single Ticket item.  */
  createTicket?: Maybe<Ticket>;
  /**  Create multiple Ticket items.  */
  createTickets?: Maybe<Array<Maybe<Ticket>>>;
  /**  Update a single Ticket item by ID.  */
  updateTicket?: Maybe<Ticket>;
  /**  Update multiple Ticket items by ID.  */
  updateTickets?: Maybe<Array<Maybe<Ticket>>>;
  /**  Delete a single Ticket item by ID.  */
  deleteTicket?: Maybe<Ticket>;
  /**  Delete multiple Ticket items by ID.  */
  deleteTickets?: Maybe<Array<Maybe<Ticket>>>;
  /**  Create a single TicketSourceHistoryRecord item.  */
  createTicketSourceHistoryRecord?: Maybe<TicketSourceHistoryRecord>;
  /**  Create multiple TicketSourceHistoryRecord items.  */
  createTicketSourceHistoryRecords?: Maybe<Array<Maybe<TicketSourceHistoryRecord>>>;
  /**  Update a single TicketSourceHistoryRecord item by ID.  */
  updateTicketSourceHistoryRecord?: Maybe<TicketSourceHistoryRecord>;
  /**  Update multiple TicketSourceHistoryRecord items by ID.  */
  updateTicketSourceHistoryRecords?: Maybe<Array<Maybe<TicketSourceHistoryRecord>>>;
  /**  Delete a single TicketSourceHistoryRecord item by ID.  */
  deleteTicketSourceHistoryRecord?: Maybe<TicketSourceHistoryRecord>;
  /**  Delete multiple TicketSourceHistoryRecord items by ID.  */
  deleteTicketSourceHistoryRecords?: Maybe<Array<Maybe<TicketSourceHistoryRecord>>>;
  /**  Create a single TicketSource item.  */
  createTicketSource?: Maybe<TicketSource>;
  /**  Create multiple TicketSource items.  */
  createTicketSources?: Maybe<Array<Maybe<TicketSource>>>;
  /**  Update a single TicketSource item by ID.  */
  updateTicketSource?: Maybe<TicketSource>;
  /**  Update multiple TicketSource items by ID.  */
  updateTicketSources?: Maybe<Array<Maybe<TicketSource>>>;
  /**  Delete a single TicketSource item by ID.  */
  deleteTicketSource?: Maybe<TicketSource>;
  /**  Delete multiple TicketSource items by ID.  */
  deleteTicketSources?: Maybe<Array<Maybe<TicketSource>>>;
  /**  Create a single TicketClassifierHistoryRecord item.  */
  createTicketClassifierHistoryRecord?: Maybe<TicketClassifierHistoryRecord>;
  /**  Create multiple TicketClassifierHistoryRecord items.  */
  createTicketClassifierHistoryRecords?: Maybe<Array<Maybe<TicketClassifierHistoryRecord>>>;
  /**  Update a single TicketClassifierHistoryRecord item by ID.  */
  updateTicketClassifierHistoryRecord?: Maybe<TicketClassifierHistoryRecord>;
  /**  Update multiple TicketClassifierHistoryRecord items by ID.  */
  updateTicketClassifierHistoryRecords?: Maybe<Array<Maybe<TicketClassifierHistoryRecord>>>;
  /**  Delete a single TicketClassifierHistoryRecord item by ID.  */
  deleteTicketClassifierHistoryRecord?: Maybe<TicketClassifierHistoryRecord>;
  /**  Delete multiple TicketClassifierHistoryRecord items by ID.  */
  deleteTicketClassifierHistoryRecords?: Maybe<Array<Maybe<TicketClassifierHistoryRecord>>>;
  /**  Create a single TicketClassifier item.  */
  createTicketClassifier?: Maybe<TicketClassifier>;
  /**  Create multiple TicketClassifier items.  */
  createTicketClassifiers?: Maybe<Array<Maybe<TicketClassifier>>>;
  /**  Update a single TicketClassifier item by ID.  */
  updateTicketClassifier?: Maybe<TicketClassifier>;
  /**  Update multiple TicketClassifier items by ID.  */
  updateTicketClassifiers?: Maybe<Array<Maybe<TicketClassifier>>>;
  /**  Delete a single TicketClassifier item by ID.  */
  deleteTicketClassifier?: Maybe<TicketClassifier>;
  /**  Delete multiple TicketClassifier items by ID.  */
  deleteTicketClassifiers?: Maybe<Array<Maybe<TicketClassifier>>>;
  /**  Create a single TicketStatusHistoryRecord item.  */
  createTicketStatusHistoryRecord?: Maybe<TicketStatusHistoryRecord>;
  /**  Create multiple TicketStatusHistoryRecord items.  */
  createTicketStatusHistoryRecords?: Maybe<Array<Maybe<TicketStatusHistoryRecord>>>;
  /**  Update a single TicketStatusHistoryRecord item by ID.  */
  updateTicketStatusHistoryRecord?: Maybe<TicketStatusHistoryRecord>;
  /**  Update multiple TicketStatusHistoryRecord items by ID.  */
  updateTicketStatusHistoryRecords?: Maybe<Array<Maybe<TicketStatusHistoryRecord>>>;
  /**  Delete a single TicketStatusHistoryRecord item by ID.  */
  deleteTicketStatusHistoryRecord?: Maybe<TicketStatusHistoryRecord>;
  /**  Delete multiple TicketStatusHistoryRecord items by ID.  */
  deleteTicketStatusHistoryRecords?: Maybe<Array<Maybe<TicketStatusHistoryRecord>>>;
  /**  Create a single TicketStatus item.  */
  createTicketStatus?: Maybe<TicketStatus>;
  /**  Create multiple TicketStatus items.  */
  createTicketStatuses?: Maybe<Array<Maybe<TicketStatus>>>;
  /**  Update a single TicketStatus item by ID.  */
  updateTicketStatus?: Maybe<TicketStatus>;
  /**  Update multiple TicketStatus items by ID.  */
  updateTicketStatuses?: Maybe<Array<Maybe<TicketStatus>>>;
  /**  Delete a single TicketStatus item by ID.  */
  deleteTicketStatus?: Maybe<TicketStatus>;
  /**  Delete multiple TicketStatus items by ID.  */
  deleteTicketStatuses?: Maybe<Array<Maybe<TicketStatus>>>;
  /**  Create a single TicketFileHistoryRecord item.  */
  createTicketFileHistoryRecord?: Maybe<TicketFileHistoryRecord>;
  /**  Create multiple TicketFileHistoryRecord items.  */
  createTicketFileHistoryRecords?: Maybe<Array<Maybe<TicketFileHistoryRecord>>>;
  /**  Update a single TicketFileHistoryRecord item by ID.  */
  updateTicketFileHistoryRecord?: Maybe<TicketFileHistoryRecord>;
  /**  Update multiple TicketFileHistoryRecord items by ID.  */
  updateTicketFileHistoryRecords?: Maybe<Array<Maybe<TicketFileHistoryRecord>>>;
  /**  Delete a single TicketFileHistoryRecord item by ID.  */
  deleteTicketFileHistoryRecord?: Maybe<TicketFileHistoryRecord>;
  /**  Delete multiple TicketFileHistoryRecord items by ID.  */
  deleteTicketFileHistoryRecords?: Maybe<Array<Maybe<TicketFileHistoryRecord>>>;
  /**  Create a single TicketFile item.  */
  createTicketFile?: Maybe<TicketFile>;
  /**  Create multiple TicketFile items.  */
  createTicketFiles?: Maybe<Array<Maybe<TicketFile>>>;
  /**  Update a single TicketFile item by ID.  */
  updateTicketFile?: Maybe<TicketFile>;
  /**  Update multiple TicketFile items by ID.  */
  updateTicketFiles?: Maybe<Array<Maybe<TicketFile>>>;
  /**  Delete a single TicketFile item by ID.  */
  deleteTicketFile?: Maybe<TicketFile>;
  /**  Delete multiple TicketFile items by ID.  */
  deleteTicketFiles?: Maybe<Array<Maybe<TicketFile>>>;
  /**  Create a single TicketChange item.  */
  createTicketChange?: Maybe<TicketChange>;
  /**  Create multiple TicketChange items.  */
  createTicketChanges?: Maybe<Array<Maybe<TicketChange>>>;
  /**  Update a single TicketChange item by ID.  */
  updateTicketChange?: Maybe<TicketChange>;
  /**  Update multiple TicketChange items by ID.  */
  updateTicketChanges?: Maybe<Array<Maybe<TicketChange>>>;
  /**  Delete a single TicketChange item by ID.  */
  deleteTicketChange?: Maybe<TicketChange>;
  /**  Delete multiple TicketChange items by ID.  */
  deleteTicketChanges?: Maybe<Array<Maybe<TicketChange>>>;
  /**  Create a single TicketCommentHistoryRecord item.  */
  createTicketCommentHistoryRecord?: Maybe<TicketCommentHistoryRecord>;
  /**  Create multiple TicketCommentHistoryRecord items.  */
  createTicketCommentHistoryRecords?: Maybe<Array<Maybe<TicketCommentHistoryRecord>>>;
  /**  Update a single TicketCommentHistoryRecord item by ID.  */
  updateTicketCommentHistoryRecord?: Maybe<TicketCommentHistoryRecord>;
  /**  Update multiple TicketCommentHistoryRecord items by ID.  */
  updateTicketCommentHistoryRecords?: Maybe<Array<Maybe<TicketCommentHistoryRecord>>>;
  /**  Delete a single TicketCommentHistoryRecord item by ID.  */
  deleteTicketCommentHistoryRecord?: Maybe<TicketCommentHistoryRecord>;
  /**  Delete multiple TicketCommentHistoryRecord items by ID.  */
  deleteTicketCommentHistoryRecords?: Maybe<Array<Maybe<TicketCommentHistoryRecord>>>;
  /**  Create a single TicketComment item.  */
  createTicketComment?: Maybe<TicketComment>;
  /**  Create multiple TicketComment items.  */
  createTicketComments?: Maybe<Array<Maybe<TicketComment>>>;
  /**  Update a single TicketComment item by ID.  */
  updateTicketComment?: Maybe<TicketComment>;
  /**  Update multiple TicketComment items by ID.  */
  updateTicketComments?: Maybe<Array<Maybe<TicketComment>>>;
  /**  Delete a single TicketComment item by ID.  */
  deleteTicketComment?: Maybe<TicketComment>;
  /**  Delete multiple TicketComment items by ID.  */
  deleteTicketComments?: Maybe<Array<Maybe<TicketComment>>>;
  /**  Create a single MessageHistoryRecord item.  */
  createMessageHistoryRecord?: Maybe<MessageHistoryRecord>;
  /**  Create multiple MessageHistoryRecord items.  */
  createMessageHistoryRecords?: Maybe<Array<Maybe<MessageHistoryRecord>>>;
  /**  Update a single MessageHistoryRecord item by ID.  */
  updateMessageHistoryRecord?: Maybe<MessageHistoryRecord>;
  /**  Update multiple MessageHistoryRecord items by ID.  */
  updateMessageHistoryRecords?: Maybe<Array<Maybe<MessageHistoryRecord>>>;
  /**  Delete a single MessageHistoryRecord item by ID.  */
  deleteMessageHistoryRecord?: Maybe<MessageHistoryRecord>;
  /**  Delete multiple MessageHistoryRecord items by ID.  */
  deleteMessageHistoryRecords?: Maybe<Array<Maybe<MessageHistoryRecord>>>;
  /**  Create a single Message item.  */
  createMessage?: Maybe<Message>;
  /**  Create multiple Message items.  */
  createMessages?: Maybe<Array<Maybe<Message>>>;
  /**  Update a single Message item by ID.  */
  updateMessage?: Maybe<Message>;
  /**  Update multiple Message items by ID.  */
  updateMessages?: Maybe<Array<Maybe<Message>>>;
  /**  Delete a single Message item by ID.  */
  deleteMessage?: Maybe<Message>;
  /**  Delete multiple Message items by ID.  */
  deleteMessages?: Maybe<Array<Maybe<Message>>>;
  /**  Create a single ContactHistoryRecord item.  */
  createContactHistoryRecord?: Maybe<ContactHistoryRecord>;
  /**  Create multiple ContactHistoryRecord items.  */
  createContactHistoryRecords?: Maybe<Array<Maybe<ContactHistoryRecord>>>;
  /**  Update a single ContactHistoryRecord item by ID.  */
  updateContactHistoryRecord?: Maybe<ContactHistoryRecord>;
  /**  Update multiple ContactHistoryRecord items by ID.  */
  updateContactHistoryRecords?: Maybe<Array<Maybe<ContactHistoryRecord>>>;
  /**  Delete a single ContactHistoryRecord item by ID.  */
  deleteContactHistoryRecord?: Maybe<ContactHistoryRecord>;
  /**  Delete multiple ContactHistoryRecord items by ID.  */
  deleteContactHistoryRecords?: Maybe<Array<Maybe<ContactHistoryRecord>>>;
  /**  Create a single Contact item.  */
  createContact?: Maybe<Contact>;
  /**  Create multiple Contact items.  */
  createContacts?: Maybe<Array<Maybe<Contact>>>;
  /**  Update a single Contact item by ID.  */
  updateContact?: Maybe<Contact>;
  /**  Update multiple Contact items by ID.  */
  updateContacts?: Maybe<Array<Maybe<Contact>>>;
  /**  Delete a single Contact item by ID.  */
  deleteContact?: Maybe<Contact>;
  /**  Delete multiple Contact items by ID.  */
  deleteContacts?: Maybe<Array<Maybe<Contact>>>;
  /**  Create a single ResidentHistoryRecord item.  */
  createResidentHistoryRecord?: Maybe<ResidentHistoryRecord>;
  /**  Create multiple ResidentHistoryRecord items.  */
  createResidentHistoryRecords?: Maybe<Array<Maybe<ResidentHistoryRecord>>>;
  /**  Update a single ResidentHistoryRecord item by ID.  */
  updateResidentHistoryRecord?: Maybe<ResidentHistoryRecord>;
  /**  Update multiple ResidentHistoryRecord items by ID.  */
  updateResidentHistoryRecords?: Maybe<Array<Maybe<ResidentHistoryRecord>>>;
  /**  Delete a single ResidentHistoryRecord item by ID.  */
  deleteResidentHistoryRecord?: Maybe<ResidentHistoryRecord>;
  /**  Delete multiple ResidentHistoryRecord items by ID.  */
  deleteResidentHistoryRecords?: Maybe<Array<Maybe<ResidentHistoryRecord>>>;
  /**  Create a single Resident item.  */
  createResident?: Maybe<Resident>;
  /**  Create multiple Resident items.  */
  createResidents?: Maybe<Array<Maybe<Resident>>>;
  /**  Update a single Resident item by ID.  */
  updateResident?: Maybe<Resident>;
  /**  Update multiple Resident items by ID.  */
  updateResidents?: Maybe<Array<Maybe<Resident>>>;
  /**  Delete a single Resident item by ID.  */
  deleteResident?: Maybe<Resident>;
  /**  Delete multiple Resident items by ID.  */
  deleteResidents?: Maybe<Array<Maybe<Resident>>>;
  registerNewUser?: Maybe<User>;
  authenticateUserWithPhoneAndPassword?: Maybe<AuthenticateUserWithPhoneAndPasswordOutput>;
  startPasswordRecovery?: Maybe<StartPasswordRecoveryOutput>;
  changePasswordWithToken?: Maybe<ChangePasswordWithTokenOutput>;
  startConfirmPhoneAction?: Maybe<StartConfirmPhoneActionOutput>;
  resendConfirmPhoneActionSms?: Maybe<ResendConfirmPhoneActionSmsOutput>;
  completeConfirmPhoneAction?: Maybe<CompleteConfirmPhoneActionOutput>;
  signinResidentUser?: Maybe<SigninResidentUserOutput>;
  changePhoneNumberResidentUser?: Maybe<ChangePhoneNumberResidentUserOutput>;
  registerNewOrganization?: Maybe<Organization>;
  inviteNewOrganizationEmployee?: Maybe<OrganizationEmployee>;
  reInviteOrganizationEmployee?: Maybe<OrganizationEmployee>;
  acceptOrRejectOrganizationInviteById?: Maybe<OrganizationEmployee>;
  acceptOrRejectOrganizationInviteByCode?: Maybe<OrganizationEmployee>;
  sendMessage?: Maybe<SendMessageOutput>;
  resendMessage?: Maybe<ResendMessageOutput>;
  registerResident?: Maybe<Resident>;
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


export type MutationCreateForgotPasswordActionHistoryRecordArgs = {
  data?: Maybe<ForgotPasswordActionHistoryRecordCreateInput>;
};


export type MutationCreateForgotPasswordActionHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecordsCreateInput>>>;
};


export type MutationUpdateForgotPasswordActionHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<ForgotPasswordActionHistoryRecordUpdateInput>;
};


export type MutationUpdateForgotPasswordActionHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteForgotPasswordActionHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteForgotPasswordActionHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateForgotPasswordActionArgs = {
  data?: Maybe<ForgotPasswordActionCreateInput>;
};


export type MutationCreateForgotPasswordActionsArgs = {
  data?: Maybe<Array<Maybe<ForgotPasswordActionsCreateInput>>>;
};


export type MutationUpdateForgotPasswordActionArgs = {
  id: Scalars['ID'];
  data?: Maybe<ForgotPasswordActionUpdateInput>;
};


export type MutationUpdateForgotPasswordActionsArgs = {
  data?: Maybe<Array<Maybe<ForgotPasswordActionsUpdateInput>>>;
};


export type MutationDeleteForgotPasswordActionArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteForgotPasswordActionsArgs = {
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


export type MutationCreateOrganizationHistoryRecordArgs = {
  data?: Maybe<OrganizationHistoryRecordCreateInput>;
};


export type MutationCreateOrganizationHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<OrganizationHistoryRecordsCreateInput>>>;
};


export type MutationUpdateOrganizationHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationHistoryRecordUpdateInput>;
};


export type MutationUpdateOrganizationHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<OrganizationHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteOrganizationHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteOrganizationHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateOrganizationArgs = {
  data?: Maybe<OrganizationCreateInput>;
};


export type MutationCreateOrganizationsArgs = {
  data?: Maybe<Array<Maybe<OrganizationsCreateInput>>>;
};


export type MutationUpdateOrganizationArgs = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationUpdateInput>;
};


export type MutationUpdateOrganizationsArgs = {
  data?: Maybe<Array<Maybe<OrganizationsUpdateInput>>>;
};


export type MutationDeleteOrganizationArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteOrganizationsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateOrganizationEmployeeHistoryRecordArgs = {
  data?: Maybe<OrganizationEmployeeHistoryRecordCreateInput>;
};


export type MutationCreateOrganizationEmployeeHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecordsCreateInput>>>;
};


export type MutationUpdateOrganizationEmployeeHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationEmployeeHistoryRecordUpdateInput>;
};


export type MutationUpdateOrganizationEmployeeHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteOrganizationEmployeeHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteOrganizationEmployeeHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateOrganizationEmployeeArgs = {
  data?: Maybe<OrganizationEmployeeCreateInput>;
};


export type MutationCreateOrganizationEmployeesArgs = {
  data?: Maybe<Array<Maybe<OrganizationEmployeesCreateInput>>>;
};


export type MutationUpdateOrganizationEmployeeArgs = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationEmployeeUpdateInput>;
};


export type MutationUpdateOrganizationEmployeesArgs = {
  data?: Maybe<Array<Maybe<OrganizationEmployeesUpdateInput>>>;
};


export type MutationDeleteOrganizationEmployeeArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteOrganizationEmployeesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateOrganizationEmployeeRoleHistoryRecordArgs = {
  data?: Maybe<OrganizationEmployeeRoleHistoryRecordCreateInput>;
};


export type MutationCreateOrganizationEmployeeRoleHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecordsCreateInput>>>;
};


export type MutationUpdateOrganizationEmployeeRoleHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationEmployeeRoleHistoryRecordUpdateInput>;
};


export type MutationUpdateOrganizationEmployeeRoleHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteOrganizationEmployeeRoleHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteOrganizationEmployeeRoleHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateOrganizationEmployeeRoleArgs = {
  data?: Maybe<OrganizationEmployeeRoleCreateInput>;
};


export type MutationCreateOrganizationEmployeeRolesArgs = {
  data?: Maybe<Array<Maybe<OrganizationEmployeeRolesCreateInput>>>;
};


export type MutationUpdateOrganizationEmployeeRoleArgs = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationEmployeeRoleUpdateInput>;
};


export type MutationUpdateOrganizationEmployeeRolesArgs = {
  data?: Maybe<Array<Maybe<OrganizationEmployeeRolesUpdateInput>>>;
};


export type MutationDeleteOrganizationEmployeeRoleArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteOrganizationEmployeeRolesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreatePropertyHistoryRecordArgs = {
  data?: Maybe<PropertyHistoryRecordCreateInput>;
};


export type MutationCreatePropertyHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<PropertyHistoryRecordsCreateInput>>>;
};


export type MutationUpdatePropertyHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<PropertyHistoryRecordUpdateInput>;
};


export type MutationUpdatePropertyHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<PropertyHistoryRecordsUpdateInput>>>;
};


export type MutationDeletePropertyHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeletePropertyHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreatePropertyArgs = {
  data?: Maybe<PropertyCreateInput>;
};


export type MutationCreatePropertiesArgs = {
  data?: Maybe<Array<Maybe<PropertiesCreateInput>>>;
};


export type MutationUpdatePropertyArgs = {
  id: Scalars['ID'];
  data?: Maybe<PropertyUpdateInput>;
};


export type MutationUpdatePropertiesArgs = {
  data?: Maybe<Array<Maybe<PropertiesUpdateInput>>>;
};


export type MutationDeletePropertyArgs = {
  id: Scalars['ID'];
};


export type MutationDeletePropertiesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingIntegrationHistoryRecordArgs = {
  data?: Maybe<BillingIntegrationHistoryRecordCreateInput>;
};


export type MutationCreateBillingIntegrationHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingIntegrationHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingIntegrationHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingIntegrationHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingIntegrationHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingIntegrationArgs = {
  data?: Maybe<BillingIntegrationCreateInput>;
};


export type MutationCreateBillingIntegrationsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationsCreateInput>>>;
};


export type MutationUpdateBillingIntegrationArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationUpdateInput>;
};


export type MutationUpdateBillingIntegrationsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationsUpdateInput>>>;
};


export type MutationDeleteBillingIntegrationArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingIntegrationsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingIntegrationAccessRightHistoryRecordArgs = {
  data?: Maybe<BillingIntegrationAccessRightHistoryRecordCreateInput>;
};


export type MutationCreateBillingIntegrationAccessRightHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingIntegrationAccessRightHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationAccessRightHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingIntegrationAccessRightHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingIntegrationAccessRightHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingIntegrationAccessRightHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingIntegrationAccessRightArgs = {
  data?: Maybe<BillingIntegrationAccessRightCreateInput>;
};


export type MutationCreateBillingIntegrationAccessRightsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationAccessRightsCreateInput>>>;
};


export type MutationUpdateBillingIntegrationAccessRightArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationAccessRightUpdateInput>;
};


export type MutationUpdateBillingIntegrationAccessRightsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationAccessRightsUpdateInput>>>;
};


export type MutationDeleteBillingIntegrationAccessRightArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingIntegrationAccessRightsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingIntegrationOrganizationContextHistoryRecordArgs = {
  data?: Maybe<BillingIntegrationOrganizationContextHistoryRecordCreateInput>;
};


export type MutationCreateBillingIntegrationOrganizationContextHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingIntegrationOrganizationContextHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationOrganizationContextHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingIntegrationOrganizationContextHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingIntegrationOrganizationContextHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingIntegrationOrganizationContextHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingIntegrationOrganizationContextArgs = {
  data?: Maybe<BillingIntegrationOrganizationContextCreateInput>;
};


export type MutationCreateBillingIntegrationOrganizationContextsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextsCreateInput>>>;
};


export type MutationUpdateBillingIntegrationOrganizationContextArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationOrganizationContextUpdateInput>;
};


export type MutationUpdateBillingIntegrationOrganizationContextsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextsUpdateInput>>>;
};


export type MutationDeleteBillingIntegrationOrganizationContextArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingIntegrationOrganizationContextsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingIntegrationLogArgs = {
  data?: Maybe<BillingIntegrationLogCreateInput>;
};


export type MutationCreateBillingIntegrationLogsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationLogsCreateInput>>>;
};


export type MutationUpdateBillingIntegrationLogArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingIntegrationLogUpdateInput>;
};


export type MutationUpdateBillingIntegrationLogsArgs = {
  data?: Maybe<Array<Maybe<BillingIntegrationLogsUpdateInput>>>;
};


export type MutationDeleteBillingIntegrationLogArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingIntegrationLogsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingPropertyHistoryRecordArgs = {
  data?: Maybe<BillingPropertyHistoryRecordCreateInput>;
};


export type MutationCreateBillingPropertyHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingPropertyHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingPropertyHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingPropertyHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingPropertyHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingPropertyHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingPropertyHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingPropertyHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingPropertyArgs = {
  data?: Maybe<BillingPropertyCreateInput>;
};


export type MutationCreateBillingPropertiesArgs = {
  data?: Maybe<Array<Maybe<BillingPropertiesCreateInput>>>;
};


export type MutationUpdateBillingPropertyArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingPropertyUpdateInput>;
};


export type MutationUpdateBillingPropertiesArgs = {
  data?: Maybe<Array<Maybe<BillingPropertiesUpdateInput>>>;
};


export type MutationDeleteBillingPropertyArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingPropertiesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingAccountHistoryRecordArgs = {
  data?: Maybe<BillingAccountHistoryRecordCreateInput>;
};


export type MutationCreateBillingAccountHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingAccountHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingAccountHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingAccountHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingAccountHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingAccountArgs = {
  data?: Maybe<BillingAccountCreateInput>;
};


export type MutationCreateBillingAccountsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountsCreateInput>>>;
};


export type MutationUpdateBillingAccountArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountUpdateInput>;
};


export type MutationUpdateBillingAccountsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountsUpdateInput>>>;
};


export type MutationDeleteBillingAccountArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingAccountsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingMeterResourceHistoryRecordArgs = {
  data?: Maybe<BillingMeterResourceHistoryRecordCreateInput>;
};


export type MutationCreateBillingMeterResourceHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingMeterResourceHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingMeterResourceHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingMeterResourceHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingMeterResourceHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingMeterResourceHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingMeterResourceArgs = {
  data?: Maybe<BillingMeterResourceCreateInput>;
};


export type MutationCreateBillingMeterResourcesArgs = {
  data?: Maybe<Array<Maybe<BillingMeterResourcesCreateInput>>>;
};


export type MutationUpdateBillingMeterResourceArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingMeterResourceUpdateInput>;
};


export type MutationUpdateBillingMeterResourcesArgs = {
  data?: Maybe<Array<Maybe<BillingMeterResourcesUpdateInput>>>;
};


export type MutationDeleteBillingMeterResourceArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingMeterResourcesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingAccountMeterHistoryRecordArgs = {
  data?: Maybe<BillingAccountMeterHistoryRecordCreateInput>;
};


export type MutationCreateBillingAccountMeterHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingAccountMeterHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountMeterHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingAccountMeterHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingAccountMeterHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingAccountMeterHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingAccountMeterArgs = {
  data?: Maybe<BillingAccountMeterCreateInput>;
};


export type MutationCreateBillingAccountMetersArgs = {
  data?: Maybe<Array<Maybe<BillingAccountMetersCreateInput>>>;
};


export type MutationUpdateBillingAccountMeterArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountMeterUpdateInput>;
};


export type MutationUpdateBillingAccountMetersArgs = {
  data?: Maybe<Array<Maybe<BillingAccountMetersUpdateInput>>>;
};


export type MutationDeleteBillingAccountMeterArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingAccountMetersArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingAccountMeterReadingHistoryRecordArgs = {
  data?: Maybe<BillingAccountMeterReadingHistoryRecordCreateInput>;
};


export type MutationCreateBillingAccountMeterReadingHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingAccountMeterReadingHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountMeterReadingHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingAccountMeterReadingHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingAccountMeterReadingHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingAccountMeterReadingHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingAccountMeterReadingArgs = {
  data?: Maybe<BillingAccountMeterReadingCreateInput>;
};


export type MutationCreateBillingAccountMeterReadingsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountMeterReadingsCreateInput>>>;
};


export type MutationUpdateBillingAccountMeterReadingArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingAccountMeterReadingUpdateInput>;
};


export type MutationUpdateBillingAccountMeterReadingsArgs = {
  data?: Maybe<Array<Maybe<BillingAccountMeterReadingsUpdateInput>>>;
};


export type MutationDeleteBillingAccountMeterReadingArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingAccountMeterReadingsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingReceiptHistoryRecordArgs = {
  data?: Maybe<BillingReceiptHistoryRecordCreateInput>;
};


export type MutationCreateBillingReceiptHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingReceiptHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingReceiptHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingReceiptHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingReceiptHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingReceiptHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingReceiptHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingReceiptHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingReceiptArgs = {
  data?: Maybe<BillingReceiptCreateInput>;
};


export type MutationCreateBillingReceiptsArgs = {
  data?: Maybe<Array<Maybe<BillingReceiptsCreateInput>>>;
};


export type MutationUpdateBillingReceiptArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingReceiptUpdateInput>;
};


export type MutationUpdateBillingReceiptsArgs = {
  data?: Maybe<Array<Maybe<BillingReceiptsUpdateInput>>>;
};


export type MutationDeleteBillingReceiptArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingReceiptsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingOrganizationHistoryRecordArgs = {
  data?: Maybe<BillingOrganizationHistoryRecordCreateInput>;
};


export type MutationCreateBillingOrganizationHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingOrganizationHistoryRecordsCreateInput>>>;
};


export type MutationUpdateBillingOrganizationHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingOrganizationHistoryRecordUpdateInput>;
};


export type MutationUpdateBillingOrganizationHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<BillingOrganizationHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteBillingOrganizationHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingOrganizationHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateBillingOrganizationArgs = {
  data?: Maybe<BillingOrganizationCreateInput>;
};


export type MutationCreateBillingOrganizationsArgs = {
  data?: Maybe<Array<Maybe<BillingOrganizationsCreateInput>>>;
};


export type MutationUpdateBillingOrganizationArgs = {
  id: Scalars['ID'];
  data?: Maybe<BillingOrganizationUpdateInput>;
};


export type MutationUpdateBillingOrganizationsArgs = {
  data?: Maybe<Array<Maybe<BillingOrganizationsUpdateInput>>>;
};


export type MutationDeleteBillingOrganizationArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBillingOrganizationsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketHistoryRecordArgs = {
  data?: Maybe<TicketHistoryRecordCreateInput>;
};


export type MutationCreateTicketHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketHistoryRecordsCreateInput>>>;
};


export type MutationUpdateTicketHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketHistoryRecordUpdateInput>;
};


export type MutationUpdateTicketHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteTicketHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketArgs = {
  data?: Maybe<TicketCreateInput>;
};


export type MutationCreateTicketsArgs = {
  data?: Maybe<Array<Maybe<TicketsCreateInput>>>;
};


export type MutationUpdateTicketArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketUpdateInput>;
};


export type MutationUpdateTicketsArgs = {
  data?: Maybe<Array<Maybe<TicketsUpdateInput>>>;
};


export type MutationDeleteTicketArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketSourceHistoryRecordArgs = {
  data?: Maybe<TicketSourceHistoryRecordCreateInput>;
};


export type MutationCreateTicketSourceHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketSourceHistoryRecordsCreateInput>>>;
};


export type MutationUpdateTicketSourceHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketSourceHistoryRecordUpdateInput>;
};


export type MutationUpdateTicketSourceHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketSourceHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteTicketSourceHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketSourceHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketSourceArgs = {
  data?: Maybe<TicketSourceCreateInput>;
};


export type MutationCreateTicketSourcesArgs = {
  data?: Maybe<Array<Maybe<TicketSourcesCreateInput>>>;
};


export type MutationUpdateTicketSourceArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketSourceUpdateInput>;
};


export type MutationUpdateTicketSourcesArgs = {
  data?: Maybe<Array<Maybe<TicketSourcesUpdateInput>>>;
};


export type MutationDeleteTicketSourceArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketSourcesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketClassifierHistoryRecordArgs = {
  data?: Maybe<TicketClassifierHistoryRecordCreateInput>;
};


export type MutationCreateTicketClassifierHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketClassifierHistoryRecordsCreateInput>>>;
};


export type MutationUpdateTicketClassifierHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketClassifierHistoryRecordUpdateInput>;
};


export type MutationUpdateTicketClassifierHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketClassifierHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteTicketClassifierHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketClassifierHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketClassifierArgs = {
  data?: Maybe<TicketClassifierCreateInput>;
};


export type MutationCreateTicketClassifiersArgs = {
  data?: Maybe<Array<Maybe<TicketClassifiersCreateInput>>>;
};


export type MutationUpdateTicketClassifierArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketClassifierUpdateInput>;
};


export type MutationUpdateTicketClassifiersArgs = {
  data?: Maybe<Array<Maybe<TicketClassifiersUpdateInput>>>;
};


export type MutationDeleteTicketClassifierArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketClassifiersArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketStatusHistoryRecordArgs = {
  data?: Maybe<TicketStatusHistoryRecordCreateInput>;
};


export type MutationCreateTicketStatusHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketStatusHistoryRecordsCreateInput>>>;
};


export type MutationUpdateTicketStatusHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketStatusHistoryRecordUpdateInput>;
};


export type MutationUpdateTicketStatusHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketStatusHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteTicketStatusHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketStatusHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketStatusArgs = {
  data?: Maybe<TicketStatusCreateInput>;
};


export type MutationCreateTicketStatusesArgs = {
  data?: Maybe<Array<Maybe<TicketStatusesCreateInput>>>;
};


export type MutationUpdateTicketStatusArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketStatusUpdateInput>;
};


export type MutationUpdateTicketStatusesArgs = {
  data?: Maybe<Array<Maybe<TicketStatusesUpdateInput>>>;
};


export type MutationDeleteTicketStatusArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketStatusesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketFileHistoryRecordArgs = {
  data?: Maybe<TicketFileHistoryRecordCreateInput>;
};


export type MutationCreateTicketFileHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketFileHistoryRecordsCreateInput>>>;
};


export type MutationUpdateTicketFileHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketFileHistoryRecordUpdateInput>;
};


export type MutationUpdateTicketFileHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketFileHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteTicketFileHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketFileHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketFileArgs = {
  data?: Maybe<TicketFileCreateInput>;
};


export type MutationCreateTicketFilesArgs = {
  data?: Maybe<Array<Maybe<TicketFilesCreateInput>>>;
};


export type MutationUpdateTicketFileArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketFileUpdateInput>;
};


export type MutationUpdateTicketFilesArgs = {
  data?: Maybe<Array<Maybe<TicketFilesUpdateInput>>>;
};


export type MutationDeleteTicketFileArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketFilesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketChangeArgs = {
  data?: Maybe<TicketChangeCreateInput>;
};


export type MutationCreateTicketChangesArgs = {
  data?: Maybe<Array<Maybe<TicketChangesCreateInput>>>;
};


export type MutationUpdateTicketChangeArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketChangeUpdateInput>;
};


export type MutationUpdateTicketChangesArgs = {
  data?: Maybe<Array<Maybe<TicketChangesUpdateInput>>>;
};


export type MutationDeleteTicketChangeArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketChangesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketCommentHistoryRecordArgs = {
  data?: Maybe<TicketCommentHistoryRecordCreateInput>;
};


export type MutationCreateTicketCommentHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketCommentHistoryRecordsCreateInput>>>;
};


export type MutationUpdateTicketCommentHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketCommentHistoryRecordUpdateInput>;
};


export type MutationUpdateTicketCommentHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<TicketCommentHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteTicketCommentHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketCommentHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateTicketCommentArgs = {
  data?: Maybe<TicketCommentCreateInput>;
};


export type MutationCreateTicketCommentsArgs = {
  data?: Maybe<Array<Maybe<TicketCommentsCreateInput>>>;
};


export type MutationUpdateTicketCommentArgs = {
  id: Scalars['ID'];
  data?: Maybe<TicketCommentUpdateInput>;
};


export type MutationUpdateTicketCommentsArgs = {
  data?: Maybe<Array<Maybe<TicketCommentsUpdateInput>>>;
};


export type MutationDeleteTicketCommentArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTicketCommentsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateMessageHistoryRecordArgs = {
  data?: Maybe<MessageHistoryRecordCreateInput>;
};


export type MutationCreateMessageHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<MessageHistoryRecordsCreateInput>>>;
};


export type MutationUpdateMessageHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<MessageHistoryRecordUpdateInput>;
};


export type MutationUpdateMessageHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<MessageHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteMessageHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteMessageHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateMessageArgs = {
  data?: Maybe<MessageCreateInput>;
};


export type MutationCreateMessagesArgs = {
  data?: Maybe<Array<Maybe<MessagesCreateInput>>>;
};


export type MutationUpdateMessageArgs = {
  id: Scalars['ID'];
  data?: Maybe<MessageUpdateInput>;
};


export type MutationUpdateMessagesArgs = {
  data?: Maybe<Array<Maybe<MessagesUpdateInput>>>;
};


export type MutationDeleteMessageArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteMessagesArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateContactHistoryRecordArgs = {
  data?: Maybe<ContactHistoryRecordCreateInput>;
};


export type MutationCreateContactHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<ContactHistoryRecordsCreateInput>>>;
};


export type MutationUpdateContactHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<ContactHistoryRecordUpdateInput>;
};


export type MutationUpdateContactHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<ContactHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteContactHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteContactHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateContactArgs = {
  data?: Maybe<ContactCreateInput>;
};


export type MutationCreateContactsArgs = {
  data?: Maybe<Array<Maybe<ContactsCreateInput>>>;
};


export type MutationUpdateContactArgs = {
  id: Scalars['ID'];
  data?: Maybe<ContactUpdateInput>;
};


export type MutationUpdateContactsArgs = {
  data?: Maybe<Array<Maybe<ContactsUpdateInput>>>;
};


export type MutationDeleteContactArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteContactsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateResidentHistoryRecordArgs = {
  data?: Maybe<ResidentHistoryRecordCreateInput>;
};


export type MutationCreateResidentHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<ResidentHistoryRecordsCreateInput>>>;
};


export type MutationUpdateResidentHistoryRecordArgs = {
  id: Scalars['ID'];
  data?: Maybe<ResidentHistoryRecordUpdateInput>;
};


export type MutationUpdateResidentHistoryRecordsArgs = {
  data?: Maybe<Array<Maybe<ResidentHistoryRecordsUpdateInput>>>;
};


export type MutationDeleteResidentHistoryRecordArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteResidentHistoryRecordsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationCreateResidentArgs = {
  data?: Maybe<ResidentCreateInput>;
};


export type MutationCreateResidentsArgs = {
  data?: Maybe<Array<Maybe<ResidentsCreateInput>>>;
};


export type MutationUpdateResidentArgs = {
  id: Scalars['ID'];
  data?: Maybe<ResidentUpdateInput>;
};


export type MutationUpdateResidentsArgs = {
  data?: Maybe<Array<Maybe<ResidentsUpdateInput>>>;
};


export type MutationDeleteResidentArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteResidentsArgs = {
  ids?: Maybe<Array<Scalars['ID']>>;
};


export type MutationRegisterNewUserArgs = {
  data: RegisterNewUserInput;
};


export type MutationAuthenticateUserWithPhoneAndPasswordArgs = {
  data: AuthenticateUserWithPhoneAndPasswordInput;
};


export type MutationStartPasswordRecoveryArgs = {
  data: StartPasswordRecoveryInput;
};


export type MutationChangePasswordWithTokenArgs = {
  data: ChangePasswordWithTokenInput;
};


export type MutationStartConfirmPhoneActionArgs = {
  data: StartConfirmPhoneActionInput;
};


export type MutationResendConfirmPhoneActionSmsArgs = {
  data: ResendConfirmPhoneActionSmsInput;
};


export type MutationCompleteConfirmPhoneActionArgs = {
  data: CompleteConfirmPhoneActionInput;
};


export type MutationSigninResidentUserArgs = {
  data: SigninResidentUserInput;
};


export type MutationChangePhoneNumberResidentUserArgs = {
  data: ChangePhoneNumberResidentUserInput;
};


export type MutationRegisterNewOrganizationArgs = {
  data: RegisterNewOrganizationInput;
};


export type MutationInviteNewOrganizationEmployeeArgs = {
  data: InviteNewOrganizationEmployeeInput;
};


export type MutationReInviteOrganizationEmployeeArgs = {
  data: ReInviteOrganizationEmployeeInput;
};


export type MutationAcceptOrRejectOrganizationInviteByIdArgs = {
  id: Scalars['ID'];
  data: AcceptOrRejectOrganizationInviteInput;
};


export type MutationAcceptOrRejectOrganizationInviteByCodeArgs = {
  inviteCode: Scalars['String'];
  data: AcceptOrRejectOrganizationInviteInput;
};


export type MutationSendMessageArgs = {
  data: SendMessageInput;
};


export type MutationResendMessageArgs = {
  data: ResendMessageInput;
};


export type MutationRegisterResidentArgs = {
  data: RegisterResidentInput;
};


export type MutationAuthenticateUserWithPasswordArgs = {
  email?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
};


export type MutationUpdateAuthenticatedUserArgs = {
  data?: Maybe<UserUpdateInput>;
};

/**  B2B customer of the service, a legal entity or an association of legal entities (holding/group)  */
export type Organization = {
  __typename?: 'Organization';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the Organization List config, or
   *  2. As an alias to the field set on 'labelField' in the Organization List config, or
   *  3. As an alias to a 'name' field on the Organization List (if one exists), or
   *  4. As an alias to the 'id' field on the Organization List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: '1', fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Country level specific  */
  country?: Maybe<OrganizationCountryType>;
  /**  Customer-friendly name  */
  name?: Maybe<Scalars['String']>;
  /**  Customer-friendly description. Friendly text for employee and resident users  */
  description?: Maybe<Scalars['String']>;
  /**  Customer-friendly avatar  */
  avatar?: Maybe<File>;
  /**  Organization metadata. Depends on country level specificExamples of data keys: `inn`, `kpp`  */
  meta?: Maybe<Scalars['JSON']>;
  employees: Array<OrganizationEmployee>;
  _employeesMeta?: Maybe<_QueryMeta>;
  /**  Graph of possible transitions for statuses. If there is no transition in this graph, it is impossible to change status if the user in the role has the right to do so.  */
  statusTransitions?: Maybe<Scalars['JSON']>;
  /**  Default employee role status transitions map which will be used as fallback for status transition validationif user dont have OrganizationEmployeeRole  */
  defaultEmployeeRoleStatusTransitions?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};


/**  B2B customer of the service, a legal entity or an association of legal entities (holding/group)  */
export type OrganizationEmployeesArgs = {
  where?: Maybe<OrganizationEmployeeWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


/**  B2B customer of the service, a legal entity or an association of legal entities (holding/group)  */
export type Organization_EmployeesMetaArgs = {
  where?: Maybe<OrganizationEmployeeWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};

export enum OrganizationCountryType {
  En = 'en',
  Ru = 'ru'
}

export type OrganizationCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  country?: Maybe<OrganizationCountryType>;
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  avatar?: Maybe<Scalars['Upload']>;
  meta?: Maybe<Scalars['JSON']>;
  employees?: Maybe<OrganizationEmployeeRelateToManyInput>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  B2B customer employees  */
export type OrganizationEmployee = {
  __typename?: 'OrganizationEmployee';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the OrganizationEmployee List config, or
   *  2. As an alias to the field set on 'labelField' in the OrganizationEmployee List config, or
   *  3. As an alias to a 'name' field on the OrganizationEmployee List (if one exists), or
   *  4. As an alias to the 'id' field on the OrganizationEmployee List.
   */
  _label_?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: '1', fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  /**  If user exists => invite is matched by email/phone (user can reject or accept it)  */
  user?: Maybe<User>;
  /**  Secret invite code (used for accept invite verification)  */
  inviteCode?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  role?: Maybe<OrganizationEmployeeRole>;
  /**  Free-form description of the employee's position  */
  position?: Maybe<Scalars['String']>;
  isAccepted?: Maybe<Scalars['Boolean']>;
  isRejected?: Maybe<Scalars['Boolean']>;
  /**  Employee is blocked status, used in permissions functions, isBlocked has Free-form description of the employee's position over all permissions  */
  isBlocked?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type OrganizationEmployeeCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  user?: Maybe<UserRelateToOneInput>;
  inviteCode?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  role?: Maybe<OrganizationEmployeeRoleRelateToOneInput>;
  position?: Maybe<Scalars['String']>;
  isAccepted?: Maybe<Scalars['Boolean']>;
  isRejected?: Maybe<Scalars['Boolean']>;
  isBlocked?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type OrganizationEmployeeHistoryRecord = {
  __typename?: 'OrganizationEmployeeHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the OrganizationEmployeeHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the OrganizationEmployeeHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the OrganizationEmployeeHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the OrganizationEmployeeHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  inviteCode?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  role?: Maybe<Scalars['String']>;
  position?: Maybe<Scalars['String']>;
  isAccepted?: Maybe<Scalars['Boolean']>;
  isRejected?: Maybe<Scalars['Boolean']>;
  isBlocked?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<OrganizationEmployeeHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type OrganizationEmployeeHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  inviteCode?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  role?: Maybe<Scalars['String']>;
  position?: Maybe<Scalars['String']>;
  isAccepted?: Maybe<Scalars['Boolean']>;
  isRejected?: Maybe<Scalars['Boolean']>;
  isBlocked?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<OrganizationEmployeeHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum OrganizationEmployeeHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type OrganizationEmployeeHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  inviteCode?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  role?: Maybe<Scalars['String']>;
  position?: Maybe<Scalars['String']>;
  isAccepted?: Maybe<Scalars['Boolean']>;
  isRejected?: Maybe<Scalars['Boolean']>;
  isBlocked?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<OrganizationEmployeeHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type OrganizationEmployeeHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user?: Maybe<Scalars['String']>;
  user_not?: Maybe<Scalars['String']>;
  user_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  inviteCode?: Maybe<Scalars['ID']>;
  inviteCode_not?: Maybe<Scalars['ID']>;
  inviteCode_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  inviteCode_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
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
  role?: Maybe<Scalars['String']>;
  role_not?: Maybe<Scalars['String']>;
  role_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  role_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  position?: Maybe<Scalars['String']>;
  position_not?: Maybe<Scalars['String']>;
  position_contains?: Maybe<Scalars['String']>;
  position_not_contains?: Maybe<Scalars['String']>;
  position_starts_with?: Maybe<Scalars['String']>;
  position_not_starts_with?: Maybe<Scalars['String']>;
  position_ends_with?: Maybe<Scalars['String']>;
  position_not_ends_with?: Maybe<Scalars['String']>;
  position_i?: Maybe<Scalars['String']>;
  position_not_i?: Maybe<Scalars['String']>;
  position_contains_i?: Maybe<Scalars['String']>;
  position_not_contains_i?: Maybe<Scalars['String']>;
  position_starts_with_i?: Maybe<Scalars['String']>;
  position_not_starts_with_i?: Maybe<Scalars['String']>;
  position_ends_with_i?: Maybe<Scalars['String']>;
  position_not_ends_with_i?: Maybe<Scalars['String']>;
  position_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  position_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isAccepted?: Maybe<Scalars['Boolean']>;
  isAccepted_not?: Maybe<Scalars['Boolean']>;
  isRejected?: Maybe<Scalars['Boolean']>;
  isRejected_not?: Maybe<Scalars['Boolean']>;
  isBlocked?: Maybe<Scalars['Boolean']>;
  isBlocked_not?: Maybe<Scalars['Boolean']>;
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
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<OrganizationEmployeeHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<OrganizationEmployeeHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type OrganizationEmployeeHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type OrganizationEmployeeHistoryRecordsCreateInput = {
  data?: Maybe<OrganizationEmployeeHistoryRecordCreateInput>;
};

export type OrganizationEmployeeHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationEmployeeHistoryRecordUpdateInput>;
};

export type OrganizationEmployeeRelateToManyInput = {
  create?: Maybe<Array<Maybe<OrganizationEmployeeCreateInput>>>;
  connect?: Maybe<Array<Maybe<OrganizationEmployeeWhereUniqueInput>>>;
  disconnect?: Maybe<Array<Maybe<OrganizationEmployeeWhereUniqueInput>>>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

/**  Employee role name and access permissions  */
export type OrganizationEmployeeRole = {
  __typename?: 'OrganizationEmployeeRole';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the OrganizationEmployeeRole List config, or
   *  2. As an alias to the field set on 'labelField' in the OrganizationEmployeeRole List config, or
   *  3. As an alias to a 'name' field on the OrganizationEmployeeRole List (if one exists), or
   *  4. As an alias to the 'id' field on the OrganizationEmployeeRole List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: '1', fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  name?: Maybe<Scalars['String']>;
  /**  Employee status transitions map  */
  statusTransitions?: Maybe<Scalars['JSON']>;
  canManageOrganization?: Maybe<Scalars['Boolean']>;
  canManageEmployees?: Maybe<Scalars['Boolean']>;
  canManageRoles?: Maybe<Scalars['Boolean']>;
  canManageIntegrations?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
};

export type OrganizationEmployeeRoleCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  name?: Maybe<Scalars['String']>;
  canManageOrganization?: Maybe<Scalars['Boolean']>;
  canManageEmployees?: Maybe<Scalars['Boolean']>;
  canManageRoles?: Maybe<Scalars['Boolean']>;
  canManageIntegrations?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
};

/**  A keystone list  */
export type OrganizationEmployeeRoleHistoryRecord = {
  __typename?: 'OrganizationEmployeeRoleHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the OrganizationEmployeeRoleHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the OrganizationEmployeeRoleHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the OrganizationEmployeeRoleHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the OrganizationEmployeeRoleHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  statusTransitions?: Maybe<Scalars['JSON']>;
  canManageOrganization?: Maybe<Scalars['Boolean']>;
  canManageEmployees?: Maybe<Scalars['Boolean']>;
  canManageRoles?: Maybe<Scalars['Boolean']>;
  canManageIntegrations?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<OrganizationEmployeeRoleHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type OrganizationEmployeeRoleHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  statusTransitions?: Maybe<Scalars['JSON']>;
  canManageOrganization?: Maybe<Scalars['Boolean']>;
  canManageEmployees?: Maybe<Scalars['Boolean']>;
  canManageRoles?: Maybe<Scalars['Boolean']>;
  canManageIntegrations?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<OrganizationEmployeeRoleHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum OrganizationEmployeeRoleHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type OrganizationEmployeeRoleHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  statusTransitions?: Maybe<Scalars['JSON']>;
  canManageOrganization?: Maybe<Scalars['Boolean']>;
  canManageEmployees?: Maybe<Scalars['Boolean']>;
  canManageRoles?: Maybe<Scalars['Boolean']>;
  canManageIntegrations?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<OrganizationEmployeeRoleHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type OrganizationEmployeeRoleHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  statusTransitions?: Maybe<Scalars['JSON']>;
  statusTransitions_not?: Maybe<Scalars['JSON']>;
  statusTransitions_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  statusTransitions_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  canManageOrganization?: Maybe<Scalars['Boolean']>;
  canManageOrganization_not?: Maybe<Scalars['Boolean']>;
  canManageEmployees?: Maybe<Scalars['Boolean']>;
  canManageEmployees_not?: Maybe<Scalars['Boolean']>;
  canManageRoles?: Maybe<Scalars['Boolean']>;
  canManageRoles_not?: Maybe<Scalars['Boolean']>;
  canManageIntegrations?: Maybe<Scalars['Boolean']>;
  canManageIntegrations_not?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageProperties_not?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageTickets_not?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageContacts_not?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  canManageTicketComments_not?: Maybe<Scalars['Boolean']>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<OrganizationEmployeeRoleHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<OrganizationEmployeeRoleHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type OrganizationEmployeeRoleHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type OrganizationEmployeeRoleHistoryRecordsCreateInput = {
  data?: Maybe<OrganizationEmployeeRoleHistoryRecordCreateInput>;
};

export type OrganizationEmployeeRoleHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationEmployeeRoleHistoryRecordUpdateInput>;
};

export type OrganizationEmployeeRoleRelateToOneInput = {
  create?: Maybe<OrganizationEmployeeRoleCreateInput>;
  connect?: Maybe<OrganizationEmployeeRoleWhereUniqueInput>;
  disconnect?: Maybe<OrganizationEmployeeRoleWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type OrganizationEmployeeRoleUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  name?: Maybe<Scalars['String']>;
  canManageOrganization?: Maybe<Scalars['Boolean']>;
  canManageEmployees?: Maybe<Scalars['Boolean']>;
  canManageRoles?: Maybe<Scalars['Boolean']>;
  canManageIntegrations?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
};

export type OrganizationEmployeeRoleWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationEmployeeRoleWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationEmployeeRoleWhereInput>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
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
  canManageOrganization?: Maybe<Scalars['Boolean']>;
  canManageOrganization_not?: Maybe<Scalars['Boolean']>;
  canManageEmployees?: Maybe<Scalars['Boolean']>;
  canManageEmployees_not?: Maybe<Scalars['Boolean']>;
  canManageRoles?: Maybe<Scalars['Boolean']>;
  canManageRoles_not?: Maybe<Scalars['Boolean']>;
  canManageIntegrations?: Maybe<Scalars['Boolean']>;
  canManageIntegrations_not?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageProperties_not?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageTickets_not?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageContacts_not?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  canManageTicketComments_not?: Maybe<Scalars['Boolean']>;
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
};

export type OrganizationEmployeeRoleWhereUniqueInput = {
  id: Scalars['ID'];
};

export type OrganizationEmployeeRolesCreateInput = {
  data?: Maybe<OrganizationEmployeeRoleCreateInput>;
};

export type OrganizationEmployeeRolesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationEmployeeRoleUpdateInput>;
};

export type OrganizationEmployeeUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  user?: Maybe<UserRelateToOneInput>;
  inviteCode?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  role?: Maybe<OrganizationEmployeeRoleRelateToOneInput>;
  position?: Maybe<Scalars['String']>;
  isAccepted?: Maybe<Scalars['Boolean']>;
  isRejected?: Maybe<Scalars['Boolean']>;
  isBlocked?: Maybe<Scalars['Boolean']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type OrganizationEmployeeWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationEmployeeWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationEmployeeWhereInput>>>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  user?: Maybe<UserWhereInput>;
  user_is_null?: Maybe<Scalars['Boolean']>;
  inviteCode?: Maybe<Scalars['ID']>;
  inviteCode_not?: Maybe<Scalars['ID']>;
  inviteCode_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  inviteCode_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
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
  role?: Maybe<OrganizationEmployeeRoleWhereInput>;
  role_is_null?: Maybe<Scalars['Boolean']>;
  position?: Maybe<Scalars['String']>;
  position_not?: Maybe<Scalars['String']>;
  position_contains?: Maybe<Scalars['String']>;
  position_not_contains?: Maybe<Scalars['String']>;
  position_starts_with?: Maybe<Scalars['String']>;
  position_not_starts_with?: Maybe<Scalars['String']>;
  position_ends_with?: Maybe<Scalars['String']>;
  position_not_ends_with?: Maybe<Scalars['String']>;
  position_i?: Maybe<Scalars['String']>;
  position_not_i?: Maybe<Scalars['String']>;
  position_contains_i?: Maybe<Scalars['String']>;
  position_not_contains_i?: Maybe<Scalars['String']>;
  position_starts_with_i?: Maybe<Scalars['String']>;
  position_not_starts_with_i?: Maybe<Scalars['String']>;
  position_ends_with_i?: Maybe<Scalars['String']>;
  position_not_ends_with_i?: Maybe<Scalars['String']>;
  position_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  position_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isAccepted?: Maybe<Scalars['Boolean']>;
  isAccepted_not?: Maybe<Scalars['Boolean']>;
  isRejected?: Maybe<Scalars['Boolean']>;
  isRejected_not?: Maybe<Scalars['Boolean']>;
  isBlocked?: Maybe<Scalars['Boolean']>;
  isBlocked_not?: Maybe<Scalars['Boolean']>;
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
};

export type OrganizationEmployeeWhereUniqueInput = {
  id: Scalars['ID'];
};

export type OrganizationEmployeesCreateInput = {
  data?: Maybe<OrganizationEmployeeCreateInput>;
};

export type OrganizationEmployeesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationEmployeeUpdateInput>;
};

/**  A keystone list  */
export type OrganizationHistoryRecord = {
  __typename?: 'OrganizationHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the OrganizationHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the OrganizationHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the OrganizationHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the OrganizationHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  country?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['JSON']>;
  avatar?: Maybe<Scalars['JSON']>;
  meta?: Maybe<Scalars['JSON']>;
  statusTransitions?: Maybe<Scalars['JSON']>;
  defaultEmployeeRoleStatusTransitions?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<OrganizationHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type OrganizationHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  country?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['JSON']>;
  avatar?: Maybe<Scalars['JSON']>;
  meta?: Maybe<Scalars['JSON']>;
  statusTransitions?: Maybe<Scalars['JSON']>;
  defaultEmployeeRoleStatusTransitions?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<OrganizationHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum OrganizationHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type OrganizationHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  country?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['JSON']>;
  avatar?: Maybe<Scalars['JSON']>;
  meta?: Maybe<Scalars['JSON']>;
  statusTransitions?: Maybe<Scalars['JSON']>;
  defaultEmployeeRoleStatusTransitions?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<OrganizationHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type OrganizationHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationHistoryRecordWhereInput>>>;
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
  description?: Maybe<Scalars['JSON']>;
  description_not?: Maybe<Scalars['JSON']>;
  description_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  description_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  avatar?: Maybe<Scalars['JSON']>;
  avatar_not?: Maybe<Scalars['JSON']>;
  avatar_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  avatar_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  statusTransitions?: Maybe<Scalars['JSON']>;
  statusTransitions_not?: Maybe<Scalars['JSON']>;
  statusTransitions_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  statusTransitions_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  defaultEmployeeRoleStatusTransitions?: Maybe<Scalars['JSON']>;
  defaultEmployeeRoleStatusTransitions_not?: Maybe<Scalars['JSON']>;
  defaultEmployeeRoleStatusTransitions_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  defaultEmployeeRoleStatusTransitions_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<OrganizationHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<OrganizationHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<OrganizationHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<OrganizationHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type OrganizationHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type OrganizationHistoryRecordsCreateInput = {
  data?: Maybe<OrganizationHistoryRecordCreateInput>;
};

export type OrganizationHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationHistoryRecordUpdateInput>;
};

export type OrganizationRelateToOneInput = {
  create?: Maybe<OrganizationCreateInput>;
  connect?: Maybe<OrganizationWhereUniqueInput>;
  disconnect?: Maybe<OrganizationWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type OrganizationUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  country?: Maybe<OrganizationCountryType>;
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  avatar?: Maybe<Scalars['Upload']>;
  meta?: Maybe<Scalars['JSON']>;
  employees?: Maybe<OrganizationEmployeeRelateToManyInput>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type OrganizationWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationWhereInput>>>;
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
  country?: Maybe<OrganizationCountryType>;
  country_not?: Maybe<OrganizationCountryType>;
  country_in?: Maybe<Array<Maybe<OrganizationCountryType>>>;
  country_not_in?: Maybe<Array<Maybe<OrganizationCountryType>>>;
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
  description?: Maybe<Scalars['String']>;
  description_not?: Maybe<Scalars['String']>;
  description_contains?: Maybe<Scalars['String']>;
  description_not_contains?: Maybe<Scalars['String']>;
  description_starts_with?: Maybe<Scalars['String']>;
  description_not_starts_with?: Maybe<Scalars['String']>;
  description_ends_with?: Maybe<Scalars['String']>;
  description_not_ends_with?: Maybe<Scalars['String']>;
  description_i?: Maybe<Scalars['String']>;
  description_not_i?: Maybe<Scalars['String']>;
  description_contains_i?: Maybe<Scalars['String']>;
  description_not_contains_i?: Maybe<Scalars['String']>;
  description_starts_with_i?: Maybe<Scalars['String']>;
  description_not_starts_with_i?: Maybe<Scalars['String']>;
  description_ends_with_i?: Maybe<Scalars['String']>;
  description_not_ends_with_i?: Maybe<Scalars['String']>;
  description_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  description_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  avatar?: Maybe<Scalars['String']>;
  avatar_not?: Maybe<Scalars['String']>;
  avatar_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  avatar_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  /**  condition must be true for all nodes  */
  employees_every?: Maybe<OrganizationEmployeeWhereInput>;
  /**  condition must be true for at least 1 node  */
  employees_some?: Maybe<OrganizationEmployeeWhereInput>;
  /**  condition must be false for all nodes  */
  employees_none?: Maybe<OrganizationEmployeeWhereInput>;
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
};

export type OrganizationWhereUniqueInput = {
  id: Scalars['ID'];
};

export type OrganizationsCreateInput = {
  data?: Maybe<OrganizationCreateInput>;
};

export type OrganizationsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<OrganizationUpdateInput>;
};

export type PropertiesCreateInput = {
  data?: Maybe<PropertyCreateInput>;
};

export type PropertiesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<PropertyUpdateInput>;
};

/**  Common property. The property is divided into separate `unit` parts, each of which can be owned by an independent owner. Community farm, residential buildings, or a cottage settlement  */
export type Property = {
  __typename?: 'Property';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the Property List config, or
   *  2. As an alias to the field set on 'labelField' in the Property List config, or
   *  3. As an alias to a 'name' field on the Property List (if one exists), or
   *  4. As an alias to the 'id' field on the Property List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  /**  Client understandable Property name. A well-known property name for the client  */
  name?: Maybe<Scalars['String']>;
  /**  Normalized address  */
  address?: Maybe<Scalars['String']>;
  /**  Property address components  */
  addressMeta?: Maybe<Scalars['JSON']>;
  /**  Common property type  */
  type?: Maybe<PropertyTypeType>;
  /**  Property map/schema  */
  map?: Maybe<Scalars['JSON']>;
  /**  A number of parts in the property. The number of flats for property.type = house. The number of garden houses for property.type = village.  */
  unitsCount?: Maybe<Scalars['Int']>;
  /**  Counter for closed tickets  */
  ticketsClosed?: Maybe<Scalars['String']>;
  /**  Counter for not closed tickets  */
  ticketsInWork?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type PropertyCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  name?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  type?: Maybe<PropertyTypeType>;
  map?: Maybe<Scalars['JSON']>;
  unitsCount?: Maybe<Scalars['Int']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type PropertyHistoryRecord = {
  __typename?: 'PropertyHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the PropertyHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the PropertyHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the PropertyHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the PropertyHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  type?: Maybe<Scalars['String']>;
  map?: Maybe<Scalars['JSON']>;
  unitsCount?: Maybe<Scalars['Int']>;
  ticketsClosed?: Maybe<Scalars['JSON']>;
  ticketsInWork?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<PropertyHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type PropertyHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  type?: Maybe<Scalars['String']>;
  map?: Maybe<Scalars['JSON']>;
  unitsCount?: Maybe<Scalars['Int']>;
  ticketsClosed?: Maybe<Scalars['JSON']>;
  ticketsInWork?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<PropertyHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum PropertyHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type PropertyHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  type?: Maybe<Scalars['String']>;
  map?: Maybe<Scalars['JSON']>;
  unitsCount?: Maybe<Scalars['Int']>;
  ticketsClosed?: Maybe<Scalars['JSON']>;
  ticketsInWork?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<PropertyHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type PropertyHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<PropertyHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<PropertyHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  addressMeta?: Maybe<Scalars['JSON']>;
  addressMeta_not?: Maybe<Scalars['JSON']>;
  addressMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  type?: Maybe<Scalars['String']>;
  type_not?: Maybe<Scalars['String']>;
  type_contains?: Maybe<Scalars['String']>;
  type_not_contains?: Maybe<Scalars['String']>;
  type_starts_with?: Maybe<Scalars['String']>;
  type_not_starts_with?: Maybe<Scalars['String']>;
  type_ends_with?: Maybe<Scalars['String']>;
  type_not_ends_with?: Maybe<Scalars['String']>;
  type_i?: Maybe<Scalars['String']>;
  type_not_i?: Maybe<Scalars['String']>;
  type_contains_i?: Maybe<Scalars['String']>;
  type_not_contains_i?: Maybe<Scalars['String']>;
  type_starts_with_i?: Maybe<Scalars['String']>;
  type_not_starts_with_i?: Maybe<Scalars['String']>;
  type_ends_with_i?: Maybe<Scalars['String']>;
  type_not_ends_with_i?: Maybe<Scalars['String']>;
  type_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  map?: Maybe<Scalars['JSON']>;
  map_not?: Maybe<Scalars['JSON']>;
  map_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  map_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  unitsCount?: Maybe<Scalars['Int']>;
  unitsCount_not?: Maybe<Scalars['Int']>;
  unitsCount_lt?: Maybe<Scalars['Int']>;
  unitsCount_lte?: Maybe<Scalars['Int']>;
  unitsCount_gt?: Maybe<Scalars['Int']>;
  unitsCount_gte?: Maybe<Scalars['Int']>;
  unitsCount_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  unitsCount_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  ticketsClosed?: Maybe<Scalars['JSON']>;
  ticketsClosed_not?: Maybe<Scalars['JSON']>;
  ticketsClosed_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  ticketsClosed_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  ticketsInWork?: Maybe<Scalars['JSON']>;
  ticketsInWork_not?: Maybe<Scalars['JSON']>;
  ticketsInWork_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  ticketsInWork_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<PropertyHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<PropertyHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<PropertyHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<PropertyHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type PropertyHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type PropertyHistoryRecordsCreateInput = {
  data?: Maybe<PropertyHistoryRecordCreateInput>;
};

export type PropertyHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<PropertyHistoryRecordUpdateInput>;
};

export type PropertyRelateToOneInput = {
  create?: Maybe<PropertyCreateInput>;
  connect?: Maybe<PropertyWhereUniqueInput>;
  disconnect?: Maybe<PropertyWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export enum PropertyTypeType {
  Building = 'building',
  Village = 'village'
}

export type PropertyUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  name?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  type?: Maybe<PropertyTypeType>;
  map?: Maybe<Scalars['JSON']>;
  unitsCount?: Maybe<Scalars['Int']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type PropertyWhereInput = {
  AND?: Maybe<Array<Maybe<PropertyWhereInput>>>;
  OR?: Maybe<Array<Maybe<PropertyWhereInput>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
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
  addressMeta?: Maybe<Scalars['JSON']>;
  addressMeta_not?: Maybe<Scalars['JSON']>;
  addressMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  type?: Maybe<PropertyTypeType>;
  type_not?: Maybe<PropertyTypeType>;
  type_in?: Maybe<Array<Maybe<PropertyTypeType>>>;
  type_not_in?: Maybe<Array<Maybe<PropertyTypeType>>>;
  map?: Maybe<Scalars['JSON']>;
  map_not?: Maybe<Scalars['JSON']>;
  map_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  map_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  unitsCount?: Maybe<Scalars['Int']>;
  unitsCount_not?: Maybe<Scalars['Int']>;
  unitsCount_lt?: Maybe<Scalars['Int']>;
  unitsCount_lte?: Maybe<Scalars['Int']>;
  unitsCount_gt?: Maybe<Scalars['Int']>;
  unitsCount_gte?: Maybe<Scalars['Int']>;
  unitsCount_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  unitsCount_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
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
};

export type PropertyWhereUniqueInput = {
  id: Scalars['ID'];
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
  /**  Search for all ForgotPasswordActionHistoryRecord items which match the where clause.  */
  allForgotPasswordActionHistoryRecords?: Maybe<Array<Maybe<ForgotPasswordActionHistoryRecord>>>;
  /**  Search for the ForgotPasswordActionHistoryRecord item with the matching ID.  */
  ForgotPasswordActionHistoryRecord?: Maybe<ForgotPasswordActionHistoryRecord>;
  /**  Perform a meta-query on all ForgotPasswordActionHistoryRecord items which match the where clause.  */
  _allForgotPasswordActionHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the ForgotPasswordActionHistoryRecord list.  */
  _ForgotPasswordActionHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all ForgotPasswordAction items which match the where clause.  */
  allForgotPasswordActions?: Maybe<Array<Maybe<ForgotPasswordAction>>>;
  /**  Search for the ForgotPasswordAction item with the matching ID.  */
  ForgotPasswordAction?: Maybe<ForgotPasswordAction>;
  /**  Perform a meta-query on all ForgotPasswordAction items which match the where clause.  */
  _allForgotPasswordActionsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the ForgotPasswordAction list.  */
  _ForgotPasswordActionsMeta?: Maybe<_ListMeta>;
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
  /**  Search for all OrganizationHistoryRecord items which match the where clause.  */
  allOrganizationHistoryRecords?: Maybe<Array<Maybe<OrganizationHistoryRecord>>>;
  /**  Search for the OrganizationHistoryRecord item with the matching ID.  */
  OrganizationHistoryRecord?: Maybe<OrganizationHistoryRecord>;
  /**  Perform a meta-query on all OrganizationHistoryRecord items which match the where clause.  */
  _allOrganizationHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the OrganizationHistoryRecord list.  */
  _OrganizationHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all Organization items which match the where clause.  */
  allOrganizations?: Maybe<Array<Maybe<Organization>>>;
  /**  Search for the Organization item with the matching ID.  */
  Organization?: Maybe<Organization>;
  /**  Perform a meta-query on all Organization items which match the where clause.  */
  _allOrganizationsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the Organization list.  */
  _OrganizationsMeta?: Maybe<_ListMeta>;
  /**  Search for all OrganizationEmployeeHistoryRecord items which match the where clause.  */
  allOrganizationEmployeeHistoryRecords?: Maybe<Array<Maybe<OrganizationEmployeeHistoryRecord>>>;
  /**  Search for the OrganizationEmployeeHistoryRecord item with the matching ID.  */
  OrganizationEmployeeHistoryRecord?: Maybe<OrganizationEmployeeHistoryRecord>;
  /**  Perform a meta-query on all OrganizationEmployeeHistoryRecord items which match the where clause.  */
  _allOrganizationEmployeeHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the OrganizationEmployeeHistoryRecord list.  */
  _OrganizationEmployeeHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all OrganizationEmployee items which match the where clause.  */
  allOrganizationEmployees?: Maybe<Array<Maybe<OrganizationEmployee>>>;
  /**  Search for the OrganizationEmployee item with the matching ID.  */
  OrganizationEmployee?: Maybe<OrganizationEmployee>;
  /**  Perform a meta-query on all OrganizationEmployee items which match the where clause.  */
  _allOrganizationEmployeesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the OrganizationEmployee list.  */
  _OrganizationEmployeesMeta?: Maybe<_ListMeta>;
  /**  Search for all OrganizationEmployeeRoleHistoryRecord items which match the where clause.  */
  allOrganizationEmployeeRoleHistoryRecords?: Maybe<Array<Maybe<OrganizationEmployeeRoleHistoryRecord>>>;
  /**  Search for the OrganizationEmployeeRoleHistoryRecord item with the matching ID.  */
  OrganizationEmployeeRoleHistoryRecord?: Maybe<OrganizationEmployeeRoleHistoryRecord>;
  /**  Perform a meta-query on all OrganizationEmployeeRoleHistoryRecord items which match the where clause.  */
  _allOrganizationEmployeeRoleHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the OrganizationEmployeeRoleHistoryRecord list.  */
  _OrganizationEmployeeRoleHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all OrganizationEmployeeRole items which match the where clause.  */
  allOrganizationEmployeeRoles?: Maybe<Array<Maybe<OrganizationEmployeeRole>>>;
  /**  Search for the OrganizationEmployeeRole item with the matching ID.  */
  OrganizationEmployeeRole?: Maybe<OrganizationEmployeeRole>;
  /**  Perform a meta-query on all OrganizationEmployeeRole items which match the where clause.  */
  _allOrganizationEmployeeRolesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the OrganizationEmployeeRole list.  */
  _OrganizationEmployeeRolesMeta?: Maybe<_ListMeta>;
  /**  Search for all PropertyHistoryRecord items which match the where clause.  */
  allPropertyHistoryRecords?: Maybe<Array<Maybe<PropertyHistoryRecord>>>;
  /**  Search for the PropertyHistoryRecord item with the matching ID.  */
  PropertyHistoryRecord?: Maybe<PropertyHistoryRecord>;
  /**  Perform a meta-query on all PropertyHistoryRecord items which match the where clause.  */
  _allPropertyHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the PropertyHistoryRecord list.  */
  _PropertyHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all Property items which match the where clause.  */
  allProperties?: Maybe<Array<Maybe<Property>>>;
  /**  Search for the Property item with the matching ID.  */
  Property?: Maybe<Property>;
  /**  Perform a meta-query on all Property items which match the where clause.  */
  _allPropertiesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the Property list.  */
  _PropertiesMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingIntegrationHistoryRecord items which match the where clause.  */
  allBillingIntegrationHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationHistoryRecord>>>;
  /**  Search for the BillingIntegrationHistoryRecord item with the matching ID.  */
  BillingIntegrationHistoryRecord?: Maybe<BillingIntegrationHistoryRecord>;
  /**  Perform a meta-query on all BillingIntegrationHistoryRecord items which match the where clause.  */
  _allBillingIntegrationHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingIntegrationHistoryRecord list.  */
  _BillingIntegrationHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingIntegration items which match the where clause.  */
  allBillingIntegrations?: Maybe<Array<Maybe<BillingIntegration>>>;
  /**  Search for the BillingIntegration item with the matching ID.  */
  BillingIntegration?: Maybe<BillingIntegration>;
  /**  Perform a meta-query on all BillingIntegration items which match the where clause.  */
  _allBillingIntegrationsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingIntegration list.  */
  _BillingIntegrationsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingIntegrationAccessRightHistoryRecord items which match the where clause.  */
  allBillingIntegrationAccessRightHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationAccessRightHistoryRecord>>>;
  /**  Search for the BillingIntegrationAccessRightHistoryRecord item with the matching ID.  */
  BillingIntegrationAccessRightHistoryRecord?: Maybe<BillingIntegrationAccessRightHistoryRecord>;
  /**  Perform a meta-query on all BillingIntegrationAccessRightHistoryRecord items which match the where clause.  */
  _allBillingIntegrationAccessRightHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingIntegrationAccessRightHistoryRecord list.  */
  _BillingIntegrationAccessRightHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingIntegrationAccessRight items which match the where clause.  */
  allBillingIntegrationAccessRights?: Maybe<Array<Maybe<BillingIntegrationAccessRight>>>;
  /**  Search for the BillingIntegrationAccessRight item with the matching ID.  */
  BillingIntegrationAccessRight?: Maybe<BillingIntegrationAccessRight>;
  /**  Perform a meta-query on all BillingIntegrationAccessRight items which match the where clause.  */
  _allBillingIntegrationAccessRightsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingIntegrationAccessRight list.  */
  _BillingIntegrationAccessRightsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingIntegrationOrganizationContextHistoryRecord items which match the where clause.  */
  allBillingIntegrationOrganizationContextHistoryRecords?: Maybe<Array<Maybe<BillingIntegrationOrganizationContextHistoryRecord>>>;
  /**  Search for the BillingIntegrationOrganizationContextHistoryRecord item with the matching ID.  */
  BillingIntegrationOrganizationContextHistoryRecord?: Maybe<BillingIntegrationOrganizationContextHistoryRecord>;
  /**  Perform a meta-query on all BillingIntegrationOrganizationContextHistoryRecord items which match the where clause.  */
  _allBillingIntegrationOrganizationContextHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingIntegrationOrganizationContextHistoryRecord list.  */
  _BillingIntegrationOrganizationContextHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingIntegrationOrganizationContext items which match the where clause.  */
  allBillingIntegrationOrganizationContexts?: Maybe<Array<Maybe<BillingIntegrationOrganizationContext>>>;
  /**  Search for the BillingIntegrationOrganizationContext item with the matching ID.  */
  BillingIntegrationOrganizationContext?: Maybe<BillingIntegrationOrganizationContext>;
  /**  Perform a meta-query on all BillingIntegrationOrganizationContext items which match the where clause.  */
  _allBillingIntegrationOrganizationContextsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingIntegrationOrganizationContext list.  */
  _BillingIntegrationOrganizationContextsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingIntegrationLog items which match the where clause.  */
  allBillingIntegrationLogs?: Maybe<Array<Maybe<BillingIntegrationLog>>>;
  /**  Search for the BillingIntegrationLog item with the matching ID.  */
  BillingIntegrationLog?: Maybe<BillingIntegrationLog>;
  /**  Perform a meta-query on all BillingIntegrationLog items which match the where clause.  */
  _allBillingIntegrationLogsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingIntegrationLog list.  */
  _BillingIntegrationLogsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingPropertyHistoryRecord items which match the where clause.  */
  allBillingPropertyHistoryRecords?: Maybe<Array<Maybe<BillingPropertyHistoryRecord>>>;
  /**  Search for the BillingPropertyHistoryRecord item with the matching ID.  */
  BillingPropertyHistoryRecord?: Maybe<BillingPropertyHistoryRecord>;
  /**  Perform a meta-query on all BillingPropertyHistoryRecord items which match the where clause.  */
  _allBillingPropertyHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingPropertyHistoryRecord list.  */
  _BillingPropertyHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingProperty items which match the where clause.  */
  allBillingProperties?: Maybe<Array<Maybe<BillingProperty>>>;
  /**  Search for the BillingProperty item with the matching ID.  */
  BillingProperty?: Maybe<BillingProperty>;
  /**  Perform a meta-query on all BillingProperty items which match the where clause.  */
  _allBillingPropertiesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingProperty list.  */
  _BillingPropertiesMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingAccountHistoryRecord items which match the where clause.  */
  allBillingAccountHistoryRecords?: Maybe<Array<Maybe<BillingAccountHistoryRecord>>>;
  /**  Search for the BillingAccountHistoryRecord item with the matching ID.  */
  BillingAccountHistoryRecord?: Maybe<BillingAccountHistoryRecord>;
  /**  Perform a meta-query on all BillingAccountHistoryRecord items which match the where clause.  */
  _allBillingAccountHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingAccountHistoryRecord list.  */
  _BillingAccountHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingAccount items which match the where clause.  */
  allBillingAccounts?: Maybe<Array<Maybe<BillingAccount>>>;
  /**  Search for the BillingAccount item with the matching ID.  */
  BillingAccount?: Maybe<BillingAccount>;
  /**  Perform a meta-query on all BillingAccount items which match the where clause.  */
  _allBillingAccountsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingAccount list.  */
  _BillingAccountsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingMeterResourceHistoryRecord items which match the where clause.  */
  allBillingMeterResourceHistoryRecords?: Maybe<Array<Maybe<BillingMeterResourceHistoryRecord>>>;
  /**  Search for the BillingMeterResourceHistoryRecord item with the matching ID.  */
  BillingMeterResourceHistoryRecord?: Maybe<BillingMeterResourceHistoryRecord>;
  /**  Perform a meta-query on all BillingMeterResourceHistoryRecord items which match the where clause.  */
  _allBillingMeterResourceHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingMeterResourceHistoryRecord list.  */
  _BillingMeterResourceHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingMeterResource items which match the where clause.  */
  allBillingMeterResources?: Maybe<Array<Maybe<BillingMeterResource>>>;
  /**  Search for the BillingMeterResource item with the matching ID.  */
  BillingMeterResource?: Maybe<BillingMeterResource>;
  /**  Perform a meta-query on all BillingMeterResource items which match the where clause.  */
  _allBillingMeterResourcesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingMeterResource list.  */
  _BillingMeterResourcesMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingAccountMeterHistoryRecord items which match the where clause.  */
  allBillingAccountMeterHistoryRecords?: Maybe<Array<Maybe<BillingAccountMeterHistoryRecord>>>;
  /**  Search for the BillingAccountMeterHistoryRecord item with the matching ID.  */
  BillingAccountMeterHistoryRecord?: Maybe<BillingAccountMeterHistoryRecord>;
  /**  Perform a meta-query on all BillingAccountMeterHistoryRecord items which match the where clause.  */
  _allBillingAccountMeterHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingAccountMeterHistoryRecord list.  */
  _BillingAccountMeterHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingAccountMeter items which match the where clause.  */
  allBillingAccountMeters?: Maybe<Array<Maybe<BillingAccountMeter>>>;
  /**  Search for the BillingAccountMeter item with the matching ID.  */
  BillingAccountMeter?: Maybe<BillingAccountMeter>;
  /**  Perform a meta-query on all BillingAccountMeter items which match the where clause.  */
  _allBillingAccountMetersMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingAccountMeter list.  */
  _BillingAccountMetersMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingAccountMeterReadingHistoryRecord items which match the where clause.  */
  allBillingAccountMeterReadingHistoryRecords?: Maybe<Array<Maybe<BillingAccountMeterReadingHistoryRecord>>>;
  /**  Search for the BillingAccountMeterReadingHistoryRecord item with the matching ID.  */
  BillingAccountMeterReadingHistoryRecord?: Maybe<BillingAccountMeterReadingHistoryRecord>;
  /**  Perform a meta-query on all BillingAccountMeterReadingHistoryRecord items which match the where clause.  */
  _allBillingAccountMeterReadingHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingAccountMeterReadingHistoryRecord list.  */
  _BillingAccountMeterReadingHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingAccountMeterReading items which match the where clause.  */
  allBillingAccountMeterReadings?: Maybe<Array<Maybe<BillingAccountMeterReading>>>;
  /**  Search for the BillingAccountMeterReading item with the matching ID.  */
  BillingAccountMeterReading?: Maybe<BillingAccountMeterReading>;
  /**  Perform a meta-query on all BillingAccountMeterReading items which match the where clause.  */
  _allBillingAccountMeterReadingsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingAccountMeterReading list.  */
  _BillingAccountMeterReadingsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingReceiptHistoryRecord items which match the where clause.  */
  allBillingReceiptHistoryRecords?: Maybe<Array<Maybe<BillingReceiptHistoryRecord>>>;
  /**  Search for the BillingReceiptHistoryRecord item with the matching ID.  */
  BillingReceiptHistoryRecord?: Maybe<BillingReceiptHistoryRecord>;
  /**  Perform a meta-query on all BillingReceiptHistoryRecord items which match the where clause.  */
  _allBillingReceiptHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingReceiptHistoryRecord list.  */
  _BillingReceiptHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingReceipt items which match the where clause.  */
  allBillingReceipts?: Maybe<Array<Maybe<BillingReceipt>>>;
  /**  Search for the BillingReceipt item with the matching ID.  */
  BillingReceipt?: Maybe<BillingReceipt>;
  /**  Perform a meta-query on all BillingReceipt items which match the where clause.  */
  _allBillingReceiptsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingReceipt list.  */
  _BillingReceiptsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingOrganizationHistoryRecord items which match the where clause.  */
  allBillingOrganizationHistoryRecords?: Maybe<Array<Maybe<BillingOrganizationHistoryRecord>>>;
  /**  Search for the BillingOrganizationHistoryRecord item with the matching ID.  */
  BillingOrganizationHistoryRecord?: Maybe<BillingOrganizationHistoryRecord>;
  /**  Perform a meta-query on all BillingOrganizationHistoryRecord items which match the where clause.  */
  _allBillingOrganizationHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingOrganizationHistoryRecord list.  */
  _BillingOrganizationHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all BillingOrganization items which match the where clause.  */
  allBillingOrganizations?: Maybe<Array<Maybe<BillingOrganization>>>;
  /**  Search for the BillingOrganization item with the matching ID.  */
  BillingOrganization?: Maybe<BillingOrganization>;
  /**  Perform a meta-query on all BillingOrganization items which match the where clause.  */
  _allBillingOrganizationsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the BillingOrganization list.  */
  _BillingOrganizationsMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketHistoryRecord items which match the where clause.  */
  allTicketHistoryRecords?: Maybe<Array<Maybe<TicketHistoryRecord>>>;
  /**  Search for the TicketHistoryRecord item with the matching ID.  */
  TicketHistoryRecord?: Maybe<TicketHistoryRecord>;
  /**  Perform a meta-query on all TicketHistoryRecord items which match the where clause.  */
  _allTicketHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketHistoryRecord list.  */
  _TicketHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all Ticket items which match the where clause.  */
  allTickets?: Maybe<Array<Maybe<Ticket>>>;
  /**  Search for the Ticket item with the matching ID.  */
  Ticket?: Maybe<Ticket>;
  /**  Perform a meta-query on all Ticket items which match the where clause.  */
  _allTicketsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the Ticket list.  */
  _TicketsMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketSourceHistoryRecord items which match the where clause.  */
  allTicketSourceHistoryRecords?: Maybe<Array<Maybe<TicketSourceHistoryRecord>>>;
  /**  Search for the TicketSourceHistoryRecord item with the matching ID.  */
  TicketSourceHistoryRecord?: Maybe<TicketSourceHistoryRecord>;
  /**  Perform a meta-query on all TicketSourceHistoryRecord items which match the where clause.  */
  _allTicketSourceHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketSourceHistoryRecord list.  */
  _TicketSourceHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketSource items which match the where clause.  */
  allTicketSources?: Maybe<Array<Maybe<TicketSource>>>;
  /**  Search for the TicketSource item with the matching ID.  */
  TicketSource?: Maybe<TicketSource>;
  /**  Perform a meta-query on all TicketSource items which match the where clause.  */
  _allTicketSourcesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketSource list.  */
  _TicketSourcesMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketClassifierHistoryRecord items which match the where clause.  */
  allTicketClassifierHistoryRecords?: Maybe<Array<Maybe<TicketClassifierHistoryRecord>>>;
  /**  Search for the TicketClassifierHistoryRecord item with the matching ID.  */
  TicketClassifierHistoryRecord?: Maybe<TicketClassifierHistoryRecord>;
  /**  Perform a meta-query on all TicketClassifierHistoryRecord items which match the where clause.  */
  _allTicketClassifierHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketClassifierHistoryRecord list.  */
  _TicketClassifierHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketClassifier items which match the where clause.  */
  allTicketClassifiers?: Maybe<Array<Maybe<TicketClassifier>>>;
  /**  Search for the TicketClassifier item with the matching ID.  */
  TicketClassifier?: Maybe<TicketClassifier>;
  /**  Perform a meta-query on all TicketClassifier items which match the where clause.  */
  _allTicketClassifiersMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketClassifier list.  */
  _TicketClassifiersMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketStatusHistoryRecord items which match the where clause.  */
  allTicketStatusHistoryRecords?: Maybe<Array<Maybe<TicketStatusHistoryRecord>>>;
  /**  Search for the TicketStatusHistoryRecord item with the matching ID.  */
  TicketStatusHistoryRecord?: Maybe<TicketStatusHistoryRecord>;
  /**  Perform a meta-query on all TicketStatusHistoryRecord items which match the where clause.  */
  _allTicketStatusHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketStatusHistoryRecord list.  */
  _TicketStatusHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketStatus items which match the where clause.  */
  allTicketStatuses?: Maybe<Array<Maybe<TicketStatus>>>;
  /**  Search for the TicketStatus item with the matching ID.  */
  TicketStatus?: Maybe<TicketStatus>;
  /**  Perform a meta-query on all TicketStatus items which match the where clause.  */
  _allTicketStatusesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketStatus list.  */
  _TicketStatusesMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketFileHistoryRecord items which match the where clause.  */
  allTicketFileHistoryRecords?: Maybe<Array<Maybe<TicketFileHistoryRecord>>>;
  /**  Search for the TicketFileHistoryRecord item with the matching ID.  */
  TicketFileHistoryRecord?: Maybe<TicketFileHistoryRecord>;
  /**  Perform a meta-query on all TicketFileHistoryRecord items which match the where clause.  */
  _allTicketFileHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketFileHistoryRecord list.  */
  _TicketFileHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketFile items which match the where clause.  */
  allTicketFiles?: Maybe<Array<Maybe<TicketFile>>>;
  /**  Search for the TicketFile item with the matching ID.  */
  TicketFile?: Maybe<TicketFile>;
  /**  Perform a meta-query on all TicketFile items which match the where clause.  */
  _allTicketFilesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketFile list.  */
  _TicketFilesMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketChange items which match the where clause.  */
  allTicketChanges?: Maybe<Array<Maybe<TicketChange>>>;
  /**  Search for the TicketChange item with the matching ID.  */
  TicketChange?: Maybe<TicketChange>;
  /**  Perform a meta-query on all TicketChange items which match the where clause.  */
  _allTicketChangesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketChange list.  */
  _TicketChangesMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketCommentHistoryRecord items which match the where clause.  */
  allTicketCommentHistoryRecords?: Maybe<Array<Maybe<TicketCommentHistoryRecord>>>;
  /**  Search for the TicketCommentHistoryRecord item with the matching ID.  */
  TicketCommentHistoryRecord?: Maybe<TicketCommentHistoryRecord>;
  /**  Perform a meta-query on all TicketCommentHistoryRecord items which match the where clause.  */
  _allTicketCommentHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketCommentHistoryRecord list.  */
  _TicketCommentHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all TicketComment items which match the where clause.  */
  allTicketComments?: Maybe<Array<Maybe<TicketComment>>>;
  /**  Search for the TicketComment item with the matching ID.  */
  TicketComment?: Maybe<TicketComment>;
  /**  Perform a meta-query on all TicketComment items which match the where clause.  */
  _allTicketCommentsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the TicketComment list.  */
  _TicketCommentsMeta?: Maybe<_ListMeta>;
  /**  Search for all MessageHistoryRecord items which match the where clause.  */
  allMessageHistoryRecords?: Maybe<Array<Maybe<MessageHistoryRecord>>>;
  /**  Search for the MessageHistoryRecord item with the matching ID.  */
  MessageHistoryRecord?: Maybe<MessageHistoryRecord>;
  /**  Perform a meta-query on all MessageHistoryRecord items which match the where clause.  */
  _allMessageHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the MessageHistoryRecord list.  */
  _MessageHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all Message items which match the where clause.  */
  allMessages?: Maybe<Array<Maybe<Message>>>;
  /**  Search for the Message item with the matching ID.  */
  Message?: Maybe<Message>;
  /**  Perform a meta-query on all Message items which match the where clause.  */
  _allMessagesMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the Message list.  */
  _MessagesMeta?: Maybe<_ListMeta>;
  /**  Search for all ContactHistoryRecord items which match the where clause.  */
  allContactHistoryRecords?: Maybe<Array<Maybe<ContactHistoryRecord>>>;
  /**  Search for the ContactHistoryRecord item with the matching ID.  */
  ContactHistoryRecord?: Maybe<ContactHistoryRecord>;
  /**  Perform a meta-query on all ContactHistoryRecord items which match the where clause.  */
  _allContactHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the ContactHistoryRecord list.  */
  _ContactHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all Contact items which match the where clause.  */
  allContacts?: Maybe<Array<Maybe<Contact>>>;
  /**  Search for the Contact item with the matching ID.  */
  Contact?: Maybe<Contact>;
  /**  Perform a meta-query on all Contact items which match the where clause.  */
  _allContactsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the Contact list.  */
  _ContactsMeta?: Maybe<_ListMeta>;
  /**  Search for all ResidentHistoryRecord items which match the where clause.  */
  allResidentHistoryRecords?: Maybe<Array<Maybe<ResidentHistoryRecord>>>;
  /**  Search for the ResidentHistoryRecord item with the matching ID.  */
  ResidentHistoryRecord?: Maybe<ResidentHistoryRecord>;
  /**  Perform a meta-query on all ResidentHistoryRecord items which match the where clause.  */
  _allResidentHistoryRecordsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the ResidentHistoryRecord list.  */
  _ResidentHistoryRecordsMeta?: Maybe<_ListMeta>;
  /**  Search for all Resident items which match the where clause.  */
  allResidents?: Maybe<Array<Maybe<Resident>>>;
  /**  Search for the Resident item with the matching ID.  */
  Resident?: Maybe<Resident>;
  /**  Perform a meta-query on all Resident items which match the where clause.  */
  _allResidentsMeta?: Maybe<_QueryMeta>;
  /**  Retrieve the meta-data for the Resident list.  */
  _ResidentsMeta?: Maybe<_ListMeta>;
  /**  Retrieve the meta-data for all lists.  */
  _ksListsMeta?: Maybe<Array<Maybe<_ListMeta>>>;
  checkPasswordRecoveryToken?: Maybe<CheckPasswordRecoveryTokenOutput>;
  getPhoneByConfirmPhoneActionToken?: Maybe<GetPhoneByConfirmPhoneActionTokenOutput>;
  ticketReportWidgetData?: Maybe<TicketReportWidgetOutput>;
  exportTicketsToExcel?: Maybe<ExportTicketsToExcelOutput>;
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


export type QueryAllForgotPasswordActionHistoryRecordsArgs = {
  where?: Maybe<ForgotPasswordActionHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortForgotPasswordActionHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryForgotPasswordActionHistoryRecordArgs = {
  where: ForgotPasswordActionHistoryRecordWhereUniqueInput;
};


export type Query_AllForgotPasswordActionHistoryRecordsMetaArgs = {
  where?: Maybe<ForgotPasswordActionHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortForgotPasswordActionHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllForgotPasswordActionsArgs = {
  where?: Maybe<ForgotPasswordActionWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortForgotPasswordActionsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryForgotPasswordActionArgs = {
  where: ForgotPasswordActionWhereUniqueInput;
};


export type Query_AllForgotPasswordActionsMetaArgs = {
  where?: Maybe<ForgotPasswordActionWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortForgotPasswordActionsBy>>;
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


export type QueryAllOrganizationHistoryRecordsArgs = {
  where?: Maybe<OrganizationHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryOrganizationHistoryRecordArgs = {
  where: OrganizationHistoryRecordWhereUniqueInput;
};


export type Query_AllOrganizationHistoryRecordsMetaArgs = {
  where?: Maybe<OrganizationHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllOrganizationsArgs = {
  where?: Maybe<OrganizationWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryOrganizationArgs = {
  where: OrganizationWhereUniqueInput;
};


export type Query_AllOrganizationsMetaArgs = {
  where?: Maybe<OrganizationWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllOrganizationEmployeeHistoryRecordsArgs = {
  where?: Maybe<OrganizationEmployeeHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeeHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryOrganizationEmployeeHistoryRecordArgs = {
  where: OrganizationEmployeeHistoryRecordWhereUniqueInput;
};


export type Query_AllOrganizationEmployeeHistoryRecordsMetaArgs = {
  where?: Maybe<OrganizationEmployeeHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeeHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllOrganizationEmployeesArgs = {
  where?: Maybe<OrganizationEmployeeWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryOrganizationEmployeeArgs = {
  where: OrganizationEmployeeWhereUniqueInput;
};


export type Query_AllOrganizationEmployeesMetaArgs = {
  where?: Maybe<OrganizationEmployeeWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllOrganizationEmployeeRoleHistoryRecordsArgs = {
  where?: Maybe<OrganizationEmployeeRoleHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeeRoleHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryOrganizationEmployeeRoleHistoryRecordArgs = {
  where: OrganizationEmployeeRoleHistoryRecordWhereUniqueInput;
};


export type Query_AllOrganizationEmployeeRoleHistoryRecordsMetaArgs = {
  where?: Maybe<OrganizationEmployeeRoleHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeeRoleHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllOrganizationEmployeeRolesArgs = {
  where?: Maybe<OrganizationEmployeeRoleWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeeRolesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryOrganizationEmployeeRoleArgs = {
  where: OrganizationEmployeeRoleWhereUniqueInput;
};


export type Query_AllOrganizationEmployeeRolesMetaArgs = {
  where?: Maybe<OrganizationEmployeeRoleWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortOrganizationEmployeeRolesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllPropertyHistoryRecordsArgs = {
  where?: Maybe<PropertyHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortPropertyHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryPropertyHistoryRecordArgs = {
  where: PropertyHistoryRecordWhereUniqueInput;
};


export type Query_AllPropertyHistoryRecordsMetaArgs = {
  where?: Maybe<PropertyHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortPropertyHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllPropertiesArgs = {
  where?: Maybe<PropertyWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortPropertiesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryPropertyArgs = {
  where: PropertyWhereUniqueInput;
};


export type Query_AllPropertiesMetaArgs = {
  where?: Maybe<PropertyWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortPropertiesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingIntegrationHistoryRecordsArgs = {
  where?: Maybe<BillingIntegrationHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingIntegrationHistoryRecordArgs = {
  where: BillingIntegrationHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingIntegrationHistoryRecordsMetaArgs = {
  where?: Maybe<BillingIntegrationHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingIntegrationsArgs = {
  where?: Maybe<BillingIntegrationWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingIntegrationArgs = {
  where: BillingIntegrationWhereUniqueInput;
};


export type Query_AllBillingIntegrationsMetaArgs = {
  where?: Maybe<BillingIntegrationWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingIntegrationAccessRightHistoryRecordsArgs = {
  where?: Maybe<BillingIntegrationAccessRightHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationAccessRightHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingIntegrationAccessRightHistoryRecordArgs = {
  where: BillingIntegrationAccessRightHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingIntegrationAccessRightHistoryRecordsMetaArgs = {
  where?: Maybe<BillingIntegrationAccessRightHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationAccessRightHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingIntegrationAccessRightsArgs = {
  where?: Maybe<BillingIntegrationAccessRightWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationAccessRightsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingIntegrationAccessRightArgs = {
  where: BillingIntegrationAccessRightWhereUniqueInput;
};


export type Query_AllBillingIntegrationAccessRightsMetaArgs = {
  where?: Maybe<BillingIntegrationAccessRightWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationAccessRightsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingIntegrationOrganizationContextHistoryRecordsArgs = {
  where?: Maybe<BillingIntegrationOrganizationContextHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationOrganizationContextHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingIntegrationOrganizationContextHistoryRecordArgs = {
  where: BillingIntegrationOrganizationContextHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingIntegrationOrganizationContextHistoryRecordsMetaArgs = {
  where?: Maybe<BillingIntegrationOrganizationContextHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationOrganizationContextHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingIntegrationOrganizationContextsArgs = {
  where?: Maybe<BillingIntegrationOrganizationContextWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationOrganizationContextsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingIntegrationOrganizationContextArgs = {
  where: BillingIntegrationOrganizationContextWhereUniqueInput;
};


export type Query_AllBillingIntegrationOrganizationContextsMetaArgs = {
  where?: Maybe<BillingIntegrationOrganizationContextWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationOrganizationContextsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingIntegrationLogsArgs = {
  where?: Maybe<BillingIntegrationLogWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationLogsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingIntegrationLogArgs = {
  where: BillingIntegrationLogWhereUniqueInput;
};


export type Query_AllBillingIntegrationLogsMetaArgs = {
  where?: Maybe<BillingIntegrationLogWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingIntegrationLogsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingPropertyHistoryRecordsArgs = {
  where?: Maybe<BillingPropertyHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingPropertyHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingPropertyHistoryRecordArgs = {
  where: BillingPropertyHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingPropertyHistoryRecordsMetaArgs = {
  where?: Maybe<BillingPropertyHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingPropertyHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingPropertiesArgs = {
  where?: Maybe<BillingPropertyWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingPropertiesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingPropertyArgs = {
  where: BillingPropertyWhereUniqueInput;
};


export type Query_AllBillingPropertiesMetaArgs = {
  where?: Maybe<BillingPropertyWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingPropertiesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingAccountHistoryRecordsArgs = {
  where?: Maybe<BillingAccountHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingAccountHistoryRecordArgs = {
  where: BillingAccountHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingAccountHistoryRecordsMetaArgs = {
  where?: Maybe<BillingAccountHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingAccountsArgs = {
  where?: Maybe<BillingAccountWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingAccountArgs = {
  where: BillingAccountWhereUniqueInput;
};


export type Query_AllBillingAccountsMetaArgs = {
  where?: Maybe<BillingAccountWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingMeterResourceHistoryRecordsArgs = {
  where?: Maybe<BillingMeterResourceHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingMeterResourceHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingMeterResourceHistoryRecordArgs = {
  where: BillingMeterResourceHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingMeterResourceHistoryRecordsMetaArgs = {
  where?: Maybe<BillingMeterResourceHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingMeterResourceHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingMeterResourcesArgs = {
  where?: Maybe<BillingMeterResourceWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingMeterResourcesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingMeterResourceArgs = {
  where: BillingMeterResourceWhereUniqueInput;
};


export type Query_AllBillingMeterResourcesMetaArgs = {
  where?: Maybe<BillingMeterResourceWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingMeterResourcesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingAccountMeterHistoryRecordsArgs = {
  where?: Maybe<BillingAccountMeterHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountMeterHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingAccountMeterHistoryRecordArgs = {
  where: BillingAccountMeterHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingAccountMeterHistoryRecordsMetaArgs = {
  where?: Maybe<BillingAccountMeterHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountMeterHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingAccountMetersArgs = {
  where?: Maybe<BillingAccountMeterWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountMetersBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingAccountMeterArgs = {
  where: BillingAccountMeterWhereUniqueInput;
};


export type Query_AllBillingAccountMetersMetaArgs = {
  where?: Maybe<BillingAccountMeterWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountMetersBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingAccountMeterReadingHistoryRecordsArgs = {
  where?: Maybe<BillingAccountMeterReadingHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountMeterReadingHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingAccountMeterReadingHistoryRecordArgs = {
  where: BillingAccountMeterReadingHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingAccountMeterReadingHistoryRecordsMetaArgs = {
  where?: Maybe<BillingAccountMeterReadingHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountMeterReadingHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingAccountMeterReadingsArgs = {
  where?: Maybe<BillingAccountMeterReadingWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountMeterReadingsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingAccountMeterReadingArgs = {
  where: BillingAccountMeterReadingWhereUniqueInput;
};


export type Query_AllBillingAccountMeterReadingsMetaArgs = {
  where?: Maybe<BillingAccountMeterReadingWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingAccountMeterReadingsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingReceiptHistoryRecordsArgs = {
  where?: Maybe<BillingReceiptHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingReceiptHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingReceiptHistoryRecordArgs = {
  where: BillingReceiptHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingReceiptHistoryRecordsMetaArgs = {
  where?: Maybe<BillingReceiptHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingReceiptHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingReceiptsArgs = {
  where?: Maybe<BillingReceiptWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingReceiptsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingReceiptArgs = {
  where: BillingReceiptWhereUniqueInput;
};


export type Query_AllBillingReceiptsMetaArgs = {
  where?: Maybe<BillingReceiptWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingReceiptsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingOrganizationHistoryRecordsArgs = {
  where?: Maybe<BillingOrganizationHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingOrganizationHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingOrganizationHistoryRecordArgs = {
  where: BillingOrganizationHistoryRecordWhereUniqueInput;
};


export type Query_AllBillingOrganizationHistoryRecordsMetaArgs = {
  where?: Maybe<BillingOrganizationHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingOrganizationHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllBillingOrganizationsArgs = {
  where?: Maybe<BillingOrganizationWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingOrganizationsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryBillingOrganizationArgs = {
  where: BillingOrganizationWhereUniqueInput;
};


export type Query_AllBillingOrganizationsMetaArgs = {
  where?: Maybe<BillingOrganizationWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortBillingOrganizationsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketHistoryRecordsArgs = {
  where?: Maybe<TicketHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketHistoryRecordArgs = {
  where: TicketHistoryRecordWhereUniqueInput;
};


export type Query_AllTicketHistoryRecordsMetaArgs = {
  where?: Maybe<TicketHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketsArgs = {
  where?: Maybe<TicketWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketArgs = {
  where: TicketWhereUniqueInput;
};


export type Query_AllTicketsMetaArgs = {
  where?: Maybe<TicketWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketSourceHistoryRecordsArgs = {
  where?: Maybe<TicketSourceHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketSourceHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketSourceHistoryRecordArgs = {
  where: TicketSourceHistoryRecordWhereUniqueInput;
};


export type Query_AllTicketSourceHistoryRecordsMetaArgs = {
  where?: Maybe<TicketSourceHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketSourceHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketSourcesArgs = {
  where?: Maybe<TicketSourceWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketSourcesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketSourceArgs = {
  where: TicketSourceWhereUniqueInput;
};


export type Query_AllTicketSourcesMetaArgs = {
  where?: Maybe<TicketSourceWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketSourcesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketClassifierHistoryRecordsArgs = {
  where?: Maybe<TicketClassifierHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketClassifierHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketClassifierHistoryRecordArgs = {
  where: TicketClassifierHistoryRecordWhereUniqueInput;
};


export type Query_AllTicketClassifierHistoryRecordsMetaArgs = {
  where?: Maybe<TicketClassifierHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketClassifierHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketClassifiersArgs = {
  where?: Maybe<TicketClassifierWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketClassifiersBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketClassifierArgs = {
  where: TicketClassifierWhereUniqueInput;
};


export type Query_AllTicketClassifiersMetaArgs = {
  where?: Maybe<TicketClassifierWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketClassifiersBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketStatusHistoryRecordsArgs = {
  where?: Maybe<TicketStatusHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketStatusHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketStatusHistoryRecordArgs = {
  where: TicketStatusHistoryRecordWhereUniqueInput;
};


export type Query_AllTicketStatusHistoryRecordsMetaArgs = {
  where?: Maybe<TicketStatusHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketStatusHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketStatusesArgs = {
  where?: Maybe<TicketStatusWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketStatusesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketStatusArgs = {
  where: TicketStatusWhereUniqueInput;
};


export type Query_AllTicketStatusesMetaArgs = {
  where?: Maybe<TicketStatusWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketStatusesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketFileHistoryRecordsArgs = {
  where?: Maybe<TicketFileHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketFileHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketFileHistoryRecordArgs = {
  where: TicketFileHistoryRecordWhereUniqueInput;
};


export type Query_AllTicketFileHistoryRecordsMetaArgs = {
  where?: Maybe<TicketFileHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketFileHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketFilesArgs = {
  where?: Maybe<TicketFileWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketFilesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketFileArgs = {
  where: TicketFileWhereUniqueInput;
};


export type Query_AllTicketFilesMetaArgs = {
  where?: Maybe<TicketFileWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketFilesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketChangesArgs = {
  where?: Maybe<TicketChangeWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketChangesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketChangeArgs = {
  where: TicketChangeWhereUniqueInput;
};


export type Query_AllTicketChangesMetaArgs = {
  where?: Maybe<TicketChangeWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketChangesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketCommentHistoryRecordsArgs = {
  where?: Maybe<TicketCommentHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketCommentHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketCommentHistoryRecordArgs = {
  where: TicketCommentHistoryRecordWhereUniqueInput;
};


export type Query_AllTicketCommentHistoryRecordsMetaArgs = {
  where?: Maybe<TicketCommentHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketCommentHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllTicketCommentsArgs = {
  where?: Maybe<TicketCommentWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketCommentsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryTicketCommentArgs = {
  where: TicketCommentWhereUniqueInput;
};


export type Query_AllTicketCommentsMetaArgs = {
  where?: Maybe<TicketCommentWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortTicketCommentsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllMessageHistoryRecordsArgs = {
  where?: Maybe<MessageHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortMessageHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryMessageHistoryRecordArgs = {
  where: MessageHistoryRecordWhereUniqueInput;
};


export type Query_AllMessageHistoryRecordsMetaArgs = {
  where?: Maybe<MessageHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortMessageHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllMessagesArgs = {
  where?: Maybe<MessageWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortMessagesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryMessageArgs = {
  where: MessageWhereUniqueInput;
};


export type Query_AllMessagesMetaArgs = {
  where?: Maybe<MessageWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortMessagesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllContactHistoryRecordsArgs = {
  where?: Maybe<ContactHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortContactHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryContactHistoryRecordArgs = {
  where: ContactHistoryRecordWhereUniqueInput;
};


export type Query_AllContactHistoryRecordsMetaArgs = {
  where?: Maybe<ContactHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortContactHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllContactsArgs = {
  where?: Maybe<ContactWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortContactsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryContactArgs = {
  where: ContactWhereUniqueInput;
};


export type Query_AllContactsMetaArgs = {
  where?: Maybe<ContactWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortContactsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllResidentHistoryRecordsArgs = {
  where?: Maybe<ResidentHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortResidentHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryResidentHistoryRecordArgs = {
  where: ResidentHistoryRecordWhereUniqueInput;
};


export type Query_AllResidentHistoryRecordsMetaArgs = {
  where?: Maybe<ResidentHistoryRecordWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortResidentHistoryRecordsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllResidentsArgs = {
  where?: Maybe<ResidentWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortResidentsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryResidentArgs = {
  where: ResidentWhereUniqueInput;
};


export type Query_AllResidentsMetaArgs = {
  where?: Maybe<ResidentWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortResidentsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type Query_KsListsMetaArgs = {
  where?: Maybe<_KsListsMetaInput>;
};


export type QueryCheckPasswordRecoveryTokenArgs = {
  data: CheckPasswordRecoveryTokenInput;
};


export type QueryGetPhoneByConfirmPhoneActionTokenArgs = {
  data: GetPhoneByConfirmPhoneActionTokenInput;
};


export type QueryTicketReportWidgetDataArgs = {
  data: TicketReportWidgetInput;
};


export type QueryExportTicketsToExcelArgs = {
  data: ExportTicketsToExcelInput;
};

export type ReInviteOrganizationEmployeeInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  organization: OrganizationWhereUniqueInput;
  email: Scalars['String'];
  phone?: Maybe<Scalars['String']>;
};

export type RegisterNewOrganizationInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  country: Scalars['String'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  meta: Scalars['JSON'];
  avatar?: Maybe<Scalars['Upload']>;
};

export type RegisterNewUserInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  name: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
  confirmPhoneActionToken?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  meta?: Maybe<Scalars['JSON']>;
};

export type RegisterResidentInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  address: Scalars['String'];
  addressMeta: Scalars['JSON'];
  unitName: Scalars['String'];
};

export type ResendConfirmPhoneActionSmsInput = {
  token: Scalars['String'];
  sender: Scalars['JSON'];
  captcha: Scalars['String'];
};

export type ResendConfirmPhoneActionSmsOutput = {
  __typename?: 'ResendConfirmPhoneActionSmsOutput';
  status: Scalars['String'];
};

export type ResendMessageInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  message?: Maybe<MessageWhereUniqueInput>;
};

export type ResendMessageOutput = {
  __typename?: 'ResendMessageOutput';
  status: Scalars['String'];
  id: Scalars['String'];
};

/**  Person, that resides in a specified property and unit  */
export type Resident = {
  __typename?: 'Resident';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the Resident List config, or
   *  2. As an alias to the field set on 'labelField' in the Resident List config, or
   *  3. As an alias to a 'name' field on the Resident List (if one exists), or
   *  4. As an alias to the 'id' field on the Resident List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Mobile user account  */
  user?: Maybe<User>;
  /**  Organization, that provides service to this resident. Can be missing, when a resident has been registered, but there is no Organization, that serves specified address in our system yet  */
  organization?: Maybe<Organization>;
  /**  Property, in which this person resides. Can be missing, when a resident has been registered, but there is no Property in our system yet  */
  property?: Maybe<Property>;
  /**  System-wide billing account, that will allow to pay for all services from all organizations  */
  billingAccount?: Maybe<BillingAccount>;
  /**  Normalized address  */
  address?: Maybe<Scalars['String']>;
  /**  Property address components  */
  addressMeta?: Maybe<Scalars['JSON']>;
  /**  Unit of the property, in which this person resides  */
  unitName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type ResidentCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<UserRelateToOneInput>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  property?: Maybe<PropertyRelateToOneInput>;
  billingAccount?: Maybe<BillingAccountRelateToOneInput>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  unitName?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type ResidentHistoryRecord = {
  __typename?: 'ResidentHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the ResidentHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the ResidentHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the ResidentHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the ResidentHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<Scalars['String']>;
  organization?: Maybe<Scalars['String']>;
  property?: Maybe<Scalars['String']>;
  billingAccount?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  unitName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ResidentHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ResidentHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<Scalars['String']>;
  organization?: Maybe<Scalars['String']>;
  property?: Maybe<Scalars['String']>;
  billingAccount?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  unitName?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ResidentHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum ResidentHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type ResidentHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<Scalars['String']>;
  organization?: Maybe<Scalars['String']>;
  property?: Maybe<Scalars['String']>;
  billingAccount?: Maybe<Scalars['String']>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  unitName?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<ResidentHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type ResidentHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<ResidentHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<ResidentHistoryRecordWhereInput>>>;
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
  user?: Maybe<Scalars['String']>;
  user_not?: Maybe<Scalars['String']>;
  user_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property?: Maybe<Scalars['String']>;
  property_not?: Maybe<Scalars['String']>;
  property_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  billingAccount?: Maybe<Scalars['String']>;
  billingAccount_not?: Maybe<Scalars['String']>;
  billingAccount_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  billingAccount_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  addressMeta?: Maybe<Scalars['JSON']>;
  addressMeta_not?: Maybe<Scalars['JSON']>;
  addressMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  unitName?: Maybe<Scalars['String']>;
  unitName_not?: Maybe<Scalars['String']>;
  unitName_contains?: Maybe<Scalars['String']>;
  unitName_not_contains?: Maybe<Scalars['String']>;
  unitName_starts_with?: Maybe<Scalars['String']>;
  unitName_not_starts_with?: Maybe<Scalars['String']>;
  unitName_ends_with?: Maybe<Scalars['String']>;
  unitName_not_ends_with?: Maybe<Scalars['String']>;
  unitName_i?: Maybe<Scalars['String']>;
  unitName_not_i?: Maybe<Scalars['String']>;
  unitName_contains_i?: Maybe<Scalars['String']>;
  unitName_not_contains_i?: Maybe<Scalars['String']>;
  unitName_starts_with_i?: Maybe<Scalars['String']>;
  unitName_not_starts_with_i?: Maybe<Scalars['String']>;
  unitName_ends_with_i?: Maybe<Scalars['String']>;
  unitName_not_ends_with_i?: Maybe<Scalars['String']>;
  unitName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<ResidentHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<ResidentHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<ResidentHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<ResidentHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type ResidentHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type ResidentHistoryRecordsCreateInput = {
  data?: Maybe<ResidentHistoryRecordCreateInput>;
};

export type ResidentHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<ResidentHistoryRecordUpdateInput>;
};

export type ResidentUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  user?: Maybe<UserRelateToOneInput>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  property?: Maybe<PropertyRelateToOneInput>;
  billingAccount?: Maybe<BillingAccountRelateToOneInput>;
  address?: Maybe<Scalars['String']>;
  addressMeta?: Maybe<Scalars['JSON']>;
  unitName?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type ResidentWhereInput = {
  AND?: Maybe<Array<Maybe<ResidentWhereInput>>>;
  OR?: Maybe<Array<Maybe<ResidentWhereInput>>>;
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
  user?: Maybe<UserWhereInput>;
  user_is_null?: Maybe<Scalars['Boolean']>;
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  property?: Maybe<PropertyWhereInput>;
  property_is_null?: Maybe<Scalars['Boolean']>;
  billingAccount?: Maybe<BillingAccountWhereInput>;
  billingAccount_is_null?: Maybe<Scalars['Boolean']>;
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
  addressMeta?: Maybe<Scalars['JSON']>;
  addressMeta_not?: Maybe<Scalars['JSON']>;
  addressMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  unitName?: Maybe<Scalars['String']>;
  unitName_not?: Maybe<Scalars['String']>;
  unitName_contains?: Maybe<Scalars['String']>;
  unitName_not_contains?: Maybe<Scalars['String']>;
  unitName_starts_with?: Maybe<Scalars['String']>;
  unitName_not_starts_with?: Maybe<Scalars['String']>;
  unitName_ends_with?: Maybe<Scalars['String']>;
  unitName_not_ends_with?: Maybe<Scalars['String']>;
  unitName_i?: Maybe<Scalars['String']>;
  unitName_not_i?: Maybe<Scalars['String']>;
  unitName_contains_i?: Maybe<Scalars['String']>;
  unitName_not_contains_i?: Maybe<Scalars['String']>;
  unitName_starts_with_i?: Maybe<Scalars['String']>;
  unitName_not_starts_with_i?: Maybe<Scalars['String']>;
  unitName_ends_with_i?: Maybe<Scalars['String']>;
  unitName_not_ends_with_i?: Maybe<Scalars['String']>;
  unitName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type ResidentWhereUniqueInput = {
  id: Scalars['ID'];
};

export type ResidentsCreateInput = {
  data?: Maybe<ResidentCreateInput>;
};

export type ResidentsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<ResidentUpdateInput>;
};

export type SendMessageInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  to: SendMessageToInput;
  type: SendMessageType;
  lang: SendMessageLang;
  meta: Scalars['JSON'];
  organization?: Maybe<OrganizationWhereUniqueInput>;
};

export enum SendMessageLang {
  Ru = 'ru',
  En = 'en'
}

export type SendMessageOutput = {
  __typename?: 'SendMessageOutput';
  status: Scalars['String'];
  id: Scalars['String'];
};

export type SendMessageToInput = {
  user?: Maybe<UserWhereUniqueInput>;
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
};

export enum SendMessageType {
  InviteNewEmployee = 'INVITE_NEW_EMPLOYEE',
  DirtyInviteNewEmployee = 'DIRTY_INVITE_NEW_EMPLOYEE',
  RegisterNewUser = 'REGISTER_NEW_USER',
  ResetPassword = 'RESET_PASSWORD',
  SmsVerify = 'SMS_VERIFY'
}

export type SigninResidentUserInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  token: Scalars['String'];
};

export type SigninResidentUserOutput = {
  __typename?: 'SigninResidentUserOutput';
  user?: Maybe<User>;
  token: Scalars['String'];
};

export enum SortBillingAccountHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  GlobalIdAsc = 'globalId_ASC',
  GlobalIdDesc = 'globalId_DESC',
  NumberAsc = 'number_ASC',
  NumberDesc = 'number_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingAccountMeterHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingAccountMeterReadingHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  PeriodAsc = 'period_ASC',
  PeriodDesc = 'period_DESC',
  Value1Asc = 'value1_ASC',
  Value1Desc = 'value1_DESC',
  Value2Asc = 'value2_ASC',
  Value2Desc = 'value2_DESC',
  Value3Asc = 'value3_ASC',
  Value3Desc = 'value3_DESC',
  DateAsc = 'date_ASC',
  DateDesc = 'date_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingAccountMeterReadingsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ContextAsc = 'context_ASC',
  ContextDesc = 'context_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  AccountAsc = 'account_ASC',
  AccountDesc = 'account_DESC',
  MeterAsc = 'meter_ASC',
  MeterDesc = 'meter_DESC',
  PeriodAsc = 'period_ASC',
  PeriodDesc = 'period_DESC',
  Value1Asc = 'value1_ASC',
  Value1Desc = 'value1_DESC',
  Value2Asc = 'value2_ASC',
  Value2Desc = 'value2_DESC',
  Value3Asc = 'value3_ASC',
  Value3Desc = 'value3_DESC',
  DateAsc = 'date_ASC',
  DateDesc = 'date_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortBillingAccountMetersBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ContextAsc = 'context_ASC',
  ContextDesc = 'context_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  AccountAsc = 'account_ASC',
  AccountDesc = 'account_DESC',
  ResourceAsc = 'resource_ASC',
  ResourceDesc = 'resource_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortBillingAccountsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ContextAsc = 'context_ASC',
  ContextDesc = 'context_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  GlobalIdAsc = 'globalId_ASC',
  GlobalIdDesc = 'globalId_DESC',
  NumberAsc = 'number_ASC',
  NumberDesc = 'number_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortBillingIntegrationAccessRightHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingIntegrationAccessRightsBy {
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  IntegrationAsc = 'integration_ASC',
  IntegrationDesc = 'integration_DESC',
  UserAsc = 'user_ASC',
  UserDesc = 'user_DESC',
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  CreatedByAsc = 'createdBy_ASC',
  CreatedByDesc = 'createdBy_DESC',
  UpdatedByAsc = 'updatedBy_ASC',
  UpdatedByDesc = 'updatedBy_DESC'
}

export enum SortBillingIntegrationHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingIntegrationLogsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ContextAsc = 'context_ASC',
  ContextDesc = 'context_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  MessageAsc = 'message_ASC',
  MessageDesc = 'message_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortBillingIntegrationOrganizationContextHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingIntegrationOrganizationContextsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  IntegrationAsc = 'integration_ASC',
  IntegrationDesc = 'integration_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortBillingIntegrationsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  AccessRightsAsc = 'accessRights_ASC',
  AccessRightsDesc = 'accessRights_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortBillingMeterResourceHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingMeterResourcesBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortBillingOrganizationHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  TinAsc = 'tin_ASC',
  TinDesc = 'tin_DESC',
  IecAsc = 'iec_ASC',
  IecDesc = 'iec_DESC',
  BicAsc = 'bic_ASC',
  BicDesc = 'bic_DESC',
  CheckNumberAsc = 'checkNumber_ASC',
  CheckNumberDesc = 'checkNumber_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingOrganizationsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ContextAsc = 'context_ASC',
  ContextDesc = 'context_DESC',
  TinAsc = 'tin_ASC',
  TinDesc = 'tin_DESC',
  IecAsc = 'iec_ASC',
  IecDesc = 'iec_DESC',
  BicAsc = 'bic_ASC',
  BicDesc = 'bic_DESC',
  CheckNumberAsc = 'checkNumber_ASC',
  CheckNumberDesc = 'checkNumber_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortBillingPropertiesBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ContextAsc = 'context_ASC',
  ContextDesc = 'context_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  GlobalIdAsc = 'globalId_ASC',
  GlobalIdDesc = 'globalId_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortBillingPropertyHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  GlobalIdAsc = 'globalId_ASC',
  GlobalIdDesc = 'globalId_DESC',
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
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingReceiptHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  PeriodAsc = 'period_ASC',
  PeriodDesc = 'period_DESC',
  PrintableNumberAsc = 'printableNumber_ASC',
  PrintableNumberDesc = 'printableNumber_DESC',
  ToPayAsc = 'toPay_ASC',
  ToPayDesc = 'toPay_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortBillingReceiptsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ContextAsc = 'context_ASC',
  ContextDesc = 'context_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  RecipientAsc = 'recipient_ASC',
  RecipientDesc = 'recipient_DESC',
  AccountAsc = 'account_ASC',
  AccountDesc = 'account_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  PeriodAsc = 'period_ASC',
  PeriodDesc = 'period_DESC',
  PrintableNumberAsc = 'printableNumber_ASC',
  PrintableNumberDesc = 'printableNumber_DESC',
  ToPayAsc = 'toPay_ASC',
  ToPayDesc = 'toPay_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortConfirmPhoneActionHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  TokenAsc = 'token_ASC',
  TokenDesc = 'token_DESC',
  SmsCodeAsc = 'smsCode_ASC',
  SmsCodeDesc = 'smsCode_DESC',
  SmsCodeRequestedAtAsc = 'smsCodeRequestedAt_ASC',
  SmsCodeRequestedAtDesc = 'smsCodeRequestedAt_DESC',
  SmsCodeExpiresAtAsc = 'smsCodeExpiresAt_ASC',
  SmsCodeExpiresAtDesc = 'smsCodeExpiresAt_DESC',
  RetriesAsc = 'retries_ASC',
  RetriesDesc = 'retries_DESC',
  IsPhoneVerifiedAsc = 'isPhoneVerified_ASC',
  IsPhoneVerifiedDesc = 'isPhoneVerified_DESC',
  RequestedAtAsc = 'requestedAt_ASC',
  RequestedAtDesc = 'requestedAt_DESC',
  ExpiresAtAsc = 'expiresAt_ASC',
  ExpiresAtDesc = 'expiresAt_DESC',
  CompletedAtAsc = 'completedAt_ASC',
  CompletedAtDesc = 'completedAt_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortConfirmPhoneActionsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  TokenAsc = 'token_ASC',
  TokenDesc = 'token_DESC',
  SmsCodeAsc = 'smsCode_ASC',
  SmsCodeDesc = 'smsCode_DESC',
  SmsCodeRequestedAtAsc = 'smsCodeRequestedAt_ASC',
  SmsCodeRequestedAtDesc = 'smsCodeRequestedAt_DESC',
  SmsCodeExpiresAtAsc = 'smsCodeExpiresAt_ASC',
  SmsCodeExpiresAtDesc = 'smsCodeExpiresAt_DESC',
  RetriesAsc = 'retries_ASC',
  RetriesDesc = 'retries_DESC',
  IsPhoneVerifiedAsc = 'isPhoneVerified_ASC',
  IsPhoneVerifiedDesc = 'isPhoneVerified_DESC',
  RequestedAtAsc = 'requestedAt_ASC',
  RequestedAtDesc = 'requestedAt_DESC',
  ExpiresAtAsc = 'expiresAt_ASC',
  ExpiresAtDesc = 'expiresAt_DESC',
  CompletedAtAsc = 'completedAt_ASC',
  CompletedAtDesc = 'completedAt_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortContactHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortContactsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortForgotPasswordActionHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  TokenAsc = 'token_ASC',
  TokenDesc = 'token_DESC',
  RequestedAtAsc = 'requestedAt_ASC',
  RequestedAtDesc = 'requestedAt_DESC',
  ExpiresAtAsc = 'expiresAt_ASC',
  ExpiresAtDesc = 'expiresAt_DESC',
  UsedAtAsc = 'usedAt_ASC',
  UsedAtDesc = 'usedAt_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortForgotPasswordActionsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  UserAsc = 'user_ASC',
  UserDesc = 'user_DESC',
  TokenAsc = 'token_ASC',
  TokenDesc = 'token_DESC',
  RequestedAtAsc = 'requestedAt_ASC',
  RequestedAtDesc = 'requestedAt_DESC',
  ExpiresAtAsc = 'expiresAt_ASC',
  ExpiresAtDesc = 'expiresAt_DESC',
  UsedAtAsc = 'usedAt_ASC',
  UsedAtDesc = 'usedAt_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortMessageHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  LangAsc = 'lang_ASC',
  LangDesc = 'lang_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  StatusAsc = 'status_ASC',
  StatusDesc = 'status_DESC',
  DeliveredAtAsc = 'deliveredAt_ASC',
  DeliveredAtDesc = 'deliveredAt_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortMessagesBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  UserAsc = 'user_ASC',
  UserDesc = 'user_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  LangAsc = 'lang_ASC',
  LangDesc = 'lang_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  StatusAsc = 'status_ASC',
  StatusDesc = 'status_DESC',
  DeliveredAtAsc = 'deliveredAt_ASC',
  DeliveredAtDesc = 'deliveredAt_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortOrganizationEmployeeHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  InviteCodeAsc = 'inviteCode_ASC',
  InviteCodeDesc = 'inviteCode_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  PositionAsc = 'position_ASC',
  PositionDesc = 'position_DESC',
  IsAcceptedAsc = 'isAccepted_ASC',
  IsAcceptedDesc = 'isAccepted_DESC',
  IsRejectedAsc = 'isRejected_ASC',
  IsRejectedDesc = 'isRejected_DESC',
  IsBlockedAsc = 'isBlocked_ASC',
  IsBlockedDesc = 'isBlocked_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC',
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortOrganizationEmployeeRoleHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  CanManageOrganizationAsc = 'canManageOrganization_ASC',
  CanManageOrganizationDesc = 'canManageOrganization_DESC',
  CanManageEmployeesAsc = 'canManageEmployees_ASC',
  CanManageEmployeesDesc = 'canManageEmployees_DESC',
  CanManageRolesAsc = 'canManageRoles_ASC',
  CanManageRolesDesc = 'canManageRoles_DESC',
  CanManageIntegrationsAsc = 'canManageIntegrations_ASC',
  CanManageIntegrationsDesc = 'canManageIntegrations_DESC',
  CanManagePropertiesAsc = 'canManageProperties_ASC',
  CanManagePropertiesDesc = 'canManageProperties_DESC',
  CanManageTicketsAsc = 'canManageTickets_ASC',
  CanManageTicketsDesc = 'canManageTickets_DESC',
  CanManageContactsAsc = 'canManageContacts_ASC',
  CanManageContactsDesc = 'canManageContacts_DESC',
  CanManageTicketCommentsAsc = 'canManageTicketComments_ASC',
  CanManageTicketCommentsDesc = 'canManageTicketComments_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  VAsc = 'v_ASC',
  VDesc = 'v_DESC',
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortOrganizationEmployeeRolesBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  CanManageOrganizationAsc = 'canManageOrganization_ASC',
  CanManageOrganizationDesc = 'canManageOrganization_DESC',
  CanManageEmployeesAsc = 'canManageEmployees_ASC',
  CanManageEmployeesDesc = 'canManageEmployees_DESC',
  CanManageRolesAsc = 'canManageRoles_ASC',
  CanManageRolesDesc = 'canManageRoles_DESC',
  CanManageIntegrationsAsc = 'canManageIntegrations_ASC',
  CanManageIntegrationsDesc = 'canManageIntegrations_DESC',
  CanManagePropertiesAsc = 'canManageProperties_ASC',
  CanManagePropertiesDesc = 'canManageProperties_DESC',
  CanManageTicketsAsc = 'canManageTickets_ASC',
  CanManageTicketsDesc = 'canManageTickets_DESC',
  CanManageContactsAsc = 'canManageContacts_ASC',
  CanManageContactsDesc = 'canManageContacts_DESC',
  CanManageTicketCommentsAsc = 'canManageTicketComments_ASC',
  CanManageTicketCommentsDesc = 'canManageTicketComments_DESC',
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
  UpdatedByDesc = 'updatedBy_DESC'
}

export enum SortOrganizationEmployeesBy {
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  UserAsc = 'user_ASC',
  UserDesc = 'user_DESC',
  InviteCodeAsc = 'inviteCode_ASC',
  InviteCodeDesc = 'inviteCode_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  RoleAsc = 'role_ASC',
  RoleDesc = 'role_DESC',
  PositionAsc = 'position_ASC',
  PositionDesc = 'position_DESC',
  IsAcceptedAsc = 'isAccepted_ASC',
  IsAcceptedDesc = 'isAccepted_DESC',
  IsRejectedAsc = 'isRejected_ASC',
  IsRejectedDesc = 'isRejected_DESC',
  IsBlockedAsc = 'isBlocked_ASC',
  IsBlockedDesc = 'isBlocked_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortOrganizationHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  CountryAsc = 'country_ASC',
  CountryDesc = 'country_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortOrganizationsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  CountryAsc = 'country_ASC',
  CountryDesc = 'country_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  EmployeesAsc = 'employees_ASC',
  EmployeesDesc = 'employees_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortPropertiesBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  UnitsCountAsc = 'unitsCount_ASC',
  UnitsCountDesc = 'unitsCount_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortPropertyHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  UnitsCountAsc = 'unitsCount_ASC',
  UnitsCountDesc = 'unitsCount_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortResidentHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortResidentsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  UserAsc = 'user_ASC',
  UserDesc = 'user_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  BillingAccountAsc = 'billingAccount_ASC',
  BillingAccountDesc = 'billingAccount_DESC',
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortTicketChangesBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  TicketAsc = 'ticket_ASC',
  TicketDesc = 'ticket_DESC',
  StatusReopenedCounterFromAsc = 'statusReopenedCounterFrom_ASC',
  StatusReopenedCounterFromDesc = 'statusReopenedCounterFrom_DESC',
  StatusReopenedCounterToAsc = 'statusReopenedCounterTo_ASC',
  StatusReopenedCounterToDesc = 'statusReopenedCounterTo_DESC',
  StatusReasonFromAsc = 'statusReasonFrom_ASC',
  StatusReasonFromDesc = 'statusReasonFrom_DESC',
  StatusReasonToAsc = 'statusReasonTo_ASC',
  StatusReasonToDesc = 'statusReasonTo_DESC',
  NumberFromAsc = 'numberFrom_ASC',
  NumberFromDesc = 'numberFrom_DESC',
  NumberToAsc = 'numberTo_ASC',
  NumberToDesc = 'numberTo_DESC',
  ClientNameFromAsc = 'clientNameFrom_ASC',
  ClientNameFromDesc = 'clientNameFrom_DESC',
  ClientNameToAsc = 'clientNameTo_ASC',
  ClientNameToDesc = 'clientNameTo_DESC',
  ClientEmailFromAsc = 'clientEmailFrom_ASC',
  ClientEmailFromDesc = 'clientEmailFrom_DESC',
  ClientEmailToAsc = 'clientEmailTo_ASC',
  ClientEmailToDesc = 'clientEmailTo_DESC',
  ClientPhoneFromAsc = 'clientPhoneFrom_ASC',
  ClientPhoneFromDesc = 'clientPhoneFrom_DESC',
  ClientPhoneToAsc = 'clientPhoneTo_ASC',
  ClientPhoneToDesc = 'clientPhoneTo_DESC',
  DetailsFromAsc = 'detailsFrom_ASC',
  DetailsFromDesc = 'detailsFrom_DESC',
  DetailsToAsc = 'detailsTo_ASC',
  DetailsToDesc = 'detailsTo_DESC',
  IsPaidFromAsc = 'isPaidFrom_ASC',
  IsPaidFromDesc = 'isPaidFrom_DESC',
  IsPaidToAsc = 'isPaidTo_ASC',
  IsPaidToDesc = 'isPaidTo_DESC',
  IsEmergencyFromAsc = 'isEmergencyFrom_ASC',
  IsEmergencyFromDesc = 'isEmergencyFrom_DESC',
  IsEmergencyToAsc = 'isEmergencyTo_ASC',
  IsEmergencyToDesc = 'isEmergencyTo_DESC',
  SectionNameFromAsc = 'sectionNameFrom_ASC',
  SectionNameFromDesc = 'sectionNameFrom_DESC',
  SectionNameToAsc = 'sectionNameTo_ASC',
  SectionNameToDesc = 'sectionNameTo_DESC',
  FloorNameFromAsc = 'floorNameFrom_ASC',
  FloorNameFromDesc = 'floorNameFrom_DESC',
  FloorNameToAsc = 'floorNameTo_ASC',
  FloorNameToDesc = 'floorNameTo_DESC',
  UnitNameFromAsc = 'unitNameFrom_ASC',
  UnitNameFromDesc = 'unitNameFrom_DESC',
  UnitNameToAsc = 'unitNameTo_ASC',
  UnitNameToDesc = 'unitNameTo_DESC',
  OrganizationIdFromAsc = 'organizationIdFrom_ASC',
  OrganizationIdFromDesc = 'organizationIdFrom_DESC',
  OrganizationIdToAsc = 'organizationIdTo_ASC',
  OrganizationIdToDesc = 'organizationIdTo_DESC',
  OrganizationDisplayNameFromAsc = 'organizationDisplayNameFrom_ASC',
  OrganizationDisplayNameFromDesc = 'organizationDisplayNameFrom_DESC',
  OrganizationDisplayNameToAsc = 'organizationDisplayNameTo_ASC',
  OrganizationDisplayNameToDesc = 'organizationDisplayNameTo_DESC',
  StatusIdFromAsc = 'statusIdFrom_ASC',
  StatusIdFromDesc = 'statusIdFrom_DESC',
  StatusIdToAsc = 'statusIdTo_ASC',
  StatusIdToDesc = 'statusIdTo_DESC',
  StatusDisplayNameFromAsc = 'statusDisplayNameFrom_ASC',
  StatusDisplayNameFromDesc = 'statusDisplayNameFrom_DESC',
  StatusDisplayNameToAsc = 'statusDisplayNameTo_ASC',
  StatusDisplayNameToDesc = 'statusDisplayNameTo_DESC',
  ClientIdFromAsc = 'clientIdFrom_ASC',
  ClientIdFromDesc = 'clientIdFrom_DESC',
  ClientIdToAsc = 'clientIdTo_ASC',
  ClientIdToDesc = 'clientIdTo_DESC',
  ClientDisplayNameFromAsc = 'clientDisplayNameFrom_ASC',
  ClientDisplayNameFromDesc = 'clientDisplayNameFrom_DESC',
  ClientDisplayNameToAsc = 'clientDisplayNameTo_ASC',
  ClientDisplayNameToDesc = 'clientDisplayNameTo_DESC',
  ContactIdFromAsc = 'contactIdFrom_ASC',
  ContactIdFromDesc = 'contactIdFrom_DESC',
  ContactIdToAsc = 'contactIdTo_ASC',
  ContactIdToDesc = 'contactIdTo_DESC',
  ContactDisplayNameFromAsc = 'contactDisplayNameFrom_ASC',
  ContactDisplayNameFromDesc = 'contactDisplayNameFrom_DESC',
  ContactDisplayNameToAsc = 'contactDisplayNameTo_ASC',
  ContactDisplayNameToDesc = 'contactDisplayNameTo_DESC',
  OperatorIdFromAsc = 'operatorIdFrom_ASC',
  OperatorIdFromDesc = 'operatorIdFrom_DESC',
  OperatorIdToAsc = 'operatorIdTo_ASC',
  OperatorIdToDesc = 'operatorIdTo_DESC',
  OperatorDisplayNameFromAsc = 'operatorDisplayNameFrom_ASC',
  OperatorDisplayNameFromDesc = 'operatorDisplayNameFrom_DESC',
  OperatorDisplayNameToAsc = 'operatorDisplayNameTo_ASC',
  OperatorDisplayNameToDesc = 'operatorDisplayNameTo_DESC',
  AssigneeIdFromAsc = 'assigneeIdFrom_ASC',
  AssigneeIdFromDesc = 'assigneeIdFrom_DESC',
  AssigneeIdToAsc = 'assigneeIdTo_ASC',
  AssigneeIdToDesc = 'assigneeIdTo_DESC',
  AssigneeDisplayNameFromAsc = 'assigneeDisplayNameFrom_ASC',
  AssigneeDisplayNameFromDesc = 'assigneeDisplayNameFrom_DESC',
  AssigneeDisplayNameToAsc = 'assigneeDisplayNameTo_ASC',
  AssigneeDisplayNameToDesc = 'assigneeDisplayNameTo_DESC',
  ExecutorIdFromAsc = 'executorIdFrom_ASC',
  ExecutorIdFromDesc = 'executorIdFrom_DESC',
  ExecutorIdToAsc = 'executorIdTo_ASC',
  ExecutorIdToDesc = 'executorIdTo_DESC',
  ExecutorDisplayNameFromAsc = 'executorDisplayNameFrom_ASC',
  ExecutorDisplayNameFromDesc = 'executorDisplayNameFrom_DESC',
  ExecutorDisplayNameToAsc = 'executorDisplayNameTo_ASC',
  ExecutorDisplayNameToDesc = 'executorDisplayNameTo_DESC',
  ClassifierIdFromAsc = 'classifierIdFrom_ASC',
  ClassifierIdFromDesc = 'classifierIdFrom_DESC',
  ClassifierIdToAsc = 'classifierIdTo_ASC',
  ClassifierIdToDesc = 'classifierIdTo_DESC',
  ClassifierDisplayNameFromAsc = 'classifierDisplayNameFrom_ASC',
  ClassifierDisplayNameFromDesc = 'classifierDisplayNameFrom_DESC',
  ClassifierDisplayNameToAsc = 'classifierDisplayNameTo_ASC',
  ClassifierDisplayNameToDesc = 'classifierDisplayNameTo_DESC',
  RelatedIdFromAsc = 'relatedIdFrom_ASC',
  RelatedIdFromDesc = 'relatedIdFrom_DESC',
  RelatedIdToAsc = 'relatedIdTo_ASC',
  RelatedIdToDesc = 'relatedIdTo_DESC',
  RelatedDisplayNameFromAsc = 'relatedDisplayNameFrom_ASC',
  RelatedDisplayNameFromDesc = 'relatedDisplayNameFrom_DESC',
  RelatedDisplayNameToAsc = 'relatedDisplayNameTo_ASC',
  RelatedDisplayNameToDesc = 'relatedDisplayNameTo_DESC',
  PropertyIdFromAsc = 'propertyIdFrom_ASC',
  PropertyIdFromDesc = 'propertyIdFrom_DESC',
  PropertyIdToAsc = 'propertyIdTo_ASC',
  PropertyIdToDesc = 'propertyIdTo_DESC',
  PropertyDisplayNameFromAsc = 'propertyDisplayNameFrom_ASC',
  PropertyDisplayNameFromDesc = 'propertyDisplayNameFrom_DESC',
  PropertyDisplayNameToAsc = 'propertyDisplayNameTo_ASC',
  PropertyDisplayNameToDesc = 'propertyDisplayNameTo_DESC',
  SourceIdFromAsc = 'sourceIdFrom_ASC',
  SourceIdFromDesc = 'sourceIdFrom_DESC',
  SourceIdToAsc = 'sourceIdTo_ASC',
  SourceIdToDesc = 'sourceIdTo_DESC',
  SourceDisplayNameFromAsc = 'sourceDisplayNameFrom_ASC',
  SourceDisplayNameFromDesc = 'sourceDisplayNameFrom_DESC',
  SourceDisplayNameToAsc = 'sourceDisplayNameTo_ASC',
  SourceDisplayNameToDesc = 'sourceDisplayNameTo_DESC',
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
  UpdatedByDesc = 'updatedBy_DESC'
}

export enum SortTicketClassifierHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortTicketClassifiersBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  ParentAsc = 'parent_ASC',
  ParentDesc = 'parent_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortTicketCommentHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  ContentAsc = 'content_ASC',
  ContentDesc = 'content_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortTicketCommentsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  TicketAsc = 'ticket_ASC',
  TicketDesc = 'ticket_DESC',
  UserAsc = 'user_ASC',
  UserDesc = 'user_DESC',
  ContentAsc = 'content_ASC',
  ContentDesc = 'content_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortTicketFileHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortTicketFilesBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  TicketAsc = 'ticket_ASC',
  TicketDesc = 'ticket_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortTicketHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  StatusReopenedCounterAsc = 'statusReopenedCounter_ASC',
  StatusReopenedCounterDesc = 'statusReopenedCounter_DESC',
  StatusUpdatedAtAsc = 'statusUpdatedAt_ASC',
  StatusUpdatedAtDesc = 'statusUpdatedAt_DESC',
  StatusReasonAsc = 'statusReason_ASC',
  StatusReasonDesc = 'statusReason_DESC',
  ClientNameAsc = 'clientName_ASC',
  ClientNameDesc = 'clientName_DESC',
  ClientEmailAsc = 'clientEmail_ASC',
  ClientEmailDesc = 'clientEmail_DESC',
  ClientPhoneAsc = 'clientPhone_ASC',
  ClientPhoneDesc = 'clientPhone_DESC',
  DetailsAsc = 'details_ASC',
  DetailsDesc = 'details_DESC',
  IsPaidAsc = 'isPaid_ASC',
  IsPaidDesc = 'isPaid_DESC',
  IsEmergencyAsc = 'isEmergency_ASC',
  IsEmergencyDesc = 'isEmergency_DESC',
  SectionNameAsc = 'sectionName_ASC',
  SectionNameDesc = 'sectionName_DESC',
  FloorNameAsc = 'floorName_ASC',
  FloorNameDesc = 'floorName_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortTicketSourceHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortTicketSourcesBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortTicketStatusHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortTicketStatusesBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortTicketsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  StatusReopenedCounterAsc = 'statusReopenedCounter_ASC',
  StatusReopenedCounterDesc = 'statusReopenedCounter_DESC',
  StatusUpdatedAtAsc = 'statusUpdatedAt_ASC',
  StatusUpdatedAtDesc = 'statusUpdatedAt_DESC',
  StatusReasonAsc = 'statusReason_ASC',
  StatusReasonDesc = 'statusReason_DESC',
  StatusAsc = 'status_ASC',
  StatusDesc = 'status_DESC',
  NumberAsc = 'number_ASC',
  NumberDesc = 'number_DESC',
  ClientAsc = 'client_ASC',
  ClientDesc = 'client_DESC',
  ContactAsc = 'contact_ASC',
  ContactDesc = 'contact_DESC',
  ClientNameAsc = 'clientName_ASC',
  ClientNameDesc = 'clientName_DESC',
  ClientEmailAsc = 'clientEmail_ASC',
  ClientEmailDesc = 'clientEmail_DESC',
  ClientPhoneAsc = 'clientPhone_ASC',
  ClientPhoneDesc = 'clientPhone_DESC',
  OperatorAsc = 'operator_ASC',
  OperatorDesc = 'operator_DESC',
  AssigneeAsc = 'assignee_ASC',
  AssigneeDesc = 'assignee_DESC',
  ExecutorAsc = 'executor_ASC',
  ExecutorDesc = 'executor_DESC',
  WatchersAsc = 'watchers_ASC',
  WatchersDesc = 'watchers_DESC',
  ClassifierAsc = 'classifier_ASC',
  ClassifierDesc = 'classifier_DESC',
  DetailsAsc = 'details_ASC',
  DetailsDesc = 'details_DESC',
  RelatedAsc = 'related_ASC',
  RelatedDesc = 'related_DESC',
  IsPaidAsc = 'isPaid_ASC',
  IsPaidDesc = 'isPaid_DESC',
  IsEmergencyAsc = 'isEmergency_ASC',
  IsEmergencyDesc = 'isEmergency_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  SectionNameAsc = 'sectionName_ASC',
  SectionNameDesc = 'sectionName_DESC',
  FloorNameAsc = 'floorName_ASC',
  FloorNameDesc = 'floorName_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
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
  CreatedByAsc = 'createdBy_ASC',
  CreatedByDesc = 'createdBy_DESC',
  UpdatedByAsc = 'updatedBy_ASC',
  UpdatedByDesc = 'updatedBy_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC'
}

export enum SortUserHistoryRecordsBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  PasswordAsc = 'password_ASC',
  PasswordDesc = 'password_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  IsActiveAsc = 'isActive_ASC',
  IsActiveDesc = 'isActive_DESC',
  IsAdminAsc = 'isAdmin_ASC',
  IsAdminDesc = 'isAdmin_DESC',
  IsSupportAsc = 'isSupport_ASC',
  IsSupportDesc = 'isSupport_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  IsEmailVerifiedAsc = 'isEmailVerified_ASC',
  IsEmailVerifiedDesc = 'isEmailVerified_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  IsPhoneVerifiedAsc = 'isPhoneVerified_ASC',
  IsPhoneVerifiedDesc = 'isPhoneVerified_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
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
  HistoryDateAsc = 'history_date_ASC',
  HistoryDateDesc = 'history_date_DESC',
  HistoryActionAsc = 'history_action_ASC',
  HistoryActionDesc = 'history_action_DESC'
}

export enum SortUsersBy {
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  IsActiveAsc = 'isActive_ASC',
  IsActiveDesc = 'isActive_DESC',
  IsAdminAsc = 'isAdmin_ASC',
  IsAdminDesc = 'isAdmin_DESC',
  IsSupportAsc = 'isSupport_ASC',
  IsSupportDesc = 'isSupport_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  IsEmailVerifiedAsc = 'isEmailVerified_ASC',
  IsEmailVerifiedDesc = 'isEmailVerified_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  IsPhoneVerifiedAsc = 'isPhoneVerified_ASC',
  IsPhoneVerifiedDesc = 'isPhoneVerified_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
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
  DeletedAtDesc = 'deletedAt_DESC'
}

export type StartConfirmPhoneActionInput = {
  phone: Scalars['String'];
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  captcha: Scalars['String'];
};

export type StartConfirmPhoneActionOutput = {
  __typename?: 'StartConfirmPhoneActionOutput';
  token: Scalars['String'];
};

export type StartPasswordRecoveryInput = {
  email: Scalars['String'];
  sender: Scalars['JSON'];
  dv: Scalars['Int'];
};

export type StartPasswordRecoveryOutput = {
  __typename?: 'StartPasswordRecoveryOutput';
  status: Scalars['String'];
};

/**  Users request or contact with the user  */
export type Ticket = {
  __typename?: 'Ticket';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the Ticket List config, or
   *  2. As an alias to the field set on 'labelField' in the Ticket List config, or
   *  3. As an alias to a 'name' field on the Ticket List (if one exists), or
   *  4. As an alias to the 'id' field on the Ticket List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  /**  Counter showing the number of changes `status` to `new_or_reopened`  */
  statusReopenedCounter?: Maybe<Scalars['Int']>;
  /**  Status updated at time  */
  statusUpdatedAt?: Maybe<Scalars['String']>;
  /**  Text reason for status changes. Sometimes you should describe the reason why you change the `status`  */
  statusReason?: Maybe<Scalars['String']>;
  /**  Status is the step of the ticket processing workflow. Companies may have different ticket processing workflows  */
  status?: Maybe<TicketStatus>;
  /**  Autogenerated ticket human readable ID  */
  number?: Maybe<Scalars['Int']>;
  /**  Inhabitant/customer/person who has a problem or want to improve/order something. Not null if we have a registered client  */
  client?: Maybe<User>;
  /**  Contact, that reported issue, described in this ticket  */
  contact?: Maybe<Contact>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientName?: Maybe<Scalars['String']>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientEmail?: Maybe<Scalars['String']>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientPhone?: Maybe<Scalars['String']>;
  /**  Staff/person who created the issue (submitter). This may be a call center operator or an employee who speaks to a inhabitant/client and filled out an issue for him  */
  operator?: Maybe<User>;
  /**  Assignee/responsible employee/user who must ensure that the issue is fulfilled  */
  assignee?: Maybe<User>;
  /**  Executor employee/user who perform the issue  */
  executor?: Maybe<User>;
  /**  Staff/person who want to watch ticket changes  */
  watchers: Array<User>;
  _watchersMeta?: Maybe<_QueryMeta>;
  /**  Typification / classification / types of work  */
  classifier?: Maybe<TicketClassifier>;
  /**  Text description of the issue. Maybe written by a user or an operator  */
  details?: Maybe<Scalars['String']>;
  /**  Sometimes, it is important for us to show related issues. For example, to show related issues  */
  related?: Maybe<Ticket>;
  /**  Indicates the ticket is paid  */
  isPaid?: Maybe<Scalars['Boolean']>;
  /**  Indicates the ticket is emergency  */
  isEmergency?: Maybe<Scalars['Boolean']>;
  /**  Extra analytics not related to remote system  */
  meta?: Maybe<Scalars['JSON']>;
  /**  Property related to the Ticket  */
  property?: Maybe<Property>;
  /**  Section name/number of an apartment building (property). You need to take from Property.map  */
  sectionName?: Maybe<Scalars['String']>;
  /**  Floor of an apartment building (property). You need to take from Property.map  */
  floorName?: Maybe<Scalars['String']>;
  /**  Flat number / door number of an apartment building (property). You need to take from Property.map  */
  unitName?: Maybe<Scalars['String']>;
  /**  Ticket source channel/system. Examples: call, email, visit, ...  */
  source?: Maybe<TicketSource>;
  /**  In the case of remote system sync, you can store some extra analytics. Examples: email, name, phone, ...  */
  sourceMeta?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};


/**  Users request or contact with the user  */
export type TicketWatchersArgs = {
  where?: Maybe<UserWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortUsersBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


/**  Users request or contact with the user  */
export type Ticket_WatchersMetaArgs = {
  where?: Maybe<UserWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortUsersBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};

/**  Incremental changes of Ticket  */
export type TicketChange = {
  __typename?: 'TicketChange';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketChange List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketChange List config, or
   *  3. As an alias to a 'name' field on the TicketChange List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketChange List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Related ticket, whose change is logged in this entity  */
  ticket?: Maybe<Ticket>;
  /**  Counter showing the number of changes `status` to `new_or_reopened`  */
  statusReopenedCounterFrom?: Maybe<Scalars['Int']>;
  /**  Counter showing the number of changes `status` to `new_or_reopened`  */
  statusReopenedCounterTo?: Maybe<Scalars['Int']>;
  /**  Text reason for status changes. Sometimes you should describe the reason why you change the `status`  */
  statusReasonFrom?: Maybe<Scalars['String']>;
  /**  Text reason for status changes. Sometimes you should describe the reason why you change the `status`  */
  statusReasonTo?: Maybe<Scalars['String']>;
  /**  Autogenerated ticket human readable ID  */
  numberFrom?: Maybe<Scalars['Int']>;
  /**  Autogenerated ticket human readable ID  */
  numberTo?: Maybe<Scalars['Int']>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientNameFrom?: Maybe<Scalars['String']>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientNameTo?: Maybe<Scalars['String']>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientEmailFrom?: Maybe<Scalars['String']>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientEmailTo?: Maybe<Scalars['String']>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientPhoneFrom?: Maybe<Scalars['String']>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientPhoneTo?: Maybe<Scalars['String']>;
  /**  Text description of the issue. Maybe written by a user or an operator  */
  detailsFrom?: Maybe<Scalars['String']>;
  /**  Text description of the issue. Maybe written by a user or an operator  */
  detailsTo?: Maybe<Scalars['String']>;
  /**  Indicates the ticket is paid  */
  isPaidFrom?: Maybe<Scalars['Boolean']>;
  /**  Indicates the ticket is paid  */
  isPaidTo?: Maybe<Scalars['Boolean']>;
  /**  Indicates the ticket is emergency  */
  isEmergencyFrom?: Maybe<Scalars['Boolean']>;
  /**  Indicates the ticket is emergency  */
  isEmergencyTo?: Maybe<Scalars['Boolean']>;
  /**  Extra analytics not related to remote system  */
  metaFrom?: Maybe<Scalars['JSON']>;
  /**  Extra analytics not related to remote system  */
  metaTo?: Maybe<Scalars['JSON']>;
  /**  Section name/number of an apartment building (property). You need to take from Property.map  */
  sectionNameFrom?: Maybe<Scalars['String']>;
  /**  Section name/number of an apartment building (property). You need to take from Property.map  */
  sectionNameTo?: Maybe<Scalars['String']>;
  /**  Floor of an apartment building (property). You need to take from Property.map  */
  floorNameFrom?: Maybe<Scalars['String']>;
  /**  Floor of an apartment building (property). You need to take from Property.map  */
  floorNameTo?: Maybe<Scalars['String']>;
  /**  Flat number / door number of an apartment building (property). You need to take from Property.map  */
  unitNameFrom?: Maybe<Scalars['String']>;
  /**  Flat number / door number of an apartment building (property). You need to take from Property.map  */
  unitNameTo?: Maybe<Scalars['String']>;
  /**  In the case of remote system sync, you can store some extra analytics. Examples: email, name, phone, ...  */
  sourceMetaFrom?: Maybe<Scalars['JSON']>;
  /**  In the case of remote system sync, you can store some extra analytics. Examples: email, name, phone, ...  */
  sourceMetaTo?: Maybe<Scalars['JSON']>;
  /**  Old id of related entity. Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organizationIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organizationIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organizationDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organizationDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Status is the step of the ticket processing workflow. Companies may have different ticket processing workflows  */
  statusIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Status is the step of the ticket processing workflow. Companies may have different ticket processing workflows  */
  statusIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Status is the step of the ticket processing workflow. Companies may have different ticket processing workflows  */
  statusDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Status is the step of the ticket processing workflow. Companies may have different ticket processing workflows  */
  statusDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Inhabitant/customer/person who has a problem or want to improve/order something. Not null if we have a registered client  */
  clientIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Inhabitant/customer/person who has a problem or want to improve/order something. Not null if we have a registered client  */
  clientIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Inhabitant/customer/person who has a problem or want to improve/order something. Not null if we have a registered client  */
  clientDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Inhabitant/customer/person who has a problem or want to improve/order something. Not null if we have a registered client  */
  clientDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Contact, that reported issue, described in this ticket  */
  contactIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Contact, that reported issue, described in this ticket  */
  contactIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Contact, that reported issue, described in this ticket  */
  contactDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Contact, that reported issue, described in this ticket  */
  contactDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Staff/person who created the issue (submitter). This may be a call center operator or an employee who speaks to a inhabitant/client and filled out an issue for him  */
  operatorIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Staff/person who created the issue (submitter). This may be a call center operator or an employee who speaks to a inhabitant/client and filled out an issue for him  */
  operatorIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Staff/person who created the issue (submitter). This may be a call center operator or an employee who speaks to a inhabitant/client and filled out an issue for him  */
  operatorDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Staff/person who created the issue (submitter). This may be a call center operator or an employee who speaks to a inhabitant/client and filled out an issue for him  */
  operatorDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Assignee/responsible employee/user who must ensure that the issue is fulfilled  */
  assigneeIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Assignee/responsible employee/user who must ensure that the issue is fulfilled  */
  assigneeIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Assignee/responsible employee/user who must ensure that the issue is fulfilled  */
  assigneeDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Assignee/responsible employee/user who must ensure that the issue is fulfilled  */
  assigneeDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Executor employee/user who perform the issue  */
  executorIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Executor employee/user who perform the issue  */
  executorIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Executor employee/user who perform the issue  */
  executorDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Executor employee/user who perform the issue  */
  executorDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Typification / classification / types of work  */
  classifierIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Typification / classification / types of work  */
  classifierIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Typification / classification / types of work  */
  classifierDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Typification / classification / types of work  */
  classifierDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Sometimes, it is important for us to show related issues. For example, to show related issues  */
  relatedIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Sometimes, it is important for us to show related issues. For example, to show related issues  */
  relatedIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Sometimes, it is important for us to show related issues. For example, to show related issues  */
  relatedDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Sometimes, it is important for us to show related issues. For example, to show related issues  */
  relatedDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Property related to the Ticket  */
  propertyIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Property related to the Ticket  */
  propertyIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Property related to the Ticket  */
  propertyDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Property related to the Ticket  */
  propertyDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old id of related entity. Ticket source channel/system. Examples: call, email, visit, ...  */
  sourceIdFrom?: Maybe<Scalars['ID']>;
  /**  New id of related entity. Ticket source channel/system. Examples: call, email, visit, ...  */
  sourceIdTo?: Maybe<Scalars['ID']>;
  /**  Old display name of related entity. Ticket source channel/system. Examples: call, email, visit, ...  */
  sourceDisplayNameFrom?: Maybe<Scalars['String']>;
  /**  New display name of related entity. Ticket source channel/system. Examples: call, email, visit, ...  */
  sourceDisplayNameTo?: Maybe<Scalars['String']>;
  /**  Old list of ids of related entities. Staff/person who want to watch ticket changes  */
  watchersIdsFrom?: Maybe<Scalars['JSON']>;
  /**  New list of ids of related entities. Staff/person who want to watch ticket changes  */
  watchersIdsTo?: Maybe<Scalars['JSON']>;
  /**  Old version of display names of related entities. Staff/person who want to watch ticket changes  */
  watchersDisplayNamesFrom?: Maybe<Scalars['JSON']>;
  /**  New version of display names of related entities. Staff/person who want to watch ticket changes  */
  watchersDisplayNamesTo?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
};

export type TicketChangeCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<TicketRelateToOneInput>;
  statusReopenedCounterFrom?: Maybe<Scalars['Int']>;
  statusReopenedCounterTo?: Maybe<Scalars['Int']>;
  statusReasonFrom?: Maybe<Scalars['String']>;
  statusReasonTo?: Maybe<Scalars['String']>;
  numberFrom?: Maybe<Scalars['Int']>;
  numberTo?: Maybe<Scalars['Int']>;
  clientNameFrom?: Maybe<Scalars['String']>;
  clientNameTo?: Maybe<Scalars['String']>;
  clientEmailFrom?: Maybe<Scalars['String']>;
  clientEmailTo?: Maybe<Scalars['String']>;
  clientPhoneFrom?: Maybe<Scalars['String']>;
  clientPhoneTo?: Maybe<Scalars['String']>;
  detailsFrom?: Maybe<Scalars['String']>;
  detailsTo?: Maybe<Scalars['String']>;
  isPaidFrom?: Maybe<Scalars['Boolean']>;
  isPaidTo?: Maybe<Scalars['Boolean']>;
  isEmergencyFrom?: Maybe<Scalars['Boolean']>;
  isEmergencyTo?: Maybe<Scalars['Boolean']>;
  metaFrom?: Maybe<Scalars['JSON']>;
  metaTo?: Maybe<Scalars['JSON']>;
  sectionNameFrom?: Maybe<Scalars['String']>;
  sectionNameTo?: Maybe<Scalars['String']>;
  floorNameFrom?: Maybe<Scalars['String']>;
  floorNameTo?: Maybe<Scalars['String']>;
  unitNameFrom?: Maybe<Scalars['String']>;
  unitNameTo?: Maybe<Scalars['String']>;
  sourceMetaFrom?: Maybe<Scalars['JSON']>;
  sourceMetaTo?: Maybe<Scalars['JSON']>;
  organizationIdFrom?: Maybe<Scalars['ID']>;
  organizationIdTo?: Maybe<Scalars['ID']>;
  organizationDisplayNameFrom?: Maybe<Scalars['String']>;
  organizationDisplayNameTo?: Maybe<Scalars['String']>;
  statusIdFrom?: Maybe<Scalars['ID']>;
  statusIdTo?: Maybe<Scalars['ID']>;
  statusDisplayNameFrom?: Maybe<Scalars['String']>;
  statusDisplayNameTo?: Maybe<Scalars['String']>;
  clientIdFrom?: Maybe<Scalars['ID']>;
  clientIdTo?: Maybe<Scalars['ID']>;
  clientDisplayNameFrom?: Maybe<Scalars['String']>;
  clientDisplayNameTo?: Maybe<Scalars['String']>;
  contactIdFrom?: Maybe<Scalars['ID']>;
  contactIdTo?: Maybe<Scalars['ID']>;
  contactDisplayNameFrom?: Maybe<Scalars['String']>;
  contactDisplayNameTo?: Maybe<Scalars['String']>;
  operatorIdFrom?: Maybe<Scalars['ID']>;
  operatorIdTo?: Maybe<Scalars['ID']>;
  operatorDisplayNameFrom?: Maybe<Scalars['String']>;
  operatorDisplayNameTo?: Maybe<Scalars['String']>;
  assigneeIdFrom?: Maybe<Scalars['ID']>;
  assigneeIdTo?: Maybe<Scalars['ID']>;
  assigneeDisplayNameFrom?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo?: Maybe<Scalars['String']>;
  executorIdFrom?: Maybe<Scalars['ID']>;
  executorIdTo?: Maybe<Scalars['ID']>;
  executorDisplayNameFrom?: Maybe<Scalars['String']>;
  executorDisplayNameTo?: Maybe<Scalars['String']>;
  classifierIdFrom?: Maybe<Scalars['ID']>;
  classifierIdTo?: Maybe<Scalars['ID']>;
  classifierDisplayNameFrom?: Maybe<Scalars['String']>;
  classifierDisplayNameTo?: Maybe<Scalars['String']>;
  relatedIdFrom?: Maybe<Scalars['ID']>;
  relatedIdTo?: Maybe<Scalars['ID']>;
  relatedDisplayNameFrom?: Maybe<Scalars['String']>;
  relatedDisplayNameTo?: Maybe<Scalars['String']>;
  propertyIdFrom?: Maybe<Scalars['ID']>;
  propertyIdTo?: Maybe<Scalars['ID']>;
  propertyDisplayNameFrom?: Maybe<Scalars['String']>;
  propertyDisplayNameTo?: Maybe<Scalars['String']>;
  sourceIdFrom?: Maybe<Scalars['ID']>;
  sourceIdTo?: Maybe<Scalars['ID']>;
  sourceDisplayNameFrom?: Maybe<Scalars['String']>;
  sourceDisplayNameTo?: Maybe<Scalars['String']>;
  watchersIdsFrom?: Maybe<Scalars['JSON']>;
  watchersIdsTo?: Maybe<Scalars['JSON']>;
  watchersDisplayNamesFrom?: Maybe<Scalars['JSON']>;
  watchersDisplayNamesTo?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
};

export type TicketChangeUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<TicketRelateToOneInput>;
  statusReopenedCounterFrom?: Maybe<Scalars['Int']>;
  statusReopenedCounterTo?: Maybe<Scalars['Int']>;
  statusReasonFrom?: Maybe<Scalars['String']>;
  statusReasonTo?: Maybe<Scalars['String']>;
  numberFrom?: Maybe<Scalars['Int']>;
  numberTo?: Maybe<Scalars['Int']>;
  clientNameFrom?: Maybe<Scalars['String']>;
  clientNameTo?: Maybe<Scalars['String']>;
  clientEmailFrom?: Maybe<Scalars['String']>;
  clientEmailTo?: Maybe<Scalars['String']>;
  clientPhoneFrom?: Maybe<Scalars['String']>;
  clientPhoneTo?: Maybe<Scalars['String']>;
  detailsFrom?: Maybe<Scalars['String']>;
  detailsTo?: Maybe<Scalars['String']>;
  isPaidFrom?: Maybe<Scalars['Boolean']>;
  isPaidTo?: Maybe<Scalars['Boolean']>;
  isEmergencyFrom?: Maybe<Scalars['Boolean']>;
  isEmergencyTo?: Maybe<Scalars['Boolean']>;
  metaFrom?: Maybe<Scalars['JSON']>;
  metaTo?: Maybe<Scalars['JSON']>;
  sectionNameFrom?: Maybe<Scalars['String']>;
  sectionNameTo?: Maybe<Scalars['String']>;
  floorNameFrom?: Maybe<Scalars['String']>;
  floorNameTo?: Maybe<Scalars['String']>;
  unitNameFrom?: Maybe<Scalars['String']>;
  unitNameTo?: Maybe<Scalars['String']>;
  sourceMetaFrom?: Maybe<Scalars['JSON']>;
  sourceMetaTo?: Maybe<Scalars['JSON']>;
  organizationIdFrom?: Maybe<Scalars['ID']>;
  organizationIdTo?: Maybe<Scalars['ID']>;
  organizationDisplayNameFrom?: Maybe<Scalars['String']>;
  organizationDisplayNameTo?: Maybe<Scalars['String']>;
  statusIdFrom?: Maybe<Scalars['ID']>;
  statusIdTo?: Maybe<Scalars['ID']>;
  statusDisplayNameFrom?: Maybe<Scalars['String']>;
  statusDisplayNameTo?: Maybe<Scalars['String']>;
  clientIdFrom?: Maybe<Scalars['ID']>;
  clientIdTo?: Maybe<Scalars['ID']>;
  clientDisplayNameFrom?: Maybe<Scalars['String']>;
  clientDisplayNameTo?: Maybe<Scalars['String']>;
  contactIdFrom?: Maybe<Scalars['ID']>;
  contactIdTo?: Maybe<Scalars['ID']>;
  contactDisplayNameFrom?: Maybe<Scalars['String']>;
  contactDisplayNameTo?: Maybe<Scalars['String']>;
  operatorIdFrom?: Maybe<Scalars['ID']>;
  operatorIdTo?: Maybe<Scalars['ID']>;
  operatorDisplayNameFrom?: Maybe<Scalars['String']>;
  operatorDisplayNameTo?: Maybe<Scalars['String']>;
  assigneeIdFrom?: Maybe<Scalars['ID']>;
  assigneeIdTo?: Maybe<Scalars['ID']>;
  assigneeDisplayNameFrom?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo?: Maybe<Scalars['String']>;
  executorIdFrom?: Maybe<Scalars['ID']>;
  executorIdTo?: Maybe<Scalars['ID']>;
  executorDisplayNameFrom?: Maybe<Scalars['String']>;
  executorDisplayNameTo?: Maybe<Scalars['String']>;
  classifierIdFrom?: Maybe<Scalars['ID']>;
  classifierIdTo?: Maybe<Scalars['ID']>;
  classifierDisplayNameFrom?: Maybe<Scalars['String']>;
  classifierDisplayNameTo?: Maybe<Scalars['String']>;
  relatedIdFrom?: Maybe<Scalars['ID']>;
  relatedIdTo?: Maybe<Scalars['ID']>;
  relatedDisplayNameFrom?: Maybe<Scalars['String']>;
  relatedDisplayNameTo?: Maybe<Scalars['String']>;
  propertyIdFrom?: Maybe<Scalars['ID']>;
  propertyIdTo?: Maybe<Scalars['ID']>;
  propertyDisplayNameFrom?: Maybe<Scalars['String']>;
  propertyDisplayNameTo?: Maybe<Scalars['String']>;
  sourceIdFrom?: Maybe<Scalars['ID']>;
  sourceIdTo?: Maybe<Scalars['ID']>;
  sourceDisplayNameFrom?: Maybe<Scalars['String']>;
  sourceDisplayNameTo?: Maybe<Scalars['String']>;
  watchersIdsFrom?: Maybe<Scalars['JSON']>;
  watchersIdsTo?: Maybe<Scalars['JSON']>;
  watchersDisplayNamesFrom?: Maybe<Scalars['JSON']>;
  watchersDisplayNamesTo?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
};

export type TicketChangeWhereInput = {
  AND?: Maybe<Array<Maybe<TicketChangeWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketChangeWhereInput>>>;
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
  ticket?: Maybe<TicketWhereInput>;
  ticket_is_null?: Maybe<Scalars['Boolean']>;
  statusReopenedCounterFrom?: Maybe<Scalars['Int']>;
  statusReopenedCounterFrom_not?: Maybe<Scalars['Int']>;
  statusReopenedCounterFrom_lt?: Maybe<Scalars['Int']>;
  statusReopenedCounterFrom_lte?: Maybe<Scalars['Int']>;
  statusReopenedCounterFrom_gt?: Maybe<Scalars['Int']>;
  statusReopenedCounterFrom_gte?: Maybe<Scalars['Int']>;
  statusReopenedCounterFrom_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  statusReopenedCounterFrom_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  statusReopenedCounterTo?: Maybe<Scalars['Int']>;
  statusReopenedCounterTo_not?: Maybe<Scalars['Int']>;
  statusReopenedCounterTo_lt?: Maybe<Scalars['Int']>;
  statusReopenedCounterTo_lte?: Maybe<Scalars['Int']>;
  statusReopenedCounterTo_gt?: Maybe<Scalars['Int']>;
  statusReopenedCounterTo_gte?: Maybe<Scalars['Int']>;
  statusReopenedCounterTo_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  statusReopenedCounterTo_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  statusReasonFrom?: Maybe<Scalars['String']>;
  statusReasonFrom_not?: Maybe<Scalars['String']>;
  statusReasonFrom_contains?: Maybe<Scalars['String']>;
  statusReasonFrom_not_contains?: Maybe<Scalars['String']>;
  statusReasonFrom_starts_with?: Maybe<Scalars['String']>;
  statusReasonFrom_not_starts_with?: Maybe<Scalars['String']>;
  statusReasonFrom_ends_with?: Maybe<Scalars['String']>;
  statusReasonFrom_not_ends_with?: Maybe<Scalars['String']>;
  statusReasonFrom_i?: Maybe<Scalars['String']>;
  statusReasonFrom_not_i?: Maybe<Scalars['String']>;
  statusReasonFrom_contains_i?: Maybe<Scalars['String']>;
  statusReasonFrom_not_contains_i?: Maybe<Scalars['String']>;
  statusReasonFrom_starts_with_i?: Maybe<Scalars['String']>;
  statusReasonFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  statusReasonFrom_ends_with_i?: Maybe<Scalars['String']>;
  statusReasonFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  statusReasonFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusReasonFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusReasonTo?: Maybe<Scalars['String']>;
  statusReasonTo_not?: Maybe<Scalars['String']>;
  statusReasonTo_contains?: Maybe<Scalars['String']>;
  statusReasonTo_not_contains?: Maybe<Scalars['String']>;
  statusReasonTo_starts_with?: Maybe<Scalars['String']>;
  statusReasonTo_not_starts_with?: Maybe<Scalars['String']>;
  statusReasonTo_ends_with?: Maybe<Scalars['String']>;
  statusReasonTo_not_ends_with?: Maybe<Scalars['String']>;
  statusReasonTo_i?: Maybe<Scalars['String']>;
  statusReasonTo_not_i?: Maybe<Scalars['String']>;
  statusReasonTo_contains_i?: Maybe<Scalars['String']>;
  statusReasonTo_not_contains_i?: Maybe<Scalars['String']>;
  statusReasonTo_starts_with_i?: Maybe<Scalars['String']>;
  statusReasonTo_not_starts_with_i?: Maybe<Scalars['String']>;
  statusReasonTo_ends_with_i?: Maybe<Scalars['String']>;
  statusReasonTo_not_ends_with_i?: Maybe<Scalars['String']>;
  statusReasonTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusReasonTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  numberFrom?: Maybe<Scalars['Int']>;
  numberFrom_not?: Maybe<Scalars['Int']>;
  numberFrom_lt?: Maybe<Scalars['Int']>;
  numberFrom_lte?: Maybe<Scalars['Int']>;
  numberFrom_gt?: Maybe<Scalars['Int']>;
  numberFrom_gte?: Maybe<Scalars['Int']>;
  numberFrom_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  numberFrom_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  numberTo?: Maybe<Scalars['Int']>;
  numberTo_not?: Maybe<Scalars['Int']>;
  numberTo_lt?: Maybe<Scalars['Int']>;
  numberTo_lte?: Maybe<Scalars['Int']>;
  numberTo_gt?: Maybe<Scalars['Int']>;
  numberTo_gte?: Maybe<Scalars['Int']>;
  numberTo_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  numberTo_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  clientNameFrom?: Maybe<Scalars['String']>;
  clientNameFrom_not?: Maybe<Scalars['String']>;
  clientNameFrom_contains?: Maybe<Scalars['String']>;
  clientNameFrom_not_contains?: Maybe<Scalars['String']>;
  clientNameFrom_starts_with?: Maybe<Scalars['String']>;
  clientNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  clientNameFrom_ends_with?: Maybe<Scalars['String']>;
  clientNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  clientNameFrom_i?: Maybe<Scalars['String']>;
  clientNameFrom_not_i?: Maybe<Scalars['String']>;
  clientNameFrom_contains_i?: Maybe<Scalars['String']>;
  clientNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  clientNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  clientNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  clientNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  clientNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  clientNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientNameTo?: Maybe<Scalars['String']>;
  clientNameTo_not?: Maybe<Scalars['String']>;
  clientNameTo_contains?: Maybe<Scalars['String']>;
  clientNameTo_not_contains?: Maybe<Scalars['String']>;
  clientNameTo_starts_with?: Maybe<Scalars['String']>;
  clientNameTo_not_starts_with?: Maybe<Scalars['String']>;
  clientNameTo_ends_with?: Maybe<Scalars['String']>;
  clientNameTo_not_ends_with?: Maybe<Scalars['String']>;
  clientNameTo_i?: Maybe<Scalars['String']>;
  clientNameTo_not_i?: Maybe<Scalars['String']>;
  clientNameTo_contains_i?: Maybe<Scalars['String']>;
  clientNameTo_not_contains_i?: Maybe<Scalars['String']>;
  clientNameTo_starts_with_i?: Maybe<Scalars['String']>;
  clientNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  clientNameTo_ends_with_i?: Maybe<Scalars['String']>;
  clientNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  clientNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientEmailFrom?: Maybe<Scalars['String']>;
  clientEmailFrom_not?: Maybe<Scalars['String']>;
  clientEmailFrom_contains?: Maybe<Scalars['String']>;
  clientEmailFrom_not_contains?: Maybe<Scalars['String']>;
  clientEmailFrom_starts_with?: Maybe<Scalars['String']>;
  clientEmailFrom_not_starts_with?: Maybe<Scalars['String']>;
  clientEmailFrom_ends_with?: Maybe<Scalars['String']>;
  clientEmailFrom_not_ends_with?: Maybe<Scalars['String']>;
  clientEmailFrom_i?: Maybe<Scalars['String']>;
  clientEmailFrom_not_i?: Maybe<Scalars['String']>;
  clientEmailFrom_contains_i?: Maybe<Scalars['String']>;
  clientEmailFrom_not_contains_i?: Maybe<Scalars['String']>;
  clientEmailFrom_starts_with_i?: Maybe<Scalars['String']>;
  clientEmailFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  clientEmailFrom_ends_with_i?: Maybe<Scalars['String']>;
  clientEmailFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  clientEmailFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientEmailFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientEmailTo?: Maybe<Scalars['String']>;
  clientEmailTo_not?: Maybe<Scalars['String']>;
  clientEmailTo_contains?: Maybe<Scalars['String']>;
  clientEmailTo_not_contains?: Maybe<Scalars['String']>;
  clientEmailTo_starts_with?: Maybe<Scalars['String']>;
  clientEmailTo_not_starts_with?: Maybe<Scalars['String']>;
  clientEmailTo_ends_with?: Maybe<Scalars['String']>;
  clientEmailTo_not_ends_with?: Maybe<Scalars['String']>;
  clientEmailTo_i?: Maybe<Scalars['String']>;
  clientEmailTo_not_i?: Maybe<Scalars['String']>;
  clientEmailTo_contains_i?: Maybe<Scalars['String']>;
  clientEmailTo_not_contains_i?: Maybe<Scalars['String']>;
  clientEmailTo_starts_with_i?: Maybe<Scalars['String']>;
  clientEmailTo_not_starts_with_i?: Maybe<Scalars['String']>;
  clientEmailTo_ends_with_i?: Maybe<Scalars['String']>;
  clientEmailTo_not_ends_with_i?: Maybe<Scalars['String']>;
  clientEmailTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientEmailTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientPhoneFrom?: Maybe<Scalars['String']>;
  clientPhoneFrom_not?: Maybe<Scalars['String']>;
  clientPhoneFrom_contains?: Maybe<Scalars['String']>;
  clientPhoneFrom_not_contains?: Maybe<Scalars['String']>;
  clientPhoneFrom_starts_with?: Maybe<Scalars['String']>;
  clientPhoneFrom_not_starts_with?: Maybe<Scalars['String']>;
  clientPhoneFrom_ends_with?: Maybe<Scalars['String']>;
  clientPhoneFrom_not_ends_with?: Maybe<Scalars['String']>;
  clientPhoneFrom_i?: Maybe<Scalars['String']>;
  clientPhoneFrom_not_i?: Maybe<Scalars['String']>;
  clientPhoneFrom_contains_i?: Maybe<Scalars['String']>;
  clientPhoneFrom_not_contains_i?: Maybe<Scalars['String']>;
  clientPhoneFrom_starts_with_i?: Maybe<Scalars['String']>;
  clientPhoneFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  clientPhoneFrom_ends_with_i?: Maybe<Scalars['String']>;
  clientPhoneFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  clientPhoneFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientPhoneFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientPhoneTo?: Maybe<Scalars['String']>;
  clientPhoneTo_not?: Maybe<Scalars['String']>;
  clientPhoneTo_contains?: Maybe<Scalars['String']>;
  clientPhoneTo_not_contains?: Maybe<Scalars['String']>;
  clientPhoneTo_starts_with?: Maybe<Scalars['String']>;
  clientPhoneTo_not_starts_with?: Maybe<Scalars['String']>;
  clientPhoneTo_ends_with?: Maybe<Scalars['String']>;
  clientPhoneTo_not_ends_with?: Maybe<Scalars['String']>;
  clientPhoneTo_i?: Maybe<Scalars['String']>;
  clientPhoneTo_not_i?: Maybe<Scalars['String']>;
  clientPhoneTo_contains_i?: Maybe<Scalars['String']>;
  clientPhoneTo_not_contains_i?: Maybe<Scalars['String']>;
  clientPhoneTo_starts_with_i?: Maybe<Scalars['String']>;
  clientPhoneTo_not_starts_with_i?: Maybe<Scalars['String']>;
  clientPhoneTo_ends_with_i?: Maybe<Scalars['String']>;
  clientPhoneTo_not_ends_with_i?: Maybe<Scalars['String']>;
  clientPhoneTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientPhoneTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  detailsFrom?: Maybe<Scalars['String']>;
  detailsFrom_not?: Maybe<Scalars['String']>;
  detailsFrom_contains?: Maybe<Scalars['String']>;
  detailsFrom_not_contains?: Maybe<Scalars['String']>;
  detailsFrom_starts_with?: Maybe<Scalars['String']>;
  detailsFrom_not_starts_with?: Maybe<Scalars['String']>;
  detailsFrom_ends_with?: Maybe<Scalars['String']>;
  detailsFrom_not_ends_with?: Maybe<Scalars['String']>;
  detailsFrom_i?: Maybe<Scalars['String']>;
  detailsFrom_not_i?: Maybe<Scalars['String']>;
  detailsFrom_contains_i?: Maybe<Scalars['String']>;
  detailsFrom_not_contains_i?: Maybe<Scalars['String']>;
  detailsFrom_starts_with_i?: Maybe<Scalars['String']>;
  detailsFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  detailsFrom_ends_with_i?: Maybe<Scalars['String']>;
  detailsFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  detailsFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  detailsFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  detailsTo?: Maybe<Scalars['String']>;
  detailsTo_not?: Maybe<Scalars['String']>;
  detailsTo_contains?: Maybe<Scalars['String']>;
  detailsTo_not_contains?: Maybe<Scalars['String']>;
  detailsTo_starts_with?: Maybe<Scalars['String']>;
  detailsTo_not_starts_with?: Maybe<Scalars['String']>;
  detailsTo_ends_with?: Maybe<Scalars['String']>;
  detailsTo_not_ends_with?: Maybe<Scalars['String']>;
  detailsTo_i?: Maybe<Scalars['String']>;
  detailsTo_not_i?: Maybe<Scalars['String']>;
  detailsTo_contains_i?: Maybe<Scalars['String']>;
  detailsTo_not_contains_i?: Maybe<Scalars['String']>;
  detailsTo_starts_with_i?: Maybe<Scalars['String']>;
  detailsTo_not_starts_with_i?: Maybe<Scalars['String']>;
  detailsTo_ends_with_i?: Maybe<Scalars['String']>;
  detailsTo_not_ends_with_i?: Maybe<Scalars['String']>;
  detailsTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  detailsTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isPaidFrom?: Maybe<Scalars['Boolean']>;
  isPaidFrom_not?: Maybe<Scalars['Boolean']>;
  isPaidTo?: Maybe<Scalars['Boolean']>;
  isPaidTo_not?: Maybe<Scalars['Boolean']>;
  isEmergencyFrom?: Maybe<Scalars['Boolean']>;
  isEmergencyFrom_not?: Maybe<Scalars['Boolean']>;
  isEmergencyTo?: Maybe<Scalars['Boolean']>;
  isEmergencyTo_not?: Maybe<Scalars['Boolean']>;
  metaFrom?: Maybe<Scalars['JSON']>;
  metaFrom_not?: Maybe<Scalars['JSON']>;
  metaFrom_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  metaFrom_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  metaTo?: Maybe<Scalars['JSON']>;
  metaTo_not?: Maybe<Scalars['JSON']>;
  metaTo_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  metaTo_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  sectionNameFrom?: Maybe<Scalars['String']>;
  sectionNameFrom_not?: Maybe<Scalars['String']>;
  sectionNameFrom_contains?: Maybe<Scalars['String']>;
  sectionNameFrom_not_contains?: Maybe<Scalars['String']>;
  sectionNameFrom_starts_with?: Maybe<Scalars['String']>;
  sectionNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  sectionNameFrom_ends_with?: Maybe<Scalars['String']>;
  sectionNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  sectionNameFrom_i?: Maybe<Scalars['String']>;
  sectionNameFrom_not_i?: Maybe<Scalars['String']>;
  sectionNameFrom_contains_i?: Maybe<Scalars['String']>;
  sectionNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  sectionNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  sectionNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  sectionNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  sectionNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  sectionNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sectionNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sectionNameTo?: Maybe<Scalars['String']>;
  sectionNameTo_not?: Maybe<Scalars['String']>;
  sectionNameTo_contains?: Maybe<Scalars['String']>;
  sectionNameTo_not_contains?: Maybe<Scalars['String']>;
  sectionNameTo_starts_with?: Maybe<Scalars['String']>;
  sectionNameTo_not_starts_with?: Maybe<Scalars['String']>;
  sectionNameTo_ends_with?: Maybe<Scalars['String']>;
  sectionNameTo_not_ends_with?: Maybe<Scalars['String']>;
  sectionNameTo_i?: Maybe<Scalars['String']>;
  sectionNameTo_not_i?: Maybe<Scalars['String']>;
  sectionNameTo_contains_i?: Maybe<Scalars['String']>;
  sectionNameTo_not_contains_i?: Maybe<Scalars['String']>;
  sectionNameTo_starts_with_i?: Maybe<Scalars['String']>;
  sectionNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  sectionNameTo_ends_with_i?: Maybe<Scalars['String']>;
  sectionNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  sectionNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sectionNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  floorNameFrom?: Maybe<Scalars['String']>;
  floorNameFrom_not?: Maybe<Scalars['String']>;
  floorNameFrom_contains?: Maybe<Scalars['String']>;
  floorNameFrom_not_contains?: Maybe<Scalars['String']>;
  floorNameFrom_starts_with?: Maybe<Scalars['String']>;
  floorNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  floorNameFrom_ends_with?: Maybe<Scalars['String']>;
  floorNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  floorNameFrom_i?: Maybe<Scalars['String']>;
  floorNameFrom_not_i?: Maybe<Scalars['String']>;
  floorNameFrom_contains_i?: Maybe<Scalars['String']>;
  floorNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  floorNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  floorNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  floorNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  floorNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  floorNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  floorNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  floorNameTo?: Maybe<Scalars['String']>;
  floorNameTo_not?: Maybe<Scalars['String']>;
  floorNameTo_contains?: Maybe<Scalars['String']>;
  floorNameTo_not_contains?: Maybe<Scalars['String']>;
  floorNameTo_starts_with?: Maybe<Scalars['String']>;
  floorNameTo_not_starts_with?: Maybe<Scalars['String']>;
  floorNameTo_ends_with?: Maybe<Scalars['String']>;
  floorNameTo_not_ends_with?: Maybe<Scalars['String']>;
  floorNameTo_i?: Maybe<Scalars['String']>;
  floorNameTo_not_i?: Maybe<Scalars['String']>;
  floorNameTo_contains_i?: Maybe<Scalars['String']>;
  floorNameTo_not_contains_i?: Maybe<Scalars['String']>;
  floorNameTo_starts_with_i?: Maybe<Scalars['String']>;
  floorNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  floorNameTo_ends_with_i?: Maybe<Scalars['String']>;
  floorNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  floorNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  floorNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitNameFrom?: Maybe<Scalars['String']>;
  unitNameFrom_not?: Maybe<Scalars['String']>;
  unitNameFrom_contains?: Maybe<Scalars['String']>;
  unitNameFrom_not_contains?: Maybe<Scalars['String']>;
  unitNameFrom_starts_with?: Maybe<Scalars['String']>;
  unitNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  unitNameFrom_ends_with?: Maybe<Scalars['String']>;
  unitNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  unitNameFrom_i?: Maybe<Scalars['String']>;
  unitNameFrom_not_i?: Maybe<Scalars['String']>;
  unitNameFrom_contains_i?: Maybe<Scalars['String']>;
  unitNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  unitNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  unitNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  unitNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  unitNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  unitNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitNameTo?: Maybe<Scalars['String']>;
  unitNameTo_not?: Maybe<Scalars['String']>;
  unitNameTo_contains?: Maybe<Scalars['String']>;
  unitNameTo_not_contains?: Maybe<Scalars['String']>;
  unitNameTo_starts_with?: Maybe<Scalars['String']>;
  unitNameTo_not_starts_with?: Maybe<Scalars['String']>;
  unitNameTo_ends_with?: Maybe<Scalars['String']>;
  unitNameTo_not_ends_with?: Maybe<Scalars['String']>;
  unitNameTo_i?: Maybe<Scalars['String']>;
  unitNameTo_not_i?: Maybe<Scalars['String']>;
  unitNameTo_contains_i?: Maybe<Scalars['String']>;
  unitNameTo_not_contains_i?: Maybe<Scalars['String']>;
  unitNameTo_starts_with_i?: Maybe<Scalars['String']>;
  unitNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  unitNameTo_ends_with_i?: Maybe<Scalars['String']>;
  unitNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  unitNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sourceMetaFrom?: Maybe<Scalars['JSON']>;
  sourceMetaFrom_not?: Maybe<Scalars['JSON']>;
  sourceMetaFrom_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  sourceMetaFrom_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  sourceMetaTo?: Maybe<Scalars['JSON']>;
  sourceMetaTo_not?: Maybe<Scalars['JSON']>;
  sourceMetaTo_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  sourceMetaTo_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  organizationIdFrom?: Maybe<Scalars['ID']>;
  organizationIdFrom_not?: Maybe<Scalars['ID']>;
  organizationIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  organizationIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  organizationIdTo?: Maybe<Scalars['ID']>;
  organizationIdTo_not?: Maybe<Scalars['ID']>;
  organizationIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  organizationIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  organizationDisplayNameFrom?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_not?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_i?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  organizationDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organizationDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organizationDisplayNameTo?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_not?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_contains?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_i?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  organizationDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organizationDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusIdFrom?: Maybe<Scalars['ID']>;
  statusIdFrom_not?: Maybe<Scalars['ID']>;
  statusIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  statusIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  statusIdTo?: Maybe<Scalars['ID']>;
  statusIdTo_not?: Maybe<Scalars['ID']>;
  statusIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  statusIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  statusDisplayNameFrom?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_not?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_i?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  statusDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusDisplayNameTo?: Maybe<Scalars['String']>;
  statusDisplayNameTo_not?: Maybe<Scalars['String']>;
  statusDisplayNameTo_contains?: Maybe<Scalars['String']>;
  statusDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  statusDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  statusDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  statusDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  statusDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  statusDisplayNameTo_i?: Maybe<Scalars['String']>;
  statusDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  statusDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  statusDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  statusDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  statusDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  statusDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  statusDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  statusDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientIdFrom?: Maybe<Scalars['ID']>;
  clientIdFrom_not?: Maybe<Scalars['ID']>;
  clientIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  clientIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  clientIdTo?: Maybe<Scalars['ID']>;
  clientIdTo_not?: Maybe<Scalars['ID']>;
  clientIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  clientIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  clientDisplayNameFrom?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_not?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_i?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  clientDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientDisplayNameTo?: Maybe<Scalars['String']>;
  clientDisplayNameTo_not?: Maybe<Scalars['String']>;
  clientDisplayNameTo_contains?: Maybe<Scalars['String']>;
  clientDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  clientDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  clientDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  clientDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  clientDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  clientDisplayNameTo_i?: Maybe<Scalars['String']>;
  clientDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  clientDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  clientDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  clientDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  clientDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  clientDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  clientDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  clientDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  contactIdFrom?: Maybe<Scalars['ID']>;
  contactIdFrom_not?: Maybe<Scalars['ID']>;
  contactIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  contactIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  contactIdTo?: Maybe<Scalars['ID']>;
  contactIdTo_not?: Maybe<Scalars['ID']>;
  contactIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  contactIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  contactDisplayNameFrom?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_not?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_i?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  contactDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  contactDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  contactDisplayNameTo?: Maybe<Scalars['String']>;
  contactDisplayNameTo_not?: Maybe<Scalars['String']>;
  contactDisplayNameTo_contains?: Maybe<Scalars['String']>;
  contactDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  contactDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  contactDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  contactDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  contactDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  contactDisplayNameTo_i?: Maybe<Scalars['String']>;
  contactDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  contactDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  contactDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  contactDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  contactDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  contactDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  contactDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  contactDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  contactDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  operatorIdFrom?: Maybe<Scalars['ID']>;
  operatorIdFrom_not?: Maybe<Scalars['ID']>;
  operatorIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  operatorIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  operatorIdTo?: Maybe<Scalars['ID']>;
  operatorIdTo_not?: Maybe<Scalars['ID']>;
  operatorIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  operatorIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  operatorDisplayNameFrom?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_not?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_i?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  operatorDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  operatorDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  operatorDisplayNameTo?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_not?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_contains?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_i?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  operatorDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  operatorDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  assigneeIdFrom?: Maybe<Scalars['ID']>;
  assigneeIdFrom_not?: Maybe<Scalars['ID']>;
  assigneeIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  assigneeIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  assigneeIdTo?: Maybe<Scalars['ID']>;
  assigneeIdTo_not?: Maybe<Scalars['ID']>;
  assigneeIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  assigneeIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  assigneeDisplayNameFrom?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_not?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  assigneeDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  assigneeDisplayNameTo?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_not?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_contains?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  assigneeDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  assigneeDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  executorIdFrom?: Maybe<Scalars['ID']>;
  executorIdFrom_not?: Maybe<Scalars['ID']>;
  executorIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  executorIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  executorIdTo?: Maybe<Scalars['ID']>;
  executorIdTo_not?: Maybe<Scalars['ID']>;
  executorIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  executorIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  executorDisplayNameFrom?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_not?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_i?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  executorDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  executorDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  executorDisplayNameTo?: Maybe<Scalars['String']>;
  executorDisplayNameTo_not?: Maybe<Scalars['String']>;
  executorDisplayNameTo_contains?: Maybe<Scalars['String']>;
  executorDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  executorDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  executorDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  executorDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  executorDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  executorDisplayNameTo_i?: Maybe<Scalars['String']>;
  executorDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  executorDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  executorDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  executorDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  executorDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  executorDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  executorDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  executorDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  executorDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  classifierIdFrom?: Maybe<Scalars['ID']>;
  classifierIdFrom_not?: Maybe<Scalars['ID']>;
  classifierIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  classifierIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  classifierIdTo?: Maybe<Scalars['ID']>;
  classifierIdTo_not?: Maybe<Scalars['ID']>;
  classifierIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  classifierIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  classifierDisplayNameFrom?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_not?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_i?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  classifierDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  classifierDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  classifierDisplayNameTo?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_not?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_contains?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_i?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  classifierDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  classifierDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  relatedIdFrom?: Maybe<Scalars['ID']>;
  relatedIdFrom_not?: Maybe<Scalars['ID']>;
  relatedIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  relatedIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  relatedIdTo?: Maybe<Scalars['ID']>;
  relatedIdTo_not?: Maybe<Scalars['ID']>;
  relatedIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  relatedIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  relatedDisplayNameFrom?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_not?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_i?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  relatedDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  relatedDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  relatedDisplayNameTo?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_not?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_contains?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_i?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  relatedDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  relatedDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  propertyIdFrom?: Maybe<Scalars['ID']>;
  propertyIdFrom_not?: Maybe<Scalars['ID']>;
  propertyIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  propertyIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  propertyIdTo?: Maybe<Scalars['ID']>;
  propertyIdTo_not?: Maybe<Scalars['ID']>;
  propertyIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  propertyIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  propertyDisplayNameFrom?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_not?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_i?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  propertyDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  propertyDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  propertyDisplayNameTo?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_not?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_contains?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_i?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  propertyDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  propertyDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sourceIdFrom?: Maybe<Scalars['ID']>;
  sourceIdFrom_not?: Maybe<Scalars['ID']>;
  sourceIdFrom_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  sourceIdFrom_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  sourceIdTo?: Maybe<Scalars['ID']>;
  sourceIdTo_not?: Maybe<Scalars['ID']>;
  sourceIdTo_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  sourceIdTo_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  sourceDisplayNameFrom?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_not?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_contains?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_not_contains?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_starts_with?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_not_starts_with?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_ends_with?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_not_ends_with?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_i?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_not_i?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_contains_i?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_not_contains_i?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_starts_with_i?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_not_starts_with_i?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_ends_with_i?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_not_ends_with_i?: Maybe<Scalars['String']>;
  sourceDisplayNameFrom_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sourceDisplayNameFrom_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sourceDisplayNameTo?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_not?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_contains?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_not_contains?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_starts_with?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_not_starts_with?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_ends_with?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_not_ends_with?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_i?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_not_i?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_contains_i?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_not_contains_i?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_starts_with_i?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_not_starts_with_i?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_ends_with_i?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_not_ends_with_i?: Maybe<Scalars['String']>;
  sourceDisplayNameTo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sourceDisplayNameTo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  watchersIdsFrom?: Maybe<Scalars['JSON']>;
  watchersIdsFrom_not?: Maybe<Scalars['JSON']>;
  watchersIdsFrom_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  watchersIdsFrom_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  watchersIdsTo?: Maybe<Scalars['JSON']>;
  watchersIdsTo_not?: Maybe<Scalars['JSON']>;
  watchersIdsTo_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  watchersIdsTo_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  watchersDisplayNamesFrom?: Maybe<Scalars['JSON']>;
  watchersDisplayNamesFrom_not?: Maybe<Scalars['JSON']>;
  watchersDisplayNamesFrom_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  watchersDisplayNamesFrom_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  watchersDisplayNamesTo?: Maybe<Scalars['JSON']>;
  watchersDisplayNamesTo_not?: Maybe<Scalars['JSON']>;
  watchersDisplayNamesTo_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  watchersDisplayNamesTo_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
};

export type TicketChangeWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketChangesCreateInput = {
  data?: Maybe<TicketChangeCreateInput>;
};

export type TicketChangesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketChangeUpdateInput>;
};

/**  Ticket typification/classification. We have a organization specific classification. We check the ticket attrs differently depending on the classifier  */
export type TicketClassifier = {
  __typename?: 'TicketClassifier';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketClassifier List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketClassifier List config, or
   *  3. As an alias to a 'name' field on the TicketClassifier List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketClassifier List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the organization. If this ref is null the object is common for all organizations  */
  organization?: Maybe<Organization>;
  /**  Multi level name  */
  fullName?: Maybe<Scalars['String']>;
  /**  This level name  */
  name?: Maybe<Scalars['String']>;
  /**  Multi level classification support  */
  parent?: Maybe<TicketClassifier>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketClassifierCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  name?: Maybe<Scalars['String']>;
  parent?: Maybe<TicketClassifierRelateToOneInput>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type TicketClassifierHistoryRecord = {
  __typename?: 'TicketClassifierHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketClassifierHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketClassifierHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the TicketClassifierHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketClassifierHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  parent?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketClassifierHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketClassifierHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  parent?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketClassifierHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum TicketClassifierHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type TicketClassifierHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  parent?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketClassifierHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketClassifierHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<TicketClassifierHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketClassifierHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  fullName?: Maybe<Scalars['JSON']>;
  fullName_not?: Maybe<Scalars['JSON']>;
  fullName_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  fullName_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  parent?: Maybe<Scalars['String']>;
  parent_not?: Maybe<Scalars['String']>;
  parent_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  parent_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<TicketClassifierHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<TicketClassifierHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<TicketClassifierHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<TicketClassifierHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type TicketClassifierHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketClassifierHistoryRecordsCreateInput = {
  data?: Maybe<TicketClassifierHistoryRecordCreateInput>;
};

export type TicketClassifierHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketClassifierHistoryRecordUpdateInput>;
};

export type TicketClassifierRelateToOneInput = {
  create?: Maybe<TicketClassifierCreateInput>;
  connect?: Maybe<TicketClassifierWhereUniqueInput>;
  disconnect?: Maybe<TicketClassifierWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type TicketClassifierUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  name?: Maybe<Scalars['String']>;
  parent?: Maybe<TicketClassifierRelateToOneInput>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketClassifierWhereInput = {
  AND?: Maybe<Array<Maybe<TicketClassifierWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketClassifierWhereInput>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
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
  parent?: Maybe<TicketClassifierWhereInput>;
  parent_is_null?: Maybe<Scalars['Boolean']>;
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
};

export type TicketClassifierWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketClassifiersCreateInput = {
  data?: Maybe<TicketClassifierCreateInput>;
};

export type TicketClassifiersUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketClassifierUpdateInput>;
};

/**  Textual comment for tickets  */
export type TicketComment = {
  __typename?: 'TicketComment';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketComment List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketComment List config, or
   *  3. As an alias to a 'name' field on the TicketComment List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketComment List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Related ticket of the comment  */
  ticket?: Maybe<Ticket>;
  /**  User, who created the comment  */
  user?: Maybe<User>;
  /**  Plain text content  */
  content?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketCommentCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<TicketRelateToOneInput>;
  user?: Maybe<UserRelateToOneInput>;
  content?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type TicketCommentHistoryRecord = {
  __typename?: 'TicketCommentHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketCommentHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketCommentHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the TicketCommentHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketCommentHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  content?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketCommentHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketCommentHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  content?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketCommentHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum TicketCommentHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type TicketCommentHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  content?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketCommentHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketCommentHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<TicketCommentHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketCommentHistoryRecordWhereInput>>>;
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
  ticket?: Maybe<Scalars['String']>;
  ticket_not?: Maybe<Scalars['String']>;
  ticket_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  ticket_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user?: Maybe<Scalars['String']>;
  user_not?: Maybe<Scalars['String']>;
  user_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  user_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  content?: Maybe<Scalars['String']>;
  content_not?: Maybe<Scalars['String']>;
  content_contains?: Maybe<Scalars['String']>;
  content_not_contains?: Maybe<Scalars['String']>;
  content_starts_with?: Maybe<Scalars['String']>;
  content_not_starts_with?: Maybe<Scalars['String']>;
  content_ends_with?: Maybe<Scalars['String']>;
  content_not_ends_with?: Maybe<Scalars['String']>;
  content_i?: Maybe<Scalars['String']>;
  content_not_i?: Maybe<Scalars['String']>;
  content_contains_i?: Maybe<Scalars['String']>;
  content_not_contains_i?: Maybe<Scalars['String']>;
  content_starts_with_i?: Maybe<Scalars['String']>;
  content_not_starts_with_i?: Maybe<Scalars['String']>;
  content_ends_with_i?: Maybe<Scalars['String']>;
  content_not_ends_with_i?: Maybe<Scalars['String']>;
  content_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  content_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<TicketCommentHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<TicketCommentHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<TicketCommentHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<TicketCommentHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type TicketCommentHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketCommentHistoryRecordsCreateInput = {
  data?: Maybe<TicketCommentHistoryRecordCreateInput>;
};

export type TicketCommentHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketCommentHistoryRecordUpdateInput>;
};

export type TicketCommentUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<TicketRelateToOneInput>;
  user?: Maybe<UserRelateToOneInput>;
  content?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketCommentWhereInput = {
  AND?: Maybe<Array<Maybe<TicketCommentWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketCommentWhereInput>>>;
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
  ticket?: Maybe<TicketWhereInput>;
  ticket_is_null?: Maybe<Scalars['Boolean']>;
  user?: Maybe<UserWhereInput>;
  user_is_null?: Maybe<Scalars['Boolean']>;
  content?: Maybe<Scalars['String']>;
  content_not?: Maybe<Scalars['String']>;
  content_contains?: Maybe<Scalars['String']>;
  content_not_contains?: Maybe<Scalars['String']>;
  content_starts_with?: Maybe<Scalars['String']>;
  content_not_starts_with?: Maybe<Scalars['String']>;
  content_ends_with?: Maybe<Scalars['String']>;
  content_not_ends_with?: Maybe<Scalars['String']>;
  content_i?: Maybe<Scalars['String']>;
  content_not_i?: Maybe<Scalars['String']>;
  content_contains_i?: Maybe<Scalars['String']>;
  content_not_contains_i?: Maybe<Scalars['String']>;
  content_starts_with_i?: Maybe<Scalars['String']>;
  content_not_starts_with_i?: Maybe<Scalars['String']>;
  content_ends_with_i?: Maybe<Scalars['String']>;
  content_not_ends_with_i?: Maybe<Scalars['String']>;
  content_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  content_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
};

export type TicketCommentWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketCommentsCreateInput = {
  data?: Maybe<TicketCommentCreateInput>;
};

export type TicketCommentsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketCommentUpdateInput>;
};

export type TicketCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  statusReopenedCounter?: Maybe<Scalars['Int']>;
  statusUpdatedAt?: Maybe<Scalars['String']>;
  statusReason?: Maybe<Scalars['String']>;
  status?: Maybe<TicketStatusRelateToOneInput>;
  number?: Maybe<Scalars['Int']>;
  client?: Maybe<UserRelateToOneInput>;
  contact?: Maybe<ContactRelateToOneInput>;
  clientName?: Maybe<Scalars['String']>;
  clientEmail?: Maybe<Scalars['String']>;
  clientPhone?: Maybe<Scalars['String']>;
  operator?: Maybe<UserRelateToOneInput>;
  assignee?: Maybe<UserRelateToOneInput>;
  executor?: Maybe<UserRelateToOneInput>;
  watchers?: Maybe<UserRelateToManyInput>;
  classifier?: Maybe<TicketClassifierRelateToOneInput>;
  details?: Maybe<Scalars['String']>;
  related?: Maybe<TicketRelateToOneInput>;
  isPaid?: Maybe<Scalars['Boolean']>;
  isEmergency?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  property?: Maybe<PropertyRelateToOneInput>;
  sectionName?: Maybe<Scalars['String']>;
  floorName?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  source?: Maybe<TicketSourceRelateToOneInput>;
  sourceMeta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  File attached to the ticket  */
export type TicketFile = {
  __typename?: 'TicketFile';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketFile List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketFile List config, or
   *  3. As an alias to a 'name' field on the TicketFile List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketFile List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  /**  File object with meta information and publicUrl  */
  file?: Maybe<File>;
  /**  Link to ticket  */
  ticket?: Maybe<Ticket>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketFileCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  file?: Maybe<Scalars['Upload']>;
  ticket?: Maybe<TicketRelateToOneInput>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type TicketFileHistoryRecord = {
  __typename?: 'TicketFileHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketFileHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketFileHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the TicketFileHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketFileHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  file?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketFileHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketFileHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  file?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketFileHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum TicketFileHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type TicketFileHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  file?: Maybe<Scalars['JSON']>;
  ticket?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketFileHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketFileHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<TicketFileHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketFileHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  file?: Maybe<Scalars['JSON']>;
  file_not?: Maybe<Scalars['JSON']>;
  file_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  file_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  ticket?: Maybe<Scalars['String']>;
  ticket_not?: Maybe<Scalars['String']>;
  ticket_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  ticket_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<TicketFileHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<TicketFileHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<TicketFileHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<TicketFileHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type TicketFileHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketFileHistoryRecordsCreateInput = {
  data?: Maybe<TicketFileHistoryRecordCreateInput>;
};

export type TicketFileHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketFileHistoryRecordUpdateInput>;
};

export type TicketFileUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  file?: Maybe<Scalars['Upload']>;
  ticket?: Maybe<TicketRelateToOneInput>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketFileWhereInput = {
  AND?: Maybe<Array<Maybe<TicketFileWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketFileWhereInput>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  file?: Maybe<Scalars['String']>;
  file_not?: Maybe<Scalars['String']>;
  file_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  file_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  ticket?: Maybe<TicketWhereInput>;
  ticket_is_null?: Maybe<Scalars['Boolean']>;
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
};

export type TicketFileWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketFilesCreateInput = {
  data?: Maybe<TicketFileCreateInput>;
};

export type TicketFilesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketFileUpdateInput>;
};

/**  A keystone list  */
export type TicketHistoryRecord = {
  __typename?: 'TicketHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the TicketHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  statusReopenedCounter?: Maybe<Scalars['Int']>;
  statusUpdatedAt?: Maybe<Scalars['String']>;
  statusReason?: Maybe<Scalars['String']>;
  status?: Maybe<Scalars['String']>;
  number?: Maybe<Scalars['JSON']>;
  client?: Maybe<Scalars['String']>;
  contact?: Maybe<Scalars['String']>;
  clientName?: Maybe<Scalars['String']>;
  clientEmail?: Maybe<Scalars['String']>;
  clientPhone?: Maybe<Scalars['String']>;
  operator?: Maybe<Scalars['String']>;
  assignee?: Maybe<Scalars['String']>;
  executor?: Maybe<Scalars['String']>;
  classifier?: Maybe<Scalars['String']>;
  details?: Maybe<Scalars['String']>;
  related?: Maybe<Scalars['String']>;
  isPaid?: Maybe<Scalars['Boolean']>;
  isEmergency?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  sectionName?: Maybe<Scalars['String']>;
  floorName?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  source?: Maybe<Scalars['String']>;
  sourceMeta?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  statusReopenedCounter?: Maybe<Scalars['Int']>;
  statusUpdatedAt?: Maybe<Scalars['String']>;
  statusReason?: Maybe<Scalars['String']>;
  status?: Maybe<Scalars['String']>;
  number?: Maybe<Scalars['JSON']>;
  client?: Maybe<Scalars['String']>;
  contact?: Maybe<Scalars['String']>;
  clientName?: Maybe<Scalars['String']>;
  clientEmail?: Maybe<Scalars['String']>;
  clientPhone?: Maybe<Scalars['String']>;
  operator?: Maybe<Scalars['String']>;
  assignee?: Maybe<Scalars['String']>;
  executor?: Maybe<Scalars['String']>;
  classifier?: Maybe<Scalars['String']>;
  details?: Maybe<Scalars['String']>;
  related?: Maybe<Scalars['String']>;
  isPaid?: Maybe<Scalars['Boolean']>;
  isEmergency?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  sectionName?: Maybe<Scalars['String']>;
  floorName?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  source?: Maybe<Scalars['String']>;
  sourceMeta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum TicketHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type TicketHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  statusReopenedCounter?: Maybe<Scalars['Int']>;
  statusUpdatedAt?: Maybe<Scalars['String']>;
  statusReason?: Maybe<Scalars['String']>;
  status?: Maybe<Scalars['String']>;
  number?: Maybe<Scalars['JSON']>;
  client?: Maybe<Scalars['String']>;
  contact?: Maybe<Scalars['String']>;
  clientName?: Maybe<Scalars['String']>;
  clientEmail?: Maybe<Scalars['String']>;
  clientPhone?: Maybe<Scalars['String']>;
  operator?: Maybe<Scalars['String']>;
  assignee?: Maybe<Scalars['String']>;
  executor?: Maybe<Scalars['String']>;
  classifier?: Maybe<Scalars['String']>;
  details?: Maybe<Scalars['String']>;
  related?: Maybe<Scalars['String']>;
  isPaid?: Maybe<Scalars['Boolean']>;
  isEmergency?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  property?: Maybe<Scalars['String']>;
  sectionName?: Maybe<Scalars['String']>;
  floorName?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  source?: Maybe<Scalars['String']>;
  sourceMeta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<TicketHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusReopenedCounter?: Maybe<Scalars['Int']>;
  statusReopenedCounter_not?: Maybe<Scalars['Int']>;
  statusReopenedCounter_lt?: Maybe<Scalars['Int']>;
  statusReopenedCounter_lte?: Maybe<Scalars['Int']>;
  statusReopenedCounter_gt?: Maybe<Scalars['Int']>;
  statusReopenedCounter_gte?: Maybe<Scalars['Int']>;
  statusReopenedCounter_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  statusReopenedCounter_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  statusUpdatedAt?: Maybe<Scalars['String']>;
  statusUpdatedAt_not?: Maybe<Scalars['String']>;
  statusUpdatedAt_lt?: Maybe<Scalars['String']>;
  statusUpdatedAt_lte?: Maybe<Scalars['String']>;
  statusUpdatedAt_gt?: Maybe<Scalars['String']>;
  statusUpdatedAt_gte?: Maybe<Scalars['String']>;
  statusUpdatedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusUpdatedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusReason?: Maybe<Scalars['String']>;
  statusReason_not?: Maybe<Scalars['String']>;
  statusReason_contains?: Maybe<Scalars['String']>;
  statusReason_not_contains?: Maybe<Scalars['String']>;
  statusReason_starts_with?: Maybe<Scalars['String']>;
  statusReason_not_starts_with?: Maybe<Scalars['String']>;
  statusReason_ends_with?: Maybe<Scalars['String']>;
  statusReason_not_ends_with?: Maybe<Scalars['String']>;
  statusReason_i?: Maybe<Scalars['String']>;
  statusReason_not_i?: Maybe<Scalars['String']>;
  statusReason_contains_i?: Maybe<Scalars['String']>;
  statusReason_not_contains_i?: Maybe<Scalars['String']>;
  statusReason_starts_with_i?: Maybe<Scalars['String']>;
  statusReason_not_starts_with_i?: Maybe<Scalars['String']>;
  statusReason_ends_with_i?: Maybe<Scalars['String']>;
  statusReason_not_ends_with_i?: Maybe<Scalars['String']>;
  statusReason_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusReason_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  status?: Maybe<Scalars['String']>;
  status_not?: Maybe<Scalars['String']>;
  status_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  status_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  number?: Maybe<Scalars['JSON']>;
  number_not?: Maybe<Scalars['JSON']>;
  number_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  number_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  client?: Maybe<Scalars['String']>;
  client_not?: Maybe<Scalars['String']>;
  client_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  client_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  contact?: Maybe<Scalars['String']>;
  contact_not?: Maybe<Scalars['String']>;
  contact_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  contact_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientName?: Maybe<Scalars['String']>;
  clientName_not?: Maybe<Scalars['String']>;
  clientName_contains?: Maybe<Scalars['String']>;
  clientName_not_contains?: Maybe<Scalars['String']>;
  clientName_starts_with?: Maybe<Scalars['String']>;
  clientName_not_starts_with?: Maybe<Scalars['String']>;
  clientName_ends_with?: Maybe<Scalars['String']>;
  clientName_not_ends_with?: Maybe<Scalars['String']>;
  clientName_i?: Maybe<Scalars['String']>;
  clientName_not_i?: Maybe<Scalars['String']>;
  clientName_contains_i?: Maybe<Scalars['String']>;
  clientName_not_contains_i?: Maybe<Scalars['String']>;
  clientName_starts_with_i?: Maybe<Scalars['String']>;
  clientName_not_starts_with_i?: Maybe<Scalars['String']>;
  clientName_ends_with_i?: Maybe<Scalars['String']>;
  clientName_not_ends_with_i?: Maybe<Scalars['String']>;
  clientName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientEmail?: Maybe<Scalars['String']>;
  clientEmail_not?: Maybe<Scalars['String']>;
  clientEmail_contains?: Maybe<Scalars['String']>;
  clientEmail_not_contains?: Maybe<Scalars['String']>;
  clientEmail_starts_with?: Maybe<Scalars['String']>;
  clientEmail_not_starts_with?: Maybe<Scalars['String']>;
  clientEmail_ends_with?: Maybe<Scalars['String']>;
  clientEmail_not_ends_with?: Maybe<Scalars['String']>;
  clientEmail_i?: Maybe<Scalars['String']>;
  clientEmail_not_i?: Maybe<Scalars['String']>;
  clientEmail_contains_i?: Maybe<Scalars['String']>;
  clientEmail_not_contains_i?: Maybe<Scalars['String']>;
  clientEmail_starts_with_i?: Maybe<Scalars['String']>;
  clientEmail_not_starts_with_i?: Maybe<Scalars['String']>;
  clientEmail_ends_with_i?: Maybe<Scalars['String']>;
  clientEmail_not_ends_with_i?: Maybe<Scalars['String']>;
  clientEmail_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientEmail_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientPhone?: Maybe<Scalars['String']>;
  clientPhone_not?: Maybe<Scalars['String']>;
  clientPhone_contains?: Maybe<Scalars['String']>;
  clientPhone_not_contains?: Maybe<Scalars['String']>;
  clientPhone_starts_with?: Maybe<Scalars['String']>;
  clientPhone_not_starts_with?: Maybe<Scalars['String']>;
  clientPhone_ends_with?: Maybe<Scalars['String']>;
  clientPhone_not_ends_with?: Maybe<Scalars['String']>;
  clientPhone_i?: Maybe<Scalars['String']>;
  clientPhone_not_i?: Maybe<Scalars['String']>;
  clientPhone_contains_i?: Maybe<Scalars['String']>;
  clientPhone_not_contains_i?: Maybe<Scalars['String']>;
  clientPhone_starts_with_i?: Maybe<Scalars['String']>;
  clientPhone_not_starts_with_i?: Maybe<Scalars['String']>;
  clientPhone_ends_with_i?: Maybe<Scalars['String']>;
  clientPhone_not_ends_with_i?: Maybe<Scalars['String']>;
  clientPhone_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientPhone_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  operator?: Maybe<Scalars['String']>;
  operator_not?: Maybe<Scalars['String']>;
  operator_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  operator_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  assignee?: Maybe<Scalars['String']>;
  assignee_not?: Maybe<Scalars['String']>;
  assignee_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  assignee_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  executor?: Maybe<Scalars['String']>;
  executor_not?: Maybe<Scalars['String']>;
  executor_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  executor_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  classifier?: Maybe<Scalars['String']>;
  classifier_not?: Maybe<Scalars['String']>;
  classifier_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  classifier_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  details?: Maybe<Scalars['String']>;
  details_not?: Maybe<Scalars['String']>;
  details_contains?: Maybe<Scalars['String']>;
  details_not_contains?: Maybe<Scalars['String']>;
  details_starts_with?: Maybe<Scalars['String']>;
  details_not_starts_with?: Maybe<Scalars['String']>;
  details_ends_with?: Maybe<Scalars['String']>;
  details_not_ends_with?: Maybe<Scalars['String']>;
  details_i?: Maybe<Scalars['String']>;
  details_not_i?: Maybe<Scalars['String']>;
  details_contains_i?: Maybe<Scalars['String']>;
  details_not_contains_i?: Maybe<Scalars['String']>;
  details_starts_with_i?: Maybe<Scalars['String']>;
  details_not_starts_with_i?: Maybe<Scalars['String']>;
  details_ends_with_i?: Maybe<Scalars['String']>;
  details_not_ends_with_i?: Maybe<Scalars['String']>;
  details_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  details_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  related?: Maybe<Scalars['String']>;
  related_not?: Maybe<Scalars['String']>;
  related_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  related_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isPaid?: Maybe<Scalars['Boolean']>;
  isPaid_not?: Maybe<Scalars['Boolean']>;
  isEmergency?: Maybe<Scalars['Boolean']>;
  isEmergency_not?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  property?: Maybe<Scalars['String']>;
  property_not?: Maybe<Scalars['String']>;
  property_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  property_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sectionName?: Maybe<Scalars['String']>;
  sectionName_not?: Maybe<Scalars['String']>;
  sectionName_contains?: Maybe<Scalars['String']>;
  sectionName_not_contains?: Maybe<Scalars['String']>;
  sectionName_starts_with?: Maybe<Scalars['String']>;
  sectionName_not_starts_with?: Maybe<Scalars['String']>;
  sectionName_ends_with?: Maybe<Scalars['String']>;
  sectionName_not_ends_with?: Maybe<Scalars['String']>;
  sectionName_i?: Maybe<Scalars['String']>;
  sectionName_not_i?: Maybe<Scalars['String']>;
  sectionName_contains_i?: Maybe<Scalars['String']>;
  sectionName_not_contains_i?: Maybe<Scalars['String']>;
  sectionName_starts_with_i?: Maybe<Scalars['String']>;
  sectionName_not_starts_with_i?: Maybe<Scalars['String']>;
  sectionName_ends_with_i?: Maybe<Scalars['String']>;
  sectionName_not_ends_with_i?: Maybe<Scalars['String']>;
  sectionName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sectionName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  floorName?: Maybe<Scalars['String']>;
  floorName_not?: Maybe<Scalars['String']>;
  floorName_contains?: Maybe<Scalars['String']>;
  floorName_not_contains?: Maybe<Scalars['String']>;
  floorName_starts_with?: Maybe<Scalars['String']>;
  floorName_not_starts_with?: Maybe<Scalars['String']>;
  floorName_ends_with?: Maybe<Scalars['String']>;
  floorName_not_ends_with?: Maybe<Scalars['String']>;
  floorName_i?: Maybe<Scalars['String']>;
  floorName_not_i?: Maybe<Scalars['String']>;
  floorName_contains_i?: Maybe<Scalars['String']>;
  floorName_not_contains_i?: Maybe<Scalars['String']>;
  floorName_starts_with_i?: Maybe<Scalars['String']>;
  floorName_not_starts_with_i?: Maybe<Scalars['String']>;
  floorName_ends_with_i?: Maybe<Scalars['String']>;
  floorName_not_ends_with_i?: Maybe<Scalars['String']>;
  floorName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  floorName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName?: Maybe<Scalars['String']>;
  unitName_not?: Maybe<Scalars['String']>;
  unitName_contains?: Maybe<Scalars['String']>;
  unitName_not_contains?: Maybe<Scalars['String']>;
  unitName_starts_with?: Maybe<Scalars['String']>;
  unitName_not_starts_with?: Maybe<Scalars['String']>;
  unitName_ends_with?: Maybe<Scalars['String']>;
  unitName_not_ends_with?: Maybe<Scalars['String']>;
  unitName_i?: Maybe<Scalars['String']>;
  unitName_not_i?: Maybe<Scalars['String']>;
  unitName_contains_i?: Maybe<Scalars['String']>;
  unitName_not_contains_i?: Maybe<Scalars['String']>;
  unitName_starts_with_i?: Maybe<Scalars['String']>;
  unitName_not_starts_with_i?: Maybe<Scalars['String']>;
  unitName_ends_with_i?: Maybe<Scalars['String']>;
  unitName_not_ends_with_i?: Maybe<Scalars['String']>;
  unitName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  source?: Maybe<Scalars['String']>;
  source_not?: Maybe<Scalars['String']>;
  source_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  source_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sourceMeta?: Maybe<Scalars['JSON']>;
  sourceMeta_not?: Maybe<Scalars['JSON']>;
  sourceMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  sourceMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<TicketHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<TicketHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<TicketHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<TicketHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type TicketHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketHistoryRecordsCreateInput = {
  data?: Maybe<TicketHistoryRecordCreateInput>;
};

export type TicketHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketHistoryRecordUpdateInput>;
};

export type TicketRelateToOneInput = {
  create?: Maybe<TicketCreateInput>;
  connect?: Maybe<TicketWhereUniqueInput>;
  disconnect?: Maybe<TicketWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type TicketReportData = {
  __typename?: 'TicketReportData';
  statusName: Scalars['String'];
  currentValue: Scalars['Int'];
  growth: Scalars['Float'];
  statusType: TicketStatusTypeType;
};

export enum TicketReportPeriodType {
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter'
}

export type TicketReportWidgetInput = {
  periodType: TicketReportPeriodType;
  offset?: Maybe<Scalars['Int']>;
  userOrganizationId: Scalars['String'];
};

export type TicketReportWidgetOutput = {
  __typename?: 'TicketReportWidgetOutput';
  data?: Maybe<Array<TicketReportData>>;
};

/**  Ticket source. Income call, mobile app, external system, ...  */
export type TicketSource = {
  __typename?: 'TicketSource';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketSource List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketSource List config, or
   *  3. As an alias to a 'name' field on the TicketSource List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketSource List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: '1', fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the organization. If this ref is null the object is common for all organizations  */
  organization?: Maybe<Organization>;
  type?: Maybe<TicketSourceTypeType>;
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketSourceCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  type?: Maybe<TicketSourceTypeType>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type TicketSourceHistoryRecord = {
  __typename?: 'TicketSourceHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketSourceHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketSourceHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the TicketSourceHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketSourceHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketSourceHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketSourceHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketSourceHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum TicketSourceHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type TicketSourceHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketSourceHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketSourceHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<TicketSourceHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketSourceHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type?: Maybe<Scalars['String']>;
  type_not?: Maybe<Scalars['String']>;
  type_contains?: Maybe<Scalars['String']>;
  type_not_contains?: Maybe<Scalars['String']>;
  type_starts_with?: Maybe<Scalars['String']>;
  type_not_starts_with?: Maybe<Scalars['String']>;
  type_ends_with?: Maybe<Scalars['String']>;
  type_not_ends_with?: Maybe<Scalars['String']>;
  type_i?: Maybe<Scalars['String']>;
  type_not_i?: Maybe<Scalars['String']>;
  type_contains_i?: Maybe<Scalars['String']>;
  type_not_contains_i?: Maybe<Scalars['String']>;
  type_starts_with_i?: Maybe<Scalars['String']>;
  type_not_starts_with_i?: Maybe<Scalars['String']>;
  type_ends_with_i?: Maybe<Scalars['String']>;
  type_not_ends_with_i?: Maybe<Scalars['String']>;
  type_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<TicketSourceHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<TicketSourceHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<TicketSourceHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<TicketSourceHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type TicketSourceHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketSourceHistoryRecordsCreateInput = {
  data?: Maybe<TicketSourceHistoryRecordCreateInput>;
};

export type TicketSourceHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketSourceHistoryRecordUpdateInput>;
};

export type TicketSourceRelateToOneInput = {
  create?: Maybe<TicketSourceCreateInput>;
  connect?: Maybe<TicketSourceWhereUniqueInput>;
  disconnect?: Maybe<TicketSourceWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export enum TicketSourceTypeType {
  MobileApp = 'mobile_app',
  WebApp = 'web_app',
  OrganizationSite = 'organization_site',
  Call = 'call',
  Visit = 'visit',
  Email = 'email',
  SocialNetwork = 'social_network',
  Messenger = 'messenger',
  RemoteSystem = 'remote_system',
  Other = 'other'
}

export type TicketSourceUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  type?: Maybe<TicketSourceTypeType>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketSourceWhereInput = {
  AND?: Maybe<Array<Maybe<TicketSourceWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketSourceWhereInput>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  type?: Maybe<TicketSourceTypeType>;
  type_not?: Maybe<TicketSourceTypeType>;
  type_in?: Maybe<Array<Maybe<TicketSourceTypeType>>>;
  type_not_in?: Maybe<Array<Maybe<TicketSourceTypeType>>>;
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
};

export type TicketSourceWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketSourcesCreateInput = {
  data?: Maybe<TicketSourceCreateInput>;
};

export type TicketSourcesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketSourceUpdateInput>;
};

/**  Ticket status. We have a organization specific statuses  */
export type TicketStatus = {
  __typename?: 'TicketStatus';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketStatus List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketStatus List config, or
   *  3. As an alias to a 'name' field on the TicketStatus List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketStatus List.
   */
  _label_?: Maybe<Scalars['String']>;
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Ref to the organization. If this ref is null the object is common for all organizations  */
  organization?: Maybe<Organization>;
  /**  Ticket status. You should also increase `statusReopenedCounter` if you want to reopen ticket  */
  type?: Maybe<TicketStatusTypeType>;
  /**  Status name  */
  name?: Maybe<Scalars['String']>;
  /**  Status colors, includes primary (font color), secondary (background color), additional (border color), all colors presented in HEX  */
  colors?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketStatusColor = {
  __typename?: 'TicketStatusColor';
  primary?: Maybe<Scalars['String']>;
  secondary?: Maybe<Scalars['String']>;
  additional?: Maybe<Scalars['String']>;
};

export type TicketStatusCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  type?: Maybe<TicketStatusTypeType>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

/**  A keystone list  */
export type TicketStatusHistoryRecord = {
  __typename?: 'TicketStatusHistoryRecord';
  /**
   * This virtual field will be resolved in one of the following ways (in this order):
   *  1. Execution of 'labelResolver' set on the TicketStatusHistoryRecord List config, or
   *  2. As an alias to the field set on 'labelField' in the TicketStatusHistoryRecord List config, or
   *  3. As an alias to a 'name' field on the TicketStatusHistoryRecord List (if one exists), or
   *  4. As an alias to the 'id' field on the TicketStatusHistoryRecord List.
   */
  _label_?: Maybe<Scalars['String']>;
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  colors?: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketStatusHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketStatusHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  colors?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketStatusHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export enum TicketStatusHistoryRecordHistoryActionType {
  C = 'c',
  U = 'u',
  D = 'd'
}

export type TicketStatusHistoryRecordUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  colors?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<TicketStatusHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type TicketStatusHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<TicketStatusHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketStatusHistoryRecordWhereInput>>>;
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
  organization?: Maybe<Scalars['String']>;
  organization_not?: Maybe<Scalars['String']>;
  organization_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type?: Maybe<Scalars['String']>;
  type_not?: Maybe<Scalars['String']>;
  type_contains?: Maybe<Scalars['String']>;
  type_not_contains?: Maybe<Scalars['String']>;
  type_starts_with?: Maybe<Scalars['String']>;
  type_not_starts_with?: Maybe<Scalars['String']>;
  type_ends_with?: Maybe<Scalars['String']>;
  type_not_ends_with?: Maybe<Scalars['String']>;
  type_i?: Maybe<Scalars['String']>;
  type_not_i?: Maybe<Scalars['String']>;
  type_contains_i?: Maybe<Scalars['String']>;
  type_not_contains_i?: Maybe<Scalars['String']>;
  type_starts_with_i?: Maybe<Scalars['String']>;
  type_not_starts_with_i?: Maybe<Scalars['String']>;
  type_ends_with_i?: Maybe<Scalars['String']>;
  type_not_ends_with_i?: Maybe<Scalars['String']>;
  type_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  colors?: Maybe<Scalars['JSON']>;
  colors_not?: Maybe<Scalars['JSON']>;
  colors_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  colors_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  history_date?: Maybe<Scalars['String']>;
  history_date_not?: Maybe<Scalars['String']>;
  history_date_lt?: Maybe<Scalars['String']>;
  history_date_lte?: Maybe<Scalars['String']>;
  history_date_gt?: Maybe<Scalars['String']>;
  history_date_gte?: Maybe<Scalars['String']>;
  history_date_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_date_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_action?: Maybe<TicketStatusHistoryRecordHistoryActionType>;
  history_action_not?: Maybe<TicketStatusHistoryRecordHistoryActionType>;
  history_action_in?: Maybe<Array<Maybe<TicketStatusHistoryRecordHistoryActionType>>>;
  history_action_not_in?: Maybe<Array<Maybe<TicketStatusHistoryRecordHistoryActionType>>>;
  history_id?: Maybe<Scalars['String']>;
  history_id_not?: Maybe<Scalars['String']>;
  history_id_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  history_id_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type TicketStatusHistoryRecordWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketStatusHistoryRecordsCreateInput = {
  data?: Maybe<TicketStatusHistoryRecordCreateInput>;
};

export type TicketStatusHistoryRecordsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketStatusHistoryRecordUpdateInput>;
};

export type TicketStatusRelateToOneInput = {
  create?: Maybe<TicketStatusCreateInput>;
  connect?: Maybe<TicketStatusWhereUniqueInput>;
  disconnect?: Maybe<TicketStatusWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export enum TicketStatusTypeType {
  NewOrReopened = 'new_or_reopened',
  Processing = 'processing',
  Canceled = 'canceled',
  Completed = 'completed',
  Deferred = 'deferred',
  Closed = 'closed'
}

export type TicketStatusUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  type?: Maybe<TicketStatusTypeType>;
  name?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketStatusWhereInput = {
  AND?: Maybe<Array<Maybe<TicketStatusWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketStatusWhereInput>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  type?: Maybe<TicketStatusTypeType>;
  type_not?: Maybe<TicketStatusTypeType>;
  type_in?: Maybe<Array<Maybe<TicketStatusTypeType>>>;
  type_not_in?: Maybe<Array<Maybe<TicketStatusTypeType>>>;
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
};

export type TicketStatusWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketStatusesCreateInput = {
  data?: Maybe<TicketStatusCreateInput>;
};

export type TicketStatusesUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketStatusUpdateInput>;
};

export type TicketUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  organization?: Maybe<OrganizationRelateToOneInput>;
  statusReopenedCounter?: Maybe<Scalars['Int']>;
  statusUpdatedAt?: Maybe<Scalars['String']>;
  statusReason?: Maybe<Scalars['String']>;
  status?: Maybe<TicketStatusRelateToOneInput>;
  number?: Maybe<Scalars['Int']>;
  client?: Maybe<UserRelateToOneInput>;
  contact?: Maybe<ContactRelateToOneInput>;
  clientName?: Maybe<Scalars['String']>;
  clientEmail?: Maybe<Scalars['String']>;
  clientPhone?: Maybe<Scalars['String']>;
  operator?: Maybe<UserRelateToOneInput>;
  assignee?: Maybe<UserRelateToOneInput>;
  executor?: Maybe<UserRelateToOneInput>;
  watchers?: Maybe<UserRelateToManyInput>;
  classifier?: Maybe<TicketClassifierRelateToOneInput>;
  details?: Maybe<Scalars['String']>;
  related?: Maybe<TicketRelateToOneInput>;
  isPaid?: Maybe<Scalars['Boolean']>;
  isEmergency?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  property?: Maybe<PropertyRelateToOneInput>;
  sectionName?: Maybe<Scalars['String']>;
  floorName?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  source?: Maybe<TicketSourceRelateToOneInput>;
  sourceMeta?: Maybe<Scalars['JSON']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type TicketWhereInput = {
  AND?: Maybe<Array<Maybe<TicketWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketWhereInput>>>;
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
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  statusReopenedCounter?: Maybe<Scalars['Int']>;
  statusReopenedCounter_not?: Maybe<Scalars['Int']>;
  statusReopenedCounter_lt?: Maybe<Scalars['Int']>;
  statusReopenedCounter_lte?: Maybe<Scalars['Int']>;
  statusReopenedCounter_gt?: Maybe<Scalars['Int']>;
  statusReopenedCounter_gte?: Maybe<Scalars['Int']>;
  statusReopenedCounter_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  statusReopenedCounter_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  statusUpdatedAt?: Maybe<Scalars['String']>;
  statusUpdatedAt_not?: Maybe<Scalars['String']>;
  statusUpdatedAt_lt?: Maybe<Scalars['String']>;
  statusUpdatedAt_lte?: Maybe<Scalars['String']>;
  statusUpdatedAt_gt?: Maybe<Scalars['String']>;
  statusUpdatedAt_gte?: Maybe<Scalars['String']>;
  statusUpdatedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusUpdatedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusReason?: Maybe<Scalars['String']>;
  statusReason_not?: Maybe<Scalars['String']>;
  statusReason_contains?: Maybe<Scalars['String']>;
  statusReason_not_contains?: Maybe<Scalars['String']>;
  statusReason_starts_with?: Maybe<Scalars['String']>;
  statusReason_not_starts_with?: Maybe<Scalars['String']>;
  statusReason_ends_with?: Maybe<Scalars['String']>;
  statusReason_not_ends_with?: Maybe<Scalars['String']>;
  statusReason_i?: Maybe<Scalars['String']>;
  statusReason_not_i?: Maybe<Scalars['String']>;
  statusReason_contains_i?: Maybe<Scalars['String']>;
  statusReason_not_contains_i?: Maybe<Scalars['String']>;
  statusReason_starts_with_i?: Maybe<Scalars['String']>;
  statusReason_not_starts_with_i?: Maybe<Scalars['String']>;
  statusReason_ends_with_i?: Maybe<Scalars['String']>;
  statusReason_not_ends_with_i?: Maybe<Scalars['String']>;
  statusReason_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusReason_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  status?: Maybe<TicketStatusWhereInput>;
  status_is_null?: Maybe<Scalars['Boolean']>;
  number?: Maybe<Scalars['Int']>;
  number_not?: Maybe<Scalars['Int']>;
  number_lt?: Maybe<Scalars['Int']>;
  number_lte?: Maybe<Scalars['Int']>;
  number_gt?: Maybe<Scalars['Int']>;
  number_gte?: Maybe<Scalars['Int']>;
  number_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  number_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  client?: Maybe<UserWhereInput>;
  client_is_null?: Maybe<Scalars['Boolean']>;
  contact?: Maybe<ContactWhereInput>;
  contact_is_null?: Maybe<Scalars['Boolean']>;
  clientName?: Maybe<Scalars['String']>;
  clientName_not?: Maybe<Scalars['String']>;
  clientName_contains?: Maybe<Scalars['String']>;
  clientName_not_contains?: Maybe<Scalars['String']>;
  clientName_starts_with?: Maybe<Scalars['String']>;
  clientName_not_starts_with?: Maybe<Scalars['String']>;
  clientName_ends_with?: Maybe<Scalars['String']>;
  clientName_not_ends_with?: Maybe<Scalars['String']>;
  clientName_i?: Maybe<Scalars['String']>;
  clientName_not_i?: Maybe<Scalars['String']>;
  clientName_contains_i?: Maybe<Scalars['String']>;
  clientName_not_contains_i?: Maybe<Scalars['String']>;
  clientName_starts_with_i?: Maybe<Scalars['String']>;
  clientName_not_starts_with_i?: Maybe<Scalars['String']>;
  clientName_ends_with_i?: Maybe<Scalars['String']>;
  clientName_not_ends_with_i?: Maybe<Scalars['String']>;
  clientName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientEmail?: Maybe<Scalars['String']>;
  clientEmail_not?: Maybe<Scalars['String']>;
  clientEmail_contains?: Maybe<Scalars['String']>;
  clientEmail_not_contains?: Maybe<Scalars['String']>;
  clientEmail_starts_with?: Maybe<Scalars['String']>;
  clientEmail_not_starts_with?: Maybe<Scalars['String']>;
  clientEmail_ends_with?: Maybe<Scalars['String']>;
  clientEmail_not_ends_with?: Maybe<Scalars['String']>;
  clientEmail_i?: Maybe<Scalars['String']>;
  clientEmail_not_i?: Maybe<Scalars['String']>;
  clientEmail_contains_i?: Maybe<Scalars['String']>;
  clientEmail_not_contains_i?: Maybe<Scalars['String']>;
  clientEmail_starts_with_i?: Maybe<Scalars['String']>;
  clientEmail_not_starts_with_i?: Maybe<Scalars['String']>;
  clientEmail_ends_with_i?: Maybe<Scalars['String']>;
  clientEmail_not_ends_with_i?: Maybe<Scalars['String']>;
  clientEmail_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientEmail_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientPhone?: Maybe<Scalars['String']>;
  clientPhone_not?: Maybe<Scalars['String']>;
  clientPhone_contains?: Maybe<Scalars['String']>;
  clientPhone_not_contains?: Maybe<Scalars['String']>;
  clientPhone_starts_with?: Maybe<Scalars['String']>;
  clientPhone_not_starts_with?: Maybe<Scalars['String']>;
  clientPhone_ends_with?: Maybe<Scalars['String']>;
  clientPhone_not_ends_with?: Maybe<Scalars['String']>;
  clientPhone_i?: Maybe<Scalars['String']>;
  clientPhone_not_i?: Maybe<Scalars['String']>;
  clientPhone_contains_i?: Maybe<Scalars['String']>;
  clientPhone_not_contains_i?: Maybe<Scalars['String']>;
  clientPhone_starts_with_i?: Maybe<Scalars['String']>;
  clientPhone_not_starts_with_i?: Maybe<Scalars['String']>;
  clientPhone_ends_with_i?: Maybe<Scalars['String']>;
  clientPhone_not_ends_with_i?: Maybe<Scalars['String']>;
  clientPhone_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  clientPhone_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  operator?: Maybe<UserWhereInput>;
  operator_is_null?: Maybe<Scalars['Boolean']>;
  assignee?: Maybe<UserWhereInput>;
  assignee_is_null?: Maybe<Scalars['Boolean']>;
  executor?: Maybe<UserWhereInput>;
  executor_is_null?: Maybe<Scalars['Boolean']>;
  /**  condition must be true for all nodes  */
  watchers_every?: Maybe<UserWhereInput>;
  /**  condition must be true for at least 1 node  */
  watchers_some?: Maybe<UserWhereInput>;
  /**  condition must be false for all nodes  */
  watchers_none?: Maybe<UserWhereInput>;
  classifier?: Maybe<TicketClassifierWhereInput>;
  classifier_is_null?: Maybe<Scalars['Boolean']>;
  details?: Maybe<Scalars['String']>;
  details_not?: Maybe<Scalars['String']>;
  details_contains?: Maybe<Scalars['String']>;
  details_not_contains?: Maybe<Scalars['String']>;
  details_starts_with?: Maybe<Scalars['String']>;
  details_not_starts_with?: Maybe<Scalars['String']>;
  details_ends_with?: Maybe<Scalars['String']>;
  details_not_ends_with?: Maybe<Scalars['String']>;
  details_i?: Maybe<Scalars['String']>;
  details_not_i?: Maybe<Scalars['String']>;
  details_contains_i?: Maybe<Scalars['String']>;
  details_not_contains_i?: Maybe<Scalars['String']>;
  details_starts_with_i?: Maybe<Scalars['String']>;
  details_not_starts_with_i?: Maybe<Scalars['String']>;
  details_ends_with_i?: Maybe<Scalars['String']>;
  details_not_ends_with_i?: Maybe<Scalars['String']>;
  details_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  details_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  related?: Maybe<TicketWhereInput>;
  related_is_null?: Maybe<Scalars['Boolean']>;
  isPaid?: Maybe<Scalars['Boolean']>;
  isPaid_not?: Maybe<Scalars['Boolean']>;
  isEmergency?: Maybe<Scalars['Boolean']>;
  isEmergency_not?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  property?: Maybe<PropertyWhereInput>;
  property_is_null?: Maybe<Scalars['Boolean']>;
  sectionName?: Maybe<Scalars['String']>;
  sectionName_not?: Maybe<Scalars['String']>;
  sectionName_contains?: Maybe<Scalars['String']>;
  sectionName_not_contains?: Maybe<Scalars['String']>;
  sectionName_starts_with?: Maybe<Scalars['String']>;
  sectionName_not_starts_with?: Maybe<Scalars['String']>;
  sectionName_ends_with?: Maybe<Scalars['String']>;
  sectionName_not_ends_with?: Maybe<Scalars['String']>;
  sectionName_i?: Maybe<Scalars['String']>;
  sectionName_not_i?: Maybe<Scalars['String']>;
  sectionName_contains_i?: Maybe<Scalars['String']>;
  sectionName_not_contains_i?: Maybe<Scalars['String']>;
  sectionName_starts_with_i?: Maybe<Scalars['String']>;
  sectionName_not_starts_with_i?: Maybe<Scalars['String']>;
  sectionName_ends_with_i?: Maybe<Scalars['String']>;
  sectionName_not_ends_with_i?: Maybe<Scalars['String']>;
  sectionName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sectionName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  floorName?: Maybe<Scalars['String']>;
  floorName_not?: Maybe<Scalars['String']>;
  floorName_contains?: Maybe<Scalars['String']>;
  floorName_not_contains?: Maybe<Scalars['String']>;
  floorName_starts_with?: Maybe<Scalars['String']>;
  floorName_not_starts_with?: Maybe<Scalars['String']>;
  floorName_ends_with?: Maybe<Scalars['String']>;
  floorName_not_ends_with?: Maybe<Scalars['String']>;
  floorName_i?: Maybe<Scalars['String']>;
  floorName_not_i?: Maybe<Scalars['String']>;
  floorName_contains_i?: Maybe<Scalars['String']>;
  floorName_not_contains_i?: Maybe<Scalars['String']>;
  floorName_starts_with_i?: Maybe<Scalars['String']>;
  floorName_not_starts_with_i?: Maybe<Scalars['String']>;
  floorName_ends_with_i?: Maybe<Scalars['String']>;
  floorName_not_ends_with_i?: Maybe<Scalars['String']>;
  floorName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  floorName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName?: Maybe<Scalars['String']>;
  unitName_not?: Maybe<Scalars['String']>;
  unitName_contains?: Maybe<Scalars['String']>;
  unitName_not_contains?: Maybe<Scalars['String']>;
  unitName_starts_with?: Maybe<Scalars['String']>;
  unitName_not_starts_with?: Maybe<Scalars['String']>;
  unitName_ends_with?: Maybe<Scalars['String']>;
  unitName_not_ends_with?: Maybe<Scalars['String']>;
  unitName_i?: Maybe<Scalars['String']>;
  unitName_not_i?: Maybe<Scalars['String']>;
  unitName_contains_i?: Maybe<Scalars['String']>;
  unitName_not_contains_i?: Maybe<Scalars['String']>;
  unitName_starts_with_i?: Maybe<Scalars['String']>;
  unitName_not_starts_with_i?: Maybe<Scalars['String']>;
  unitName_ends_with_i?: Maybe<Scalars['String']>;
  unitName_not_ends_with_i?: Maybe<Scalars['String']>;
  unitName_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitName_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  source?: Maybe<TicketSourceWhereInput>;
  source_is_null?: Maybe<Scalars['Boolean']>;
  sourceMeta?: Maybe<Scalars['JSON']>;
  sourceMeta_not?: Maybe<Scalars['JSON']>;
  sourceMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  sourceMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
};

export type TicketWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketsCreateInput = {
  data?: Maybe<TicketCreateInput>;
};

export type TicketsUpdateInput = {
  id: Scalars['ID'];
  data?: Maybe<TicketUpdateInput>;
};


/**  Individual / person / service account / impersonal company account  */
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
  /**  Data structure Version  */
  dv?: Maybe<Scalars['Int']>;
  /**  Client-side devise identification used for the anti-fraud detection. Example `{ dv: 1, fingerprint: 'VaxSw2aXZa'}`. Where the `fingerprint` should be the same for the same devices and it's not linked to the user ID. It's the device ID like browser / mobile application / remote system  */
  sender?: Maybe<Scalars['JSON']>;
  /**  Name. If impersonal account should be a company name  */
  name?: Maybe<Scalars['String']>;
  /**  Password. Update only  */
  password_is_set?: Maybe<Scalars['Boolean']>;
  /**  Field that allows you to distinguish CRM users from mobile app users  */
  type?: Maybe<UserTypeType>;
  /**  Can logged in?  */
  isActive?: Maybe<Scalars['Boolean']>;
  /**  Superuser access to service data  */
  isAdmin?: Maybe<Scalars['Boolean']>;
  /**  Can access to "/admin/" panel. And do support tasks  */
  isSupport?: Maybe<Scalars['Boolean']>;
  /**  Email. Transformed to lower case  */
  email?: Maybe<Scalars['String']>;
  /**  Email verification flag. User verify email by access to secret link  */
  isEmailVerified?: Maybe<Scalars['Boolean']>;
  /**  Phone. In international E.164 format without spaces  */
  phone?: Maybe<Scalars['String']>;
  /**  Phone verification flag. User verify phone by access to secret sms message  */
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  /**  User loaded avarat image  */
  avatar?: Maybe<File>;
  /**  User metadata. Example: `city`, `country`, ...  */
  meta?: Maybe<Scalars['JSON']>;
  /**  External system user id. Used for integrations  */
  importId?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<User>;
  updatedBy?: Maybe<User>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type UserCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  type?: Maybe<UserTypeType>;
  isActive?: Maybe<Scalars['Boolean']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  isEmailVerified?: Maybe<Scalars['Boolean']>;
  phone?: Maybe<Scalars['String']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  avatar?: Maybe<Scalars['Upload']>;
  meta?: Maybe<Scalars['JSON']>;
  importId?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
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
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  isActive?: Maybe<Scalars['Boolean']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  isEmailVerified?: Maybe<Scalars['Boolean']>;
  phone?: Maybe<Scalars['String']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  avatar?: Maybe<Scalars['JSON']>;
  meta?: Maybe<Scalars['JSON']>;
  importId?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<UserHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type UserHistoryRecordCreateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  isActive?: Maybe<Scalars['Boolean']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  isEmailVerified?: Maybe<Scalars['Boolean']>;
  phone?: Maybe<Scalars['String']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  avatar?: Maybe<Scalars['JSON']>;
  meta?: Maybe<Scalars['JSON']>;
  importId?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
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
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  isActive?: Maybe<Scalars['Boolean']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  isEmailVerified?: Maybe<Scalars['Boolean']>;
  phone?: Maybe<Scalars['String']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  avatar?: Maybe<Scalars['JSON']>;
  meta?: Maybe<Scalars['JSON']>;
  importId?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<Scalars['String']>;
  updatedBy?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['JSON']>;
  history_date?: Maybe<Scalars['String']>;
  history_action?: Maybe<UserHistoryRecordHistoryActionType>;
  history_id?: Maybe<Scalars['String']>;
};

export type UserHistoryRecordWhereInput = {
  AND?: Maybe<Array<Maybe<UserHistoryRecordWhereInput>>>;
  OR?: Maybe<Array<Maybe<UserHistoryRecordWhereInput>>>;
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
  type?: Maybe<Scalars['String']>;
  type_not?: Maybe<Scalars['String']>;
  type_contains?: Maybe<Scalars['String']>;
  type_not_contains?: Maybe<Scalars['String']>;
  type_starts_with?: Maybe<Scalars['String']>;
  type_not_starts_with?: Maybe<Scalars['String']>;
  type_ends_with?: Maybe<Scalars['String']>;
  type_not_ends_with?: Maybe<Scalars['String']>;
  type_i?: Maybe<Scalars['String']>;
  type_not_i?: Maybe<Scalars['String']>;
  type_contains_i?: Maybe<Scalars['String']>;
  type_not_contains_i?: Maybe<Scalars['String']>;
  type_starts_with_i?: Maybe<Scalars['String']>;
  type_not_starts_with_i?: Maybe<Scalars['String']>;
  type_ends_with_i?: Maybe<Scalars['String']>;
  type_not_ends_with_i?: Maybe<Scalars['String']>;
  type_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isActive?: Maybe<Scalars['Boolean']>;
  isActive_not?: Maybe<Scalars['Boolean']>;
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
  isEmailVerified?: Maybe<Scalars['Boolean']>;
  isEmailVerified_not?: Maybe<Scalars['Boolean']>;
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
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  isPhoneVerified_not?: Maybe<Scalars['Boolean']>;
  avatar?: Maybe<Scalars['JSON']>;
  avatar_not?: Maybe<Scalars['JSON']>;
  avatar_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  avatar_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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

export type UserRelateToManyInput = {
  create?: Maybe<Array<Maybe<UserCreateInput>>>;
  connect?: Maybe<Array<Maybe<UserWhereUniqueInput>>>;
  disconnect?: Maybe<Array<Maybe<UserWhereUniqueInput>>>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type UserRelateToOneInput = {
  create?: Maybe<UserCreateInput>;
  connect?: Maybe<UserWhereUniqueInput>;
  disconnect?: Maybe<UserWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export enum UserTypeType {
  Staff = 'staff',
  Resident = 'resident'
}

export type UserUpdateInput = {
  dv?: Maybe<Scalars['Int']>;
  sender?: Maybe<Scalars['JSON']>;
  name?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  type?: Maybe<UserTypeType>;
  isActive?: Maybe<Scalars['Boolean']>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  isSupport?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
  isEmailVerified?: Maybe<Scalars['Boolean']>;
  phone?: Maybe<Scalars['String']>;
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  avatar?: Maybe<Scalars['Upload']>;
  meta?: Maybe<Scalars['JSON']>;
  importId?: Maybe<Scalars['String']>;
  v?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['String']>;
  createdBy?: Maybe<UserRelateToOneInput>;
  updatedBy?: Maybe<UserRelateToOneInput>;
  deletedAt?: Maybe<Scalars['String']>;
  newId?: Maybe<Scalars['String']>;
};

export type UserWhereInput = {
  AND?: Maybe<Array<Maybe<UserWhereInput>>>;
  OR?: Maybe<Array<Maybe<UserWhereInput>>>;
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
  type?: Maybe<UserTypeType>;
  type_not?: Maybe<UserTypeType>;
  type_in?: Maybe<Array<Maybe<UserTypeType>>>;
  type_not_in?: Maybe<Array<Maybe<UserTypeType>>>;
  isActive?: Maybe<Scalars['Boolean']>;
  isActive_not?: Maybe<Scalars['Boolean']>;
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
  isEmailVerified?: Maybe<Scalars['Boolean']>;
  isEmailVerified_not?: Maybe<Scalars['Boolean']>;
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
  isPhoneVerified?: Maybe<Scalars['Boolean']>;
  isPhoneVerified_not?: Maybe<Scalars['Boolean']>;
  avatar?: Maybe<Scalars['String']>;
  avatar_not?: Maybe<Scalars['String']>;
  avatar_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  avatar_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  importId?: Maybe<Scalars['String']>;
  importId_not?: Maybe<Scalars['String']>;
  importId_contains?: Maybe<Scalars['String']>;
  importId_not_contains?: Maybe<Scalars['String']>;
  importId_starts_with?: Maybe<Scalars['String']>;
  importId_not_starts_with?: Maybe<Scalars['String']>;
  importId_ends_with?: Maybe<Scalars['String']>;
  importId_not_ends_with?: Maybe<Scalars['String']>;
  importId_i?: Maybe<Scalars['String']>;
  importId_not_i?: Maybe<Scalars['String']>;
  importId_contains_i?: Maybe<Scalars['String']>;
  importId_not_contains_i?: Maybe<Scalars['String']>;
  importId_starts_with_i?: Maybe<Scalars['String']>;
  importId_not_starts_with_i?: Maybe<Scalars['String']>;
  importId_ends_with_i?: Maybe<Scalars['String']>;
  importId_not_ends_with_i?: Maybe<Scalars['String']>;
  importId_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importId_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
