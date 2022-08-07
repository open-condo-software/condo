#ifndef _ERRORS_H_
#define _ERRORS_H_

#define ERR_MEM 				1
#define ERR_BAD_SIGN			2
#define ERR_BAD_LEN				3
#define ERR_BAD_USER			4
#define ERR_CRYDRV				5
#define ERR_INIT_CRYMASK		6
#define ERR_NOT_SUPPORTED   	8
#define ERR_CRC_SK_FILE			9
#define ERR_THREAD				10
#define ERR_NO_SIGN				11
#define ERR_OPEN_FILE			12
#define ERR_OPEN_MK_FILE		13
#define ERR_OPEN_PUB			14
#define ERR_OPEN_SK_FILE		15
#define ERR_TOO_MANY			16
#define ERR_READ_SK_FILE		17
#define ERR_READ_MK_FILE		18
#define ERR_SIGN_NO_REG			19
#define ERR_BAD_SELFTEST		20
#define ERR_GK_READ				21
#define ERR_UZ_READ				22
#define ERR_CRC_GKUZ			23
#define ERR_GKUZ_PSW			24
#define ERR_DSCH				25
#define ERR_CRC_TM				26
#define ERR_LOAD_GRN_DLL		27
#define ERR_STOP				28
#define ERR_TMDRV_NOT_FOUND		29
#define ERR_NO_TM_ATTACHED		30
#define ERR_READ_TM				31
#define ERR_BAD_PARAM			32
#define ERR_BAD_HANDLE			33
#define ERR_HANDLE_TYPE			34
#define ERR_WRITE_TM			35

//----------- Crypt only ------------------------------
#define ERR_READ_NET_FILE		37
#define ERR_INIT				39
#define ERR_LOAD_KEY			40
#define ERR_NET_KEY				42
#define ERR_NO_CRYP				43
#define ERR_BAD_CRYP			44
#define ERR_FILE_KEY			45
#define ERR_READ_FILE			46
#define ERR_WRITE_FILE			47
#define ERR_COMPRESS			48
#define ERR_MORE_DATA			49

//----------- FPSU only ------------------------------
#define  ERR_DEVICE_NOT_FOUND   101
#define  ERR_NO_SOCKET          102
#define  ERR_NO_RESOLVE         103
#define  ERR_NO_RESPONSE        104
#define  ERR_BAD_PACKET         105
#define  ERR_NO_TCPIP           106
#define  ERR_NO_KEY             107
#define  ERR_FPSU_BAD_PARAM     108
#define  ERR_DRIVER_INTERNAL    109
#define  ERR_TIMEOUT            110
#define  ERR_BAD_VERSION        111

//----------- Bad Init ------------------------------
#define ERR_NOT_USED_TMDRV 11110
#define ERR_NOT_USED_DSCH  11111
#define ERR_NOT_USED_GKUZ  11112

// ************************************   Asn1Pars ERROR codes   *********************************************

#define ERR_OK					0

#define ERR_UNKNOWN_ASN1_TYPE	300
#define ERR_ENCODE				301
#define ERR_DECODE				302
#define ERR_LONG_TAG			303
#define ERR_LONG_LENGTH			304
#define ERR_TEMPLATE			305
#define ERR_CHOICE_TYPE			306
#define ERR_BAD_ASN1_OBJECT		307
#define ERR_UNKNOWN_OID			308
#define ERR_UNKNOWN_ID			309
#define ERR_CONVERT				310

#define ERR_STRUCT_VALUE_NOT_SET		311
#define ERR_UNKNOWN_CERTIFICATE_TYPE	312
#define ERR_GET_CURRENT_TIME			313
#define ERR_NOT_SIGNED_DATA_TYPE		314
#define ERR_CMS_NO_SIGNER_INFO			315
#define	ERR_CMS_DONT_HAVE_DATA			316
#define ERR_UNSUPPORTED_ALGORITHM		317
#define ERR_LOAD_LIBRARY				318
#define ERR_BAD_PEM						319
#define ERR_DIFFERENT					320
#define ERR_NOT_ISSUER_CERTIFICATE		321
#define ERR_NOT_FOUND					322

#define ERR_HASH_ATTRIBUTES				323
#define ERR_HASH_NOT_EQUAL				324
#define ERR_BAD_CERTIFICATES_COUNT		325
#define ERR_CERTIFICATE_NOT_FOUND		326
#define ERR_CERTIFICATE_TIME_ELAPSED	327
#define ERR_CERTIFICATE_NOT_ROOT		328
#define	ERR_SIGNING_TIME_ELAPSED		329
#define ERR_CERTIFICATE_NOT_CHECKED		330
#define ERR_NOT_ENCRYPTED_DATA_TYPE		331

#define ERR_CERT_IN_CRL				    332
#define ERR_CRL_BAD_SIGN			    333
#define ERR_CRL_TIME_ELAPSED		    334

#define ERR_INVALID_UNDEFINED_LENGTH	335
#define ERR_TAG_MISMATCH				336

#define ERR_CRL_DECODE				    337

#define ERR_BUFFER_IN_STACK_TO_SMALL	338
#define ERR_CA_CONSTRAINTS_UNSATISFACT	339
#define ERR_IMPROPER_CERTIFICATE		340
#define ERR_NO_ELG_KEY					341
#define ERR_PARAMETERS_ABSENT			342
#define ERR_PATH_LEN_CONSTRAINT			343

#endif
