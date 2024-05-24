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


export type AddressMetaDataField = {
  __typename?: 'AddressMetaDataField';
  postal_code?: Maybe<Scalars['String']>;
  country: Scalars['String'];
  country_iso_code?: Maybe<Scalars['String']>;
  federal_district?: Maybe<Scalars['String']>;
  region_fias_id?: Maybe<Scalars['String']>;
  region_kladr_id?: Maybe<Scalars['String']>;
  region_iso_code?: Maybe<Scalars['String']>;
  region_with_type?: Maybe<Scalars['String']>;
  region_type?: Maybe<Scalars['String']>;
  region_type_full?: Maybe<Scalars['String']>;
  region: Scalars['String'];
  area_fias_id?: Maybe<Scalars['String']>;
  area_kladr_id?: Maybe<Scalars['String']>;
  area_with_type?: Maybe<Scalars['String']>;
  area_type?: Maybe<Scalars['String']>;
  area_type_full?: Maybe<Scalars['String']>;
  area?: Maybe<Scalars['String']>;
  city_fias_id?: Maybe<Scalars['String']>;
  city_kladr_id?: Maybe<Scalars['String']>;
  city_with_type?: Maybe<Scalars['String']>;
  city_type?: Maybe<Scalars['String']>;
  city_type_full?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  city_area?: Maybe<Scalars['String']>;
  city_district_fias_id?: Maybe<Scalars['String']>;
  city_district_kladr_id?: Maybe<Scalars['String']>;
  city_district_with_type?: Maybe<Scalars['String']>;
  city_district_type?: Maybe<Scalars['String']>;
  city_district_type_full?: Maybe<Scalars['String']>;
  city_district?: Maybe<Scalars['String']>;
  settlement_fias_id?: Maybe<Scalars['String']>;
  settlement_kladr_id?: Maybe<Scalars['String']>;
  settlement_with_type?: Maybe<Scalars['String']>;
  settlement_type?: Maybe<Scalars['String']>;
  settlement_type_full?: Maybe<Scalars['String']>;
  settlement?: Maybe<Scalars['String']>;
  street_fias_id?: Maybe<Scalars['String']>;
  street_kladr_id?: Maybe<Scalars['String']>;
  street_with_type?: Maybe<Scalars['String']>;
  street_type?: Maybe<Scalars['String']>;
  street_type_full?: Maybe<Scalars['String']>;
  street?: Maybe<Scalars['String']>;
  house_fias_id?: Maybe<Scalars['String']>;
  house_kladr_id?: Maybe<Scalars['String']>;
  house_type?: Maybe<Scalars['String']>;
  house_type_full?: Maybe<Scalars['String']>;
  house?: Maybe<Scalars['String']>;
  block_type?: Maybe<Scalars['String']>;
  block_type_full?: Maybe<Scalars['String']>;
  block?: Maybe<Scalars['String']>;
  entrance?: Maybe<Scalars['String']>;
  floor?: Maybe<Scalars['String']>;
  flat_fias_id?: Maybe<Scalars['String']>;
  flat_type?: Maybe<Scalars['String']>;
  flat_type_full?: Maybe<Scalars['String']>;
  flat?: Maybe<Scalars['String']>;
  flat_area?: Maybe<Scalars['String']>;
  square_meter_price?: Maybe<Scalars['String']>;
  flat_price?: Maybe<Scalars['String']>;
  postal_box?: Maybe<Scalars['String']>;
  fias_id?: Maybe<Scalars['String']>;
  fias_code?: Maybe<Scalars['String']>;
  fias_level?: Maybe<Scalars['String']>;
  fias_actuality_state?: Maybe<Scalars['String']>;
  kladr_id?: Maybe<Scalars['String']>;
  geoname_id?: Maybe<Scalars['String']>;
  capital_marker?: Maybe<Scalars['String']>;
  okato?: Maybe<Scalars['String']>;
  oktmo?: Maybe<Scalars['String']>;
  tax_office?: Maybe<Scalars['String']>;
  tax_office_legal?: Maybe<Scalars['String']>;
  timezone?: Maybe<Scalars['String']>;
  geo_lat?: Maybe<Scalars['String']>;
  geo_lon?: Maybe<Scalars['String']>;
  beltway_hit?: Maybe<Scalars['String']>;
  beltway_distance?: Maybe<Scalars['String']>;
  metro?: Maybe<Array<Maybe<AddressMetaDataMetroField>>>;
  qc_geo?: Maybe<Scalars['String']>;
  qc_complete?: Maybe<Scalars['String']>;
  qc_house?: Maybe<Scalars['String']>;
  history_values?: Maybe<Array<Maybe<Scalars['String']>>>;
  unparsed_parts?: Maybe<Scalars['String']>;
  source?: Maybe<Scalars['String']>;
  qc?: Maybe<Scalars['String']>;
};

export type AddressMetaDataMetroField = {
  __typename?: 'AddressMetaDataMetroField';
  name?: Maybe<Scalars['String']>;
  line?: Maybe<Scalars['String']>;
  distance?: Maybe<Scalars['String']>;
};

export type AddressMetaField = {
  __typename?: 'AddressMetaField';
  dv?: Maybe<Scalars['Int']>;
  value: Scalars['String'];
  unrestricted_value: Scalars['String'];
  data: AddressMetaDataField;
};

