This is a guide for installing certificates for owners of computers with Windows operating system. For correct working we need two certificates: root and issuer.

### Install root certificate

1. [Download root certificate](/tls/windows/russian_trusted_root_ca.cer) → follow to «Downloads» folder → select «Russian Trusted Root CA.cer» → click «Open» → select «Install certificate...»

**[Download root certificate](/tls/windows/russian_trusted_root_ca.cer)**

![Image11](/tls/windows/windows-root-cert.png "Information about root certificate")

2. In window «Master of certificate import» select «Current user» → click «Next» → select «Place all certificates in following storage» → click «View» → select «Trusted root certificate authorities» → click «Next»

![Image12](/tls/windows/windows-import-root-cert.png "Master of import of root certificate")

3. In window «End of import certificate master click «Done» → select «Ok»
   If a window «Security caution» will appear→ click «Yes»

![Image13](/tls/windows/windows-complete-import-root-cert.png "Completing of import of root certificate")

### Install issuer certificate

1. [Download issuer certificate](/tls/windows/russian_trusted_sub_ca.cer) → go to «Downloads» folder → select «Russian Trusted Sub CA.cer» → click «Open» → select «Install certificate...»

**[Download issuer certificate](/tls/windows/russian_trusted_sub_ca.cer)**

![Image21](/tls/windows/windows-issuer-cert.webp "Information about issuer certificate")

2. In window «Master of certificate import» select «Current user» → click «Next» → select «Automatically select storage using certificate type» → click «Next»

![Image22](/tls/windows/windows-import-issuer-cert.webp "Master of import of issuer certificate")

3. In window «End of import certificate master click «Done» → select «Ok»

![Image23](/tls/windows/windows-complete-import-issuer-cert.webp "Завершение импорта выпускающего сертификата")

### Clear cache of your browser

Clean cache of the browser on the device you are trying to get access. It needs for correct working with the resources, protected with certificates from Mintsifry.
