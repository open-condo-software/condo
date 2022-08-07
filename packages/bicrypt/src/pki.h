#ifndef _BICR50_H_
#define _BICR50_H_


#ifndef CR_ZAG

#ifdef WIN64
#define DECL __stdcall
#define DECL8 char * __stdcall
#else
#define DECL __declspec(dllexport) __stdcall
#define DECL8 __declspec(dllexport) char * __stdcall
#endif

typedef unsigned char UInt8;
typedef int Int32;
typedef unsigned int UInt32;

typedef void * PLibTime;
typedef void * CFG_CTX;
typedef void * H_TWOKEYS;
typedef void * PNodeList;
typedef void * H_DIGEST;
typedef void * OP_CTX;
typedef void * OP_CTX_SIGN;
typedef void * OP_CTX_CHECK;
typedef void * OP_CTX_ENC;
typedef void * OP_CTX_DEC;
typedef void * OP_CTX_TLS;

typedef enum _CARRIER_TYPE
{
	CARRIER_FILE = 0,
	CARRIER_TM = 1,
	CARRIER_VPNKEY = 2

} CARRIER_TYPE;


typedef enum _SIGN_OP_TYPE
{
	OP_CreateAttached = 0,        // buffer с определенной длиной
	OP_CreateAttachedUndef = 1,   // buffer с неопределенной длиной
	OP_CreateDetachedHash = 2,    // hash
	OP_CreateDetached = 3,		  // buffer с определенной длиной
	OP_CreateDetachedUndef = 4,	  // buffer с неопределенной длиной
	OP_AddSign = 5 //(добавить ЭП в существующую CMS)

} SIGN_OP_TYPE;

#endif //CR_ZAG


#ifdef __BORLANDC__
#define _In_
#define _Out_
#endif
#define _In_Out_

#define MAX_NUMOF_SIGN 100

