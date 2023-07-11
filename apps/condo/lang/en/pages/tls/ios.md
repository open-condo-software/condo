How to install TLS certificates for owners of iPhone and iPad.

### Install certificates profile

1. [Download profile for Apple iOS](/tls/ios/russiantrusted.mobileconfig) on your device using Safari browser → tap «Allow»

   ![Image1](/tls/ios/ios-allow-download.jpg)

2. In «Settings» select «Downloaded profile» → tap «Install profile» → tap «Install».

   Install certificates right after download, either way, they will be automatically deleted.

   ![Image2](/tls/ios/ios-install-downloaded-profile.jpg)

3. Enter pin-code of your device→ a window «Confirmation» will appear → select «Install» → «Profile install» → «Install» → «Profile was installed» → «Done».

   ![Image3](/tls/ios/ios-install-prompt.jpg)

### Enable trust for certificates

1. Open «Settings» → «Basics» → «About your device» → «Trust certificates» → enable certificate trust for «Russian Trusted Root CA» switching the setting on.

   ![Image4](/tls/ios/ios-enable-trust-certificate.jpg)

2. A notification «Root certificate» will appear → select «Next». Done!

   ![Image5](/tls/ios/ios-confirm-trust-certificate.jpg)

### Clean cache of your browser

After installing certificates, clean cache of your browser. It is needed for correct working with web resources, that are protected with TLS certificates from Mintsifry
