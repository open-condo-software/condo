This is a guide to install certificates for owners of Apple computers and laptops

### Install configuration file that contains root and issuer certificates

1. [Download certificates for MacOS](/tls/macos/russiantrustedca.pem) → go to «Downloads» → select «RussianTrustedCA.pem» → in "Keychain" application enter login and password → click «Update key chain»

**[Download certificates](/tls/macos/russiantrustedca.pem)**

![Image1](/tls/macos/macos-import-cert.webp "Import of certificate")

2. In «Keychain» app select «Login» → go to a tab «Certificates» → find files «Russian Trusted Root CA» and «Russian Trusted Sub CA». They are the installed certificates

![Image2](/tls/macos/macos-view-cert.webp "View of certificates in Keychain app")

3. Select the certificate «Russian Trusted Root CA» → expand a tab «Trusting» → click «Always trust»

![Image3](/tls/macos/macos-trust-root-ca.webp "Setting \"Always trust\" for certificate \"Russian Trusted Root CA\"")

4. Enter user name and password → click «Update settings»

![Image4](/tls/macos/macos-enter-password.webp "Enter password to update settings")

### Repeat for second certificate

In «Keychain» application select «Russian Trusted Sub CA» → expand tab «Trusting» → set «Always trust» → enter user name and password → click «Update settings»

![Image5](/tls/macos/macos-trust-sub-ca.webp "Setting \"Always trust\" for certificate \"Russian Trusted Sub CA\"")

### Clear cache of your browser

Clean cache of the browser on the device you are trying to get access. It needs for correct working with the resources, protected with certificates from Mintsifry.
