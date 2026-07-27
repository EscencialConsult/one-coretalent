// Contenido "Parte I" (educativo) por test, que renderiza FichaTest.jsx al inicio de
// cada informe. Texto descriptivo/educativo (NO toca los resultados, que son
// deterministas). Big Five tiene su Parte I embebida en su propio informe, por eso no
// figura acá. Estructura de cada ficha:
//   { titulo, queEsTitulo, queEs:[], historia:[], tabla:{titulo,intro,cols,filas},
//     queNoEs:[{t,d}], resumen, comoSeCalcula:{intro,tabla?,nota}, parteII }

export const FICHAS = {
  // ─────────────────────────── Bar-On EQ-i ───────────────────────────
  'baron-eqi': {
    titulo: 'Comprendiendo el Bar-On EQ-i',
    queEsTitulo: '¿Qué es el Test Bar-On EQ-i?',
    queEs: [
      'El Bar-On Emotional Quotient Inventory (EQ-i) es uno de los instrumentos de evaluación de la inteligencia emocional y social más reconocidos y validados científicamente a nivel mundial.',
      'Consiste en un cuestionario de 133 ítems (escala Likert de 5 puntos) que organiza sus resultados en 15 subescalas agrupadas en 5 grandes componentes: Intrapersonal, Interpersonal, Adaptabilidad, Manejo del Estrés y Estado de Ánimo General.',
    ],
    historia: [
      'Fue desarrollado por el Dr. Reuven Bar-On, que define la inteligencia emocional como un conjunto de capacidades, competencias y habilidades no cognitivas que influyen en la habilidad de una persona para afrontar las demandas y presiones del entorno.',
      'El sistema normaliza los puntajes brutos a una escala porcentual (0 a 100) para comparar el peso relativo de cada área, y contempla un ajuste de consistencia interno: la puntuación de ciertos ítems de control se resta del Cociente Emocional Total y del componente Interpersonal para afinar la precisión del perfil.',
    ],
    tabla: {
      titulo: 'Los 5 componentes',
      intro: 'Cada componente agrupa varias subescalas de la inteligencia emocional.',
      cols: ['Componente', 'Qué evalúa'],
      filas: [
        ['Intrapersonal', 'Reconocer y expresar las emociones propias.'],
        ['Interpersonal', 'Habilidades sociales, relacionales y empatía.'],
        ['Adaptabilidad', 'Flexibilidad, prueba de la realidad y ajuste a los cambios.'],
        ['Manejo del Estrés', 'Tolerancia a la presión y control de impulsos.'],
        ['Estado de Ánimo', 'Bienestar, felicidad y optimismo.'],
      ],
    },
    queNoEs: [
      { t: 'No mide inteligencia (IQ)', d: 'evalúa el espectro socioemocional, no las habilidades cognitivas tradicionales.' },
      { t: 'No emite diagnósticos inmutables', d: 'refleja el momento actual y puede variar por factores contextuales o el estado emocional del día.' },
      { t: 'No debe interpretarse de forma aislada', d: 'conviene integrarlo en un proceso más amplio, con la orientación de un profesional de la psicología.' },
    ],
    resumen: 'los porcentajes describen la disponibilidad de cada recurso emocional, no el valor de la persona.',
    comoSeCalcula: {
      intro: 'Cada subescala y componente obtiene un puntaje bruto que se normaliza a un porcentaje (0 a 100) y se clasifica en un nivel. El Cociente Emocional Total aplica además el ajuste de consistencia.',
      tabla: {
        cols: ['Porcentaje', 'Nivel'],
        filas: [['≥ 80%', 'Muy Alto'], ['65–79%', 'Alto'], ['35–64%', 'Promedio'], ['20–34%', 'Bajo'], ['< 20%', 'Muy Bajo']],
      },
      nota: 'los puntajes, porcentajes y niveles se calculan de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── CAD ───────────────────────────
  cad: {
    titulo: 'Comprendiendo el CAD',
    queEsTitulo: '¿Qué es el Cuestionario de Afrontamiento del Dolor (CAD)?',
    queEs: [
      'El CAD es una herramienta autoadministrada diseñada para detectar y evaluar las estrategias psicológicas y conductuales que utiliza una persona para hacer frente al dolor crónico.',
      'Consta de 31 ítems (escala tipo Likert de acuerdo) que exploran seis estrategias: Religión, Catarsis, Distracción, Autocontrol mental, Autoafirmación y Búsqueda de información.',
    ],
    historia: [
      'Fue creado en España por los investigadores Soriano y Monsalve, con buenos índices de consistencia interna (alfa de Cronbach: Religión 0.94, Catarsis 0.88, Distracción 0.82, Autocontrol 0.81, Autoafirmación 0.79, Búsqueda de información 0.77).',
      'A diferencia de otras pruebas, el CAD no establece puntos de corte oficiales: su análisis es relativo (ipsativo), comparando qué estrategias predominan sobre otras en la misma persona.',
    ],
    queNoEs: [
      { t: 'No mide la intensidad del dolor', d: 'ni diagnostica su origen médico; sólo evalúa las herramientas psicológicas para convivir con él.' },
      { t: 'Un puntaje bajo no es un déficit', d: 'indica menor preferencia, menor utilidad percibida o menor entrenamiento en esa estrategia.' },
      { t: 'No debe interpretarse de forma aislada', d: 'conviene integrarlo en una evaluación más amplia con un profesional.' },
    ],
    resumen: 'la puntuación normalizada (0 a 4) permite comparar estrategias con distinto número de ítems dentro del mismo perfil.',
    comoSeCalcula: {
      intro: 'Cada estrategia suma los valores de sus ítems y se expresa como puntuación normalizada (0 a 4) y como porcentaje. No hay niveles ni cortes oficiales: se comparan las estrategias entre sí (más altas vs. más bajas).',
      nota: 'los totales, promedios y porcentajes se calculan de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── Toulouse-Piéron ───────────────────────────
  'toulouse-pieron': {
    titulo: 'Comprendiendo el Toulouse-Piéron',
    queEsTitulo: '¿Qué es el Test de Toulouse-Piéron?',
    queEs: [
      'Es una prueba perceptiva que evalúa la atención sostenida, la concentración y la rapidez de procesamiento visual.',
      'Presenta una matriz de 1.600 cuadrados; al inicio se indican dos cuadrados de referencia y la tarea es marcar, en 10 minutos, todos los idénticos a los de referencia, discriminándolos de los distractores.',
    ],
    historia: [
      'Las métricas no dan un puntaje estático: la combinación de varias variables define distintos perfiles atencionales. De las puntuaciones directas (Total Procesado = Aciertos + Errores + Omisiones) se derivan tres baremos de rendimiento.',
    ],
    tabla: {
      titulo: 'Los tres baremos y los perfiles',
      intro: 'Atención (según aciertos), Precisión (según errores) y Velocidad (según total procesado). Su cruce define el perfil.',
      cols: ['Baremo', 'Rango'],
      filas: [
        ['Atención', 'Muy Bajo → Muy Alto'],
        ['Precisión', 'Muy Baja → Excelente'],
        ['Velocidad', 'Muy Lento → Muy Rápido'],
        ['Perfil', 'Atento y Preciso · Lento y Preciso · Intermedio · Rápido e Impulsivo · Disperso'],
      ],
    },
    queNoEs: [
      { t: 'No mide inteligencia ni CI', d: 'sólo evalúa la concentración visual focalizada frente a estímulos repetitivos.' },
      { t: 'No es un diagnóstico', d: 'un perfil "Disperso" o con dificultades severas de atención no implica un diagnóstico (por ejemplo, TDAH).' },
      { t: 'Ante resultados atípicos', d: 'se requiere una evaluación neuropsicológica complementaria.' },
    ],
    comoSeCalcula: {
      intro: 'Se comparan las marcas reales del evaluado contra los cuadrados objetivo de la grilla, obteniendo aciertos, errores y omisiones exactos. Con esas puntuaciones directas se ubican los tres baremos y el perfil resultante.',
      nota: 'aciertos, errores y omisiones se calculan comparando marca por marca contra los objetivos reales, sin estimaciones.',
    },
  },

  // ─────────────────────────── CHASIDE ───────────────────────────
  chaside: {
    titulo: 'Comprendiendo el CHASIDE',
    queEsTitulo: '¿Qué es el Test CHASIDE?',
    queEs: [
      'Es un cuestionario de orientación vocacional que ayuda a identificar intereses y aptitudes hacia distintas áreas profesionales, para orientar decisiones de estudio o carrera.',
      'Su nombre es un acrónimo de las siete áreas que evalúa: Administrativas, Humanísticas, Artísticas, Sociales, Investigativas (Científicas), (Defensa/Seguridad) y Ecológicas/Técnicas.',
    ],
    tabla: {
      titulo: 'Las 7 áreas',
      intro: 'Cada letra representa un campo de intereses y aptitudes.',
      cols: ['Letra', 'Área'],
      filas: [
        ['C', 'Administrativas y contables'],
        ['H', 'Humanísticas y sociales'],
        ['A', 'Artísticas'],
        ['S', 'Servicio social / salud'],
        ['I', 'Investigativas / científicas'],
        ['D', 'Defensa y seguridad'],
        ['E', 'Ecológicas / técnicas'],
      ],
    },
    queNoEs: [
      { t: 'No mide inteligencia ni rendimiento', d: 'orienta según intereses y preferencias, no según capacidad.' },
      { t: 'No es determinante', d: 'es una guía orientativa; la decisión vocacional integra muchos otros factores.' },
      { t: 'No reemplaza la orientación profesional', d: 'conviene acompañarlo con un proceso de orientación vocacional.' },
    ],
    comoSeCalcula: {
      intro: 'Cada ítem (Sí/No) suma a su área correspondiente, tanto en intereses como en aptitudes. Las áreas con mayor puntaje señalan la orientación predominante.',
      nota: 'los puntajes por área se calculan de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── DNLA Percepción Personal ───────────────────────────
  'dnla-percepcion-personal': {
    titulo: 'Comprendiendo el DNLA – Percepción Personal',
    queEsTitulo: '¿Qué es el DNLA – Personal Insight Profile?',
    queEs: [
      'Es una autoevaluación de bienestar integral y desarrollo personal: cómo se percibe la persona en distintas áreas de su vida y su equilibrio emocional.',
      'Se responde con una escala de frecuencia y organiza los resultados en seis dimensiones de bienestar y desarrollo.',
    ],
    tabla: {
      titulo: 'Las 6 dimensiones',
      intro: 'Cada dimensión aporta una mirada del bienestar y el desarrollo personal.',
      cols: ['Dimensión', 'Qué explora'],
      filas: [
        ['Autopercepción y Autoestima', 'Cómo se valora y se percibe la persona.'],
        ['Motivación y Propósito', 'Sentido, metas y motivación.'],
        ['Adaptabilidad Emocional', 'Manejo de emociones y cambios.'],
        ['Relaciones y Empatía', 'Vínculos y conexión con otros.'],
        ['Bienestar y Equilibrio', 'Balance general de vida.'],
        ['Crecimiento Personal', 'Aprendizaje y desarrollo continuo.'],
      ],
    },
    queNoEs: [
      { t: 'No es un diagnóstico clínico', d: 'es una autopercepción, influida por el momento y el estado de ánimo.' },
      { t: 'No hay respuestas correctas', d: 'refleja la mirada de la propia persona sobre sí misma.' },
      { t: 'No debe usarse de forma aislada', d: 'es un insumo para la reflexión y el desarrollo, mejor acompañado.' },
    ],
    comoSeCalcula: {
      intro: 'Cada dimensión promedia sus ítems y se expresa en un puntaje comparable, que refleja la autopercepción en esa área.',
      nota: 'los promedios por dimensión se calculan de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── DNLA Leadership ───────────────────────────
  'dnla-leadership': {
    titulo: 'Comprendiendo el DNLA – Liderazgo',
    queEsTitulo: '¿Qué es el DNLA – Leadership & Middle Management?',
    queEs: [
      'Es una autoevaluación del estilo de liderazgo y gestión de mandos medios: cómo la persona guía, comunica, decide, motiva y desarrolla a su equipo.',
      'Consta de 40 afirmaciones respondidas según la frecuencia (1 a 5) con que la persona actúa de ese modo, organizadas en 8 competencias de liderazgo.',
    ],
    tabla: {
      titulo: 'Las 8 competencias',
      intro: 'Cada competencia describe una faceta del liderazgo.',
      cols: ['Competencia', 'Foco'],
      filas: [
        ['Visión Estratégica', 'Rumbo y objetivos.'],
        ['Comunicación', 'Claridad y escucha.'],
        ['Decisión', 'Resolución y criterio.'],
        ['Motivación', 'Inspirar al equipo.'],
        ['Conflictos', 'Gestión de tensiones.'],
        ['Resiliencia', 'Sostener bajo presión.'],
        ['Innovación', 'Mejora y cambio.'],
        ['Autogestión', 'Organización personal.'],
      ],
    },
    queNoEs: [
      { t: 'No mide resultados de negocio', d: 'evalúa el estilo y las competencias percibidas, no el desempeño objetivo.' },
      { t: 'Es una autoevaluación', d: 'refleja cómo la persona cree que actúa; conviene contrastarla con una mirada 360°.' },
      { t: 'No es un veredicto', d: 'es un insumo para el desarrollo del liderazgo.' },
    ],
    comoSeCalcula: {
      intro: 'Cada competencia promedia sus ítems (escala 1 a 5). El perfil muestra las competencias más y menos desarrolladas.',
      nota: 'los promedios por competencia se calculan de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── DISC ───────────────────────────
  disc: {
    titulo: 'Comprendiendo el DISC',
    queEsTitulo: '¿Qué es el Test DISC Profesional?',
    queEs: [
      'Es una evaluación del estilo de comportamiento que describe cómo tiende a actuar una persona, especialmente en el entorno laboral, a través de cuatro dimensiones: Dominancia, Influencia, Estabilidad y Cumplimiento.',
      'Se responde por elección forzada: en cada grupo de adjetivos se elige el que MÁS y el que MENOS describe a la persona.',
    ],
    historia: [
      'El modelo DISC se basa en el trabajo de William Moulton Marston sobre las emociones y el comportamiento normal. Esta versión usa el método de elección forzada (tipo Cleaver) para perfilar el estilo.',
    ],
    tabla: {
      titulo: 'Las 4 dimensiones',
      intro: 'Cada persona combina las cuatro en distinta medida; no hay un estilo "mejor".',
      cols: ['Dimensión', 'Tendencia'],
      filas: [
        ['D · Dominancia', 'Orientación a resultados, decisión, desafío.'],
        ['I · Influencia', 'Comunicación, entusiasmo, relación.'],
        ['S · Estabilidad', 'Constancia, colaboración, paciencia.'],
        ['C · Cumplimiento', 'Precisión, normas, análisis.'],
      ],
    },
    queNoEs: [
      { t: 'No mide inteligencia ni aptitudes', d: 'describe el estilo de comportamiento, no la capacidad.' },
      { t: 'No hay perfiles buenos o malos', d: 'cada estilo aporta fortalezas según el rol y el contexto.' },
      { t: 'No es un diagnóstico', d: 'refleja tendencias de conducta, no rasgos fijos e inmutables.' },
    ],
    comoSeCalcula: {
      intro: 'A partir de las elecciones de MÁS y MENOS en cada grupo se computan los puntajes de D, I, S y C. La combinación define el perfil dominante y su patrón de comportamiento.',
      nota: 'los puntajes por dimensión se calculan de forma determinista a partir de las elecciones reales (letra por letra).',
    },
  },

  // ─────────────────────────── Dominó D-48 ───────────────────────────
  'domino-48': {
    titulo: 'Comprendiendo el Dominó D-48',
    queEsTitulo: '¿Qué es el Test de Dominó (D-48)?',
    queEs: [
      'Es una prueba de inteligencia general no verbal: mide la capacidad de razonamiento lógico y abstracto (el factor "g") mediante series de fichas de dominó.',
      'En cada ítem hay una secuencia de fichas que sigue una regla lógica y hay que deducir los puntos de la ficha faltante. Es una prueba con tiempo límite.',
    ],
    historia: [
      'Fue desarrollado por E. Anstey. Al usar fichas de dominó en lugar de palabras, reduce la influencia del lenguaje y la cultura, por lo que se considera relativamente "libre de cultura".',
    ],
    queNoEs: [
      { t: 'No mide conocimientos ni memoria', d: 'evalúa el razonamiento lógico-abstracto, no lo aprendido.' },
      { t: 'No define el valor de la persona', d: 'es una medida de un tipo específico de inteligencia, entre muchos.' },
      { t: 'No es un diagnóstico', d: 'un resultado puntual puede verse afectado por el estado o el contexto de la prueba.' },
    ],
    comoSeCalcula: {
      intro: 'Se cuentan los aciertos (respuestas correctas) y se comparan con un baremo para ubicar el nivel/percentil de razonamiento y la tipología correspondiente.',
      nota: 'los aciertos y el nivel se calculan de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── Eneagrama ───────────────────────────
  eneagrama: {
    titulo: 'Comprendiendo el Eneagrama',
    queEsTitulo: '¿Qué es el Test de Eneagrama?',
    queEs: [
      'El Eneagrama es un modelo de personalidad que describe nueve tipos (eneatipos), cada uno con una motivación central, un miedo básico y un patrón de comportamiento característico.',
      'Este test consta de 90 ítems (10 por eneatipo) respondidos en una escala de frecuencia (1 a 5). Determina el tipo base, sus dos alas y las flechas de integración y desintegración.',
    ],
    historia: [
      'El Eneagrama integra tradiciones de sabiduría con la psicología moderna. Cada tipo se conecta con otros dos mediante "flechas": la de integración (crecimiento) y la de desintegración (estrés), que describen cómo cambia la persona según su momento.',
    ],
    queNoEs: [
      { t: 'No es un diagnóstico clínico', d: 'describe patrones de personalidad, no trastornos.' },
      { t: 'Ningún tipo es mejor que otro', d: 'cada eneatipo tiene fortalezas y desafíos propios.' },
      { t: 'No encasilla a la persona', d: 'es un mapa para el autoconocimiento; las personas son más complejas que una etiqueta.' },
    ],
    resumen: 'el tipo base es el patrón predominante; las alas y las flechas matizan el perfil.',
    comoSeCalcula: {
      intro: 'Cada eneatipo se puntúa normalizando sus 10 ítems de 0 a 100 (todo 1 = 0%, todo 5 = 100%). El de mayor puntaje es el tipo base; los dos siguientes son las alas; las flechas surgen del mapa del eneagrama.',
      nota: 'los puntajes por eneatipo, el tipo base, las alas y las flechas se calculan de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── GDS-15 ───────────────────────────
  'gds-15': {
    titulo: 'Comprendiendo la GDS-15',
    queEsTitulo: '¿Qué es la Escala de Depresión Geriátrica (GDS-15)?',
    queEs: [
      'Es un cuestionario breve de cribado de síntomas depresivos, especialmente validado en personas mayores. Consta de 15 preguntas de respuesta Sí/No sobre cómo se sintió la persona en la última semana.',
      'No es un instrumento diagnóstico: es una herramienta de tamizaje que orienta sobre la posible presencia de sintomatología depresiva.',
    ],
    historia: [
      'La GDS fue desarrollada por Yesavage y colaboradores; la versión de 15 ítems es la forma abreviada de uso más extendido por su rapidez y facilidad de administración.',
    ],
    queNoEs: [
      { t: 'No es un diagnóstico', d: 'es un cribado; un resultado alterado requiere una evaluación clínica profesional.' },
      { t: 'No mide la gravedad clínica', d: 'orienta sobre la presencia de síntomas, no reemplaza la valoración de un profesional.' },
      { t: 'No debe usarse de forma aislada', d: 'se interpreta dentro de una evaluación más amplia.' },
    ],
    comoSeCalcula: {
      intro: 'Cada respuesta indicativa de síntoma suma 1 punto (algunos ítems puntúan con "Sí" y otros con "No"). El total ubica el resultado en una banda de cribado.',
      tabla: {
        cols: ['Puntaje', 'Interpretación (orientativa)'],
        filas: [['0–4', 'Normal'], ['5–8', 'Depresión leve'], ['9–11', 'Depresión moderada'], ['12–15', 'Depresión severa']],
      },
      nota: 'el puntaje total se calcula de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── IPP-R ───────────────────────────
  'ipp-r': {
    titulo: 'Comprendiendo el IPP-R',
    queEsTitulo: '¿Qué es el IPP-R?',
    queEs: [
      'El Inventario de Intereses y Preferencias Profesionales – Revisado (IPP-R) explora el grado de agrado o interés de la persona hacia distintas actividades y profesiones, para orientar decisiones vocacionales y de carrera.',
      'Se responde indicando, para cada ítem, el nivel de agrado (No conozco / Desagrado / Indiferencia / Agrado). Los ítems se agrupan en 15 campos profesionales.',
    ],
    queNoEs: [
      { t: 'No mide aptitud ni capacidad', d: 'mide intereses y preferencias, no si la persona "sirve" para algo.' },
      { t: 'No es determinante', d: 'es una guía orientativa dentro de un proceso de orientación más amplio.' },
      { t: 'No reemplaza al orientador', d: 'conviene acompañarlo con una devolución profesional.' },
    ],
    comoSeCalcula: {
      intro: 'Se suma el agrado de los ítems de cada campo profesional. Los campos con mayor puntaje señalan los intereses predominantes; el patrón (concentrado o disperso) también aporta información.',
      nota: 'los puntajes por campo se calculan de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── Kuder ───────────────────────────
  kuder: {
    titulo: 'Comprendiendo el Kuder',
    queEsTitulo: '¿Qué es el Test de Kuder?',
    queEs: [
      'Es un inventario de intereses vocacionales que identifica las áreas de actividad que la persona prefiere, para orientar decisiones de estudio o trabajo.',
      'Se responde por elección forzada: en cada grupo de tres actividades se elige la que MÁS y la que MENOS gusta. Los resultados se agrupan en 10 áreas de interés.',
    ],
    tabla: {
      titulo: 'Las 10 áreas de interés',
      intro: 'Cada área agrupa un tipo de actividad preferida.',
      cols: ['Área', 'Ejemplos'],
      filas: [
        ['Aire libre', 'Trabajo al exterior, naturaleza.'],
        ['Mecánico', 'Máquinas, herramientas.'],
        ['Cálculo', 'Números, precisión.'],
        ['Científico', 'Investigación, experimentar.'],
        ['Persuasivo', 'Convencer, vender.'],
        ['Artístico', 'Diseño, creatividad.'],
        ['Literario', 'Leer, escribir.'],
        ['Musical', 'Música.'],
        ['Servicio social', 'Ayudar a otros.'],
        ['Administrativo', 'Orden, oficina.'],
      ],
    },
    queNoEs: [
      { t: 'No mide aptitud', d: 'mide intereses, no la capacidad para desempeñar una actividad.' },
      { t: 'No es un veredicto vocacional', d: 'es una guía orientativa.' },
      { t: 'No reemplaza la orientación profesional', d: 'se interpreta mejor con acompañamiento.' },
    ],
    comoSeCalcula: {
      intro: 'A partir de las elecciones de MÁS y MENOS se computa el interés relativo por cada una de las 10 áreas, expresado en un ranking/percentiles.',
      nota: 'los puntajes por área se calculan de forma determinista a partir de las elecciones.',
    },
  },

  // ─────────────────────────── STAI ───────────────────────────
  stai: {
    titulo: 'Comprendiendo el STAI',
    queEsTitulo: '¿Qué es el Cuestionario de Ansiedad Estado-Rasgo (STAI)?',
    queEs: [
      'El STAI evalúa dos facetas de la ansiedad: la ansiedad-estado (cómo se siente la persona en este momento) y la ansiedad-rasgo (cómo se siente habitualmente, como tendencia estable).',
      'Consta de 40 ítems (20 de estado y 20 de rasgo) con escalas de intensidad/frecuencia de 4 puntos. Algunos ítems están formulados de manera inversa.',
    ],
    historia: [
      'Fue desarrollado por Spielberger y colaboradores. La distinción estado/rasgo es uno de los aportes centrales del modelo: permite separar la reacción puntual de la predisposición general.',
    ],
    queNoEs: [
      { t: 'No es un diagnóstico', d: 'evalúa niveles de ansiedad, no un trastorno; un resultado alto requiere valoración profesional.' },
      { t: 'Mide un momento y una tendencia', d: 'la ansiedad-estado puede variar según la situación del día.' },
      { t: 'No debe usarse de forma aislada', d: 'se interpreta dentro de una evaluación más amplia.' },
    ],
    comoSeCalcula: {
      intro: 'Se suman los ítems de cada escala (invirtiendo los ítems inversos) y el puntaje se compara con baremos por sexo para obtener el nivel de ansiedad-estado y de ansiedad-rasgo.',
      nota: 'los puntajes de estado y rasgo se calculan de forma determinista a partir de las respuestas.',
    },
  },

  // ─────────────────────────── WAIS-IV (screening) ───────────────────────────
  'wais-iv': {
    titulo: 'Comprendiendo el WAIS-IV',
    queEsTitulo: '¿Qué es esta evaluación tipo WAIS-IV?',
    queEs: [
      'La WAIS-IV (Escala de Inteligencia de Wechsler para Adultos) es una de las pruebas de inteligencia más usadas. Organiza la capacidad cognitiva en cuatro índices: Comprensión Verbal, Razonamiento Perceptual, Memoria de Trabajo y Velocidad de Procesamiento.',
      'Esta versión es una adaptación de screening de opción múltiple: ofrece una estimación orientativa del perfil cognitivo, no una administración clínica completa.',
    ],
    queNoEs: [
      { t: 'No es la WAIS-IV clínica', d: 'es una adaptación de tamizaje; no sustituye una evaluación con un psicólogo habilitado y el material original.' },
      { t: 'El CI es orientativo', d: 'la estimación no equivale a un CI clínico normado.' },
      { t: 'No es un diagnóstico', d: 'un resultado puntual puede verse afectado por el contexto y el estado de la persona.' },
    ],
    comoSeCalcula: {
      intro: 'Cada respuesta correcta suma a su índice. A partir de los aciertos se estima un puntaje por índice (ICV, IRP, IMT, IVP) y un CI estimado global, con sus fortalezas y debilidades relativas.',
      nota: 'los aciertos, los índices y la estimación se calculan de forma determinista a partir de las respuestas.',
    },
  },
}

// Excel Integral (mismos textos para los tres niveles; cambia sólo la cantidad de ítems).
const FICHA_EXCEL = {
  titulo: 'Comprendiendo la evaluación de Excel',
  queEsTitulo: '¿Qué es la evaluación de Excel Integral?',
  queEs: [
    'Es una prueba de conocimiento técnico que mide el dominio de Microsoft Excel mediante preguntas de opción múltiple con una única respuesta correcta.',
    'A diferencia de los tests psicométricos, acá sí hay respuestas correctas e incorrectas: el resultado es el porcentaje de aciertos, organizado por categorías temáticas (fórmulas, funciones, formato, etc.).',
  ],
  queNoEs: [
    { t: 'No es un test de personalidad ni psicométrico', d: 'mide conocimiento técnico de una herramienta, no rasgos de la persona.' },
    { t: 'No mide la experiencia real', d: 'evalúa el conocimiento puntual sobre Excel, que puede diferir de la práctica cotidiana.' },
    { t: 'Es una foto del momento', d: 'el resultado refleja el conocimiento actual y mejora con la práctica y la capacitación.' },
  ],
  comoSeCalcula: {
    intro: 'Se cuenta la cantidad de respuestas correctas sobre el total y se obtiene el porcentaje de aciertos, además del detalle por categoría. El porcentaje ubica el resultado en una banda de desempeño.',
    nota: 'el porcentaje de aciertos y el detalle por categoría se calculan de forma determinista a partir de las respuestas.',
  },
}
FICHAS['excel-inicial'] = FICHA_EXCEL
FICHAS['excel-intermedio'] = FICHA_EXCEL
FICHAS['excel-avanzado'] = FICHA_EXCEL
