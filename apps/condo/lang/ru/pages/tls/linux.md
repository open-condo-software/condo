1. Скачайте [корневой](https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt) и [выпускающий](https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt) сертификаты в папку Downloads на вашем компьютере.

2. Откройте терминал, нажав на Activities → Terminal

   ![Image1](/tls/linux/linux-terminal-app.jpg)

3. Перейдите в папку загрузки командой cd Downloads/. Командой `ls` вы можете убедиться, что файлы сертификатов russian_trusted_root_ca.crt и russian_trusted_sub_ca.crt действительно находятся в этой папке.

   ![Image2](/tls/linux/linux-check-downloads.jpg)

4. Скопируйте корневой сертификат в каталог /usr/share/pki/ca-trust-source/anchors/ командой: `sudo cp russian_trusted_root_ca.crt /usr/share/pki/ca-trust-source/anchors`. Система запросит ввести пароль суперпользователя. Введите пароль.

   ![Image3](/tls/linux/linux-copy-root-cert.jpg)

5. Скопируйте в тот же каталог выпускающий сертификат командой: `sudo cp russian_trusted_sub_ca.crt /usr/share/pki/ca-trust-source/anchors`. Обновите общесистемное хранилище сертификатов командой: `sudo update-ca-trust`.

   ![Image4](/tls/linux/linux-copy-issuer-cert.jpg)

6. Проверьте, что сертификаты Минцифры установились в хранилище доверенных сертификатов командой: `trust list`.

   ![Image5](/tls/linux/linux-trust-list.jpg)

7. В конце списка должны появиться сертификаты Russian Trusted Root CA и Russian Trusted Sub CA.

   ![Image6](/tls/linux/linux-trust-list-output.jpg)

### Очистите кэш вашего браузера

После установки сертификатов очистите кэш вашего браузера. Это необходимо для корректной работы с веб-ресурсами, защищенными сертификатами Национального УЦ Минцифры России
