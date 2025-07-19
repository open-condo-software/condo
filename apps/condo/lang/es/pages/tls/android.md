Cómo instalar certificados en tu teléfono o tableta Android. Para asegurar un funcionamiento adecuado, instala dos certificados: raíz y emisor.

### Instalar el certificado raíz

1. Descarga el [certificado raíz "Trusted Root CA.cer"](tls/android/trusted_root_ca.cer) → ve a "Configuración" → escribe "Certificado" en la búsqueda → selecciona "Certificado CA" (o "Autoridad de Certificación"). Si se te pide ingresar el nombre del certificado, escribe "Trusted Root CA" → selecciona "VPN y aplicaciones" → presiona "Aceptar".

   ![Image11](tls/android/android-search-certificate-setting.jpg)

2. Si aparece una advertencia, presiona "Instalar de todos modos" o "Instalar en cualquier caso".

   ![Image12](tls/android/android-install-prompt.jpg)

3. Ingresa el código/contraseña de tu dispositivo → "Confirmar" → en "Descargas" selecciona "Trusted Root CA.cer".

   ![Image13](tls/android/android-select-root-certificate.jpg)

4. El certificado se instalará y aparecerá una notificación "Certificado de CA instalado" en la parte inferior de la pantalla.

   ![Image14](tls/android/android-certificate-installed-notification.jpg)

### Instalar el certificado emisor

1. Descarga el [certificado emisor "Trusted Sub CA.cer"](tls/android/trusted_sub_ca.cer) → ve a "Configuración" → escribe "Certificado" en la búsqueda → selecciona "Certificado CA" (o "Autoridad de Certificación") → en la advertencia, selecciona "Instalar de todos modos" o "Instalar en cualquier caso".

   ![Image21](tls/android/android-search-certificate-setting.jpg)

2. Ingresa el código/contraseña de tu dispositivo → "Confirmar" → en "Descargas" selecciona "Trusted Sub CA.cer".

   ![Image22](tls/android/android-select-issuer-certificate.jpg)

3. El certificado se instalará y aparecerá una notificación "Certificado de CA instalado" en la parte inferior de la pantalla.

   ![Image24](tls/android/android-certificate-installed-notification.jpg)

Si se te pide ingresar el nombre del certificado, escribe "Trusted Sub CA" → selecciona "VPN y aplicaciones" → presiona "Aceptar".

### Verificar que la instalación fue exitosa

En la búsqueda de "Configuración", escribe "Certificados de confianza" o "Credenciales de confianza" → ve a la pestaña "Usuario" → verás dos certificados instalados "Trusted Root CA" y "Trusted Sub CA" del Ministerio de Asuntos Digitales. ¡Listo, todo funcionó!

![Image3](tls/android/android-view-installed-certificates.jpg)

### Borrar la caché de tu navegador

Después de instalar los certificados, borra la caché de tu navegador. Esto es necesario para el correcto funcionamiento con recursos web protegidos por certificados de la Autoridad CA Nacional del Ministerio de Asuntos Digitales.
