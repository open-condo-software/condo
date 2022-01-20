#ifndef _B_CRY_H_
#define _B_CRY_H_

#ifndef DECL
#ifdef UNIX
#define DECL
#else
#define DECL __stdcall
#endif
#endif

#define cVPNKEY  16
#define cFPSU    8
#define cTMDRV   4
#define cDSCH    2
#define cGKUZ    1

#ifdef BICR_OLDAPI

typedef struct { void *empty; } CR_INIT;
typedef struct { void *empty; } CR_USER;
typedef struct { void *empty; } CR_NET;
typedef struct { void *empty; } CR_PKEY;
typedef struct { void *empty; } CR_PKBASE;
typedef struct { void *empty; } CR_HASH;
#define H_INIT 		CR_INIT*
#define H_USER 		CR_USER*
#define H_NET 		CR_NET*
#define H_PKEY 		CR_PKEY*
#define H_PKBASE 	CR_PKBASE*
#define H_HASH 		CR_HASH*
#define BICR_HANDLE void*

#else //BICR_OLDAPI

#ifdef WIN64
typedef __int64 BICR_HANDLE;
#else
#ifdef UNIX64
typedef long long BICR_HANDLE;
#else
typedef int BICR_HANDLE;
#endif
#endif

typedef BICR_HANDLE H_INIT;
typedef BICR_HANDLE H_USER;
typedef BICR_HANDLE H_NET;
typedef BICR_HANDLE H_PKEY;
typedef BICR_HANDLE H_PKBASE;
typedef BICR_HANDLE H_HASH;

#endif //BICR_OLDAPI

//razmer kriptozagolovka
#define CR_HDR_SIZE 48
//razmer kriptozagolovka v novom formate
#define CR_HDR_SIZE60 60

