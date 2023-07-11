How to install certificates on Android phone or tablet. For correct working install two certificates: root and issuer.

### Install root certificate

1. Download [root certificate «Russian Trusted Root CA.cer»](/tls/android/russian_trusted_root_ca.cer) → open «Settings» → in search field enter «Certificate» → select «Cerficiate CA» (or «Certificate of certification authority»). If window «Specify name of certificate» will appear, enter «Russian Trusted Root CA» → select «VPN and aplications» → tap «ОК».

   ![Image11](/tls/android/android-search-certificate-setting.jpg)

2. If a prompt will appear, tap «Install anyway».

   ![Image12](/tls/android/android-install-prompt.jpg)

3. Enter pin code of your device→ «Confirm» → in «Downloads» select «Russian Trusted Root CA.cer»

   ![Image13](/tls/android/android-select-root-certificate.jpg)

4. Certificate will be installed and in bottom of the screen will appear notification «Certificate CA is installed».

   ![Image14](/tls/android/android-certificate-installed-notification.jpg)

### Install issuer certificate

1. Download [issuer certificate «Russian Trusted Sub CA.cer»](russian_trusted_sub_ca.cer) → open «Settings» → in searh enter «Certificate» → select «Cerficate CA» (or «Certificate of certificate authority») →  in the prompt select «Install anyway».

   ![Image21](/tls/android/android-search-certificate-setting.jpg)]

2. Enter pin-code of your device → «Confirm» → in «Downloads» select «Russian Trusted Sub CA.cer».

   ![Image22](/tls/android/android-select-issuer-certificate.jpg)

3. Certificate will be installed and in bottom of the screen will appear notification «Certificate CA is installed».

   ![Image24](/tls/android/android-certificate-installed-notification.jpg)

If a window «Specify certificate name» will appear, select  «Russian Trusted Sub CA» → enter «VPN and applications» → tap «ОК».

### Check that installing was successful

In search field in «Settings» enter «Trusted certificates» or «Trusted accounts» → open a tab «User» → in a list you will see two installed certificates from Mintsyfry «Russian Trusted Root CA» and «Russian Trusted Sub CA».

![Image3](/tls/android/android-view-installed-certificates.jpg)

### Clean cache of your browser

After installing certificates, clean cache of your browser. It is needed for correct working with web resources, that are protected with TLS certificates from Mintsifry
