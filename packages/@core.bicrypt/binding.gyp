{
  'targets': [
    {
       'target_name': 'copy-libraries',
       'type': 'none',
       'copies':[
            {
                'destination': '<(module_root_dir)/build/Release/',
                'files':[ '<(module_root_dir)/lib/libbicr5_64.so' ]
            },
       ],
    },
    {
      'target_name': 'condo-bicrypt-sign-native',
      'dependencies' : [ 'copy-libraries' ],
      'sources': [ 'src/condo_bicrypt_sign.cc' ],
      'include_dirs': ["<!@(node -p \"require('node-addon-api').include\")"],
      'dependencies': ["<!(node -p \"require('node-addon-api').gyp\")"],
      'cflags!': [
         '-fno-exceptions',
         '-Wno-write-strings',
         '-Wno-deprecated-declarations',
         '-Wno-narrowing'
      ],
      'cflags_cc!': [
         '-fno-exceptions',
         '-Wno-write-strings',
         '-Wno-deprecated-declarations',
         '-Wno-narrowing'
      ],
      'xcode_settings': {
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7'
      },
      "defines": [
        "UNIX"
      ],
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      "ldflags": [
         "-Wl,-rpath,'$$ORIGIN'",
      ],
      "libraries": [
        "<(module_root_dir)/lib/libbicr5_64.so",
      ],
      "link_settings": {
        "libraries": [
            "-Wl,-rpath,'$$ORIGIN'",
            "-Wl,-rpath,'$$ORIGIN'/../../lib",
        ],
      },
      "cflags_cc": [
        "-DUNIX",
        "-DUNIX64",
        "-DLONG_IS_64BITS",
        "-lpthread",
        "-fexceptions",
        "-fPIC",
        "-Wno-unknown-pragmas",
      ],
    }
  ]
}
