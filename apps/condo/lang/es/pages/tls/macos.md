Esta es una guía de instalación de certificados para propietarios de laptops y computadoras Apple.

### Instale el archivo de configuración que contiene los certificados raíz y emisor

1. [Descargue los certificados para MacOS](/tls/macos/russiantrustedca.pem) → vaya a "Descargas" → seleccione "RussianTrustedCA.pem" → en la aplicación "Llavero", ingrese el nombre de usuario y la contraseña → haga clic en "Cambiar juego de claves"

   **[Descargar certificados](/tls/macos/russiantrustedca.pem)**

   ![Imagen1](/tls/macos/macos-import-cert.webp "Importar certificado")

2. En la aplicación "Llavero", seleccione "Iniciar sesión" → vaya a la pestaña "Certificados" → encuentre los archivos "Root CA" y "Sub CA". Estos son los certificados instalados.

   ![Imagen2](/tls/macos/macos-view-cert.webp "Ver certificados en Llavero")

3. Seleccione el certificado "Root CA" → expanda la pestaña "Confiar" → haga clic en "Confiar siempre"

   ![Imagen3](/tls/macos/macos-trust-root-ca.webp "Establecer \"Confiar siempre\" para el certificado \"Root CA\"")

4. Ingrese el nombre de usuario y la contraseña → haga clic en "Actualizar ajustes"

   ![Imagen4](/tls/macos/macos-enter-password.webp "Ingrese la contraseña para actualizar los ajustes")

### Repita los pasos para el segundo certificado

En la aplicación "Llavero", seleccione "Sub CA" → expanda la pestaña "Confiar" → seleccione "Confiar siempre" → ingrese el nombre de usuario y la contraseña → haga clic en "Actualizar ajustes"

![Imagen5](/tls/macos/macos-trust-sub-ca.webp "Establecer \"Confiar siempre\" para el certificado \"Sub CA\"")

### Borre la caché de su navegador

Borre la caché del navegador en el dispositivo desde el cual está accediendo. Esto es necesario para el correcto funcionamiento con recursos protegidos por certificados de seguridad del Ministerio de Asuntos Digitales.
