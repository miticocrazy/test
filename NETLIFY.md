# Publicación

Proyecto de Netlify: `luma-naroa-261013`, equipo `crazy-ds3o6wc`.
URL: https://luma-naroa-261013.netlify.app

El proyecto es público, sin contraseña, según la petición del propietario. La autorización local del CLI está fuera del repositorio y de los paquetes entregables. No se publica esa configuración.

```sh
npm run build
NODE_USE_ENV_PROXY=1 XDG_CONFIG_HOME=/workspace/.netlify-config npm exec --cache /workspace/.npm-cache --yes --package=netlify-cli@17.38.1 -- netlify deploy --prod --dir dist
```

La dinámica para dos móviles funciona mediante intercambio explícito de enlaces. No requiere funciones de Netlify ni servidor. No hay sincronización automática. Las grabaciones reales siguen pendientes.

## Estado de esta actualización

La versión nueva compila y funciona en las pruebas locales. La publicación no se ha podido completar: el CLI termina por tiempo agotado, la API deja los despliegues en estado `new` o `uploading` y rechaza la subida de archivos con HTTP 401. Restaurar el despliegue anterior devuelve `ready` en la API, pero el enlace público sigue dando HTTP 404. No se considera publicada ni verificada esta actualización.

El ZIP `aventura-web.zip` contiene directamente los archivos de `dist/`, con `index.html` en la raíz. Puede subirse desde el panel del proyecto de Netlify, en «Upload your project files». El ZIP de código permite continuar el desarrollo y reconstruir el sitio.
