/* ============================================================================
   UNA PEQUEÑA AVENTURA · CONFIGURACIÓN
   ----------------------------------------------------------------------------
   Paulo: este es el único archivo que necesitas tocar.

   Cómo editarlo sin romper nada:
   · Cambia solo lo que va entre comillas '…'.
   · Si un texto necesita un apóstrofo, usa ’ (el tipográfico) en vez de '.
   · No borres comas, llaves { } ni corchetes [ ].
   · Guarda el archivo y vuelve a subir la carpeta a tu hosting.

   Ojo: este archivo se publica con la web. Cualquiera que mire el código de
   la página puede leerlo, así que no escribas aquí notas para ti.

   Fechas: formato AAAA-MM-DDTHH:MM:SS+02:00 (hora de Madrid en octubre).
   Son instantes exactos: se abren a esa hora aunque el móvil esté en otro país.

   Audios: pon tus grabaciones en la carpeta media/ con estos nombres
   (vale .m4a, que es lo que exporta Notas de voz del iPhone, o .mp3):
     media/a0.m4a → saludo de la portada
     media/a1.m4a → sorpresa del capítulo 1
     media/a2.m4a → sorpresa del capítulo 2
     media/a3.m4a → el final
     media/a4.m4a → justo antes de abrir la sorpresa del capítulo 2
   Si un audio no está, el juego enseña el texto escrito en su lugar.

   Fotos (opcional): media/f1.jpg, media/f2.jpg… y escribe la ruta en la
   sorpresa que quieras (campo foto). Si la dejas en null, no sale ninguna.
   ========================================================================== */

