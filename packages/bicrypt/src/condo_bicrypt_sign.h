#pragma once

#include <napi.h>

class CondoBicryptSign : public Napi::ObjectWrap<CondoBicryptSign>
{
public:
    CondoBicryptSign(const Napi::CallbackInfo&);
    Napi::Value Sign(const Napi::CallbackInfo&);
    static Napi::Function GetClass(Napi::Env);

private:
    std::string _pathToKey;
    std::string _passPhrase;
    std::string _pathToPRDN;
    bool isDebug;
    void Debug (std::string state, int status);
};
