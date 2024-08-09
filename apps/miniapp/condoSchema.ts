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
  canReadTickets?: Maybe<Scalars['Boolean']>;
  canReadTickets_not?: Maybe<Scalars['Boolean']>;
  canManageTickets?: Maybe<Scalars['Boolean']>;
  canManageTickets_not?: Maybe<Scalars['Boolean']>;
  canReadTicketComments?: Maybe<Scalars['Boolean']>;
  canReadTicketComments_not?: Maybe<Scalars['Boolean']>;
  canManageTicketComments?: Maybe<Scalars['Boolean']>;
  canManageTicketComments_not?: Maybe<Scalars['Boolean']>;
  canReadTicketFiles?: Maybe<Scalars['Boolean']>;
  canReadTicketFiles_not?: Maybe<Scalars['Boolean']>;
  canManageTicketFiles?: Maybe<Scalars['Boolean']>;
  canManageTicketFiles_not?: Maybe<Scalars['Boolean']>;
  canReadTicketCommentFiles?: Maybe<Scalars['Boolean']>;
  canReadTicketCommentFiles_not?: Maybe<Scalars['Boolean']>;
  canManageTicketCommentFiles?: Maybe<Scalars['Boolean']>;
  canManageTicketCommentFiles_not?: Maybe<Scalars['Boolean']>;
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

export enum B2BAppCategoryType {
  Dispatching = 'DISPATCHING',
  Gis = 'GIS',
  SmartHome = 'SMART_HOME',
  BusinessDevelopment = 'BUSINESS_DEVELOPMENT',
  Finance = 'FINANCE',
  Other = 'OTHER'
}