#if defined(__cplusplus)
extern "C" {
#endif

int DECL cr_load_bicr_dll(char *dll_path);

// initsializatsija biblioteki dlja BiCrypt 4.0
int DECL cr_init_bicr4 (char *dll_path, int tm_flag,
	const char *gk,
	const char *uz,
	const char *psw,
	void *tm_number,
	int *tmn_blen,
	int *init_mode,
	H_INIT *init_struct,
	char *prnd_filename, int flag_init_grn, int *warning);

// initsializatsija biblioteki dlja Windows 95/NT s funktsijami shifrovanija
int DECL cr_init (int tm_flag,
	const char *gk,
	const char *uz,
	const char *psw,
	void *tm_number,
	int *tmn_blen,
	int *init_mode,
	H_INIT *init_struct );

//gruzit GK iz bufera dliny gk_len
//gruzit UZ iz bufera dliny uz_len
int DECL cr_init_buf (int tm_flag,
  	const char *gk, int gk_len,
  	const char *uz, int uz_len,
  	const char *psw,
  	void *tm_number,
  	int *tmn_blen,
  	int *init_mode,
  	H_INIT *init_struct );

//deinitsializatsija biblioteki
int DECL cr_uninit ( H_INIT init_struct );

//otkryt' hesh
int DECL cr_hash_open ( H_HASH *hash_struct );

//vychislit' hesh
int DECL cr_hash_calc ( H_HASH hash_struct,
  	void *buf,
  	int buf_len );

//vozvratit' hesh
int DECL cr_hash_return ( H_HASH hash_struct,
  	void *res,
  	int *res_blen );

//zakryt' hesh
int DECL cr_hash_close ( H_HASH hash_struct );

//sgenerirovat' master klyuch
int DECL cr_gen_masterkey ( H_INIT init_struct, void *masterkey, int *master_len );

//ystanavlivaet master-klyuch i masku
int DECL cr_install_masterkey ( H_INIT init_struct, 
    void *masterkey, int master_len,
    void *masterkey_gk, int *master_blen_gk );

//sgenerirovat' klyuchi podpisi (OLDAPI)
int DECL cr_gen_elgkey ( H_INIT init_struct,
  	char *password, int *passlen,
  	void *secrkey, int *secr_blen,
  	H_PKEY *pkey_struct,
  	char *userid,
  	void *tm_number, int *tmn_blen );

//sgenerirovat' klyuchi podpisi i ne vydavat ih naruzhu
int DECL cr_gen_onetime_keypair(H_INIT init_struct,
  H_USER *user_struct,
  H_PKEY *pkey_struct,
  char *userid);

//sgenerirovat' klyuchi podpisi v fail (API 4.0)
int DECL cr_gen_keypair ( H_INIT init_struct,
  	char *password, int *passlen,
	char *ConfidentFilename,
  	H_PKEY *pkey_struct,
  	char *userid);

//sgenerirovat' klyuchi podpisi na master klyuche (API 4.0)
int DECL cr_gen_keypair_mk ( H_INIT init_struct,
  	const void *masterkey, int master_len,
	char *ConfidentFilename,
  	H_PKEY *pkey_struct,
  	char *userid);

//Generiruet klyuch podpisi
//esli mode=0 to rabotaet analogichno cr_gen_elgkey
//esli mode=1 togda zapisyvaet klyuch nachinaja so smeschenija 128
int DECL cr_gen_elgkey_ext ( H_INIT init_struct,
	const char *userid,
	char *password, int *pass_blen,
	void *secrkey, int *secr_blen,
	int mode,
	H_PKEY *pkey_struct, 
	void *tm_number, int *tmn_blen );

//sgenerirovat' klyuchi podpisi na master klyuche (OLDAPI)
int DECL cr_gen_elgkey_mk ( H_INIT init_struct,
  	const void *masterkey, int master_len,
  	void *secrkey, int *secr_blen,
  	H_PKEY *pkey_struct,
  	char *userid,
  	void *tm_number, int *tmn_blen );

//Generiruet klyuch podpisi
//esli mode=0 to rabotaet analogichno cr_gen_elgkey_mk
//esli mode=1 togda zapisyvaet klyuch nachinaja so smeschenija 128
int DECL cr_gen_elgkey_mk_ext ( H_INIT init_struct,
	const char *userid,
	const void *masterkey, int master_len,
	void *secrkey, int *secr_blen,
	int mode,
	H_PKEY *pkey_struct,
	void *tm_number, int *tmn_blen );

//zagruzit' klyuch podpisi (OLDAPI)
int DECL cr_load_elgkey ( H_INIT init_struct,
  	char *password, int pass_len,
  	void *secrkey, int secr_blen,
  	void *tm_number, int *tmn_blen,
  	char *userid, int *userid_blen,
  	H_USER *user_struct );

//sozdat' zatravku DSCH v file ili na tabletku (filename=NULL)
//esli flag_init_grn!=0 togda vyzyvaet klaviaturnyj DSCH
int DECL cr_init_prnd(H_INIT init_struct, char *filename, int flag_init_grn);

//zapisat' zatravku DSCH v file ili na tabletku (filename=NULL)
int DECL cr_write_prnd(H_INIT init_struct, char *filename);

//zagruzit' klyuch podpisi iz faila (API 4.0)
int DECL cr_read_skey ( H_INIT init_struct,
  	char *password, int pass_len,
  	char *ConfidentFilename,
  	char *userid, int *userid_blen,
  	H_USER *user_struct );

//zagruzit' dopolnitel'nyj klyuch podpisi (mode=1)
//zagruzit' osnovnoj klyuch podpisi (mode=0)
int DECL cr_load_elgkey_ext ( H_INIT init_struct,
  	char *password, int pass_len,
  	void *secrkey, int secr_blen,
  	void *tm_number, int *tmn_blen,
  	char *userid, int *userid_blen,
  	int mode,
  	H_USER *user_struct );

//zagruzit' klyuchi podpisi na master klyuche (OLDAPI)
int DECL cr_load_elgkey_mk ( H_INIT init_struct,
  	void *masterkey, int master_len,
  	void *secrkey, int secr_len,
  	void *tm_number, int *tmn_blen,
  	char *userid, int *userid_blen,
  	H_USER *user_struct );

//zagruzit' klyuch podpisi na master klyuche (API 4.0)
int DECL cr_read_skey_mk ( H_INIT init_struct,
  	void *masterkey, int master_len,
	char *ConfidentFilename,
  	char *userid, int *userid_blen,
  	H_USER *user_struct );
 
//zagruzit' dopolnitel'nyj klyuch podpisi na master klyuche (mode=1)
int DECL cr_load_elgkey_mk_ext ( H_INIT init_struct,
  	void *masterkey, int master_len,
  	void *secrkey, int secr_len,
  	void *tm_number, int *tmn_blen,
  	char *userid, int *userid_blen,
  	int mode,
  	H_USER *user_struct );

//sgenerirovat' public key
int DECL cr_gen_pubkey ( H_INIT init_struct,
  	H_USER user_struct,
  	H_PKEY *pkey_struct );

//zakryt' deskriptor H_USER
int DECL cr_elgkey_close ( H_INIT init_struct, H_USER user_struct );

//podpisat' bufer
int DECL cr_sign_buf ( H_INIT init_struct,
  	H_USER user_struct,
  	void *buf, int buf_len,
  	void *sign,	int *sign_blen );

//proverit' bufer
int DECL cr_check_buf ( H_INIT init_struct,
  	H_PKEY pkey,
  	void *buf, int buf_blen,
  	void *sign, int sign_blen );

//podpisat' hesh
int DECL cr_sign_hash ( H_INIT init_struct,
  	H_USER user_struct,
  	void *hash, int hash_blen,
  	void *sign, int *sign_blen );

//proverit' hesh
int DECL cr_check_hash ( H_INIT init_struct,
	H_PKEY pkey,
	void *hash, int hash_blen,
	void *sign, int sign_blen );

//vernut' nomer tabletki
int DECL cr_get_tm_number ( H_INIT init_struct, 
	void *tm_number, int *tmn_blen );

//poluchit' identifikator sekretnogo klyucha
int DECL cr_elgkey_getid ( H_INIT init_struct,
  	H_USER user_struct,
  	char *userid, int *userid_blen );

// initsalizirovat' deskriptor publichnyh klyuchej H_PKBASE dannymi iz pamjati
int DECL cr_pkbase_open_membuf ( void *membuf, int mem_blen,
	int com_blen,
	H_PKBASE* pkbase_struct );

//initsializirovat' deskriptor publichnyh klyuchej H_PKBASE dannymi iz fajla/FPSU
int DECL cr_pkbase_load ( H_INIT init_struct, 
	char *pk_file,
	int com_blen,
	int flag_modify,
	H_PKBASE* pkbase_struct );

//initsializirovat' deskriptor publichnyh klyuchej H_PKBASE dannymi iz fajla
// flag_modify = 1 esli bazu budut modifitsirovat'
// flag_modify = 0 esli baza ostanetsja prezhnej
int DECL cr_pkbase_open ( char *pk_file, 
	int com_blen, 
	int flag_modify,
	H_PKBASE* pkbase_struct );

//zakryt' deskriptor H_PKBASE
int DECL cr_pkbase_close ( H_PKBASE pkbase_struct );

//zakryt' deskriptor s otkrytym klyuchom
int DECL cr_pkey_close ( H_PKEY pkey_struct );

//proverit' nalichie otkrytogo klyucha v spravochnike
//esli najden - vozvratit' ukazatel' na nee, esli eto trebuetsja (pkey!=NULL)
int DECL cr_pkbase_find ( H_PKBASE pkbase_struct,
   const char *userid,
   void *comment, int *com_blen,
   H_PKEY *pkey_struct );

//dobavit' novyj ili zamenit' suschestvuyuschij publichnyj klyuch
int DECL cr_pkbase_add ( H_PKBASE pkbase_struct,
   H_PKEY pkey_struct,
   void *comment, int com_blen );
   
//ubrat' publichnyj klyuch iz spravochnika
int DECL cr_pkbase_remove ( H_PKBASE pkbase_struct,
   const char *userid );
   
//sohranit' spravochnik v fajl
int DECL cr_pkbase_save ( H_PKBASE pkbase_struct, 
	const char *pk_file );

//ustanovka setevyh klyuchej na disk
int DECL cr_install_netkey ( H_INIT init_struct, 
	const char *input_key, 
	const char *input_nkl, 
	const char *output_nkl );

//prochitat' tri stranitsy iz tabletki
int DECL cr_read_three_tm_page ( H_INIT init_struct,
  	void *pagebufer );

//sozdat' deskriptor H_PKEY s odnim otkrytym klyuchom
int DECL cr_pkey_put ( void *pubkey, 
	char *namkey, 
	H_PKEY *struct_pkey );

// poluchit' identifikator otkrytogo klyucha
int DECL cr_pkey_getid ( H_PKEY pkey_struct, 
	char *userid, 
	int *userid_blen );

//proverit' (flag_del=1 - udalit') podpis' nomer N dlja fajla, N>=1
int DECL cr_check_file ( H_INIT init_struct,
    H_PKBASE pkbase_struct,
    const char *file_name, 
    int N, 
    int flag_del,
    char *userid, int *userid_blen );

//podpisat' fajl
int DECL cr_sign_file ( H_INIT init_struct,
    H_USER user_struct,
    const char *file_name );

//initsializiruet funktsiyu ProcentFunc dlja vyvoda protsenta ispolnenija fajla
//ProcentData mozhet soderzhat' lyubye dannye pol'zovatelja, naprimer HWND okna
//oni peredayutsja kak pervyj parametr pri posleduyuschem vyzove ProcentFunc
int DECL cr_set_procent_callback ( H_INIT init_struct, 
	int(*ProcentFunc)(void*,long,long), 
	void *ProcentData );

#ifdef UNIX
int DECL cr_init_random(void );
#else
//vyvesti na ekran okno i ozhidat' dvizhenija myshi ili nazhatija na klaviaturu
//dlja zapolnenija datchika
//hWnd - hendl okna roditelja ili NULL esli roditelja net
int DECL cr_init_random(HWND hWnd );

//podpisat' HANDLE otkrytogo faila
int DECL cr_sign_hfile ( H_INIT init_struct,
    H_USER user_struct,
    HANDLE hFile );
#endif

//vozvraschaet strukturu dannyh podpisi dlja fajla
int DECL cr_file_get_sign_struct ( H_INIT init_struct,
    const char *file_name, 
    int search_from, 
    void *sign, int *sign_blen, 
    char *userid, int *userid_blen,
    int *struct_blen );

//dobavljaet strukturu dannyh podpisi v konets fajla
int DECL cr_file_put_sign_struct ( H_INIT init_struct,
    const char *file_name,
    void *sign, int sign_blen, 
    char *userid, int userid_blen );

//vozvraschaet strukturu dannyh podpisi dlja bufera
int DECL cr_buf_get_sign_struct ( H_INIT init_struct,
    const void *buf, int buf_len, 
    int search_from, 
    void *sign, int *sign_blen, 
    char *userid, int *userid_blen,
    int *struct_blen );

//dobavljaet strukturu dannyh podpisi v konets bufera
int DECL cr_buf_put_sign_struct ( H_INIT init_struct,
    void *buf, int inbuf_len, int *outbuf_len,
    void *sign, int sign_blen, 
    char *userid, int userid_blen );

//Kratkoe opisanie formata SberSign 3.1 dlja hranenija hesha v tabletke 
//  1) tabletka dolzhna byt' bolee 512 bajt razmerom
//       (eto tip 4, 6, 12)
//  2) pishetsja 30 bajt v tabletku po mestu s offsetom 256
//  3) pishetsja Crc2 ot etih 30 bajt po mestu 256+30
//     (to est' eta stranitsa budet s Crc2)
//     Vnimanie! Hesh fajla po GOST soderzhit 32 bajta, 
//     no poslednie 2 bajta v etom formate ne budut uchityvat'sja 
//     v operatsijah sravnenija i t.d. oni polagayutsja ravnym Crc2

// chitaet iz tabletki v formate SberSign 3.1
int DECL cr_read_tm(void *buf, int *buf_blen );

// pishet v tabletku v formate SberSign 3.1
int DECL cr_write_tm(void *buf, int buf_len );

//vozvratit' dlja raspechatki
//vnimanie! vozvraschaetsja publichnyj klyuch 256 bajt
//	dlja raspechatki dostatochno vzjat' 
//	pervye 64 bajta (dlja 512 bit podpisi)
//	ili pervye 128 bajt (dlja 1024 bit podpisi)
//	ostal'nye bajty nuzhny tol'ko dlja proverki podpisi
//	eto tak nazyvaemaja reshetka
//	reshetka mozhet byt' sgenerirovana spets.protseduroj
//      i ee ne objazatel'no raspechatyvat'
int DECL cr_pkey_getinfo ( H_PKEY pkey_struct,
	char *userid, int *userid_blen,
	void *pkbuf, int *pkbuf_blen );

//vybrat' iz otkrytogo spravochnika pervyj klyuch
int DECL cr_pkbase_findfirst ( H_PKBASE pkbase_struct,
	H_PKEY *pkey_struct,
	void *comment, int *com_blen );

//vybrat' iz otkrytogo spravochnika posleduyuschie klyuchi
//vnimanie! ne pol'zujtes' protseduroj cr_pkbase_find
//	esli vy ne zakonchili vyborku vseh klyuchej
//	tak kak ona portit vnutrennij ukazatel' tekuschego klyucha
int DECL cr_pkbase_findnext ( H_PKBASE pkbase_struct,
	H_PKEY *pkey_struct,
	void *comment, int *com_blen );

//vozvraschaet informatsiyu ob ispol'zuemoj biblioteke
int DECL cr_get_version_info(char *info_str, int *str_blen );

// Chitaet klyuch ETsP iz tabletki
int DECL cr_read_tmkey(void *buf, int *buf_len );

// Pishet klyuch ETsP v tabletku
int DECL cr_write_tmkey(void *buf, int buf_len );

//zagruzit' setevye klyuchi iz fajla
int DECL cr_netfile_load ( H_INIT init_struct,
	const char* net_file,
	int flag_compr,
	H_NET* cr_net_struct );

//zagruzit' setevye klyuchi iz bufera
int DECL cr_netbuf_load ( H_INIT init_struct,
  	void* net_buf, int buf_blen,
  	int flag_compr,
  	H_NET* cr_net_struct );

//zashifrovat' bufer
int DECL cr_buf_encode ( H_NET cr_net_struct,
  	int num_recv,
  	const void* buf_in, unsigned int inlen,
  	void* buf_out, unsigned int* out_blen );

//rasshifrovat' bufer
int DECL cr_buf_decode ( H_NET cr_net_struct,
  	const void* buf_in,
  	unsigned int inlen,
  	void* buf_out,
  	unsigned int* out_blen );

//vygruzit' setevye klyuchi
int DECL cr_netkey_close ( H_NET cr_net_struct );

// Zashifrovat' fajl
int DECL cr_file_encode ( H_NET net_struct,
    int num_recv,
    const char* in_file_name,
    const char* out_file_name );

// Rasshifrovat' fajl
int DECL cr_file_decode ( H_NET net_struct,
    const char* in_file_name,
    const char* out_file_name );

//Zagruzhaet klyuch dlja shifrovanija na osnove publichnyh klyuchej
//na vhod podat' predvaritel'no zagruzhennye sekretnyj klyuch podpisi otpravitelja
//i publichnyj klyuch podpisi poluchatelja
//vydaet na vyhode klyuch shifrovanija my_cr_net kotoryj mozhno ispol'zovat' 
//dlja zashifrovanija ili rasshifrovanija s ispol'zovaniem standartnyh funktsij
//posle ispol'zovanija - udalit' klyuch funktsiej cr_netkey_close
int DECL cr_load_pcrypt_key ( H_INIT my_cr_init, 
	H_USER userkey, 
	H_PKEY pkey, 
	int flag_compress, 
	H_NET *my_cr_net );

//initsializiruet nachalo upakovki
int DECL cr_start_compress ( H_INIT init_struct );

//pakuet blok dannyh
int DECL cr_compress_block ( H_INIT init_struct,
    const void *buf_in, const unsigned int in_blen,
    void *buf_out, unsigned int *out_blen );

//initsializiruet nachalo raspakovki
int DECL cr_start_uncompress ( H_INIT init_struct );

//raspakovyvaet blok dannyh
int DECL cr_uncompress_block ( H_INIT init_struct,
    const void *buf_in, const unsigned int in_blen,
    void *buf_out, unsigned int *out_blen );

//szhimaet fajl dannyh
int DECL cr_file_compress ( H_INIT init_struct,
    const char *in_file_name, 
    const char *out_file_name );

//razzhimaet fajl dannyh
int DECL cr_file_uncompress ( H_INIT init_struct,
    const char *in_file_name, 
    const char *out_file_name );

//Generiruet glavnyj klyuch
//Esli zadan bufer gkbuf[262] - togda klyuch pishetsja v bufer
//esli zadan gkbuf=NULL - glavnyj klyuch (i uzly zameny) pishutsja v tabletku
//nachinaja so smeschenija 128 (tabletka dolzhna byt' razmerom 256 bajt)
//Uzly zameny berutsja te, kotorye byli zagruzheny v pamjat' pri cr_init
int DECL cr_gen_gk ( H_INIT init_struct,
	char *password,
	void *gkbuf, int *gkblen,
	void *tm_number, int *tmn_blen );

//Kopiruet GK iz bufera v tabletku
//Uzly zameny berutsja te, kotorye byli zagruzheny v pamjat' pri cr_init
int DECL cr_gk_copy_tm ( H_INIT init_struct,
	void *gkbuf, int gkblen,
	void *tm_number, int *tmn_blen );

//Kopiruet GK iz tabletki v bufer
int DECL cr_gk_read_tm ( H_INIT init_struct,
	void *gkbuf, int *gkblen,
	void *uzbuf, int *uzblen,
	void *tm_number, int *tmn_blen );

/*--------------- ADDITIONAL CRYPTO FUNCTIONS 23/08/2005 ----------------*/
//Generiruet fajl s klyuchevoj tablitsej
int DECL cr_gen_netkey_table ( H_INIT init_struct,
	int net_number,
	int nodes,
    char *ktabl_file,
    char *nsys_file );

//Schityvaet klyuch iz klyuchevoj tablitsy i formiruet
//fajly s etim klyuchom dlja funktsii cr_install_netkey
int DECL cr_gen_enckey ( H_INIT init_struct,
	int net_number,
	int node_number,
    char *ktabl_buf, int ktabl_len,
    char *nsys_buf, int nsys_len,
    char *key_dir );

//Pereshifrovanie setevyh klyuchej
//BiKript dolzhen byt' proinitsializirovan na novom klyuche GK
//Esli vozvraschaet 0, togda pereshli na novyj GK 
//i pereshifrovali na nego fajl s klyuchami
int DECL cr_change_netkey ( H_INIT cr_init_struct, 
	char *old_key_name,
	char *new_key_name,
	char *old_gk_name,
	char *old_uz_name,
	char *old_passw );

//расширение таблицы до new_nodes узлов, уменьшить таблицу нельзя
//если задать new_nodes=0, то вернет текущее число узлов в current_nodes
int DECL cr_extend_netkey_table ( H_INIT init_struct,
	char* ktabl_file, 
	char* nsys_file,
	int new_nodes,
	int* current_nodes );

//Vvodit v dejstvie klyuch, zapisannyj funktsijami
//cr_gen_elgkey_mk_ext cr_gen_elgkey_ext
//perepisyvaja ego iz smeschenija 128 po smescheniyu 0 vnutri tabletki
//staryj klyuch pri etom unichtozhaetsja
//Nikakih proverok validnosti klyucha ne proizvoditsja
//dlja proverki validnosti vyzovite funktsiyu chtenija klyucha - cr_load_elgkey
int DECL cr_change_elgkey ( H_INIT init_struct,
	void *tm_number, int *tmn_blen );

//Vozvraschaet 32 sluchajnyh bajta
int DECL cr_get32_random ( H_INIT init_struct, 
	void *data );

//----------------------------------------------------------------

// sm msdn na CryptSetHashParam(*, HP_HASHVAL, * );
int DECL cr_hash_set(
 H_HASH hHash, // in/out;
 const char *hash // in;
 );

// sm msdn na CryptDuplicateHash(hHashSrc, *, &hHashDst );
int DECL cr_hash_dup(
 const H_HASH hHashSrc, // in;
 H_HASH *hHashDst // out;
 );

int DECL cr_file_compressW ( H_INIT init_struct,
    const wchar_t *in_file_name, 
    const wchar_t *out_file_name );

int DECL cr_file_uncompressW ( H_INIT init_struct,
    const wchar_t *in_file_name, 
    const wchar_t *out_file_name );

int DECL cr_file_get_sign_structW ( H_INIT init_struct,
    const wchar_t *file_name, 
    int search_from, 
    void *sign, int *sign_blen, 
    char *userid, int *userid_blen,
    int *struct_blen );

int DECL cr_file_put_sign_structW ( H_INIT init_struct,
    const wchar_t *file_name,
    void *sign, int sign_blen, 
    char *userid, int userid_blen );

int DECL cr_check_fileW ( H_INIT init_struct,
    H_PKBASE pkbase_struct,
    const wchar_t *file_name, 
    int N, 
    int flag_del,
    char *userid, int *userid_blen );

int DECL cr_sign_fileW ( H_INIT init_struct,
    H_USER user_struct,
    const wchar_t *file_name );

int DECL cr_file_encodeW ( H_NET net_struct,
    int num_recv,
    const wchar_t* in_file_name,
    const wchar_t* out_file_name );

int DECL cr_file_decodeW ( H_NET net_struct,
    const wchar_t* in_file_name,
    const wchar_t* out_file_name );

int DECL cr_set_param(BICR_HANDLE Ahandle, int option, int value);
int DECL cr_get_param(BICR_HANDLE Ahandle, int option, int *value);

int DECL cr_get_cert_usage_info(H_INIT init_struct, char *buf, int len, 
	char *s1, int *len_s1,
	char *s2, int *len_s2,
	char *s3, int *len_s3
	);

#if defined(__cplusplus)
} //extern "C"
#endif

#endif