/**  B2B app  */
export type B2BApp = {
  __typename?: 'B2BApp';
  /**  Name of B2B App  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};

export type B2BAppAccessRightSetWhereInput = {
  AND?: Maybe<Array<Maybe<B2BAppAccessRightSetWhereInput>>>;
  OR?: Maybe<Array<Maybe<B2BAppAccessRightSetWhereInput>>>;
  app?: Maybe<B2BAppWhereInput>;
  app_is_null?: Maybe<Scalars['Boolean']>;
  canReadContacts?: Maybe<Scalars['Boolean']>;
  canReadContacts_not?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageContacts_not?: Maybe<Scalars['Boolean']>;
  canReadMeters?: Maybe<Scalars['Boolean']>;
  canReadMeters_not?: Maybe<Scalars['Boolean']>;
  canManageMeters?: Maybe<Scalars['Boolean']>;
  canManageMeters_not?: Maybe<Scalars['Boolean']>;
  canReadMeterReadings?: Maybe<Scalars['Boolean']>;
  canReadMeterReadings_not?: Maybe<Scalars['Boolean']>;
  canManageMeterReadings?: Maybe<Scalars['Boolean']>;
  canManageMeterReadings_not?: Maybe<Scalars['Boolean']>;
  canReadOrganizations?: Maybe<Scalars['Boolean']>;
  canReadOrganizations_not?: Maybe<Scalars['Boolean']>;
  canManageOrganizations?: Maybe<Scalars['Boolean']>;
  canManageOrganizations_not?: Maybe<Scalars['Boolean']>;
  canReadProperties?: Maybe<Scalars['Boolean']>;
  canReadProperties_not?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageProperties_not?: Maybe<Scalars['Boolean']>;
  canExecuteRegisterMetersReadings?: Maybe<Scalars['Boolean']>;
  canExecuteRegisterMetersReadings_not?: Maybe<Scalars['Boolean']>;
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

export type B2BAppAccessRightWhereInput = {
  AND?: Maybe<Array<Maybe<B2BAppAccessRightWhereInput>>>;
  OR?: Maybe<Array<Maybe<B2BAppAccessRightWhereInput>>>;
  user?: Maybe<UserWhereInput>;
  user_is_null?: Maybe<Scalars['Boolean']>;
  app?: Maybe<B2BAppWhereInput>;
  app_is_null?: Maybe<Scalars['Boolean']>;
  accessRightSet?: Maybe<B2BAppAccessRightSetWhereInput>;
  accessRightSet_is_null?: Maybe<Scalars['Boolean']>;
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

/**  Object which connects B2B App and Organization. Used to determine if app is connected or not, and store settings / state of app for specific organization  */
export type B2BAppContext = {
  __typename?: 'B2BAppContext';
  /**  B2B App  */
  app?: Maybe<B2BApp>;
  /**  Organization  */
  organization?: Maybe<Organization>;
  /**  Status of B2BApp connection, Can be one of the following: ["InProgress", "Error", "Finished"]. If not specified explicitly on creation, uses default value from related B2BApp model  */
  status?: Maybe<Scalars['String']>;
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

export type B2BAppContextWhereInput = {
  AND?: Maybe<Array<Maybe<B2BAppContextWhereInput>>>;
  OR?: Maybe<Array<Maybe<B2BAppContextWhereInput>>>;
  app?: Maybe<B2BAppWhereInput>;
  app_is_null?: Maybe<Scalars['Boolean']>;
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  status?: Maybe<Scalars['String']>;
  status_not?: Maybe<Scalars['String']>;
  status_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  status_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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

export type B2BAppContextWhereUniqueInput = {
  id: Scalars['ID'];
};

export enum B2BAppGlobalFeature {
  PropertyMapGeneration = 'PropertyMapGeneration',
  AttachCallRecordToTicket = 'AttachCallRecordToTicket'
}

export type B2BAppNewsSharingConfigWhereInput = {
  AND?: Maybe<Array<Maybe<B2BAppNewsSharingConfigWhereInput>>>;
  OR?: Maybe<Array<Maybe<B2BAppNewsSharingConfigWhereInput>>>;
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
  publishUrl?: Maybe<Scalars['String']>;
  publishUrl_not?: Maybe<Scalars['String']>;
  publishUrl_contains?: Maybe<Scalars['String']>;
  publishUrl_not_contains?: Maybe<Scalars['String']>;
  publishUrl_starts_with?: Maybe<Scalars['String']>;
  publishUrl_not_starts_with?: Maybe<Scalars['String']>;
  publishUrl_ends_with?: Maybe<Scalars['String']>;
  publishUrl_not_ends_with?: Maybe<Scalars['String']>;
  publishUrl_i?: Maybe<Scalars['String']>;
  publishUrl_not_i?: Maybe<Scalars['String']>;
  publishUrl_contains_i?: Maybe<Scalars['String']>;
  publishUrl_not_contains_i?: Maybe<Scalars['String']>;
  publishUrl_starts_with_i?: Maybe<Scalars['String']>;
  publishUrl_not_starts_with_i?: Maybe<Scalars['String']>;
  publishUrl_ends_with_i?: Maybe<Scalars['String']>;
  publishUrl_not_ends_with_i?: Maybe<Scalars['String']>;
  publishUrl_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  publishUrl_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  icon?: Maybe<Scalars['String']>;
  icon_not?: Maybe<Scalars['String']>;
  icon_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  icon_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  previewUrl?: Maybe<Scalars['String']>;
  previewUrl_not?: Maybe<Scalars['String']>;
  previewUrl_contains?: Maybe<Scalars['String']>;
  previewUrl_not_contains?: Maybe<Scalars['String']>;
  previewUrl_starts_with?: Maybe<Scalars['String']>;
  previewUrl_not_starts_with?: Maybe<Scalars['String']>;
  previewUrl_ends_with?: Maybe<Scalars['String']>;
  previewUrl_not_ends_with?: Maybe<Scalars['String']>;
  previewUrl_i?: Maybe<Scalars['String']>;
  previewUrl_not_i?: Maybe<Scalars['String']>;
  previewUrl_contains_i?: Maybe<Scalars['String']>;
  previewUrl_not_contains_i?: Maybe<Scalars['String']>;
  previewUrl_starts_with_i?: Maybe<Scalars['String']>;
  previewUrl_not_starts_with_i?: Maybe<Scalars['String']>;
  previewUrl_ends_with_i?: Maybe<Scalars['String']>;
  previewUrl_not_ends_with_i?: Maybe<Scalars['String']>;
  previewUrl_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  previewUrl_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  getRecipientsUrl?: Maybe<Scalars['String']>;
  getRecipientsUrl_not?: Maybe<Scalars['String']>;
  getRecipientsUrl_contains?: Maybe<Scalars['String']>;
  getRecipientsUrl_not_contains?: Maybe<Scalars['String']>;
  getRecipientsUrl_starts_with?: Maybe<Scalars['String']>;
  getRecipientsUrl_not_starts_with?: Maybe<Scalars['String']>;
  getRecipientsUrl_ends_with?: Maybe<Scalars['String']>;
  getRecipientsUrl_not_ends_with?: Maybe<Scalars['String']>;
  getRecipientsUrl_i?: Maybe<Scalars['String']>;
  getRecipientsUrl_not_i?: Maybe<Scalars['String']>;
  getRecipientsUrl_contains_i?: Maybe<Scalars['String']>;
  getRecipientsUrl_not_contains_i?: Maybe<Scalars['String']>;
  getRecipientsUrl_starts_with_i?: Maybe<Scalars['String']>;
  getRecipientsUrl_not_starts_with_i?: Maybe<Scalars['String']>;
  getRecipientsUrl_ends_with_i?: Maybe<Scalars['String']>;
  getRecipientsUrl_not_ends_with_i?: Maybe<Scalars['String']>;
  getRecipientsUrl_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  getRecipientsUrl_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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

export type B2BAppRelateToOneInput = {
  connect?: Maybe<B2BAppWhereUniqueInput>;
  disconnect?: Maybe<B2BAppWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

/**  This model links the role of the organization and mini-apps, allowing mini-apps to extend the main role template. Having this mapping between role A and mini-app B means that all employees in the organization with role A can access mini-app B. In addition, a mini-app may want to differentiate access within itself. To do this, it can create B2BAppPermissions via service user, the keys of which will appear as properties in the "permissions" field on all B2BAppRole associated with the mini-app.  By default, all existing and new permissions will be set to "true" for all roles in the organization that have "canManageB2BApps" checked, false for other employees. When connecting the miniapp will be automatically created B2BAppRole for all roles that have the "canManageB2BApps" checkbox. B2BAppRole can be created and updated manually by employees with the "canManageRoles" permission for other roles. When deleting B2BAppPermission, its key is also removed from the permissions field of all corresponding B2BAppRole, and when adding it - it is added to all roles, and the value is set according to the rules described above.  */
export type B2BAppRole = {
  __typename?: 'B2BAppRole';
  /**  Link to the application to which the role belongs  */
  app?: Maybe<B2BApp>;
  /**  Link to the role of the organization that B2BAppRole extends  */
  role?: Maybe<OrganizationEmployeeRole>;
  /**  A set of specific permissions within a mini-app for a specific role. Is a Json object where the key is the "key" field from B2BAppPermission and the value is Boolean. Example: "{"canManagePasses": true, "canReadConfig": false}"  */
  permissions?: Maybe<Scalars['JSON']>;
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

export type B2BAppRoleCreateInput = {
  app?: Maybe<B2BAppRelateToOneInput>;
  role?: Maybe<OrganizationEmployeeRoleRelateToOneInput>;
  permissions?: Maybe<Scalars['JSON']>;
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

export type B2BAppRoleWhereInput = {
  AND?: Maybe<Array<Maybe<B2BAppRoleWhereInput>>>;
  OR?: Maybe<Array<Maybe<B2BAppRoleWhereInput>>>;
  app?: Maybe<B2BAppWhereInput>;
  app_is_null?: Maybe<Scalars['Boolean']>;
  role?: Maybe<OrganizationEmployeeRoleWhereInput>;
  role_is_null?: Maybe<Scalars['Boolean']>;
  permissions?: Maybe<Scalars['JSON']>;
  permissions_not?: Maybe<Scalars['JSON']>;
  permissions_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  permissions_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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

export type B2BAppRoleWhereUniqueInput = {
  id: Scalars['ID'];
};

export type B2BAppRolesCreateInput = {
  data?: Maybe<B2BAppRoleCreateInput>;
};

export type B2BAppWhereInput = {
  AND?: Maybe<Array<Maybe<B2BAppWhereInput>>>;
  OR?: Maybe<Array<Maybe<B2BAppWhereInput>>>;
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
  logo?: Maybe<Scalars['String']>;
  logo_not?: Maybe<Scalars['String']>;
  logo_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  logo_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  shortDescription?: Maybe<Scalars['String']>;
  shortDescription_not?: Maybe<Scalars['String']>;
  shortDescription_contains?: Maybe<Scalars['String']>;
  shortDescription_not_contains?: Maybe<Scalars['String']>;
  shortDescription_starts_with?: Maybe<Scalars['String']>;
  shortDescription_not_starts_with?: Maybe<Scalars['String']>;
  shortDescription_ends_with?: Maybe<Scalars['String']>;
  shortDescription_not_ends_with?: Maybe<Scalars['String']>;
  shortDescription_i?: Maybe<Scalars['String']>;
  shortDescription_not_i?: Maybe<Scalars['String']>;
  shortDescription_contains_i?: Maybe<Scalars['String']>;
  shortDescription_not_contains_i?: Maybe<Scalars['String']>;
  shortDescription_starts_with_i?: Maybe<Scalars['String']>;
  shortDescription_not_starts_with_i?: Maybe<Scalars['String']>;
  shortDescription_ends_with_i?: Maybe<Scalars['String']>;
  shortDescription_not_ends_with_i?: Maybe<Scalars['String']>;
  shortDescription_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  shortDescription_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  developer?: Maybe<Scalars['String']>;
  developer_not?: Maybe<Scalars['String']>;
  developer_contains?: Maybe<Scalars['String']>;
  developer_not_contains?: Maybe<Scalars['String']>;
  developer_starts_with?: Maybe<Scalars['String']>;
  developer_not_starts_with?: Maybe<Scalars['String']>;
  developer_ends_with?: Maybe<Scalars['String']>;
  developer_not_ends_with?: Maybe<Scalars['String']>;
  developer_i?: Maybe<Scalars['String']>;
  developer_not_i?: Maybe<Scalars['String']>;
  developer_contains_i?: Maybe<Scalars['String']>;
  developer_not_contains_i?: Maybe<Scalars['String']>;
  developer_starts_with_i?: Maybe<Scalars['String']>;
  developer_not_starts_with_i?: Maybe<Scalars['String']>;
  developer_ends_with_i?: Maybe<Scalars['String']>;
  developer_not_ends_with_i?: Maybe<Scalars['String']>;
  developer_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  developer_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  partnerUrl?: Maybe<Scalars['String']>;
  partnerUrl_not?: Maybe<Scalars['String']>;
  partnerUrl_contains?: Maybe<Scalars['String']>;
  partnerUrl_not_contains?: Maybe<Scalars['String']>;
  partnerUrl_starts_with?: Maybe<Scalars['String']>;
  partnerUrl_not_starts_with?: Maybe<Scalars['String']>;
  partnerUrl_ends_with?: Maybe<Scalars['String']>;
  partnerUrl_not_ends_with?: Maybe<Scalars['String']>;
  partnerUrl_i?: Maybe<Scalars['String']>;
  partnerUrl_not_i?: Maybe<Scalars['String']>;
  partnerUrl_contains_i?: Maybe<Scalars['String']>;
  partnerUrl_not_contains_i?: Maybe<Scalars['String']>;
  partnerUrl_starts_with_i?: Maybe<Scalars['String']>;
  partnerUrl_not_starts_with_i?: Maybe<Scalars['String']>;
  partnerUrl_ends_with_i?: Maybe<Scalars['String']>;
  partnerUrl_not_ends_with_i?: Maybe<Scalars['String']>;
  partnerUrl_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  partnerUrl_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  detailedDescription?: Maybe<Scalars['String']>;
  detailedDescription_not?: Maybe<Scalars['String']>;
  detailedDescription_contains?: Maybe<Scalars['String']>;
  detailedDescription_not_contains?: Maybe<Scalars['String']>;
  detailedDescription_starts_with?: Maybe<Scalars['String']>;
  detailedDescription_not_starts_with?: Maybe<Scalars['String']>;
  detailedDescription_ends_with?: Maybe<Scalars['String']>;
  detailedDescription_not_ends_with?: Maybe<Scalars['String']>;
  detailedDescription_i?: Maybe<Scalars['String']>;
  detailedDescription_not_i?: Maybe<Scalars['String']>;
  detailedDescription_contains_i?: Maybe<Scalars['String']>;
  detailedDescription_not_contains_i?: Maybe<Scalars['String']>;
  detailedDescription_starts_with_i?: Maybe<Scalars['String']>;
  detailedDescription_not_starts_with_i?: Maybe<Scalars['String']>;
  detailedDescription_ends_with_i?: Maybe<Scalars['String']>;
  detailedDescription_not_ends_with_i?: Maybe<Scalars['String']>;
  detailedDescription_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  detailedDescription_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  appUrl?: Maybe<Scalars['String']>;
  appUrl_not?: Maybe<Scalars['String']>;
  appUrl_contains?: Maybe<Scalars['String']>;
  appUrl_not_contains?: Maybe<Scalars['String']>;
  appUrl_starts_with?: Maybe<Scalars['String']>;
  appUrl_not_starts_with?: Maybe<Scalars['String']>;
  appUrl_ends_with?: Maybe<Scalars['String']>;
  appUrl_not_ends_with?: Maybe<Scalars['String']>;
  appUrl_i?: Maybe<Scalars['String']>;
  appUrl_not_i?: Maybe<Scalars['String']>;
  appUrl_contains_i?: Maybe<Scalars['String']>;
  appUrl_not_contains_i?: Maybe<Scalars['String']>;
  appUrl_starts_with_i?: Maybe<Scalars['String']>;
  appUrl_not_starts_with_i?: Maybe<Scalars['String']>;
  appUrl_ends_with_i?: Maybe<Scalars['String']>;
  appUrl_not_ends_with_i?: Maybe<Scalars['String']>;
  appUrl_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  appUrl_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isHidden?: Maybe<Scalars['Boolean']>;
  isHidden_not?: Maybe<Scalars['Boolean']>;
  isGlobal?: Maybe<Scalars['Boolean']>;
  isGlobal_not?: Maybe<Scalars['Boolean']>;
  isPublic?: Maybe<Scalars['Boolean']>;
  isPublic_not?: Maybe<Scalars['Boolean']>;
  hasDynamicTitle?: Maybe<Scalars['Boolean']>;
  hasDynamicTitle_not?: Maybe<Scalars['Boolean']>;
  icon?: Maybe<Scalars['String']>;
  icon_not?: Maybe<Scalars['String']>;
  icon_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  icon_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  menuCategory?: Maybe<Scalars['String']>;
  menuCategory_not?: Maybe<Scalars['String']>;
  menuCategory_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  menuCategory_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  contextDefaultStatus?: Maybe<Scalars['String']>;
  contextDefaultStatus_not?: Maybe<Scalars['String']>;
  contextDefaultStatus_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  contextDefaultStatus_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  category?: Maybe<Scalars['String']>;
  category_not?: Maybe<Scalars['String']>;
  category_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  category_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  /**  condition must be true for all nodes  */
  accessRights_every?: Maybe<B2BAppAccessRightWhereInput>;
  /**  condition must be true for at least 1 node  */
  accessRights_some?: Maybe<B2BAppAccessRightWhereInput>;
  /**  condition must be false for all nodes  */
  accessRights_none?: Maybe<B2BAppAccessRightWhereInput>;
  features?: Maybe<Array<B2BAppGlobalFeature>>;
  features_not?: Maybe<Array<B2BAppGlobalFeature>>;
  features_in?: Maybe<Array<Maybe<Array<B2BAppGlobalFeature>>>>;
  features_not_in?: Maybe<Array<Maybe<Array<B2BAppGlobalFeature>>>>;
  displayPriority?: Maybe<Scalars['Int']>;
  displayPriority_not?: Maybe<Scalars['Int']>;
  displayPriority_lt?: Maybe<Scalars['Int']>;
  displayPriority_lte?: Maybe<Scalars['Int']>;
  displayPriority_gt?: Maybe<Scalars['Int']>;
  displayPriority_gte?: Maybe<Scalars['Int']>;
  displayPriority_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  displayPriority_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  label?: Maybe<Scalars['String']>;
  label_not?: Maybe<Scalars['String']>;
  label_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  label_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  gallery?: Maybe<Array<Scalars['String']>>;
  gallery_not?: Maybe<Array<Scalars['String']>>;
  gallery_in?: Maybe<Array<Maybe<Array<Scalars['String']>>>>;
  gallery_not_in?: Maybe<Array<Maybe<Array<Scalars['String']>>>>;
  price?: Maybe<Scalars['String']>;
  price_not?: Maybe<Scalars['String']>;
  price_contains?: Maybe<Scalars['String']>;
  price_not_contains?: Maybe<Scalars['String']>;
  price_starts_with?: Maybe<Scalars['String']>;
  price_not_starts_with?: Maybe<Scalars['String']>;
  price_ends_with?: Maybe<Scalars['String']>;
  price_not_ends_with?: Maybe<Scalars['String']>;
  price_i?: Maybe<Scalars['String']>;
  price_not_i?: Maybe<Scalars['String']>;
  price_contains_i?: Maybe<Scalars['String']>;
  price_not_contains_i?: Maybe<Scalars['String']>;
  price_starts_with_i?: Maybe<Scalars['String']>;
  price_not_starts_with_i?: Maybe<Scalars['String']>;
  price_ends_with_i?: Maybe<Scalars['String']>;
  price_not_ends_with_i?: Maybe<Scalars['String']>;
  price_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  price_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  newsSharingConfig?: Maybe<B2BAppNewsSharingConfigWhereInput>;
  newsSharingConfig_is_null?: Maybe<Scalars['Boolean']>;
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

export type B2BAppWhereUniqueInput = {
  id: Scalars['ID'];
};

export type BuildingFloor = {
  __typename?: 'BuildingFloor';
  id: Scalars['String'];
  type: BuildingFloorType;
  index: Scalars['Int'];
  name: Scalars['String'];
  units: Array<Maybe<BuildingUnit>>;
};

export enum BuildingFloorType {
  Floor = 'floor'
}

/** Technical map of the 'building' type Property object. We assume that there will be different maps for different property types.  */
export type BuildingMap = {
  __typename?: 'BuildingMap';
  dv: Scalars['Int'];
  sections?: Maybe<Array<Maybe<BuildingSection>>>;
  parking?: Maybe<Array<Maybe<BuildingSection>>>;
  type?: Maybe<BuildingMapType>;
};

export enum BuildingMapType {
  Building = 'building'
}

export type BuildingSection = {
  __typename?: 'BuildingSection';
  id: Scalars['String'];
  type: BuildingSectionType;
  index: Scalars['Int'];
  name: Scalars['String'];
  floors: Array<Maybe<BuildingFloor>>;
  preview?: Maybe<Scalars['Boolean']>;
};

export enum BuildingSectionType {
  Section = 'section'
}

export type BuildingUnit = {
  __typename?: 'BuildingUnit';
  id: Scalars['String'];
  type: BuildingUnitType;
  unitType?: Maybe<BuildingUnitSubType>;
  name?: Maybe<Scalars['String']>;
  label: Scalars['String'];
  preview?: Maybe<Scalars['Boolean']>;
};

export enum BuildingUnitSubType {
  Parking = 'parking',
  Flat = 'flat',
  Apartment = 'apartment',
  Commercial = 'commercial',
  Warehouse = 'warehouse'
}

export enum BuildingUnitType {
  Unit = 'unit'
}

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

/**  Contact information of a person. Currently it will be related to a ticket, but in the future, it will be associated with more things  */
export type Contact = {
  __typename?: 'Contact';
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  /**  Property, that is a subject of an issue, reported by this person in first ticket. Meaning of this field will be revised in the future  */
  property?: Maybe<Property>;
  /**  Property unit, that is a subject of an issue, reported by this person in first ticket. Meaning of this field will be revised in the future  */
  unitName?: Maybe<Scalars['String']>;
  /**  Type of unit, such as parking lot or flat. Default value: "flat"  */
  unitType?: Maybe<Scalars['String']>;
  /**  Normalized contact email of this person  */
  email?: Maybe<Scalars['String']>;
  /**  Normalized contact phone of this person in E.164 format without spaces  */
  phone?: Maybe<Scalars['String']>;
  /**  Name or full name of this person  */
  name?: Maybe<Scalars['String']>;
  /**  The contact's role  */
  role?: Maybe<ContactRole>;
  /**  Contact verification flag.  */
  isVerified?: Maybe<Scalars['Boolean']>;
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

export type ContactRelateToOneInput = {
  connect?: Maybe<ContactWhereUniqueInput>;
  disconnect?: Maybe<ContactWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

/**  Role for contact  */
export type ContactRole = {
  __typename?: 'ContactRole';
  /**  The role's name  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};

export type ContactRoleWhereInput = {
  AND?: Maybe<Array<Maybe<ContactRoleWhereInput>>>;
  OR?: Maybe<Array<Maybe<ContactRoleWhereInput>>>;
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

export type ContactWhereInput = {
  AND?: Maybe<Array<Maybe<ContactWhereInput>>>;
  OR?: Maybe<Array<Maybe<ContactWhereInput>>>;
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
  unitType?: Maybe<Scalars['String']>;
  unitType_not?: Maybe<Scalars['String']>;
  unitType_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitType_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  role?: Maybe<ContactRoleWhereInput>;
  role_is_null?: Maybe<Scalars['Boolean']>;
  isVerified?: Maybe<Scalars['Boolean']>;
  isVerified_not?: Maybe<Scalars['Boolean']>;
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

export type ContactWhereUniqueInput = {
  id: Scalars['ID'];
};

export type CustomAccessFieldRuleInput = {
  field: Scalars['String'];
  create?: Maybe<Scalars['Boolean']>;
  read?: Maybe<Scalars['Boolean']>;
  update?: Maybe<Scalars['Boolean']>;
};

export type CustomAccessInput = {
  accessRules?: Maybe<Array<Maybe<CustomAccessListRuleInput>>>;
};

export type CustomAccessListRuleInput = {
  list: Scalars['String'];
  create?: Maybe<Scalars['Boolean']>;
  read?: Maybe<Scalars['Boolean']>;
  update?: Maybe<Scalars['Boolean']>;
  fields?: Maybe<Array<Maybe<CustomAccessFieldRuleInput>>>;
};

export enum FeedbackAdditionalOptionsType {
  LowQuality = 'lowQuality',
  HighQuality = 'highQuality',
  Slowly = 'slowly',
  Quickly = 'quickly'
}


export enum MobileApp {
  Resident = 'resident',
  Master = 'master'
}

export enum MobilePlatform {
  Android = 'android',
  Ios = 'ios'
}

export type Mutation = {
  __typename?: 'Mutation';
  /**  Create a single Ticket item.  */
  createTicket?: Maybe<Ticket>;
  /**  Create multiple Ticket items.  */
  createTickets?: Maybe<Array<Maybe<Ticket>>>;
  /**  Create a single B2BAppRole item.  */
  createB2BAppRole?: Maybe<B2BAppRole>;
  /**  Create multiple B2BAppRole items.  */
  createB2BAppRoles?: Maybe<Array<Maybe<B2BAppRole>>>;
};


export type MutationCreateTicketArgs = {
  data?: Maybe<TicketCreateInput>;
};


export type MutationCreateTicketsArgs = {
  data?: Maybe<Array<Maybe<TicketsCreateInput>>>;
};


export type MutationCreateB2BAppRoleArgs = {
  data?: Maybe<B2BAppRoleCreateInput>;
};


export type MutationCreateB2BAppRolesArgs = {
  data?: Maybe<Array<Maybe<B2BAppRolesCreateInput>>>;
};

/**  B2B customer of the service, a legal entity or an association of legal entities (holding/group)  */
export type Organization = {
  __typename?: 'Organization';
  /**  Customer-friendly name  */
  name?: Maybe<Scalars['String']>;
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

export enum OrganizationCountryType {
  En = 'en',
  Ru = 'ru'
}

/**  B2B customer employees. For invite employee should use inviteNewOrganizationEmployee and reInviteOrganizationEmployee  */
export type OrganizationEmployee = {
  __typename?: 'OrganizationEmployee';
  /**  If user exists => invite is matched by email/phone (user can reject or accept it)  */
  user?: Maybe<User>;
  role?: Maybe<OrganizationEmployeeRole>;
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

/**  Employee role name and access permissions  */
export type OrganizationEmployeeRole = {
  __typename?: 'OrganizationEmployeeRole';
  canManageRoles?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  name?: Maybe<Scalars['String']>;
};

export type OrganizationEmployeeRoleRelateToOneInput = {
  connect?: Maybe<OrganizationEmployeeRoleWhereUniqueInput>;
  disconnect?: Maybe<OrganizationEmployeeRoleWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type OrganizationEmployeeRoleWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationEmployeeRoleWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationEmployeeRoleWhereInput>>>;
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
  canManageOrganization?: Maybe<Scalars['Boolean']>;
  canManageOrganization_not?: Maybe<Scalars['Boolean']>;
  canReadEmployees?: Maybe<Scalars['Boolean']>;
  canReadEmployees_not?: Maybe<Scalars['Boolean']>;
  canManageEmployees?: Maybe<Scalars['Boolean']>;
  canManageEmployees_not?: Maybe<Scalars['Boolean']>;
  canManageRoles?: Maybe<Scalars['Boolean']>;
  canManageRoles_not?: Maybe<Scalars['Boolean']>;
  canManageIntegrations?: Maybe<Scalars['Boolean']>;
  canManageIntegrations_not?: Maybe<Scalars['Boolean']>;
  canReadProperties?: Maybe<Scalars['Boolean']>;
  canReadProperties_not?: Maybe<Scalars['Boolean']>;
  canManageProperties?: Maybe<Scalars['Boolean']>;
  canManageProperties_not?: Maybe<Scalars['Boolean']>;
  canReadDocuments?: Maybe<Scalars['Boolean']>;
  canReadDocuments_not?: Maybe<Scalars['Boolean']>;
  canManageDocuments?: Maybe<Scalars['Boolean']>;
  canManageDocuments_not?: Maybe<Scalars['Boolean']>;
  canReadTickets?: Maybe<Scalars['Boolean']>;
  canReadTickets_not?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageTickets_not?: Maybe<Scalars['Boolean']>;
  canManageMeters?: Maybe<Scalars['Boolean']>;
  canManageMeters_not?: Maybe<Scalars['Boolean']>;
  canManageMeterReadings?: Maybe<Scalars['Boolean']>;
  canManageMeterReadings_not?: Maybe<Scalars['Boolean']>;
  canReadContacts?: Maybe<Scalars['Boolean']>;
  canReadContacts_not?: Maybe<Scalars['Boolean']>;
  canManageContacts?: Maybe<Scalars['Boolean']>;
  canManageContacts_not?: Maybe<Scalars['Boolean']>;
  canManageContactRoles?: Maybe<Scalars['Boolean']>;
  canManageContactRoles_not?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  canManageTicketComments_not?: Maybe<Scalars['Boolean']>;
  canShareTickets?: Maybe<Scalars['Boolean']>;
  canShareTickets_not?: Maybe<Scalars['Boolean']>;
  canReadBillingReceipts?: Maybe<Scalars['Boolean']>;
  canReadBillingReceipts_not?: Maybe<Scalars['Boolean']>;
  canImportBillingReceipts?: Maybe<Scalars['Boolean']>;
  canImportBillingReceipts_not?: Maybe<Scalars['Boolean']>;
  canReadPayments?: Maybe<Scalars['Boolean']>;
  canReadPayments_not?: Maybe<Scalars['Boolean']>;
  canInviteNewOrganizationEmployees?: Maybe<Scalars['Boolean']>;
  canInviteNewOrganizationEmployees_not?: Maybe<Scalars['Boolean']>;
  canBeAssignedAsResponsible?: Maybe<Scalars['Boolean']>;
  canBeAssignedAsResponsible_not?: Maybe<Scalars['Boolean']>;
  canBeAssignedAsExecutor?: Maybe<Scalars['Boolean']>;
  canBeAssignedAsExecutor_not?: Maybe<Scalars['Boolean']>;
  canManageTicketPropertyHints?: Maybe<Scalars['Boolean']>;
  canManageTicketPropertyHints_not?: Maybe<Scalars['Boolean']>;
  ticketVisibilityType?: Maybe<Scalars['String']>;
  ticketVisibilityType_not?: Maybe<Scalars['String']>;
  ticketVisibilityType_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  ticketVisibilityType_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  canManagePropertyScopes?: Maybe<Scalars['Boolean']>;
  canManagePropertyScopes_not?: Maybe<Scalars['Boolean']>;
  canManageBankAccounts?: Maybe<Scalars['Boolean']>;
  canManageBankAccounts_not?: Maybe<Scalars['Boolean']>;
  canManageBankAccountReportTasks?: Maybe<Scalars['Boolean']>;
  canManageBankAccountReportTasks_not?: Maybe<Scalars['Boolean']>;
  canManageBankIntegrationAccountContexts?: Maybe<Scalars['Boolean']>;
  canManageBankIntegrationAccountContexts_not?: Maybe<Scalars['Boolean']>;
  canManageBankIntegrationOrganizationContexts?: Maybe<Scalars['Boolean']>;
  canManageBankIntegrationOrganizationContexts_not?: Maybe<Scalars['Boolean']>;
  canManageBankContractorAccounts?: Maybe<Scalars['Boolean']>;
  canManageBankContractorAccounts_not?: Maybe<Scalars['Boolean']>;
  canManageBankTransactions?: Maybe<Scalars['Boolean']>;
  canManageBankTransactions_not?: Maybe<Scalars['Boolean']>;
  canManageBankAccountReports?: Maybe<Scalars['Boolean']>;
  canManageBankAccountReports_not?: Maybe<Scalars['Boolean']>;
  canReadIncidents?: Maybe<Scalars['Boolean']>;
  canReadIncidents_not?: Maybe<Scalars['Boolean']>;
  canManageIncidents?: Maybe<Scalars['Boolean']>;
  canManageIncidents_not?: Maybe<Scalars['Boolean']>;
  canReadNewsItems?: Maybe<Scalars['Boolean']>;
  canReadNewsItems_not?: Maybe<Scalars['Boolean']>;
  canManageNewsItems?: Maybe<Scalars['Boolean']>;
  canManageNewsItems_not?: Maybe<Scalars['Boolean']>;
  canManageNewsItemTemplates?: Maybe<Scalars['Boolean']>;
  canManageNewsItemTemplates_not?: Maybe<Scalars['Boolean']>;
  canManageCallRecords?: Maybe<Scalars['Boolean']>;
  canManageCallRecords_not?: Maybe<Scalars['Boolean']>;
  canDownloadCallRecords?: Maybe<Scalars['Boolean']>;
  canDownloadCallRecords_not?: Maybe<Scalars['Boolean']>;
  canManageMobileFeatureConfigs?: Maybe<Scalars['Boolean']>;
  canManageMobileFeatureConfigs_not?: Maybe<Scalars['Boolean']>;
  canManageB2BApps?: Maybe<Scalars['Boolean']>;
  canManageB2BApps_not?: Maybe<Scalars['Boolean']>;
  canReadAnalytics?: Maybe<Scalars['Boolean']>;
  canReadAnalytics_not?: Maybe<Scalars['Boolean']>;
  canReadInvoices?: Maybe<Scalars['Boolean']>;
  canReadInvoices_not?: Maybe<Scalars['Boolean']>;
  canManageInvoices?: Maybe<Scalars['Boolean']>;
  canManageInvoices_not?: Maybe<Scalars['Boolean']>;
  canReadMarketItems?: Maybe<Scalars['Boolean']>;
  canReadMarketItems_not?: Maybe<Scalars['Boolean']>;
  canManageMarketItems?: Maybe<Scalars['Boolean']>;
  canManageMarketItems_not?: Maybe<Scalars['Boolean']>;
  canReadMeters?: Maybe<Scalars['Boolean']>;
  canReadMeters_not?: Maybe<Scalars['Boolean']>;
  canReadSettings?: Maybe<Scalars['Boolean']>;
  canReadSettings_not?: Maybe<Scalars['Boolean']>;
  canReadExternalReports?: Maybe<Scalars['Boolean']>;
  canReadExternalReports_not?: Maybe<Scalars['Boolean']>;
  canReadServices?: Maybe<Scalars['Boolean']>;
  canReadServices_not?: Maybe<Scalars['Boolean']>;
  canReadCallRecords?: Maybe<Scalars['Boolean']>;
  canReadCallRecords_not?: Maybe<Scalars['Boolean']>;
  canReadMarketItemPrices?: Maybe<Scalars['Boolean']>;
  canReadMarketItemPrices_not?: Maybe<Scalars['Boolean']>;
  canManageMarketItemPrices?: Maybe<Scalars['Boolean']>;
  canManageMarketItemPrices_not?: Maybe<Scalars['Boolean']>;
  canReadMarketPriceScopes?: Maybe<Scalars['Boolean']>;
  canReadMarketPriceScopes_not?: Maybe<Scalars['Boolean']>;
  canManageMarketPriceScopes?: Maybe<Scalars['Boolean']>;
  canManageMarketPriceScopes_not?: Maybe<Scalars['Boolean']>;
  canReadPaymentsWithInvoices?: Maybe<Scalars['Boolean']>;
  canReadPaymentsWithInvoices_not?: Maybe<Scalars['Boolean']>;
  canReadMarketplace?: Maybe<Scalars['Boolean']>;
  canReadMarketplace_not?: Maybe<Scalars['Boolean']>;
  canManageMarketplace?: Maybe<Scalars['Boolean']>;
  canManageMarketplace_not?: Maybe<Scalars['Boolean']>;
  canReadTour?: Maybe<Scalars['Boolean']>;
  canReadTour_not?: Maybe<Scalars['Boolean']>;
  canManageTour?: Maybe<Scalars['Boolean']>;
  canManageTour_not?: Maybe<Scalars['Boolean']>;
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

export type OrganizationEmployeeRoleWhereUniqueInput = {
  id: Scalars['ID'];
};

export type OrganizationEmployeeWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationEmployeeWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationEmployeeWhereInput>>>;
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
  hasAllSpecializations?: Maybe<Scalars['Boolean']>;
  hasAllSpecializations_not?: Maybe<Scalars['Boolean']>;
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

export type OrganizationEmployeeWhereUniqueInput = {
  id: Scalars['ID'];
};

export enum OrganizationFeature {
  Spp = 'SPP'
}

export type OrganizationLinkWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationLinkWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationLinkWhereInput>>>;
  from?: Maybe<OrganizationWhereInput>;
  from_is_null?: Maybe<Scalars['Boolean']>;
  to?: Maybe<OrganizationWhereInput>;
  to_is_null?: Maybe<Scalars['Boolean']>;
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

export type OrganizationRelateToOneInput = {
  connect?: Maybe<OrganizationWhereUniqueInput>;
  disconnect?: Maybe<OrganizationWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type OrganizationWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationWhereInput>>>;
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
  type?: Maybe<Scalars['String']>;
  type_not?: Maybe<Scalars['String']>;
  type_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  type_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  phoneNumberPrefix?: Maybe<Scalars['String']>;
  phoneNumberPrefix_not?: Maybe<Scalars['String']>;
  phoneNumberPrefix_contains?: Maybe<Scalars['String']>;
  phoneNumberPrefix_not_contains?: Maybe<Scalars['String']>;
  phoneNumberPrefix_starts_with?: Maybe<Scalars['String']>;
  phoneNumberPrefix_not_starts_with?: Maybe<Scalars['String']>;
  phoneNumberPrefix_ends_with?: Maybe<Scalars['String']>;
  phoneNumberPrefix_not_ends_with?: Maybe<Scalars['String']>;
  phoneNumberPrefix_i?: Maybe<Scalars['String']>;
  phoneNumberPrefix_not_i?: Maybe<Scalars['String']>;
  phoneNumberPrefix_contains_i?: Maybe<Scalars['String']>;
  phoneNumberPrefix_not_contains_i?: Maybe<Scalars['String']>;
  phoneNumberPrefix_starts_with_i?: Maybe<Scalars['String']>;
  phoneNumberPrefix_not_starts_with_i?: Maybe<Scalars['String']>;
  phoneNumberPrefix_ends_with_i?: Maybe<Scalars['String']>;
  phoneNumberPrefix_not_ends_with_i?: Maybe<Scalars['String']>;
  phoneNumberPrefix_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  phoneNumberPrefix_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  /**  condition must be true for all nodes  */
  employees_every?: Maybe<OrganizationEmployeeWhereInput>;
  /**  condition must be true for at least 1 node  */
  employees_some?: Maybe<OrganizationEmployeeWhereInput>;
  /**  condition must be false for all nodes  */
  employees_none?: Maybe<OrganizationEmployeeWhereInput>;
  /**  condition must be true for all nodes  */
  relatedOrganizations_every?: Maybe<OrganizationLinkWhereInput>;
  /**  condition must be true for at least 1 node  */
  relatedOrganizations_some?: Maybe<OrganizationLinkWhereInput>;
  /**  condition must be false for all nodes  */
  relatedOrganizations_none?: Maybe<OrganizationLinkWhereInput>;
  importRemoteSystem?: Maybe<Scalars['String']>;
  importRemoteSystem_not?: Maybe<Scalars['String']>;
  importRemoteSystem_contains?: Maybe<Scalars['String']>;
  importRemoteSystem_not_contains?: Maybe<Scalars['String']>;
  importRemoteSystem_starts_with?: Maybe<Scalars['String']>;
  importRemoteSystem_not_starts_with?: Maybe<Scalars['String']>;
  importRemoteSystem_ends_with?: Maybe<Scalars['String']>;
  importRemoteSystem_not_ends_with?: Maybe<Scalars['String']>;
  importRemoteSystem_i?: Maybe<Scalars['String']>;
  importRemoteSystem_not_i?: Maybe<Scalars['String']>;
  importRemoteSystem_contains_i?: Maybe<Scalars['String']>;
  importRemoteSystem_not_contains_i?: Maybe<Scalars['String']>;
  importRemoteSystem_starts_with_i?: Maybe<Scalars['String']>;
  importRemoteSystem_not_starts_with_i?: Maybe<Scalars['String']>;
  importRemoteSystem_ends_with_i?: Maybe<Scalars['String']>;
  importRemoteSystem_not_ends_with_i?: Maybe<Scalars['String']>;
  importRemoteSystem_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  importRemoteSystem_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  features?: Maybe<Array<OrganizationFeature>>;
  features_not?: Maybe<Array<OrganizationFeature>>;
  features_in?: Maybe<Array<Maybe<Array<OrganizationFeature>>>>;
  features_not_in?: Maybe<Array<Maybe<Array<OrganizationFeature>>>>;
  isApproved?: Maybe<Scalars['Boolean']>;
  isApproved_not?: Maybe<Scalars['Boolean']>;
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

export type OrganizationWhereUniqueInput = {
  id: Scalars['ID'];
};

/**  Common property. The property is divided into separate `unit` parts, each of which can be owned by an independent owner. Community farm, residential buildings, or a cottage settlement  */
export type Property = {
  __typename?: 'Property';
  id: Scalars['ID'];
  /**  Normalized address  */
  address?: Maybe<Scalars['String']>;
  /**  Property address components  */
  addressMeta?: Maybe<AddressMetaField>;
  /**  Client understandable Property name. A well-known property name for the client  */
  name?: Maybe<Scalars['String']>;
  /**  Common property type  */
  type?: Maybe<PropertyTypeType>;
  /**  Property map/schema  */
  map?: Maybe<BuildingMap>;
  /**  The unique key of the address  */
  addressKey?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
};

export type PropertyRelateToOneInput = {
  connect?: Maybe<PropertyWhereUniqueInput>;
  disconnect?: Maybe<PropertyWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export enum PropertyTypeType {
  Building = 'building',
  Village = 'village'
}

export type PropertyWhereInput = {
  AND?: Maybe<Array<Maybe<PropertyWhereInput>>>;
  OR?: Maybe<Array<Maybe<PropertyWhereInput>>>;
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
  uninhabitedUnitsCount?: Maybe<Scalars['Int']>;
  uninhabitedUnitsCount_not?: Maybe<Scalars['Int']>;
  uninhabitedUnitsCount_lt?: Maybe<Scalars['Int']>;
  uninhabitedUnitsCount_lte?: Maybe<Scalars['Int']>;
  uninhabitedUnitsCount_gt?: Maybe<Scalars['Int']>;
  uninhabitedUnitsCount_gte?: Maybe<Scalars['Int']>;
  uninhabitedUnitsCount_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  uninhabitedUnitsCount_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  isApproved?: Maybe<Scalars['Boolean']>;
  isApproved_not?: Maybe<Scalars['Boolean']>;
  yearOfConstruction?: Maybe<Scalars['String']>;
  yearOfConstruction_not?: Maybe<Scalars['String']>;
  yearOfConstruction_lt?: Maybe<Scalars['String']>;
  yearOfConstruction_lte?: Maybe<Scalars['String']>;
  yearOfConstruction_gt?: Maybe<Scalars['String']>;
  yearOfConstruction_gte?: Maybe<Scalars['String']>;
  yearOfConstruction_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  yearOfConstruction_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  area?: Maybe<Scalars['String']>;
  area_not?: Maybe<Scalars['String']>;
  area_lt?: Maybe<Scalars['String']>;
  area_lte?: Maybe<Scalars['String']>;
  area_gt?: Maybe<Scalars['String']>;
  area_gte?: Maybe<Scalars['String']>;
  area_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  area_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
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
  addressKey?: Maybe<Scalars['String']>;
  addressKey_not?: Maybe<Scalars['String']>;
  addressKey_contains?: Maybe<Scalars['String']>;
  addressKey_not_contains?: Maybe<Scalars['String']>;
  addressKey_starts_with?: Maybe<Scalars['String']>;
  addressKey_not_starts_with?: Maybe<Scalars['String']>;
  addressKey_ends_with?: Maybe<Scalars['String']>;
  addressKey_not_ends_with?: Maybe<Scalars['String']>;
  addressKey_i?: Maybe<Scalars['String']>;
  addressKey_not_i?: Maybe<Scalars['String']>;
  addressKey_contains_i?: Maybe<Scalars['String']>;
  addressKey_not_contains_i?: Maybe<Scalars['String']>;
  addressKey_starts_with_i?: Maybe<Scalars['String']>;
  addressKey_not_starts_with_i?: Maybe<Scalars['String']>;
  addressKey_ends_with_i?: Maybe<Scalars['String']>;
  addressKey_not_ends_with_i?: Maybe<Scalars['String']>;
  addressKey_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  addressKey_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  addressMeta?: Maybe<Scalars['JSON']>;
  addressMeta_not?: Maybe<Scalars['JSON']>;
  addressMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressSources?: Maybe<Scalars['JSON']>;
  addressSources_not?: Maybe<Scalars['JSON']>;
  addressSources_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressSources_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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

export type PropertyWhereUniqueInput = {
  id: Scalars['ID'];
};

export enum QualityControlAdditionalOptionsType {
  LowQuality = 'lowQuality',
  HighQuality = 'highQuality',
  Slowly = 'slowly',
  Quickly = 'quickly'
}

export type Query = {
  __typename?: 'Query';
  /**  Search for all Organization items which match the where clause.  */
  allOrganizations?: Maybe<Array<Maybe<Organization>>>;
  /**  Search for the Organization item with the matching ID.  */
  Organization?: Maybe<Organization>;
  /**  Perform a meta-query on all Organization items which match the where clause.  */
  _allOrganizationsMeta?: Maybe<_QueryMeta>;
  /**  Search for all OrganizationEmployee items which match the where clause.  */
  allOrganizationEmployees?: Maybe<Array<Maybe<OrganizationEmployee>>>;
  /**  Search for the OrganizationEmployee item with the matching ID.  */
  OrganizationEmployee?: Maybe<OrganizationEmployee>;
  /**  Perform a meta-query on all OrganizationEmployee items which match the where clause.  */
  _allOrganizationEmployeesMeta?: Maybe<_QueryMeta>;
  /**  Search for all OrganizationEmployeeRole items which match the where clause.  */
  allOrganizationEmployeeRoles?: Maybe<Array<Maybe<OrganizationEmployeeRole>>>;
  /**  Search for the OrganizationEmployeeRole item with the matching ID.  */
  OrganizationEmployeeRole?: Maybe<OrganizationEmployeeRole>;
  /**  Perform a meta-query on all OrganizationEmployeeRole items which match the where clause.  */
  _allOrganizationEmployeeRolesMeta?: Maybe<_QueryMeta>;
  /**  Search for all Property items which match the where clause.  */
  allProperties?: Maybe<Array<Maybe<Property>>>;
  /**  Search for the Property item with the matching ID.  */
  Property?: Maybe<Property>;
  /**  Perform a meta-query on all Property items which match the where clause.  */
  _allPropertiesMeta?: Maybe<_QueryMeta>;
  /**  Search for all Ticket items which match the where clause.  */
  allTickets?: Maybe<Array<Maybe<Ticket>>>;
  /**  Search for the Ticket item with the matching ID.  */
  Ticket?: Maybe<Ticket>;
  /**  Perform a meta-query on all Ticket items which match the where clause.  */
  _allTicketsMeta?: Maybe<_QueryMeta>;
  /**  Search for all Contact items which match the where clause.  */
  allContacts?: Maybe<Array<Maybe<Contact>>>;
  /**  Search for the Contact item with the matching ID.  */
  Contact?: Maybe<Contact>;
  /**  Perform a meta-query on all Contact items which match the where clause.  */
  _allContactsMeta?: Maybe<_QueryMeta>;
  /**  Search for all Resident items which match the where clause.  */
  allResidents?: Maybe<Array<Maybe<Resident>>>;
  /**  Search for the Resident item with the matching ID.  */
  Resident?: Maybe<Resident>;
  /**  Perform a meta-query on all Resident items which match the where clause.  */
  _allResidentsMeta?: Maybe<_QueryMeta>;
  /**  Search for all B2BAppContext items which match the where clause.  */
  allB2BAppContexts?: Maybe<Array<Maybe<B2BAppContext>>>;
  /**  Search for the B2BAppContext item with the matching ID.  */
  B2BAppContext?: Maybe<B2BAppContext>;
  /**  Perform a meta-query on all B2BAppContext items which match the where clause.  */
  _allB2BAppContextsMeta?: Maybe<_QueryMeta>;
  /**  Search for all B2BAppRole items which match the where clause.  */
  allB2BAppRoles?: Maybe<Array<Maybe<B2BAppRole>>>;
  /**  Search for the B2BAppRole item with the matching ID.  */
  B2BAppRole?: Maybe<B2BAppRole>;
  /**  Perform a meta-query on all B2BAppRole items which match the where clause.  */
  _allB2BAppRolesMeta?: Maybe<_QueryMeta>;
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


export type QueryAllB2BAppContextsArgs = {
  where?: Maybe<B2BAppContextWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortB2BAppContextsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryB2BAppContextArgs = {
  where: B2BAppContextWhereUniqueInput;
};


export type Query_AllB2BAppContextsMetaArgs = {
  where?: Maybe<B2BAppContextWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortB2BAppContextsBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryAllB2BAppRolesArgs = {
  where?: Maybe<B2BAppRoleWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortB2BAppRolesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};


export type QueryB2BAppRoleArgs = {
  where: B2BAppRoleWhereUniqueInput;
};


export type Query_AllB2BAppRolesMetaArgs = {
  where?: Maybe<B2BAppRoleWhereInput>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<SortB2BAppRolesBy>>;
  orderBy?: Maybe<Scalars['String']>;
  first?: Maybe<Scalars['Int']>;
  skip?: Maybe<Scalars['Int']>;
};

/**  Person, that resides in a specified property and unit  */
export type Resident = {
  __typename?: 'Resident';
  /**  Mobile user account  */
  user?: Maybe<User>;
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

export type ResidentWhereInput = {
  AND?: Maybe<Array<Maybe<ResidentWhereInput>>>;
  OR?: Maybe<Array<Maybe<ResidentWhereInput>>>;
  user?: Maybe<UserWhereInput>;
  user_is_null?: Maybe<Scalars['Boolean']>;
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
  unitType?: Maybe<Scalars['String']>;
  unitType_not?: Maybe<Scalars['String']>;
  unitType_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitType_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
  id_not_in?: Maybe<Array<Maybe<Scalars['ID']>>>;
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
  addressKey?: Maybe<Scalars['String']>;
  addressKey_not?: Maybe<Scalars['String']>;
  addressKey_contains?: Maybe<Scalars['String']>;
  addressKey_not_contains?: Maybe<Scalars['String']>;
  addressKey_starts_with?: Maybe<Scalars['String']>;
  addressKey_not_starts_with?: Maybe<Scalars['String']>;
  addressKey_ends_with?: Maybe<Scalars['String']>;
  addressKey_not_ends_with?: Maybe<Scalars['String']>;
  addressKey_i?: Maybe<Scalars['String']>;
  addressKey_not_i?: Maybe<Scalars['String']>;
  addressKey_contains_i?: Maybe<Scalars['String']>;
  addressKey_not_contains_i?: Maybe<Scalars['String']>;
  addressKey_starts_with_i?: Maybe<Scalars['String']>;
  addressKey_not_starts_with_i?: Maybe<Scalars['String']>;
  addressKey_ends_with_i?: Maybe<Scalars['String']>;
  addressKey_not_ends_with_i?: Maybe<Scalars['String']>;
  addressKey_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  addressKey_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  addressMeta?: Maybe<Scalars['JSON']>;
  addressMeta_not?: Maybe<Scalars['JSON']>;
  addressMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressSources?: Maybe<Scalars['JSON']>;
  addressSources_not?: Maybe<Scalars['JSON']>;
  addressSources_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  addressSources_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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

export type ResidentWhereUniqueInput = {
  id: Scalars['ID'];
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

export enum SortB2BAppContextsBy {
  AppAsc = 'app_ASC',
  AppDesc = 'app_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  StatusAsc = 'status_ASC',
  StatusDesc = 'status_DESC',
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

export enum SortB2BAppRolesBy {
  AppAsc = 'app_ASC',
  AppDesc = 'app_DESC',
  RoleAsc = 'role_ASC',
  RoleDesc = 'role_DESC',
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

export enum SortContactsBy {
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
  UnitTypeAsc = 'unitType_ASC',
  UnitTypeDesc = 'unitType_DESC',
  EmailAsc = 'email_ASC',
  EmailDesc = 'email_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  RoleAsc = 'role_ASC',
  RoleDesc = 'role_DESC',
  IsVerifiedAsc = 'isVerified_ASC',
  IsVerifiedDesc = 'isVerified_DESC',
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

export enum SortOrganizationEmployeeRolesBy {
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  CanManageOrganizationAsc = 'canManageOrganization_ASC',
  CanManageOrganizationDesc = 'canManageOrganization_DESC',
  CanReadEmployeesAsc = 'canReadEmployees_ASC',
  CanReadEmployeesDesc = 'canReadEmployees_DESC',
  CanManageEmployeesAsc = 'canManageEmployees_ASC',
  CanManageEmployeesDesc = 'canManageEmployees_DESC',
  CanManageRolesAsc = 'canManageRoles_ASC',
  CanManageRolesDesc = 'canManageRoles_DESC',
  CanManageIntegrationsAsc = 'canManageIntegrations_ASC',
  CanManageIntegrationsDesc = 'canManageIntegrations_DESC',
  CanReadPropertiesAsc = 'canReadProperties_ASC',
  CanReadPropertiesDesc = 'canReadProperties_DESC',
  CanManagePropertiesAsc = 'canManageProperties_ASC',
  CanManagePropertiesDesc = 'canManageProperties_DESC',
  CanReadDocumentsAsc = 'canReadDocuments_ASC',
  CanReadDocumentsDesc = 'canReadDocuments_DESC',
  CanManageDocumentsAsc = 'canManageDocuments_ASC',
  CanManageDocumentsDesc = 'canManageDocuments_DESC',
  CanReadTicketsAsc = 'canReadTickets_ASC',
  CanReadTicketsDesc = 'canReadTickets_DESC',
  CanManageTicketsAsc = 'canManageTickets_ASC',
  CanManageTicketsDesc = 'canManageTickets_DESC',
  CanManageMetersAsc = 'canManageMeters_ASC',
  CanManageMetersDesc = 'canManageMeters_DESC',
  CanManageMeterReadingsAsc = 'canManageMeterReadings_ASC',
  CanManageMeterReadingsDesc = 'canManageMeterReadings_DESC',
  CanReadContactsAsc = 'canReadContacts_ASC',
  CanReadContactsDesc = 'canReadContacts_DESC',
  CanManageContactsAsc = 'canManageContacts_ASC',
  CanManageContactsDesc = 'canManageContacts_DESC',
  CanManageContactRolesAsc = 'canManageContactRoles_ASC',
  CanManageContactRolesDesc = 'canManageContactRoles_DESC',
  CanManageTicketCommentsAsc = 'canManageTicketComments_ASC',
  CanManageTicketCommentsDesc = 'canManageTicketComments_DESC',
  CanShareTicketsAsc = 'canShareTickets_ASC',
  CanShareTicketsDesc = 'canShareTickets_DESC',
  CanReadBillingReceiptsAsc = 'canReadBillingReceipts_ASC',
  CanReadBillingReceiptsDesc = 'canReadBillingReceipts_DESC',
  CanImportBillingReceiptsAsc = 'canImportBillingReceipts_ASC',
  CanImportBillingReceiptsDesc = 'canImportBillingReceipts_DESC',
  CanReadPaymentsAsc = 'canReadPayments_ASC',
  CanReadPaymentsDesc = 'canReadPayments_DESC',
  CanInviteNewOrganizationEmployeesAsc = 'canInviteNewOrganizationEmployees_ASC',
  CanInviteNewOrganizationEmployeesDesc = 'canInviteNewOrganizationEmployees_DESC',
  CanBeAssignedAsResponsibleAsc = 'canBeAssignedAsResponsible_ASC',
  CanBeAssignedAsResponsibleDesc = 'canBeAssignedAsResponsible_DESC',
  CanBeAssignedAsExecutorAsc = 'canBeAssignedAsExecutor_ASC',
  CanBeAssignedAsExecutorDesc = 'canBeAssignedAsExecutor_DESC',
  CanManageTicketPropertyHintsAsc = 'canManageTicketPropertyHints_ASC',
  CanManageTicketPropertyHintsDesc = 'canManageTicketPropertyHints_DESC',
  TicketVisibilityTypeAsc = 'ticketVisibilityType_ASC',
  TicketVisibilityTypeDesc = 'ticketVisibilityType_DESC',
  CanManagePropertyScopesAsc = 'canManagePropertyScopes_ASC',
  CanManagePropertyScopesDesc = 'canManagePropertyScopes_DESC',
  CanManageBankAccountsAsc = 'canManageBankAccounts_ASC',
  CanManageBankAccountsDesc = 'canManageBankAccounts_DESC',
  CanManageBankAccountReportTasksAsc = 'canManageBankAccountReportTasks_ASC',
  CanManageBankAccountReportTasksDesc = 'canManageBankAccountReportTasks_DESC',
  CanManageBankIntegrationAccountContextsAsc = 'canManageBankIntegrationAccountContexts_ASC',
  CanManageBankIntegrationAccountContextsDesc = 'canManageBankIntegrationAccountContexts_DESC',
  CanManageBankIntegrationOrganizationContextsAsc = 'canManageBankIntegrationOrganizationContexts_ASC',
  CanManageBankIntegrationOrganizationContextsDesc = 'canManageBankIntegrationOrganizationContexts_DESC',
  CanManageBankContractorAccountsAsc = 'canManageBankContractorAccounts_ASC',
  CanManageBankContractorAccountsDesc = 'canManageBankContractorAccounts_DESC',
  CanManageBankTransactionsAsc = 'canManageBankTransactions_ASC',
  CanManageBankTransactionsDesc = 'canManageBankTransactions_DESC',
  CanManageBankAccountReportsAsc = 'canManageBankAccountReports_ASC',
  CanManageBankAccountReportsDesc = 'canManageBankAccountReports_DESC',
  CanReadIncidentsAsc = 'canReadIncidents_ASC',
  CanReadIncidentsDesc = 'canReadIncidents_DESC',
  CanManageIncidentsAsc = 'canManageIncidents_ASC',
  CanManageIncidentsDesc = 'canManageIncidents_DESC',
  CanReadNewsItemsAsc = 'canReadNewsItems_ASC',
  CanReadNewsItemsDesc = 'canReadNewsItems_DESC',
  CanManageNewsItemsAsc = 'canManageNewsItems_ASC',
  CanManageNewsItemsDesc = 'canManageNewsItems_DESC',
  CanManageNewsItemTemplatesAsc = 'canManageNewsItemTemplates_ASC',
  CanManageNewsItemTemplatesDesc = 'canManageNewsItemTemplates_DESC',
  CanManageCallRecordsAsc = 'canManageCallRecords_ASC',
  CanManageCallRecordsDesc = 'canManageCallRecords_DESC',
  CanDownloadCallRecordsAsc = 'canDownloadCallRecords_ASC',
  CanDownloadCallRecordsDesc = 'canDownloadCallRecords_DESC',
  CanManageMobileFeatureConfigsAsc = 'canManageMobileFeatureConfigs_ASC',
  CanManageMobileFeatureConfigsDesc = 'canManageMobileFeatureConfigs_DESC',
  CanManageB2BAppsAsc = 'canManageB2BApps_ASC',
  CanManageB2BAppsDesc = 'canManageB2BApps_DESC',
  CanReadAnalyticsAsc = 'canReadAnalytics_ASC',
  CanReadAnalyticsDesc = 'canReadAnalytics_DESC',
  CanReadInvoicesAsc = 'canReadInvoices_ASC',
  CanReadInvoicesDesc = 'canReadInvoices_DESC',
  CanManageInvoicesAsc = 'canManageInvoices_ASC',
  CanManageInvoicesDesc = 'canManageInvoices_DESC',
  CanReadMarketItemsAsc = 'canReadMarketItems_ASC',
  CanReadMarketItemsDesc = 'canReadMarketItems_DESC',
  CanManageMarketItemsAsc = 'canManageMarketItems_ASC',
  CanManageMarketItemsDesc = 'canManageMarketItems_DESC',
  CanReadMetersAsc = 'canReadMeters_ASC',
  CanReadMetersDesc = 'canReadMeters_DESC',
  CanReadSettingsAsc = 'canReadSettings_ASC',
  CanReadSettingsDesc = 'canReadSettings_DESC',
  CanReadExternalReportsAsc = 'canReadExternalReports_ASC',
  CanReadExternalReportsDesc = 'canReadExternalReports_DESC',
  CanReadServicesAsc = 'canReadServices_ASC',
  CanReadServicesDesc = 'canReadServices_DESC',
  CanReadCallRecordsAsc = 'canReadCallRecords_ASC',
  CanReadCallRecordsDesc = 'canReadCallRecords_DESC',
  CanReadMarketItemPricesAsc = 'canReadMarketItemPrices_ASC',
  CanReadMarketItemPricesDesc = 'canReadMarketItemPrices_DESC',
  CanManageMarketItemPricesAsc = 'canManageMarketItemPrices_ASC',
  CanManageMarketItemPricesDesc = 'canManageMarketItemPrices_DESC',
  CanReadMarketPriceScopesAsc = 'canReadMarketPriceScopes_ASC',
  CanReadMarketPriceScopesDesc = 'canReadMarketPriceScopes_DESC',
  CanManageMarketPriceScopesAsc = 'canManageMarketPriceScopes_ASC',
  CanManageMarketPriceScopesDesc = 'canManageMarketPriceScopes_DESC',
  CanReadPaymentsWithInvoicesAsc = 'canReadPaymentsWithInvoices_ASC',
  CanReadPaymentsWithInvoicesDesc = 'canReadPaymentsWithInvoices_DESC',
  CanReadMarketplaceAsc = 'canReadMarketplace_ASC',
  CanReadMarketplaceDesc = 'canReadMarketplace_DESC',
  CanManageMarketplaceAsc = 'canManageMarketplace_ASC',
  CanManageMarketplaceDesc = 'canManageMarketplace_DESC',
  CanReadTourAsc = 'canReadTour_ASC',
  CanReadTourDesc = 'canReadTour_DESC',
  CanManageTourAsc = 'canManageTour_ASC',
  CanManageTourDesc = 'canManageTour_DESC',
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
  DvAsc = 'dv_ASC',
  DvDesc = 'dv_DESC'
}

export enum SortOrganizationEmployeesBy {
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
  HasAllSpecializationsAsc = 'hasAllSpecializations_ASC',
  HasAllSpecializationsDesc = 'hasAllSpecializations_DESC',
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

export enum SortOrganizationsBy {
  CountryAsc = 'country_ASC',
  CountryDesc = 'country_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  TinAsc = 'tin_ASC',
  TinDesc = 'tin_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  PhoneAsc = 'phone_ASC',
  PhoneDesc = 'phone_DESC',
  PhoneNumberPrefixAsc = 'phoneNumberPrefix_ASC',
  PhoneNumberPrefixDesc = 'phoneNumberPrefix_DESC',
  EmployeesAsc = 'employees_ASC',
  EmployeesDesc = 'employees_DESC',
  RelatedOrganizationsAsc = 'relatedOrganizations_ASC',
  RelatedOrganizationsDesc = 'relatedOrganizations_DESC',
  ImportRemoteSystemAsc = 'importRemoteSystem_ASC',
  ImportRemoteSystemDesc = 'importRemoteSystem_DESC',
  ImportIdAsc = 'importId_ASC',
  ImportIdDesc = 'importId_DESC',
  IsApprovedAsc = 'isApproved_ASC',
  IsApprovedDesc = 'isApproved_DESC',
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

export enum SortPropertiesBy {
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  UnitsCountAsc = 'unitsCount_ASC',
  UnitsCountDesc = 'unitsCount_DESC',
  UninhabitedUnitsCountAsc = 'uninhabitedUnitsCount_ASC',
  UninhabitedUnitsCountDesc = 'uninhabitedUnitsCount_DESC',
  IsApprovedAsc = 'isApproved_ASC',
  IsApprovedDesc = 'isApproved_DESC',
  YearOfConstructionAsc = 'yearOfConstruction_ASC',
  YearOfConstructionDesc = 'yearOfConstruction_DESC',
  AreaAsc = 'area_ASC',
  AreaDesc = 'area_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
  AddressKeyAsc = 'addressKey_ASC',
  AddressKeyDesc = 'addressKey_DESC',
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

export enum SortResidentsBy {
  UserAsc = 'user_ASC',
  UserDesc = 'user_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
  UnitTypeAsc = 'unitType_ASC',
  UnitTypeDesc = 'unitType_DESC',
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  AddressAsc = 'address_ASC',
  AddressDesc = 'address_DESC',
  AddressKeyAsc = 'addressKey_ASC',
  AddressKeyDesc = 'addressKey_DESC',
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

export enum SortTicketsBy {
  OrganizationAsc = 'organization_ASC',
  OrganizationDesc = 'organization_DESC',
  StatusReopenedCounterAsc = 'statusReopenedCounter_ASC',
  StatusReopenedCounterDesc = 'statusReopenedCounter_DESC',
  ReviewValueAsc = 'reviewValue_ASC',
  ReviewValueDesc = 'reviewValue_DESC',
  ReviewCommentAsc = 'reviewComment_ASC',
  ReviewCommentDesc = 'reviewComment_DESC',
  FeedbackValueAsc = 'feedbackValue_ASC',
  FeedbackValueDesc = 'feedbackValue_DESC',
  FeedbackCommentAsc = 'feedbackComment_ASC',
  FeedbackCommentDesc = 'feedbackComment_DESC',
  FeedbackUpdatedAtAsc = 'feedbackUpdatedAt_ASC',
  FeedbackUpdatedAtDesc = 'feedbackUpdatedAt_DESC',
  QualityControlValueAsc = 'qualityControlValue_ASC',
  QualityControlValueDesc = 'qualityControlValue_DESC',
  QualityControlCommentAsc = 'qualityControlComment_ASC',
  QualityControlCommentDesc = 'qualityControlComment_DESC',
  QualityControlUpdatedAtAsc = 'qualityControlUpdatedAt_ASC',
  QualityControlUpdatedAtDesc = 'qualityControlUpdatedAt_DESC',
  QualityControlUpdatedByAsc = 'qualityControlUpdatedBy_ASC',
  QualityControlUpdatedByDesc = 'qualityControlUpdatedBy_DESC',
  StatusUpdatedAtAsc = 'statusUpdatedAt_ASC',
  StatusUpdatedAtDesc = 'statusUpdatedAt_DESC',
  CompletedAtAsc = 'completedAt_ASC',
  CompletedAtDesc = 'completedAt_DESC',
  LastCommentAtAsc = 'lastCommentAt_ASC',
  LastCommentAtDesc = 'lastCommentAt_DESC',
  LastResidentCommentAtAsc = 'lastResidentCommentAt_ASC',
  LastResidentCommentAtDesc = 'lastResidentCommentAt_DESC',
  LastCommentWithResidentTypeAtAsc = 'lastCommentWithResidentTypeAt_ASC',
  LastCommentWithResidentTypeAtDesc = 'lastCommentWithResidentTypeAt_DESC',
  StatusReasonAsc = 'statusReason_ASC',
  StatusReasonDesc = 'statusReason_DESC',
  StatusAsc = 'status_ASC',
  StatusDesc = 'status_DESC',
  DeadlineAsc = 'deadline_ASC',
  DeadlineDesc = 'deadline_DESC',
  OrderAsc = 'order_ASC',
  OrderDesc = 'order_DESC',
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
  AssigneeAsc = 'assignee_ASC',
  AssigneeDesc = 'assignee_DESC',
  ExecutorAsc = 'executor_ASC',
  ExecutorDesc = 'executor_DESC',
  CategoryClassifierAsc = 'categoryClassifier_ASC',
  CategoryClassifierDesc = 'categoryClassifier_DESC',
  PlaceClassifierAsc = 'placeClassifier_ASC',
  PlaceClassifierDesc = 'placeClassifier_DESC',
  ProblemClassifierAsc = 'problemClassifier_ASC',
  ProblemClassifierDesc = 'problemClassifier_DESC',
  ClassifierAsc = 'classifier_ASC',
  ClassifierDesc = 'classifier_DESC',
  IsAutoClassifiedAsc = 'isAutoClassified_ASC',
  IsAutoClassifiedDesc = 'isAutoClassified_DESC',
  DetailsAsc = 'details_ASC',
  DetailsDesc = 'details_DESC',
  RelatedAsc = 'related_ASC',
  RelatedDesc = 'related_DESC',
  IsPaidAsc = 'isPaid_ASC',
  IsPaidDesc = 'isPaid_DESC',
  IsPayableAsc = 'isPayable_ASC',
  IsPayableDesc = 'isPayable_DESC',
  IsEmergencyAsc = 'isEmergency_ASC',
  IsEmergencyDesc = 'isEmergency_DESC',
  IsWarrantyAsc = 'isWarranty_ASC',
  IsWarrantyDesc = 'isWarranty_DESC',
  IsResidentTicketAsc = 'isResidentTicket_ASC',
  IsResidentTicketDesc = 'isResidentTicket_DESC',
  CanReadByResidentAsc = 'canReadByResident_ASC',
  CanReadByResidentDesc = 'canReadByResident_DESC',
  PropertyAsc = 'property_ASC',
  PropertyDesc = 'property_DESC',
  PropertyAddressAsc = 'propertyAddress_ASC',
  PropertyAddressDesc = 'propertyAddress_DESC',
  SectionNameAsc = 'sectionName_ASC',
  SectionNameDesc = 'sectionName_DESC',
  SectionTypeAsc = 'sectionType_ASC',
  SectionTypeDesc = 'sectionType_DESC',
  FloorNameAsc = 'floorName_ASC',
  FloorNameDesc = 'floorName_DESC',
  UnitNameAsc = 'unitName_ASC',
  UnitNameDesc = 'unitName_DESC',
  UnitTypeAsc = 'unitType_ASC',
  UnitTypeDesc = 'unitType_DESC',
  SourceAsc = 'source_ASC',
  SourceDesc = 'source_DESC',
  DeferredUntilAsc = 'deferredUntil_ASC',
  DeferredUntilDesc = 'deferredUntil_DESC',
  IsCompletedAfterDeadlineAsc = 'isCompletedAfterDeadline_ASC',
  IsCompletedAfterDeadlineDesc = 'isCompletedAfterDeadline_DESC',
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

export enum Status {
  Success = 'success',
  Error = 'error'
}

/**  Users request or contact with the user. It has fields `clientName`, `clientPhone`, `clientEmail`, which stores contact information at the moment of creating or updating. Values of these fields are independent from related entities, like Contact, Resident etc. If by some reason related entities will be deleted, unavailable or will change its contact information, these fields will stay unchanged.So, by creating a new ticket with connection to some contact entity (Contact, Resident), these fields will be populated by its contact information if other values are not explicitly provided.  */
export type Ticket = {
  __typename?: 'Ticket';
  /**  Ref to the organization. The object will be deleted if the organization ceases to exist  */
  organization?: Maybe<Organization>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientName?: Maybe<Scalars['String']>;
  /**  Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it  */
  clientPhone?: Maybe<Scalars['String']>;
  /**  Valid combination of 3 classifiers  */
  classifier?: Maybe<TicketClassifier>;
  /**  Text description of the issue. Maybe written by a user or an operator  */
  details?: Maybe<Scalars['String']>;
  /**  Property related to the Ticket  */
  property?: Maybe<Property>;
  /**  Flat number / door number of an apartment building (property). You need to take from Property.map  */
  unitName?: Maybe<Scalars['String']>;
  /**  Type of unit, such as parking lot or flat. Default value: "flat"  */
  unitType?: Maybe<Scalars['String']>;
  /**  Ticket source channel/system. Examples: call, email, visit, ...  */
  source?: Maybe<TicketSource>;
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

/**  Describes what type of work needs to be done to fix incident  */
export type TicketCategoryClassifier = {
  __typename?: 'TicketCategoryClassifier';
  /**  text description  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};

export type TicketCategoryClassifierRelateToOneInput = {
  connect?: Maybe<TicketCategoryClassifierWhereUniqueInput>;
  disconnect?: Maybe<TicketCategoryClassifierWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type TicketCategoryClassifierWhereInput = {
  AND?: Maybe<Array<Maybe<TicketCategoryClassifierWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketCategoryClassifierWhereInput>>>;
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

export type TicketCategoryClassifierWhereUniqueInput = {
  id: Scalars['ID'];
};

/**  Rules for all possible valid combinations of classifiers  */
export type TicketClassifier = {
  __typename?: 'TicketClassifier';
  /**  Location of incident  */
  place?: Maybe<TicketPlaceClassifier>;
  /**  Type of work to fix incident  */
  category?: Maybe<TicketCategoryClassifier>;
  /**  What needs to be done  */
  problem?: Maybe<TicketProblemClassifier>;
  id: Scalars['ID'];
};

export type TicketClassifierRelateToOneInput = {
  connect?: Maybe<TicketClassifierWhereUniqueInput>;
  disconnect?: Maybe<TicketClassifierWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type TicketClassifierWhereInput = {
  AND?: Maybe<Array<Maybe<TicketClassifierWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketClassifierWhereInput>>>;
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  place?: Maybe<TicketPlaceClassifierWhereInput>;
  place_is_null?: Maybe<Scalars['Boolean']>;
  category?: Maybe<TicketCategoryClassifierWhereInput>;
  category_is_null?: Maybe<Scalars['Boolean']>;
  problem?: Maybe<TicketProblemClassifierWhereInput>;
  problem_is_null?: Maybe<Scalars['Boolean']>;
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

export type TicketClassifierWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketCreateInput = {
  organization?: Maybe<OrganizationRelateToOneInput>;
  statusReopenedCounter?: Maybe<Scalars['Int']>;
  reviewValue?: Maybe<TicketReviewValueType>;
  reviewComment?: Maybe<Scalars['String']>;
  feedbackValue?: Maybe<TicketFeedbackValueType>;
  feedbackComment?: Maybe<Scalars['String']>;
  feedbackAdditionalOptions?: Maybe<Array<Maybe<FeedbackAdditionalOptionsType>>>;
  feedbackUpdatedAt?: Maybe<Scalars['String']>;
  qualityControlValue?: Maybe<TicketQualityControlValueType>;
  qualityControlComment?: Maybe<Scalars['String']>;
  qualityControlAdditionalOptions?: Maybe<Array<Maybe<QualityControlAdditionalOptionsType>>>;
  qualityControlUpdatedAt?: Maybe<Scalars['String']>;
  qualityControlUpdatedBy?: Maybe<UserRelateToOneInput>;
  statusUpdatedAt?: Maybe<Scalars['String']>;
  completedAt?: Maybe<Scalars['String']>;
  lastCommentAt?: Maybe<Scalars['String']>;
  lastResidentCommentAt?: Maybe<Scalars['String']>;
  lastCommentWithResidentTypeAt?: Maybe<Scalars['String']>;
  statusReason?: Maybe<Scalars['String']>;
  status?: Maybe<TicketStatusRelateToOneInput>;
  deadline?: Maybe<Scalars['String']>;
  order?: Maybe<Scalars['Int']>;
  number?: Maybe<Scalars['Int']>;
  client?: Maybe<UserRelateToOneInput>;
  contact?: Maybe<ContactRelateToOneInput>;
  clientName?: Maybe<Scalars['String']>;
  clientEmail?: Maybe<Scalars['String']>;
  clientPhone?: Maybe<Scalars['String']>;
  assignee?: Maybe<UserRelateToOneInput>;
  executor?: Maybe<UserRelateToOneInput>;
  categoryClassifier?: Maybe<TicketCategoryClassifierRelateToOneInput>;
  placeClassifier?: Maybe<TicketPlaceClassifierRelateToOneInput>;
  problemClassifier?: Maybe<TicketProblemClassifierRelateToOneInput>;
  classifier?: Maybe<TicketClassifierRelateToOneInput>;
  isAutoClassified?: Maybe<Scalars['Boolean']>;
  details?: Maybe<Scalars['String']>;
  related?: Maybe<TicketRelateToOneInput>;
  isPaid?: Maybe<Scalars['Boolean']>;
  isPayable?: Maybe<Scalars['Boolean']>;
  isEmergency?: Maybe<Scalars['Boolean']>;
  isWarranty?: Maybe<Scalars['Boolean']>;
  isResidentTicket?: Maybe<Scalars['Boolean']>;
  canReadByResident?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  property?: Maybe<PropertyRelateToOneInput>;
  propertyAddress?: Maybe<Scalars['String']>;
  propertyAddressMeta?: Maybe<Scalars['JSON']>;
  sectionName?: Maybe<Scalars['String']>;
  sectionType?: Maybe<Scalars['String']>;
  floorName?: Maybe<Scalars['String']>;
  unitName?: Maybe<Scalars['String']>;
  unitType?: Maybe<Scalars['String']>;
  source?: Maybe<TicketSourceRelateToOneInput>;
  sourceMeta?: Maybe<Scalars['JSON']>;
  deferredUntil?: Maybe<Scalars['String']>;
  isCompletedAfterDeadline?: Maybe<Scalars['Boolean']>;
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

export enum TicketFeedbackValueType {
  Bad = 'bad',
  Good = 'good',
  Returned = 'returned'
}

/**  Describes where the incident occurred  */
export type TicketPlaceClassifier = {
  __typename?: 'TicketPlaceClassifier';
  /**  text content  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};

export type TicketPlaceClassifierRelateToOneInput = {
  connect?: Maybe<TicketPlaceClassifierWhereUniqueInput>;
  disconnect?: Maybe<TicketPlaceClassifierWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type TicketPlaceClassifierWhereInput = {
  AND?: Maybe<Array<Maybe<TicketPlaceClassifierWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketPlaceClassifierWhereInput>>>;
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

export type TicketPlaceClassifierWhereUniqueInput = {
  id: Scalars['ID'];
};

/**  Describes what work needs to be done to fix incident  */
export type TicketProblemClassifier = {
  __typename?: 'TicketProblemClassifier';
  /**  text content  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};

export type TicketProblemClassifierRelateToOneInput = {
  connect?: Maybe<TicketProblemClassifierWhereUniqueInput>;
  disconnect?: Maybe<TicketProblemClassifierWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type TicketProblemClassifierWhereInput = {
  AND?: Maybe<Array<Maybe<TicketProblemClassifierWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketProblemClassifierWhereInput>>>;
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

export type TicketProblemClassifierWhereUniqueInput = {
  id: Scalars['ID'];
};

export enum TicketQualityControlValueType {
  Bad = 'bad',
  Good = 'good'
}

export type TicketRelateToOneInput = {
  create?: Maybe<TicketCreateInput>;
  connect?: Maybe<TicketWhereUniqueInput>;
  disconnect?: Maybe<TicketWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export enum TicketReviewValueType {
  Bad = 'bad',
  Good = 'good',
  Returned = 'returned'
}

/**  Ticket source. Income call, mobile app, external system, ...  */
export type TicketSource = {
  __typename?: 'TicketSource';
  /**  Localized Ticket source name  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  type?: Maybe<TicketSourceTypeType>;
};

export type TicketSourceRelateToOneInput = {
  connect?: Maybe<TicketSourceWhereUniqueInput>;
  disconnect?: Maybe<TicketSourceWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export enum TicketSourceTypeType {
  Email = 'email',
  MobileApp = 'mobile_app',
  RemoteSystem = 'remote_system',
  Call = 'call',
  Other = 'other',
  Visit = 'visit',
  WebApp = 'web_app',
  OrganizationSite = 'organization_site',
  Messenger = 'messenger',
  SocialNetwork = 'social_network',
  MobileAppStaff = 'mobile_app_staff',
  MobileAppResident = 'mobile_app_resident',
  CrmImport = 'crm_import'
}

export type TicketSourceWhereInput = {
  AND?: Maybe<Array<Maybe<TicketSourceWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketSourceWhereInput>>>;
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

export type TicketSourceWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketStatusRelateToOneInput = {
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

export type TicketStatusWhereInput = {
  AND?: Maybe<Array<Maybe<TicketStatusWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketStatusWhereInput>>>;
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

export type TicketStatusWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketWhereInput = {
  AND?: Maybe<Array<Maybe<TicketWhereInput>>>;
  OR?: Maybe<Array<Maybe<TicketWhereInput>>>;
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
  reviewValue?: Maybe<TicketReviewValueType>;
  reviewValue_not?: Maybe<TicketReviewValueType>;
  reviewValue_in?: Maybe<Array<Maybe<TicketReviewValueType>>>;
  reviewValue_not_in?: Maybe<Array<Maybe<TicketReviewValueType>>>;
  reviewComment?: Maybe<Scalars['String']>;
  reviewComment_not?: Maybe<Scalars['String']>;
  reviewComment_contains?: Maybe<Scalars['String']>;
  reviewComment_not_contains?: Maybe<Scalars['String']>;
  reviewComment_starts_with?: Maybe<Scalars['String']>;
  reviewComment_not_starts_with?: Maybe<Scalars['String']>;
  reviewComment_ends_with?: Maybe<Scalars['String']>;
  reviewComment_not_ends_with?: Maybe<Scalars['String']>;
  reviewComment_i?: Maybe<Scalars['String']>;
  reviewComment_not_i?: Maybe<Scalars['String']>;
  reviewComment_contains_i?: Maybe<Scalars['String']>;
  reviewComment_not_contains_i?: Maybe<Scalars['String']>;
  reviewComment_starts_with_i?: Maybe<Scalars['String']>;
  reviewComment_not_starts_with_i?: Maybe<Scalars['String']>;
  reviewComment_ends_with_i?: Maybe<Scalars['String']>;
  reviewComment_not_ends_with_i?: Maybe<Scalars['String']>;
  reviewComment_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  reviewComment_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  feedbackValue?: Maybe<TicketFeedbackValueType>;
  feedbackValue_not?: Maybe<TicketFeedbackValueType>;
  feedbackValue_in?: Maybe<Array<Maybe<TicketFeedbackValueType>>>;
  feedbackValue_not_in?: Maybe<Array<Maybe<TicketFeedbackValueType>>>;
  feedbackComment?: Maybe<Scalars['String']>;
  feedbackComment_not?: Maybe<Scalars['String']>;
  feedbackComment_contains?: Maybe<Scalars['String']>;
  feedbackComment_not_contains?: Maybe<Scalars['String']>;
  feedbackComment_starts_with?: Maybe<Scalars['String']>;
  feedbackComment_not_starts_with?: Maybe<Scalars['String']>;
  feedbackComment_ends_with?: Maybe<Scalars['String']>;
  feedbackComment_not_ends_with?: Maybe<Scalars['String']>;
  feedbackComment_i?: Maybe<Scalars['String']>;
  feedbackComment_not_i?: Maybe<Scalars['String']>;
  feedbackComment_contains_i?: Maybe<Scalars['String']>;
  feedbackComment_not_contains_i?: Maybe<Scalars['String']>;
  feedbackComment_starts_with_i?: Maybe<Scalars['String']>;
  feedbackComment_not_starts_with_i?: Maybe<Scalars['String']>;
  feedbackComment_ends_with_i?: Maybe<Scalars['String']>;
  feedbackComment_not_ends_with_i?: Maybe<Scalars['String']>;
  feedbackComment_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  feedbackComment_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  feedbackAdditionalOptions?: Maybe<Array<Maybe<FeedbackAdditionalOptionsType>>>;
  feedbackAdditionalOptions_not?: Maybe<Array<Maybe<FeedbackAdditionalOptionsType>>>;
  feedbackAdditionalOptions_in?: Maybe<Array<Maybe<Array<Maybe<FeedbackAdditionalOptionsType>>>>>;
  feedbackAdditionalOptions_not_in?: Maybe<Array<Maybe<Array<Maybe<FeedbackAdditionalOptionsType>>>>>;
  feedbackUpdatedAt?: Maybe<Scalars['String']>;
  feedbackUpdatedAt_not?: Maybe<Scalars['String']>;
  feedbackUpdatedAt_lt?: Maybe<Scalars['String']>;
  feedbackUpdatedAt_lte?: Maybe<Scalars['String']>;
  feedbackUpdatedAt_gt?: Maybe<Scalars['String']>;
  feedbackUpdatedAt_gte?: Maybe<Scalars['String']>;
  feedbackUpdatedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  feedbackUpdatedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  qualityControlValue?: Maybe<TicketQualityControlValueType>;
  qualityControlValue_not?: Maybe<TicketQualityControlValueType>;
  qualityControlValue_in?: Maybe<Array<Maybe<TicketQualityControlValueType>>>;
  qualityControlValue_not_in?: Maybe<Array<Maybe<TicketQualityControlValueType>>>;
  qualityControlComment?: Maybe<Scalars['String']>;
  qualityControlComment_not?: Maybe<Scalars['String']>;
  qualityControlComment_contains?: Maybe<Scalars['String']>;
  qualityControlComment_not_contains?: Maybe<Scalars['String']>;
  qualityControlComment_starts_with?: Maybe<Scalars['String']>;
  qualityControlComment_not_starts_with?: Maybe<Scalars['String']>;
  qualityControlComment_ends_with?: Maybe<Scalars['String']>;
  qualityControlComment_not_ends_with?: Maybe<Scalars['String']>;
  qualityControlComment_i?: Maybe<Scalars['String']>;
  qualityControlComment_not_i?: Maybe<Scalars['String']>;
  qualityControlComment_contains_i?: Maybe<Scalars['String']>;
  qualityControlComment_not_contains_i?: Maybe<Scalars['String']>;
  qualityControlComment_starts_with_i?: Maybe<Scalars['String']>;
  qualityControlComment_not_starts_with_i?: Maybe<Scalars['String']>;
  qualityControlComment_ends_with_i?: Maybe<Scalars['String']>;
  qualityControlComment_not_ends_with_i?: Maybe<Scalars['String']>;
  qualityControlComment_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  qualityControlComment_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  qualityControlAdditionalOptions?: Maybe<Array<Maybe<QualityControlAdditionalOptionsType>>>;
  qualityControlAdditionalOptions_not?: Maybe<Array<Maybe<QualityControlAdditionalOptionsType>>>;
  qualityControlAdditionalOptions_in?: Maybe<Array<Maybe<Array<Maybe<QualityControlAdditionalOptionsType>>>>>;
  qualityControlAdditionalOptions_not_in?: Maybe<Array<Maybe<Array<Maybe<QualityControlAdditionalOptionsType>>>>>;
  qualityControlUpdatedAt?: Maybe<Scalars['String']>;
  qualityControlUpdatedAt_not?: Maybe<Scalars['String']>;
  qualityControlUpdatedAt_lt?: Maybe<Scalars['String']>;
  qualityControlUpdatedAt_lte?: Maybe<Scalars['String']>;
  qualityControlUpdatedAt_gt?: Maybe<Scalars['String']>;
  qualityControlUpdatedAt_gte?: Maybe<Scalars['String']>;
  qualityControlUpdatedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  qualityControlUpdatedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  qualityControlUpdatedBy?: Maybe<UserWhereInput>;
  qualityControlUpdatedBy_is_null?: Maybe<Scalars['Boolean']>;
  statusUpdatedAt?: Maybe<Scalars['String']>;
  statusUpdatedAt_not?: Maybe<Scalars['String']>;
  statusUpdatedAt_lt?: Maybe<Scalars['String']>;
  statusUpdatedAt_lte?: Maybe<Scalars['String']>;
  statusUpdatedAt_gt?: Maybe<Scalars['String']>;
  statusUpdatedAt_gte?: Maybe<Scalars['String']>;
  statusUpdatedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  statusUpdatedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  completedAt?: Maybe<Scalars['String']>;
  completedAt_not?: Maybe<Scalars['String']>;
  completedAt_lt?: Maybe<Scalars['String']>;
  completedAt_lte?: Maybe<Scalars['String']>;
  completedAt_gt?: Maybe<Scalars['String']>;
  completedAt_gte?: Maybe<Scalars['String']>;
  completedAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  completedAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  lastCommentAt?: Maybe<Scalars['String']>;
  lastCommentAt_not?: Maybe<Scalars['String']>;
  lastCommentAt_lt?: Maybe<Scalars['String']>;
  lastCommentAt_lte?: Maybe<Scalars['String']>;
  lastCommentAt_gt?: Maybe<Scalars['String']>;
  lastCommentAt_gte?: Maybe<Scalars['String']>;
  lastCommentAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  lastCommentAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  lastResidentCommentAt?: Maybe<Scalars['String']>;
  lastResidentCommentAt_not?: Maybe<Scalars['String']>;
  lastResidentCommentAt_lt?: Maybe<Scalars['String']>;
  lastResidentCommentAt_lte?: Maybe<Scalars['String']>;
  lastResidentCommentAt_gt?: Maybe<Scalars['String']>;
  lastResidentCommentAt_gte?: Maybe<Scalars['String']>;
  lastResidentCommentAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  lastResidentCommentAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  lastCommentWithResidentTypeAt?: Maybe<Scalars['String']>;
  lastCommentWithResidentTypeAt_not?: Maybe<Scalars['String']>;
  lastCommentWithResidentTypeAt_lt?: Maybe<Scalars['String']>;
  lastCommentWithResidentTypeAt_lte?: Maybe<Scalars['String']>;
  lastCommentWithResidentTypeAt_gt?: Maybe<Scalars['String']>;
  lastCommentWithResidentTypeAt_gte?: Maybe<Scalars['String']>;
  lastCommentWithResidentTypeAt_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  lastCommentWithResidentTypeAt_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  deadline?: Maybe<Scalars['String']>;
  deadline_not?: Maybe<Scalars['String']>;
  deadline_lt?: Maybe<Scalars['String']>;
  deadline_lte?: Maybe<Scalars['String']>;
  deadline_gt?: Maybe<Scalars['String']>;
  deadline_gte?: Maybe<Scalars['String']>;
  deadline_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deadline_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  order?: Maybe<Scalars['Int']>;
  order_not?: Maybe<Scalars['Int']>;
  order_lt?: Maybe<Scalars['Int']>;
  order_lte?: Maybe<Scalars['Int']>;
  order_gt?: Maybe<Scalars['Int']>;
  order_gte?: Maybe<Scalars['Int']>;
  order_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
  order_not_in?: Maybe<Array<Maybe<Scalars['Int']>>>;
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
  assignee?: Maybe<UserWhereInput>;
  assignee_is_null?: Maybe<Scalars['Boolean']>;
  executor?: Maybe<UserWhereInput>;
  executor_is_null?: Maybe<Scalars['Boolean']>;
  categoryClassifier?: Maybe<TicketCategoryClassifierWhereInput>;
  categoryClassifier_is_null?: Maybe<Scalars['Boolean']>;
  placeClassifier?: Maybe<TicketPlaceClassifierWhereInput>;
  placeClassifier_is_null?: Maybe<Scalars['Boolean']>;
  problemClassifier?: Maybe<TicketProblemClassifierWhereInput>;
  problemClassifier_is_null?: Maybe<Scalars['Boolean']>;
  classifier?: Maybe<TicketClassifierWhereInput>;
  classifier_is_null?: Maybe<Scalars['Boolean']>;
  isAutoClassified?: Maybe<Scalars['Boolean']>;
  isAutoClassified_not?: Maybe<Scalars['Boolean']>;
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
  isPayable?: Maybe<Scalars['Boolean']>;
  isPayable_not?: Maybe<Scalars['Boolean']>;
  isEmergency?: Maybe<Scalars['Boolean']>;
  isEmergency_not?: Maybe<Scalars['Boolean']>;
  isWarranty?: Maybe<Scalars['Boolean']>;
  isWarranty_not?: Maybe<Scalars['Boolean']>;
  isResidentTicket?: Maybe<Scalars['Boolean']>;
  isResidentTicket_not?: Maybe<Scalars['Boolean']>;
  canReadByResident?: Maybe<Scalars['Boolean']>;
  canReadByResident_not?: Maybe<Scalars['Boolean']>;
  meta?: Maybe<Scalars['JSON']>;
  meta_not?: Maybe<Scalars['JSON']>;
  meta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  meta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  property?: Maybe<PropertyWhereInput>;
  property_is_null?: Maybe<Scalars['Boolean']>;
  propertyAddress?: Maybe<Scalars['String']>;
  propertyAddress_not?: Maybe<Scalars['String']>;
  propertyAddress_contains?: Maybe<Scalars['String']>;
  propertyAddress_not_contains?: Maybe<Scalars['String']>;
  propertyAddress_starts_with?: Maybe<Scalars['String']>;
  propertyAddress_not_starts_with?: Maybe<Scalars['String']>;
  propertyAddress_ends_with?: Maybe<Scalars['String']>;
  propertyAddress_not_ends_with?: Maybe<Scalars['String']>;
  propertyAddress_i?: Maybe<Scalars['String']>;
  propertyAddress_not_i?: Maybe<Scalars['String']>;
  propertyAddress_contains_i?: Maybe<Scalars['String']>;
  propertyAddress_not_contains_i?: Maybe<Scalars['String']>;
  propertyAddress_starts_with_i?: Maybe<Scalars['String']>;
  propertyAddress_not_starts_with_i?: Maybe<Scalars['String']>;
  propertyAddress_ends_with_i?: Maybe<Scalars['String']>;
  propertyAddress_not_ends_with_i?: Maybe<Scalars['String']>;
  propertyAddress_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  propertyAddress_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  propertyAddressMeta?: Maybe<Scalars['JSON']>;
  propertyAddressMeta_not?: Maybe<Scalars['JSON']>;
  propertyAddressMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  propertyAddressMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
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
  sectionType?: Maybe<Scalars['String']>;
  sectionType_not?: Maybe<Scalars['String']>;
  sectionType_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  sectionType_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  unitType?: Maybe<Scalars['String']>;
  unitType_not?: Maybe<Scalars['String']>;
  unitType_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  unitType_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  source?: Maybe<TicketSourceWhereInput>;
  source_is_null?: Maybe<Scalars['Boolean']>;
  sourceMeta?: Maybe<Scalars['JSON']>;
  sourceMeta_not?: Maybe<Scalars['JSON']>;
  sourceMeta_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  sourceMeta_not_in?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  deferredUntil?: Maybe<Scalars['String']>;
  deferredUntil_not?: Maybe<Scalars['String']>;
  deferredUntil_lt?: Maybe<Scalars['String']>;
  deferredUntil_lte?: Maybe<Scalars['String']>;
  deferredUntil_gt?: Maybe<Scalars['String']>;
  deferredUntil_gte?: Maybe<Scalars['String']>;
  deferredUntil_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  deferredUntil_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  isCompletedAfterDeadline?: Maybe<Scalars['Boolean']>;
  isCompletedAfterDeadline_not?: Maybe<Scalars['Boolean']>;
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

export type TicketWhereUniqueInput = {
  id: Scalars['ID'];
};

export type TicketsCreateInput = {
  data?: Maybe<TicketCreateInput>;
};


/**  Individual / person / service account / impersonal company account. Used primarily for authorization purposes, optimized access control with checking of `type` field, tracking authority of performed CRUD operations. Think of `User` as a technical entity, not a business actor. Business actor entities are Resident, OrganizationEmployee etc., — they are participating in high-level business scenarios and have connected to `User`. Almost everyting, created in the system, ends up to `User` as a source of action.  */
export type User = {
  __typename?: 'User';
  /**  Name. If impersonal account should be a company name  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /**  Phone. In international E.164 format without spaces  */
  phone?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['String']>;
};

export enum UserLocaleType {
  Ru = 'ru',
  En = 'en'
}

export type UserRelateToOneInput = {
  connect?: Maybe<UserWhereUniqueInput>;
  disconnect?: Maybe<UserWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export type UserRightsSetWhereInput = {
  AND?: Maybe<Array<Maybe<UserRightsSetWhereInput>>>;
  OR?: Maybe<Array<Maybe<UserRightsSetWhereInput>>>;
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
  canReadB2BApps?: Maybe<Scalars['Boolean']>;
  canReadB2BApps_not?: Maybe<Scalars['Boolean']>;
  canManageB2BApps?: Maybe<Scalars['Boolean']>;
  canManageB2BApps_not?: Maybe<Scalars['Boolean']>;
  canReadB2BAppAccessRights?: Maybe<Scalars['Boolean']>;
  canReadB2BAppAccessRights_not?: Maybe<Scalars['Boolean']>;
  canManageB2BAppAccessRights?: Maybe<Scalars['Boolean']>;
  canManageB2BAppAccessRights_not?: Maybe<Scalars['Boolean']>;
  canReadB2BAppAccessRightSets?: Maybe<Scalars['Boolean']>;
  canReadB2BAppAccessRightSets_not?: Maybe<Scalars['Boolean']>;
  canManageB2BAppAccessRightSets?: Maybe<Scalars['Boolean']>;
  canManageB2BAppAccessRightSets_not?: Maybe<Scalars['Boolean']>;
  canReadB2BAppContexts?: Maybe<Scalars['Boolean']>;
  canReadB2BAppContexts_not?: Maybe<Scalars['Boolean']>;
  canManageB2BAppContexts?: Maybe<Scalars['Boolean']>;
  canManageB2BAppContexts_not?: Maybe<Scalars['Boolean']>;
  canReadB2BAppNewsSharingConfigs?: Maybe<Scalars['Boolean']>;
  canReadB2BAppNewsSharingConfigs_not?: Maybe<Scalars['Boolean']>;
  canManageB2BAppNewsSharingConfigs?: Maybe<Scalars['Boolean']>;
  canManageB2BAppNewsSharingConfigs_not?: Maybe<Scalars['Boolean']>;
  canReadB2BAppPermissions?: Maybe<Scalars['Boolean']>;
  canReadB2BAppPermissions_not?: Maybe<Scalars['Boolean']>;
  canManageB2BAppPermissions?: Maybe<Scalars['Boolean']>;
  canManageB2BAppPermissions_not?: Maybe<Scalars['Boolean']>;
  canReadB2BAppPromoBlocks?: Maybe<Scalars['Boolean']>;
  canReadB2BAppPromoBlocks_not?: Maybe<Scalars['Boolean']>;
  canManageB2BAppPromoBlocks?: Maybe<Scalars['Boolean']>;
  canManageB2BAppPromoBlocks_not?: Maybe<Scalars['Boolean']>;
  canReadB2CApps?: Maybe<Scalars['Boolean']>;
  canReadB2CApps_not?: Maybe<Scalars['Boolean']>;
  canManageB2CApps?: Maybe<Scalars['Boolean']>;
  canManageB2CApps_not?: Maybe<Scalars['Boolean']>;
  canReadB2CAppAccessRights?: Maybe<Scalars['Boolean']>;
  canReadB2CAppAccessRights_not?: Maybe<Scalars['Boolean']>;
  canManageB2CAppAccessRights?: Maybe<Scalars['Boolean']>;
  canManageB2CAppAccessRights_not?: Maybe<Scalars['Boolean']>;
  canReadB2CAppBuilds?: Maybe<Scalars['Boolean']>;
  canReadB2CAppBuilds_not?: Maybe<Scalars['Boolean']>;
  canManageB2CAppBuilds?: Maybe<Scalars['Boolean']>;
  canManageB2CAppBuilds_not?: Maybe<Scalars['Boolean']>;
  canReadB2CAppProperties?: Maybe<Scalars['Boolean']>;
  canReadB2CAppProperties_not?: Maybe<Scalars['Boolean']>;
  canManageB2CAppProperties?: Maybe<Scalars['Boolean']>;
  canManageB2CAppProperties_not?: Maybe<Scalars['Boolean']>;
  canReadOrganizations?: Maybe<Scalars['Boolean']>;
  canReadOrganizations_not?: Maybe<Scalars['Boolean']>;
  canManageOrganizations?: Maybe<Scalars['Boolean']>;
  canManageOrganizations_not?: Maybe<Scalars['Boolean']>;
  canReadTickets?: Maybe<Scalars['Boolean']>;
  canReadTickets_not?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageTickets_not?: Maybe<Scalars['Boolean']>;
  canReadTicketAutoAssignments?: Maybe<Scalars['Boolean']>;
  canReadTicketAutoAssignments_not?: Maybe<Scalars['Boolean']>;
  canManageTicketAutoAssignments?: Maybe<Scalars['Boolean']>;
  canManageTicketAutoAssignments_not?: Maybe<Scalars['Boolean']>;
  canReadOidcClients?: Maybe<Scalars['Boolean']>;
  canReadOidcClients_not?: Maybe<Scalars['Boolean']>;
  canManageOidcClients?: Maybe<Scalars['Boolean']>;
  canManageOidcClients_not?: Maybe<Scalars['Boolean']>;
  canReadUsers?: Maybe<Scalars['Boolean']>;
  canReadUsers_not?: Maybe<Scalars['Boolean']>;
  canReadUserRightsSets?: Maybe<Scalars['Boolean']>;
  canReadUserRightsSets_not?: Maybe<Scalars['Boolean']>;
  canManageUserRightsSets?: Maybe<Scalars['Boolean']>;
  canManageUserRightsSets_not?: Maybe<Scalars['Boolean']>;
  canExecuteRegisterNewServiceUser?: Maybe<Scalars['Boolean']>;
  canExecuteRegisterNewServiceUser_not?: Maybe<Scalars['Boolean']>;
  canExecuteSendMessage?: Maybe<Scalars['Boolean']>;
  canExecuteSendMessage_not?: Maybe<Scalars['Boolean']>;
  canManageOrganizationIsApprovedField?: Maybe<Scalars['Boolean']>;
  canManageOrganizationIsApprovedField_not?: Maybe<Scalars['Boolean']>;
  canReadUserEmailField?: Maybe<Scalars['Boolean']>;
  canReadUserEmailField_not?: Maybe<Scalars['Boolean']>;
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

export enum UserTypeType {
  Staff = 'staff',
  Resident = 'resident',
  Service = 'service'
}

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
  locale?: Maybe<UserLocaleType>;
  locale_not?: Maybe<UserLocaleType>;
  locale_in?: Maybe<Array<Maybe<UserLocaleType>>>;
  locale_not_in?: Maybe<Array<Maybe<UserLocaleType>>>;
  customAccess?: Maybe<CustomAccessInput>;
  customAccess_not?: Maybe<CustomAccessInput>;
  customAccess_in?: Maybe<Array<Maybe<CustomAccessInput>>>;
  customAccess_not_in?: Maybe<Array<Maybe<CustomAccessInput>>>;
  showGlobalHints?: Maybe<Scalars['Boolean']>;
  showGlobalHints_not?: Maybe<Scalars['Boolean']>;
  rightsSet?: Maybe<UserRightsSetWhereInput>;
  rightsSet_is_null?: Maybe<Scalars['Boolean']>;
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

export type _InternalDeleteMeterAndMeterReadingsInput = {
  dv: Scalars['Int'];
  sender: SenderFieldInput;
  propertyIds?: Maybe<Array<Maybe<Scalars['ID']>>>;
  organizationId: Scalars['ID'];
};

export type _InternalDeleteMeterAndMeterReadingsOutput = {
  __typename?: '_internalDeleteMeterAndMeterReadingsOutput';
  status: Status;
  metersToDelete: Scalars['Int'];
  deletedMeters: Scalars['Int'];
};

export type _InternalDeleteMeterReadingsInput = {
  dv: Scalars['Int'];
  sender: SenderFieldInput;
  propertyIds?: Maybe<Array<Maybe<Scalars['ID']>>>;
  organizationId: Scalars['ID'];
  startDateTime: Scalars['String'];
  endDateTime: Scalars['String'];
};

export type _InternalDeleteMeterReadingsOutput = {
  __typename?: '_internalDeleteMeterReadingsOutput';
  status: Status;
  toDelete: Scalars['Int'];
  deleted: Scalars['Int'];
};

export type _InternalScheduleTaskByNameInput = {
  dv: Scalars['Int'];
  sender: Scalars['JSON'];
  taskName: Scalars['String'];
  taskArgs?: Maybe<Scalars['JSON']>;
};

export type _InternalScheduleTaskByNameOutput = {
  __typename?: '_internalScheduleTaskByNameOutput';
  id: Scalars['String'];
};

export type _InternalSendNotificationNewMobileAppVersionInput = {
  dv: Scalars['Int'];
  sender: SenderFieldInput;
  platform: MobilePlatform;
  app: MobileApp;
  buildVersion: Scalars['String'];
  title?: Maybe<Scalars['String']>;
  body?: Maybe<Scalars['String']>;
  organizationIds?: Maybe<Array<Scalars['ID']>>;
};

export type _InternalSendNotificationNewMobileAppVersionOutput = {
  __typename?: '_internalSendNotificationNewMobileAppVersionOutput';
  messageBatchId: Scalars['ID'];
};

export type _InternalSyncContactsWithResidentsForOrganizationInput = {
  dv: Scalars['Int'];
  sender: SenderFieldInput;
  organization: OrganizationWhereUniqueInput;
};

export type _KsListsMetaInput = {
  key?: Maybe<Scalars['String']>;
  /** Whether this is an auxiliary helper list */
  auxiliary?: Maybe<Scalars['Boolean']>;
};
