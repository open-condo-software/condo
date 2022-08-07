#include "condo_bicrypt_sign.h"
#include "bcry.h"
#include "errors.h"
#include <iostream>
#include <stdlib.h>
#include <openssl/evp.h>

#define BUF_LEN 2002
#define SIGN_LENGTH 64
#define RESULT_LENGTH 1024

using namespace Napi;

char *base64(char *input, int length) {
  const auto pl = 4*((length+2)/3);
  auto output = (char *)(calloc(pl+1, 1)); //+1 for the terminating null that EVP_EncodeBlock adds on
  const auto ol = EVP_EncodeBlock((unsigned char *)(output), (const unsigned char *)(input), length);
  if (pl != ol) { std::cerr << "Whoops, encode predicted " << pl << " but we got " << ol << "\n"; }
  return output;
}


CondoBicryptSign::CondoBicryptSign(const Napi::CallbackInfo& info) : ObjectWrap(info) {
   this->_pathToKey = info[0].As<Napi::String>().Utf8Value();
   this->_passPhrase = info[1].As<Napi::String>().Utf8Value();
   this->_pathToPRDN = info[2].As<Napi::String>().Utf8Value();
}

void CondoBicryptSign::Debug (std::string state, int status = 0) {
    if (this->isDebug) {
        std::cout << state << " = " << status << "\n";
    }
}

Napi::Value CondoBicryptSign::Sign(const Napi::CallbackInfo& info) {
    this->isDebug = info[1].As<Napi::Boolean>();
    Napi::Env env = info.Env();
    H_INIT h_init = 0;
    H_USER h_user = 0;
    int result;
    int totalResult = 0;
    //-------------- INIT --------------------------------
    int mode;
    result = cr_init(0, "", "", "", NULL, NULL, &mode, &h_init);
    totalResult += result;
    this->Debug("[STEP] INIT", result);
    //-------------- INIT RANDOM --------------------------------
    char pathPRDN[BUF_LEN];
    strcpy(pathPRDN, this->_pathToPRDN.c_str());
    result = cr_init_prnd(h_init, pathPRDN, 1);
    totalResult += result;
    this->Debug("[STEP] INIT RANDOM", result);

    //-------------- READ KEY --------------------------------
    char secret[BUF_LEN]; strcpy(secret, this->_passPhrase.c_str());
    char pathKey[BUF_LEN]; strcpy(pathKey, this->_pathToKey.c_str());
    char userId[BUF_LEN]; int uLength = BUF_LEN; userId[0] = 0;
    result = cr_read_skey(h_init, secret, strlen(secret), pathKey, userId, &uLength, &h_user);
    totalResult += result;
    this->Debug("[STEP] READ KEY", result);
    this->Debug(userId);

    //-------------- SIGN TEXT --------------------------------
    std::string xmlToSign = info[0].As<Napi::String>().Utf8Value();
    unsigned char xmlBuffer[xmlToSign.length()];
    memcpy(xmlBuffer, xmlToSign.data(), xmlToSign.length());
    int textSize = xmlToSign.length();
    char sign[BUF_LEN]; int signLength = BUF_LEN; sign[0] = 0;
    result = cr_sign_buf( h_init, h_user, &xmlBuffer, textSize, sign, &signLength);
    this->Debug(xmlToSign, textSize);
    this->Debug(sign);
    totalResult += result;
    //-------------- PUT CONTROL SUM --------------------------------
    int realResultSignLength = BUF_LEN;
    char emptyText[RESULT_LENGTH] = ""; emptyText[0] = 0;
    result = cr_buf_put_sign_struct(h_init, &emptyText, 0, &realResultSignLength, &sign, signLength, userId, uLength);
    this->Debug("[STEP] PUT SIGNATURE STRUCTURE", result);
    this->Debug(" * EMPTY-BUFFER-START");
    this->Debug(emptyText, realResultSignLength);
    this->Debug(" * EMPTY-BUFFER-END");
    char* encodedSign = base64(emptyText, realResultSignLength);
    this->Debug(" * SIGNATURE-LENGTH", realResultSignLength);
    //-------------- CHECK CONTROL SUM --------------------------------
    char checkSign[BUF_LEN]; int checkSignLength = BUF_LEN; checkSign[0] = 0;
    char checkUserId[BUF_LEN]; int checkULength = BUF_LEN; checkUserId[0] = 0;
    int checkStructureLength = 0;
    result = cr_buf_get_sign_struct(h_init,
        emptyText, realResultSignLength, 0,
        checkSign, &checkSignLength,
        checkUserId, &checkULength,
        &checkStructureLength
    );
    this->Debug("[STEP] SIGNATURE CHECK", result);
    this->Debug(" * SIGNATURE INFO");
    this->Debug(checkUserId, checkULength);
    this->Debug(checkSign, checkSignLength);
    this->Debug(" * STRUCTURE LENGTH", checkStructureLength);
    //-------------- CLOSE KEY --------------------------------
    result = cr_elgkey_close ( h_init, h_user );
    totalResult += result;
    this->Debug("[STEP] CLOSE KEY", result);
    //-------------- CLOSE CONTEXT --------------------------------
    result = cr_uninit(h_init);
    totalResult += result;
    if (totalResult > 0) {
        Napi::TypeError::New(env, "Signing failed").ThrowAsJavaScriptException();
        return env.Null();
    }
    this->Debug("[STEP] CLOSE CONTEXT", result);
    return Napi::Value::From(env, encodedSign);
}

Napi::Function CondoBicryptSign::GetClass(Napi::Env env) {
    return DefineClass(env, "CondoBicryptSign", {
        CondoBicryptSign::InstanceMethod("sign", &CondoBicryptSign::Sign),
    });
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::String name = Napi::String::New(env, "CondoBicryptSign");
    exports.Set(name, CondoBicryptSign::GetClass(env));
    return exports;
}

NODE_API_MODULE(addon, Init)