window.AVENTURA = {
  version: '3.0',

  /* 1 · NOMBRES ------------------------------------------------------------ */
  nombres: {
    jugadora: 'Naroa',
    remitente: 'Paulo'
  },

  /* 2 · FECHAS (hora de Madrid) ------------------------------------------- */
  fechas: {
    capitulo1: '2026-10-13T07:00:00+02:00', // martes 13 · 7:00
    capitulo2: '2026-10-14T09:00:00+02:00', // miércoles 14 · 9:00
    capitulo3: '2026-10-15T09:00:00+02:00', // jueves 15 · 9:00
    final:     '2026-10-16T10:00:00+02:00'  // viernes 16 · 10:00 aprox.
  },
  zonaHoraria: 'Europe/Madrid',

  // Para abrir el final antes de tiempo: cámbialo a true y vuelve a subir la web.
  // (Funciona porque cambias el archivo publicado; no hay ningún botón secreto.)
  abrirFinalYa: false,

  /* 3 · COLORES DE LA INTERFAZ ---------------------------------------------
     Rosa para Naroa, rojo para Paulo y oro para la magia. Cambian botones,
     paneles y textos; los dibujos tienen sus propios colores en art.js.     */
  colores: {
    crema: '#FFF4EC',
    rosa: '#F48FB1',
    rubor: '#FFD6E5',
    rojo: '#D9364F',
    rojoOscuro: '#9F263F',
    oro: '#F5C77E',
    ciruela: '#402435'
  },

  /* 4 · EL PERRITO QUE LA ACOMPAÑA ----------------------------------------
     Pom: un pomerania inventado, con su lazo rosa. No es el retrato de
     ningún perro de verdad. Si prefieres otro nombre (por ejemplo Thor),
     cámbialo aquí y en la presentación; los colores son del pelo, la parte
     clara, la sombra, el brillo y el lazo.                                */
  companero: {
    nombre: 'Pom',
    presentacion: '¡Guau! Soy Pom. Hoy te acompaño yo.',
    colores: {
      pelo: '#EE8E43',
      claro: '#FFE7C9',
      sombra: '#C9692D',
      brillo: '#F7B46F',
      lazo: '#F48FB1'
    }
  },

  /* 5 · TU SALUDO EN LA PORTADA (opcional) ---------------------------------
     Si el audio no está, Pom le da el mensaje por escrito al empezar.      */
  saludo: {
    audio: ['media/a0.m4a', 'media/a0.mp3'],
    transcripcion: 'Hola potxola, a ver qué haces aquí… te he preparado una cosita para estos días, pero no te voy a contar más. Dale y ya verás.'
  },

  /* 6 · PROGRESO ----------------------------------------------------------- */
  xpPorReto: 25,
  niveles: [
    { nivel: 1, xp: 0,   nombre: 'Exploradora',        frase: 'Cada reto suma.' },
    { nivel: 2, xp: 50,  nombre: 'Buscadora de luces', frase: 'Encuentras luces hasta donde no las hay.' },
    { nivel: 3, xp: 100, nombre: 'Reina del súper',    frase: 'Nadie coloca una tienda como tú.' },
    { nivel: 4, xp: 150, nombre: 'Experta en ratitos', frase: 'Nivel máximo. Los mejores ratitos, cosa tuya.' }
  ],

  /* 7 · CAPÍTULOS ----------------------------------------------------------
     notaDePaulo: tu notita debajo de cada pregunta opcional. Escríbela
     solo si es algo que de verdad vas a cumplir.                          */
  capitulos: [
    {
      id: 'c1',
      fecha: 'capitulo1',
      titulo: 'La maleta misteriosa',
      intro: 'Alguien ha dejado una maleta en la plaza. Está cerrada… y por aquí brillan cositas. ¿Me ayudas a llenarla?',
      retos: [
        {
          id: 'c1a', juego: 'maleta',
          titulo: 'Lo que brilla en la plaza',
          texto: 'Encuentra cinco cositas que brillan y guárdalas en la maleta.'
        },
        {
          id: 'c1b', juego: 'parejas',
          titulo: 'Parejas de lo nuestro',
          texto: 'Da la vuelta a las cartas y encuentra las seis parejas.',
          parejas: 6 // en modo fácil se juega con 4
        }
      ],
      conexion: {
        pregunta: 'Cuando volvamos a vernos, ¿qué te apetecería encontrarte?',
        opciones: ['Un abrazo', 'Un ratito tranquilos', 'Una tontería de las nuestras', 'Todavía no lo sé'],
        notaDePaulo: 'Me apetece preparar un ratito bueno contigo, a nuestro ritmo.'
      },
      sorpresa: 's1'
    },
    {
      id: 'c2',
      fecha: 'capitulo2',
      titulo: 'Mimimimi y las luces',
      intro: 'La tiendita de la esquina se ha quedado a oscuras. Dicen que, cuando se encienden sus luces, se oye un «mimimimi».',
      retos: [
        {
          id: 'c2a', juego: 'luces',
          titulo: 'Enciende las luces',
          texto: 'Gira las piezas para que la corriente llegue del enchufe al cartel.'
        },
        {
          id: 'c2b', juego: 'tienda',
          titulo: 'La tiendita',
          texto: 'Coloca cada cosa en su balda: tócala y luego su sitio, o arrástrala.'
        }
      ],
      conexion: {
        pregunta: 'Hoy me vendría bien…',
        opciones: ['Cariño', 'Distraerme', 'Calma', 'Que me escuchen', 'Mi espacio'],
        notaDePaulo: 'Quiero escucharte mejor y entender qué te ayuda.'
      },
      sorpresa: 's2'
    },
    {
      id: 'c3',
      fecha: 'capitulo3',
      titulo: 'Nuestro ratito',
      intro: 'Hoy toca preparar un rincón para estar a gusto: mantita, algo calentito y algo que ver o jugar.',
      retos: [
        {
          id: 'c3a', juego: 'rincon',
          titulo: 'Prepara el rincón',
          texto: 'Pon seis cositas en su sitio para que el rincón quede perfecto.'
        },
        {
          id: 'c3b', juego: 'palabras',
          titulo: 'Palabritas',
          texto: 'Une cada palabra con la suya en portugués. Con pistas y sin prisa.',
          // Las 4 primeras son las del modo fácil. Cámbialas si tú lo dices de otra forma.
          pares: [
            { es: 'él',        pt: 'ele',      pista: 'Igual que «él», pero con una e al final.' },
            { es: 'ella',      pt: 'ela',      pista: 'Como «ella», pero con una sola l.' },
            { es: 'abrazo',    pt: 'abraço',   pista: 'Casi igual: esa ç suena como una s.' },
            { es: 'besito',    pt: 'beijinho', pista: 'Un beso pequeñito, con «-inho» al final.' },
            { es: 'palomitas', pt: 'pipocas',  pista: 'Lo que hace «pop» antes de una peli.' },
            { es: 'gracias',   pt: 'obrigada', pista: 'Así da las gracias una chica.' }
          ]
        }
      ],
      conexion: {
        pregunta: 'Si necesitamos parar, ¿qué nos ayudaría?',
        opciones: ['Acordar cuándo seguimos', 'Un mensaje cortito', 'Un rato para desconectar', 'Hablar en persona', 'Ahora no'],
        aclaracion: 'Es una preferencia tuya para guardar, no un acuerdo: eso lo hablamos los dos cuando nos venga bien.',
        textoPasar: 'Pasar',
        notaDePaulo: 'Si ahora te apetece desconectar, también está bien.'
      },
      sorpresa: 's3'
    }
  ],

  /* 8 · SORPRESAS ----------------------------------------------------------
     Se ven solo al abrirlas. Los nombres s1, s2… son neutros a propósito.
     objeto: lo que aparece antes de abrir ('maleta' o 'regalo').
     propuesta y cuando: tu plan concreto. No pongas fechas ni reservas que
     no tengas cerradas.
     audio: lista de archivos posibles; se usa el primero que exista.
     transcripcion: el texto de tu audio (también sale si no hay audio).   */
  sorpresas: {
    s1: {
      objeto: 'maleta',
      titulo: 'Vale por una cena juntos',
      texto: 'Elegimos un día y disfrutamos a nuestro ritmo.',
      nota: 'Un ratito preparado para ti, a nuestro ritmo.',
      propuesta: 'Yo busco el sitio y me encargo de todo; tú solo tienes que venir.',
      cuando: 'Cuando vuelvas, miramos juntos qué día nos viene bien.',
      foto: null,
      audio: ['media/a1.m4a', 'media/a1.mp3'],
      transcripcion: 'Enhorabuena cariño, toma un regalo, sigue así.'
    },
    s2: {
      objeto: 'regalo',
      antesDeAbrir: {
        audio: ['media/a4.m4a', 'media/a4.mp3'],
        texto: 'Mimimimi, que ya sé que quieres ver qué hay. Venga, ahora sí, abre.'
      },
      titulo: 'Vale por una noche de peli o de juego',
      texto: 'Tú eliges: peli o partida. Las palomitas de mantequilla las pongo yo.',
      nota: 'Que tengo ganas de jugar y de reírnos un rato.',
      propuesta: 'Yo llevo las palomitas y preparo el sofá, la manta y lo que haga falta.',
      cuando: 'La primera noche tranquila que tengamos los dos.',
      foto: null,
      audio: ['media/a2.m4a', 'media/a2.mp3'],
      transcripcion: 'Me he acordado de ti y quería dejarte esto por aquí. Espero que te saque una sonrisita, te quiero.'
    },
    s3: {
      objeto: 'regalo',
      titulo: 'Vale por un regalo especial',
      texto: 'Lo que es… todavía no te lo voy a decir.',
      nota: 'Un pequeño misterio para cuando nos veamos.',
      propuesta: 'Te lo doy en mano.',
      cuando: 'En cuanto nos veamos.',
      foto: null,
      audio: null,
      transcripcion: null
    },
    s4: {
      objeto: 'regalo',
      titulo: 'Vale por una escapada a Sobrón',
      texto: 'Un día para nosotros junto al agua.',
      nota: 'Me apetece mucho ese plan contigo.',
      propuesta: 'Mi propuesta: preparar una ruta tranquila y una merienda junto al agua.',
      cuando: 'Elegimos juntos un día con buen tiempo.',
      foto: null,
      audio: null,
      transcripcion: null
    }
  },

  /* 9 · FINAL -------------------------------------------------------------- */
  final: {
    titulo: 'La puerta del viernes',
    carta: 'Quería prepararte algo nuestro para acompañarte estos días y sacarte alguna sonrisa. Me he acordado de nuestras tonterías y de los ratitos que me gusta compartir contigo. Tengo ganas de verte, potxola.',
    firma: 'Paulo',
    audio: ['media/a3.m4a', 'media/a3.mp3'],
    transcripcion: 'Quería prepararte algo nuestro para acompañarte estos días. Espero que te lo hayas pasado bien y que alguna sorpresa te haya hecho ilusión. Tengo ganas de verte, potxola.',
    sorpresa: 's4'
  },

  /* 10 · CUADERNO PRIVADO --------------------------------------------------
     Lo que ella escriba se queda en su móvil. No te llega nada.            */
  cuaderno: {
    texto: 'Si hay algo que te gustaría contarme cuando estemos tranquilos, puedes guardarlo aquí. También puedes pasar.'
  },

  /* 11 · EL PASE DEL FINAL --------------------------------------------------
     Al abrir la puerta del viernes, Naroa recibe un pase con su nombre.
     · Sin servidor: es un recuerdo que vive en su móvil y se puede guardar
       como imagen. No tiene código QR ni botones de Wallet.
     · Con el servidor del pase (carpeta servidor-pase, lo explica PASE.md):
       además lleva un QR para comprobar que es auténtico, botones de Apple
       Wallet y Google Wallet (si los configuras) y el canje cuando estéis
       juntos. Pon aquí su dirección, con / al final.
     Este archivo es público: aquí solo va la dirección. Las claves, los
     certificados, tu contraseña y la sorpresa extra se quedan en el servidor. */
  pase: {
    titulo: 'Pase de aventurera',
    mensaje: 'Gracias por jugar conmigo estos días.',
    lugares: ['La plaza', 'La tiendita', 'La casita', 'La puerta del viernes'],
    servidor: '',                      // p. ej. 'https://tudominio.com/aventura/pase/'  ('' = solo recuerdo)
    idAventura: 'naroa-octubre-2026'   // igual que aventura_id en el config.php del servidor
  },

  /* 12 · VISTA PREVIA (solo para ti) --------------------------------------
     Abre la web con #vista-previa al final del enlace, o en Ajustes mantén
     pulsado el número de versión 2 segundos y escribe esta palabra.
     No es una contraseña de seguridad: solo evita que se abra sin querer. */
  codigoVistaPrevia: 'pom'
};
