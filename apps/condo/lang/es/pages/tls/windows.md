Esta es una guía de instalación para propietarios de computadoras con sistema operativo Windows. Para un funcionamiento correcto, se necesitan dos certificados: el certificado raíz y el certificado emisor.

### Instale el certificado raíz

1. [Descargue el certificado raíz](/tls/windows/russian_trusted_root_ca.cer) → vaya a la carpeta "Descargas" → seleccione "Russian Trusted Root CA.cer" → haga clic en "Abrir" → elija "Instalar certificado..."

   **[Descargar certificado raíz](/tls/windows/russian_trusted_root_ca.cer)**

   ![Image11](/tls/windows/windows-root-cert.png "Detalles del certificado raíz")

2. En el asistente para la importación de certificados, seleccione "Usuario actual" → haga clic en "Siguiente" → elija "Colocar todos los certificados en el siguiente almacén" → haga clic en "Examinar" → seleccione "Autoridades de certificación raíz de confianza" → haga clic en "Siguiente"

   ![Image12](/tls/windows/windows-import-root-cert.png "Asistente para la importación del certificado raíz")

3. En la ventana "Finalizar asistente para importación de certificados", haga clic en "Finalizar" → seleccione "Aceptar"

   Si aparece una advertencia de seguridad, haga clic en "Sí"

   ![Image13](/tls/windows/windows-complete-import-root-cert.png "Finalizar importación del certificado raíz")

### Instale el certificado emisor

1. [Descargue el certificado emisor](tls/windows/russian_trusted_sub_ca.cer) → vaya a la carpeta "Descargas" → seleccione "Russian Trusted Sub CA.cer" → haga clic en "Abrir" → elija "Instalar certificado..."

   **[Descargar certificado emisor](tls/windows/russian_trusted_sub_ca.cer)**

   ![Image21](/tls/windows/windows-issuer-cert.webp "Detalles del certificado emisor")

2. En el asistente para la importación de certificados, seleccione "Usuario actual" → haga clic en "Siguiente" → elija "Seleccionar automáticamente el almacén según el tipo de certificado" → haga clic en "Siguiente"

   ![Image22](/tls/windows/windows-import-issuer-cert.webp "Asistente para la importación del certificado emisor")

3. En la ventana "Finalizar asistente para importación de certificados", haga clic en "Finalizar" → seleccione "Aceptar"

   ![Image23](/tls/windows/windows-complete-import-issuer-cert.webp "Finalizar importación del certificado emisor")

### Borre la caché de su navegador

Después de instalar los certificados, borre la caché de su navegador. Esto es necesario para el correcto funcionamiento con recursos web protegidos por certificados de una autoridad de certificación nacional.
