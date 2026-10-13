# Una pequeña aventura para dos

Aventura móvil para Paulo y Naroa, basada en el ZIP aportado. Incluye los capítulos originales y una dinámica nueva para jugar desde dos móviles, también a distancia.

## Jugar juntos

Abre «Nuestro juego · dos móviles», elige tu nombre y crea una partida. Envía la invitación a la otra persona. Cada uno completa sus misiones y pulsa **Compartir actualización** para enviar su avance. El destinatario abre ese enlace o lo pega en **Recibir actualización**. Es un intercambio manual de turnos: los cambios no se sincronizan automáticamente.

Hay seis misiones iniciales: la tiendita, luces, palabras español/portugués, un rincón juntos y dos propuestas opcionales fuera de pantalla. Ambos pueden añadir misiones y un mensaje. Completar una misión entre los dos enciende una luz; repetirla no duplica el premio. Saltar una propuesta no penaliza. El enlace transporta las misiones y los avances confirmados; no incluye el cuaderno ni las respuestas privadas de la aventura individual.

El progreso se guarda en cada navegador. Borrar sus datos puede perderlo. El intercambio de enlaces actualiza la dinámica compartida, no los capítulos individuales. No hay cuentas ni contraseña. Los enlaces de actualización contienen datos del juego y quien los reciba puede leerlos.

## Voz y contenido

Los guiones editables están en `GUIONES_VOZ_PAULO.md`. No hay grabaciones reales todavía ni voz sintética. Sin audio, se muestra el mensaje escrito. Graba los archivos indicados, colócalos en `public/media/` y vuelve a publicar. Escribir una ruta en el editor no sube un archivo.

`src/legacy/config.js` contiene los capítulos, fechas, regalos y transcripciones. Las aperturas son 13/10/2026 07:00, 14/10 09:00, 15/10 09:00 y 16/10 10:00, Europe/Madrid. `src/duo/content.js` contiene las misiones compartidas y sus guiones. Las propuestas son borradores: no afirman compras ni reservas realizadas. El compañero ilustrado es ficticio.

El análisis privado y las conversaciones no están incluidos en el sitio ni en el paquete de código. Las notas personales de la aventura permanecen en el navegador. El pase de recuerdo es local: no hay emisión real de Wallet ni servidor PHP conectado.

## Desarrollo y validación

Node 22.12 o superior. Desde este directorio:

```sh
npm ci
npm run dev
npm test
npx playwright test
npm run build
```

La compilación estática queda en `dist/`. Se han probado seis casos de estado y tres de navegador: intercambio real de enlaces entre dos contextos independientes, incorporación de una misión, conservación del progreso anterior y pantalla de 320 px. Son pruebas en Chromium; no se ha probado Safari en un iPhone físico.

En desarrollo, la vista previa usa almacenamiento independiente y se activa con `#vista-previa`. Está desactivada en producción. Los archivos antiguos de progreso se migran cuando el nuevo estado aún no existe. El cuaderno nunca se incorpora al enlace compartido.

## Publicación

Consulta `NETLIFY.md`. Para actualizar misiones iniciales o incorporar grabaciones, modifica los archivos, reconstruye y publica `dist/`. Las misiones creadas desde los móviles se intercambian mediante enlaces y no necesitan republicar la web.
