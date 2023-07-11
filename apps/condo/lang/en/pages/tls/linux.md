1. Download [root](https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt) и [выпускающий](https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt) certificate into Downloads folder.

2. Open terminal, pressing Activities → Terminal

   ![Image1](/tls/linux/linux-terminal-app.jpg)

3. Follow into Downloads folder with command `cd Downloads/`. With `ls` command you can check that files russian_trusted_root_ca.crt and russian_trusted_sub_ca.crt has been downloaded

   ![Image2](/tls/linux/linux-check-downloads.jpg)

4. Copy root certificate into folder /usr/share/pki/ca-trust-source/anchors/ with command: `sudo cp russian_trusted_root_ca.crt /usr/share/pki/ca-trust-source/anchors`. System will prompt to enter password of superuser.

   ![Image3](/tls/linux/linux-copy-root-cert.jpg)

5. Copy into the same folder the issuer certificate with command: `sudo cp russian_trusted_sub_ca.crt /usr/share/pki/ca-trust-source/anchors`. Update system certificate storage with command: `sudo update-ca-trust`.

   ![Image4](/tls/linux/linux-copy-issuer-cert.jpg)

6. Check that certiifcates from Mintsifry Проверьте has been installed into trusted certificate storage with command: `trust list`.

   ![Image5](/tls/linux/linux-trust-list.jpg)

7. In end of the list should appear cerficiates "Russian Trusted Root CA" and "Russian Trusted Sub CA".

   ![Image6](/tls/linux/linux-trust-list-output.jpg)

### Clean cache of your browser

After installing certificates, clean cache of your browser. It is needed for correct working with web resources, that are protected with TLS certificates from Mintsifry
