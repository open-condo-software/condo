Explicamos detalladamente cómo instalar certificados de seguridad si estás usando un iPhone o iPad

### Instalar el perfil con certificados

1. Descarga el [perfil para Apple iOS](tls/ios/russiantrusted.mobileconfig) en tu teléfono usando el navegador Safari → haz clic en "Permitir" en la ventana del sistema.

   ![Image1](tls/ios/ios-allow-download.jpg)

2. En "Ajustes", selecciona "Perfil descargado" → se abrirá la ventana "Instalación de perfil" → haz clic en "Instalar".

   Instala los certificados inmediatamente después de la descarga, de lo contrario se eliminarán automáticamente.

   ![Image2](tls/ios/ios-install-downloaded-profile.jpg)

3. Ingresa el código/contraseña de tu dispositivo → aparecerá la ventana "Advertencia" → selecciona "Instalar" → "Instalar perfil" → "Instalar" → "Perfil instalado" → "Listo".

   ![Image3](tls/ios/ios-install-prompt.jpg)

### Habilita la confianza para los certificados

1. Ve a "Ajustes" → "General" → "Acerca de este dispositivo" → "Confianza de certificados" → activa la confianza para el certificado "Trusted Root CA" deslizando el interruptor hacia la derecha.

   ![Image4](tls/ios/ios-enable-trust-certificate.jpg)

2. Aparecerá una notificación "Certificado raíz" → selecciona "Siguiente". ¡Listo!

   ![Image5](tls/ios/ios-confirm-trust-certificate.jpg)

### Borra la caché de tu navegador

Después de instalar los certificados, borra la caché de tu navegador. Esto es necesario para el correcto funcionamiento con recursos web protegidos por certificados de la Autoridad CA Nacional del Ministerio de Asuntos Digitales.