/**  Object which connects B2B App and Organization. Used to determine if app is connected or not, and store settings / state of app for specific organization  */
export type B2BAppContext = {
  __typename?: 'B2BAppContext';
  /**  B2B App  */
  app?: Maybe<B2BApp>;
  /**  Organization  */
  organization?: Maybe<Organization>;
  /**  Status of B2BApp connection, Can be one of the following: ["InProgress", "Error", "Finished"]. If not specified explicitly on creation, uses default value from related B2BApp model  */
  status?: Maybe<B2BAppContextStatusType>;
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

export enum B2BAppContextDefaultStatusType {
  InProgress = 'InProgress',
  Error = 'Error',
  Finished = 'Finished'
}

export enum B2BAppContextStatusType {
  InProgress = 'InProgress',
  Error = 'Error',
  Finished = 'Finished'
}

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
  status?: Maybe<B2BAppContextStatusType>;
  status_not?: Maybe<B2BAppContextStatusType>;
  status_in?: Maybe<Array<Maybe<B2BAppContextStatusType>>>;
  status_not_in?: Maybe<Array<Maybe<B2BAppContextStatusType>>>;
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

export enum B2BAppIconType {
  AlertCircle = 'AlertCircle',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  BarChartHorizontal = 'BarChartHorizontal',
  BarChartVertical = 'BarChartVertical',
  Bill = 'Bill',
  Briefcase = 'Briefcase',
  Building = 'Building',
  CalendarDays = 'CalendarDays',
  Car = 'Car',
  Check = 'Check',
  CheckCircle = 'CheckCircle',
  CheckSquare = 'CheckSquare',
  ChevronDown = 'ChevronDown',
  ChevronLeft = 'ChevronLeft',
  ChevronRight = 'ChevronRight',
  ChevronUp = 'ChevronUp',
  CircleEllipsis = 'CircleEllipsis',
  Clock = 'Clock',
  Close = 'Close',
  Contacts = 'Contacts',
  Copy = 'Copy',
  CreditCard = 'CreditCard',
  DoorOpen = 'DoorOpen',
  Doors = 'Doors',
  Download = 'Download',
  Edit = 'Edit',
  Employee = 'Employee',
  ExternalLink = 'ExternalLink',
  Eye = 'Eye',
  EyeOff = 'EyeOff',
  FileCheck = 'FileCheck',
  FileDown = 'FileDown',
  FileEdit = 'FileEdit',
  FileText = 'FileText',
  FileUp = 'FileUp',
  Filter = 'Filter',
  Flat = 'Flat',
  Floor = 'Floor',
  Frown = 'Frown',
  Globe = 'Globe',
  Guide = 'Guide',
  History = 'History',
  Home = 'Home',
  House = 'House',
  Inbox = 'Inbox',
  Info = 'Info',
  Interfloor = 'Interfloor',
  Key = 'Key',
  Layers = 'Layers',
  LayoutList = 'LayoutList',
  Link = 'Link',
  List = 'List',
  Lock = 'Lock',
  LogOut = 'LogOut',
  Mail = 'Mail',
  Market = 'Market',
  Menu = 'Menu',
  Meters = 'Meters',
  MinusCircle = 'MinusCircle',
  MoreHorizontal = 'MoreHorizontal',
  MoreVertical = 'MoreVertical',
  NewAppeal = 'NewAppeal',
  Newspaper = 'Newspaper',
  OnOff = 'OnOff',
  Paperclip = 'Paperclip',
  Parking = 'Parking',
  Pause = 'Pause',
  PauseFilled = 'PauseFilled',
  Phone = 'Phone',
  PhoneIncoming = 'PhoneIncoming',
  PhoneOutgoing = 'PhoneOutgoing',
  PieChart = 'PieChart',
  Play = 'Play',
  PlayFilled = 'PlayFilled',
  Plus = 'Plus',
  PlusCircle = 'PlusCircle',
  Print = 'Print',
  QuestionCircle = 'QuestionCircle',
  Readings = 'Readings',
  RefreshCw = 'RefreshCw',
  Rocket = 'Rocket',
  Ruble = 'Ruble',
  Sber = 'Sber',
  Search = 'Search',
  Send = 'Send',
  Services = 'Services',
  Settings = 'Settings',
  Share = 'Share',
  Sheet = 'Sheet',
  Slash = 'Slash',
  SmartHome = 'SmartHome',
  Smartphone = 'Smartphone',
  Smile = 'Smile',
  SortAsc = 'SortAsc',
  SortDesc = 'SortDesc',
  Star = 'Star',
  StarFilled = 'StarFilled',
  Subtitles = 'Subtitles',
  Trash = 'Trash',
  Unlock = 'Unlock',
  User = 'User',
  UserSquare = 'UserSquare',
  Wallet = 'Wallet',
  XCircle = 'XCircle'
}

export enum B2BAppLabelType {
  Free = 'FREE',
  Discount = 'DISCOUNT',
  Popular = 'POPULAR',
  New = 'NEW'
}

export enum B2BAppMenuCategoryType {
  Tour = 'TOUR',
  Dashboard = 'DASHBOARD',
  Communication = 'COMMUNICATION',
  Properties = 'PROPERTIES',
  Residents = 'RESIDENTS',
  Employees = 'EMPLOYEES',
  Market = 'MARKET',
  Billing = 'BILLING',
  Meters = 'METERS',
  Miniapps = 'MINIAPPS',
  Settings = 'SETTINGS'
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
  previewPicture?: Maybe<Scalars['String']>;
  previewPicture_not?: Maybe<Scalars['String']>;
  previewPicture_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  previewPicture_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  customFormUrl?: Maybe<Scalars['String']>;
  customFormUrl_not?: Maybe<Scalars['String']>;
  customFormUrl_contains?: Maybe<Scalars['String']>;
  customFormUrl_not_contains?: Maybe<Scalars['String']>;
  customFormUrl_starts_with?: Maybe<Scalars['String']>;
  customFormUrl_not_starts_with?: Maybe<Scalars['String']>;
  customFormUrl_ends_with?: Maybe<Scalars['String']>;
  customFormUrl_not_ends_with?: Maybe<Scalars['String']>;
  customFormUrl_i?: Maybe<Scalars['String']>;
  customFormUrl_not_i?: Maybe<Scalars['String']>;
  customFormUrl_contains_i?: Maybe<Scalars['String']>;
  customFormUrl_not_contains_i?: Maybe<Scalars['String']>;
  customFormUrl_starts_with_i?: Maybe<Scalars['String']>;
  customFormUrl_not_starts_with_i?: Maybe<Scalars['String']>;
  customFormUrl_ends_with_i?: Maybe<Scalars['String']>;
  customFormUrl_not_ends_with_i?: Maybe<Scalars['String']>;
  customFormUrl_in?: Maybe<Array<Maybe<Scalars['String']>>>;
  customFormUrl_not_in?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  icon?: Maybe<B2BAppIconType>;
  icon_not?: Maybe<B2BAppIconType>;
  icon_in?: Maybe<Array<Maybe<B2BAppIconType>>>;
  icon_not_in?: Maybe<Array<Maybe<B2BAppIconType>>>;
  menuCategory?: Maybe<B2BAppMenuCategoryType>;
  menuCategory_not?: Maybe<B2BAppMenuCategoryType>;
  menuCategory_in?: Maybe<Array<Maybe<B2BAppMenuCategoryType>>>;
  menuCategory_not_in?: Maybe<Array<Maybe<B2BAppMenuCategoryType>>>;
  contextDefaultStatus?: Maybe<B2BAppContextDefaultStatusType>;
  contextDefaultStatus_not?: Maybe<B2BAppContextDefaultStatusType>;
  contextDefaultStatus_in?: Maybe<Array<Maybe<B2BAppContextDefaultStatusType>>>;
  contextDefaultStatus_not_in?: Maybe<Array<Maybe<B2BAppContextDefaultStatusType>>>;
  category?: Maybe<B2BAppCategoryType>;
  category_not?: Maybe<B2BAppCategoryType>;
  category_in?: Maybe<Array<Maybe<B2BAppCategoryType>>>;
  category_not_in?: Maybe<Array<Maybe<B2BAppCategoryType>>>;
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
  label?: Maybe<B2BAppLabelType>;
  label_not?: Maybe<B2BAppLabelType>;
  label_in?: Maybe<Array<Maybe<B2BAppLabelType>>>;
  label_not_in?: Maybe<Array<Maybe<B2BAppLabelType>>>;
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

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

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
  /**  Create a single B2BAppRole item.  */
  createB2BAppRole?: Maybe<B2BAppRole>;
  /**  Create multiple B2BAppRole items.  */
  createB2BAppRoles?: Maybe<Array<Maybe<B2BAppRole>>>;
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
};

export type OrganizationEmployeeRoleRelateToOneInput = {
  connect?: Maybe<OrganizationEmployeeRoleWhereUniqueInput>;
  disconnect?: Maybe<OrganizationEmployeeRoleWhereUniqueInput>;
  disconnectAll?: Maybe<Scalars['Boolean']>;
};

export enum OrganizationEmployeeRoleTicketVisibilityTypeType {
  Organization = 'organization',
  Property = 'property',
  PropertyAndSpecialization = 'propertyAndSpecialization',
  Assigned = 'assigned'
}

export type OrganizationEmployeeRoleWhereInput = {
  AND?: Maybe<Array<Maybe<OrganizationEmployeeRoleWhereInput>>>;
  OR?: Maybe<Array<Maybe<OrganizationEmployeeRoleWhereInput>>>;
  organization?: Maybe<OrganizationWhereInput>;
  organization_is_null?: Maybe<Scalars['Boolean']>;
  isDefault?: Maybe<Scalars['Boolean']>;
  isDefault_not?: Maybe<Scalars['Boolean']>;
  isEditable?: Maybe<Scalars['Boolean']>;
  isEditable_not?: Maybe<Scalars['Boolean']>;
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
  ticketVisibilityType?: Maybe<OrganizationEmployeeRoleTicketVisibilityTypeType>;
  ticketVisibilityType_not?: Maybe<OrganizationEmployeeRoleTicketVisibilityTypeType>;
  ticketVisibilityType_in?: Maybe<Array<Maybe<OrganizationEmployeeRoleTicketVisibilityTypeType>>>;
  ticketVisibilityType_not_in?: Maybe<Array<Maybe<OrganizationEmployeeRoleTicketVisibilityTypeType>>>;
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
  canReadMarketSetting?: Maybe<Scalars['Boolean']>;
  canReadMarketSetting_not?: Maybe<Scalars['Boolean']>;
  canManageMarketSetting?: Maybe<Scalars['Boolean']>;
  canManageMarketSetting_not?: Maybe<Scalars['Boolean']>;
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

export enum OrganizationTypeType {
  ManagingCompany = 'MANAGING_COMPANY',
  Holding = 'HOLDING',
  ServiceProvider = 'SERVICE_PROVIDER'
}

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
  type?: Maybe<OrganizationTypeType>;
  type_not?: Maybe<OrganizationTypeType>;
  type_in?: Maybe<Array<Maybe<OrganizationTypeType>>>;
  type_not_in?: Maybe<Array<Maybe<OrganizationTypeType>>>;
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

export enum Status {
  Success = 'success',
  Error = 'error'
}


/**  Individual / person / service account / impersonal company account. Used primarily for authorization purposes, optimized access control with checking of `type` field, tracking authority of performed CRUD operations. Think of `User` as a technical entity, not a business actor. Business actor entities are Resident, OrganizationEmployee etc., — they are participating in high-level business scenarios and have connected to `User`. Almost everyting, created in the system, ends up to `User` as a source of action.  */
export type User = {
  __typename?: 'User';
  /**  Name. If impersonal account should be a company name  */
  name?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
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
  canReadMessages?: Maybe<Scalars['Boolean']>;
  canReadMessages_not?: Maybe<Scalars['Boolean']>;
  canReadMessageBatches?: Maybe<Scalars['Boolean']>;
  canReadMessageBatches_not?: Maybe<Scalars['Boolean']>;
  canManageMessageBatches?: Maybe<Scalars['Boolean']>;
  canManageMessageBatches_not?: Maybe<Scalars['Boolean']>;
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
  canReadPayments?: Maybe<Scalars['Boolean']>;
  canReadPayments_not?: Maybe<Scalars['Boolean']>;
  canReadBillingReceipts?: Maybe<Scalars['Boolean']>;
  canReadBillingReceipts_not?: Maybe<Scalars['Boolean']>;
  canReadBillingOrganizationIntegrationContexts?: Maybe<Scalars['Boolean']>;
  canReadBillingOrganizationIntegrationContexts_not?: Maybe<Scalars['Boolean']>;
  canExecuteRegisterNewServiceUser?: Maybe<Scalars['Boolean']>;
  canExecuteRegisterNewServiceUser_not?: Maybe<Scalars['Boolean']>;
  canExecuteSendMessage?: Maybe<Scalars['Boolean']>;
  canExecuteSendMessage_not?: Maybe<Scalars['Boolean']>;
  canExecute_internalSendHashedResidentPhones?: Maybe<Scalars['Boolean']>;
  canExecute_internalSendHashedResidentPhones_not?: Maybe<Scalars['Boolean']>;
  canExecute_allPaymentsSum?: Maybe<Scalars['Boolean']>;
  canExecute_allPaymentsSum_not?: Maybe<Scalars['Boolean']>;
  canExecute_allBillingReceiptsSum?: Maybe<Scalars['Boolean']>;
  canExecute_allBillingReceiptsSum_not?: Maybe<Scalars['Boolean']>;
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

export type _InternalSendHashedResidentPhonesInput = {
  dv: Scalars['Int'];
  sender: SenderFieldInput;
};

export type _InternalSendHashedResidentPhonesOutput = {
  __typename?: '_internalSendHashedResidentPhonesOutput';
  taskId: Scalars['ID'];
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