#if defined(__cplusplus)
extern "C" {
#endif

// --- Служебные функции ---

PNodeList DECL cr_GetNextNode(PNodeList cc);	//1.1
PNodeList DECL cr_GetLastNode(PNodeList cc);	//1.2
DECL8 cr_GetNodeFilename(PNodeList Anode);		//1.5
Int32 DECL cr_GetNodeBuffer(PNodeList node, UInt8 *buffer, UInt32 *bufferLength);	//1.6
Int32 DECL cr_GetNodeStatus(PNodeList node);	//1.7
Int32 DECL cr_GetSizeNodeList(PNodeList cc);	//1.8
Int32 DECL cr_CreateLibraryTime(PLibTime *time); //2.1
Int32 DECL cr_FreeLibraryTime(PLibTime *time);	//2.2
Int32 DECL cr_GetCurrentLibTime(PLibTime currentTime);	//2.3
Int32 DECL cr_SetLibraryTime(PLibTime time, UInt32 d,UInt32 m, UInt32 y, UInt32 h,UInt32 mm,UInt32 s); //2.4
Int32 DECL cr_GetLibraryTime(PLibTime time, UInt32 *d,UInt32 *m, UInt32 *y, UInt32 *h,UInt32 *mm,UInt32 *s); //2.5
Int32 DECL cr_CopyLibraryTime(PLibTime time1, PLibTime time2); //2.6
Int32 DECL cr_FreeCertificateChain(PNodeList *CertChainToFree); //5.9



// --- Контекст и работа с ним -----

Int32 DECL cr_CreateContext( _In_ PLibTime time,
			_Out_ CFG_CTX* ctx);

Int32 DECL cr_AddCert( _In_ CFG_CTX ctx, 
			_In_ char *Filename,
			_In_ UInt8* binary_cert, 
			_In_ UInt32 certLength);

Int32 DECL cr_AddCertGUI( _In_ CFG_CTX ctx, 
			_In_ UInt8* binary_cert, 
			_In_ UInt32 certLength);

Int32 DECL cr_AddCrl( _In_ CFG_CTX ctx, 
			_In_ char *Filename,
			_In_ UInt8* binary_crl, 
			_In_ UInt32 crlLength);

Int32 DECL cr_LoadPrnd( _In_ CFG_CTX ctx, int flag_init_grn);

Int32 DECL cr_LoadPrndGUI( _In_ CFG_CTX ctx);

Int32 DECL cr_DupContext( _In_ CFG_CTX ctx_in, 
			_Out_ CFG_CTX* ctx_out);

Int32 DECL cr_FreeContext( _In_ CFG_CTX *ctx);



// --- Закрытый ключ и личный сертификат ------

Int32 DECL cr_GetNumOfBinds( _In_ CFG_CTX ctx, 
			_Out_ UInt32 *numof_binds);

Int32 DECL cr_GetBindLabel( _In_ CFG_CTX ctx, 
			_In_ UInt32 bind_number,
			_Out_ char* bind_label,
			_In_Out_ UInt32* bindLength);

Int32 DECL cr_GetPrivateKeyCarrierFromBind( _In_ CFG_CTX ctx, 
			_In_ UInt32 bind_number,
			_Out_ CARRIER_TYPE* carrier);

Int32 DECL cr_GetPrndCarrier( _In_ CFG_CTX ctx, 
			_Out_ CARRIER_TYPE* carrier);

Int32 DECL cr_GetCertificateFromBind( _In_ CFG_CTX ctx, 
			_In_ UInt32 bind_number,
			_Out_ char *Filename,
			UInt32 *FilenameLength,
			_Out_ UInt8* binary_cert, 
			_In_Out_ UInt32 *certLength);

Int32 DECL cr_FindBind( _In_ CFG_CTX ctx, 
			_In_ UInt8* binary_cert, 
			_In_ UInt32 certLength,
			_Out_ UInt32* bind_number);

Int32 DECL cr_LoadKeyPairFromBind( _In_ CFG_CTX ctx, 
			_In_ UInt32 bind_number,
			_In_ char *Apassw,
			_Out_ H_TWOKEYS* keypair);

Int32 DECL cr_LoadKeyPairGUI( _In_ CFG_CTX ctx, 
			_Out_ H_TWOKEYS* keypair);

Int32 DECL cr_FreeKeyPair( _In_ H_TWOKEYS* keypair);



// ----- Формирование ЭП ------

Int32 DECL cr_SignInit( _In_ CFG_CTX ctx, 
			_In_ H_TWOKEYS key, 
			_In_ int include_certs_len, // длина вкладываемой в CMS цепочки сертификатов
			_In_ UInt8* unsigned_attrs, 
			_In_ UInt8* signed_attrs, 
			_In_ int enum_included_signed_attrs, 
			_In_ SIGN_OP_TYPE operation_type, 
			_Out_ OP_CTX_SIGN* s_ctx);

Int32 DECL cr_SignPutHash( _In_ OP_CTX_SIGN s_ctx,  
			_In_ H_DIGEST digest);

Int32 DECL cr_SignPutData( _In_ OP_CTX_SIGN s_ctx,  
			_In_ UInt8* data_to_sign,
			_In_ UInt32 dataLength );

Int32 DECL cr_SignPutDataUndefLen( _In_ OP_CTX_SIGN s_ctx,  
			_In_ UInt8* in_data_part, 
			_In_ UInt32 dataLength,
			_Out_ UInt8* out_cms_part,
			_In_Out_ UInt32* cmsLength );

Int32 DECL cr_SignPutCms( _In_ OP_CTX_SIGN s_ctx,  
			_In_ UInt8* cms_in,
			_In_ UInt32 cmsLength);

Int32 DECL cr_SignPutCmsStream( _In_ OP_CTX_SIGN s_ctx, 
			_In_ UInt8* in_cms_part, 
			_In_ UInt32 cmsLength,
			_Out_ UInt8* out_cms_part,
			_In_Out_ UInt32* out_cmsLength );

Int32 DECL cr_Sign( _In_ OP_CTX_SIGN *s_ctx, 
			_Out_ UInt8* final_cms,
			_In_Out_ UInt32* cmsLength );



// ----- Проверка ЭП ------

Int32 DECL cr_CheckInit( _In_ CFG_CTX ctx, 
			_Out_ OP_CTX_CHECK* c_ctx);

Int32 DECL cr_CheckPutHash( _In_ OP_CTX_CHECK c_ctx, 
			_In_ H_DIGEST digest);

Int32 DECL cr_CheckPutData( _In_ OP_CTX_CHECK c_ctx, 
			_In_ UInt8* data_part,
			_In_ UInt32 dataLength);

Int32 DECL cr_CheckPutCms( _In_ OP_CTX_CHECK c_ctx,  
			_In_ UInt8* cms_part,
			_In_ UInt32 cmsLength);

Int32 DECL cr_Check( _In_ OP_CTX_CHECK *c_ctx,
			_Out_ UInt32 *ResultNumOfSign,
			_Out_ int ResultSign[MAX_NUMOF_SIGN],
			_Out_ PNodeList ResultCertChain[MAX_NUMOF_SIGN]);



// ----- Шифрование ----------

Int32 DECL cr_EncryptInit( _In_ CFG_CTX ctx, 
			_In_ UInt32 numof_recipient,
			_In_ UInt8 *recipient_binary_cert, 
			_In_ UInt32 *recipient_binary_length,
			_In_ int length_flag,
			_In_ int OID_Included_Data,
			_Out_ OP_CTX_ENC* enc_ctx);

Int32 DECL cr_EncryptUndefLen( _In_ OP_CTX_ENC enc_ctx, 
			_In_ UInt8* data, 
			_In_ UInt32 dataLength, 
			_Out_ UInt8* encrypted_data,
			_In_Out_ UInt32* encrypted_data_length);

Int32 DECL cr_Encrypt( _In_ OP_CTX_ENC *enc_ctx, 
			_In_ UInt8* data, 
			_In_ UInt32 dataLength, 
			_Out_ UInt8* final_encrypted_data,
			_In_Out_ UInt32* final_encrypted_data_length);



// ---- Расшифрование ------

Int32 DECL cr_DecryptInit( _In_ CFG_CTX ctx, 
			_In_ H_TWOKEYS key, 
   			_Out_ OP_CTX_DEC* dec_ctx);

Int32 DECL cr_DecryptUndefLen( _In_ OP_CTX_DEC dec_ctx, 
    		_In_ UInt8* enveloped_cms_part, 
			_In_ UInt32 cmsLength, 
    		_Out_ UInt8* decrypted_data_part,
			_In_Out_ UInt32* decrypted_data_length);

Int32 DECL cr_Decrypt( _In_ OP_CTX_DEC *dec_ctx, 
			_In_ UInt8* enveloped_cms_data_final, 
			_In_ UInt32 cmsLength, 
			_Out_ int* OID_Included_Data,
			_Out_ UInt8* data,
			_In_Out_ UInt32* decrypted_data_length);



// ---- Проверка ЭП основных сущностей ------

Int32 DECL cr_CheckCertificate( _In_ CFG_CTX ctx, 
			_In_ UInt8* binary_cert, 
			_In_ UInt32 certLength, 
			_Out_ PNodeList* certChain);

Int32 DECL cr_CheckPKCS10( _In_ CFG_CTX ctx,  
			_In_ UInt8* pkcs,
			_In_ UInt32 pkcsLength);

Int32 DECL cr_CheckCrl( _In_ CFG_CTX ctx, 
			_In_ UInt8* binary_crl, 
			_In_ UInt32 crlLength, 
			_Out_ PNodeList* certChain);



// ---- Генерация ключевых пар (запросов на сертификат) ------

Int32 DECL cr_GenerateKeyPairGUI( _In_ CFG_CTX ctx,
			_In_ UInt8* distinguished_name, 
			_In_ UInt32 distinguished_nameLength,
			_In_ UInt8* attributes,  
			_In_ UInt32 attributesLength,
			_In_ char *userid,
			_In_ char Aparam,
			_Out_ UInt8* pkcs10_binary, 
			_Out_ UInt32* pkcs10Length);

	//no cr_
Int32 DECL gray_GenerateKeyPair( _In_ CFG_CTX ctx,
			_In_ UInt8* distinguished_name, 
			_In_ UInt32 distinguished_nameLength,
			_In_ UInt8* attributes,  
			_In_ UInt32 attributesLength,
			_In_ char *userid,
			_In_ char Aparam,
			_In_ CARRIER_TYPE carrier,
			_In_ char *Filename,
			_Out_ char* password,
			_Out_ UInt8* pkcs10_binary, 
			_Out_ UInt32* pkcs10Length);



// ------- Методы вычисления хеша -----------------------

Int32 DECL cr_DigestInit( _In_ CFG_CTX ctx, 
			_Out_ H_DIGEST* hDigest);

Int32 DECL cr_DigestParam( _In_ H_DIGEST hDigest,
			_In_ char param);

Int32 DECL cr_DigestUpdate( _In_ H_DIGEST hDigest, 
			_In_ UInt8* data_next,
			_In_ UInt32 data_length);

Int32 DECL cr_DigestFinal( _In_ H_DIGEST hDigest,
    		_Out_ UInt8* hashData,
    		_In_Out_ UInt32 *hashDataLength);

Int32 DECL cr_DigestClose( _In_ H_DIGEST *hDigest);



// ------- Функции TLS -----------------------

Int32 DECL cr_TLSInit( _In_ CFG_CTX ctx, 
			_In_ char* server_addres,
			_In_ H_TWOKEYS key, 
			_Out_ OP_CTX_TLS *ctx_tls);

Int32 DECL cr_TLSServerInit( _In_ CFG_CTX ctx, 
			_In_ char* server_addres,
			_In_ UInt32 auth_type,
			_In_ H_TWOKEYS key, 
			_Out_ OP_CTX_TLS *ctx_tls);

Int32 DECL cr_TLSHandshake( _In_ OP_CTX_TLS ctx_tls,
			_In_ UInt8* inbuf, 
			_In_ UInt32 length, 
			_Out_ UInt8* outbuf, 
			_In_Out_ UInt32* retlength);

Int32 DECL cr_TLSRead( _In_ OP_CTX_TLS ctx_tls,
			_In_ UInt8* inbuf, 
			_In_ UInt32 length, 
			_Out_ UInt8* outbuf, 
			_In_Out_ UInt32* retlength);

Int32 DECL cr_TLSWrite( _In_ OP_CTX_TLS ctx_tls,
			_In_ UInt8* inbuf, 
			_In_ UInt32 length, 
			_Out_ UInt8* outbuf, 
			_In_Out_ UInt32* retlength);

Int32 DECL cr_TLSReset( _In_ OP_CTX_TLS ctx_tls);

Int32 DECL cr_TLSGetRemoteCert( _In_ OP_CTX_TLS ctx_tls,
			_Out_ UInt8* binary_cert, 
			_In_Out_ UInt32 certLength);


#if defined(__cplusplus)
} //extern "C"
#endif

#endif
