1. Descargue el [certificado raíz](https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt) y el [certificado emisor](https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt) en la carpeta Descargas en su computadora.

2. Abra la terminal presionando Actividades → Terminal

   ![Imagen1](/tls/linux/linux-terminal-app.jpg)

3. Vaya a la carpeta de descargas con el comando cd Descargas/. Puede verificar que los archivos de certificados russian_trusted_root_ca.crt y russian_trusted_sub_ca.crt están en esta carpeta con el comando `ls`.

   ![Imagen2](/tls/linux/linux-check-downloads.jpg)

4. Copie el certificado raíz en el directorio /usr/share/pki/ca-trust-source/anchors/ con el comando: `sudo cp russian_trusted_root_ca.crt /usr/share/pki/ca-trust-source/anchors`. El sistema solicitará la contraseña del superusuario. Ingrese la contraseña.

   ![Imagen3](/tls/linux/linux-copy-root-cert.jpg)

5. Copie el certificado emisor en el mismo directorio con el comando: `sudo cp russian_trusted_sub_ca.crt /usr/share/pki/ca-trust-source/anchors`. Actualice el almacén de certificados del sistema con el comando: `sudo update-ca-trust`.

   ![Imagen4](/tls/linux/linux-copy-issuer-cert.jpg)

6. Verifique que los certificados se hayan instalado en el almacén de certificados de confianza con el comando: `trust list`.

   ![Imagen5](/tls/linux/linux-trust-list.jpg)

7. Al final de la lista deberían aparecer los certificados raíz y emisor.

   ![Imagen6](/tls/linux/linux-trust-list-output.jpg)

### Borre la caché de su navegador

Después de instalar los certificados, borre la caché de su navegador. Esto es necesario para el correcto funcionamiento con recursos web protegidos por certificados de la Autoridad CA Nacional.
