# Guion IA (actos 1-5, 7)

Locución definitiva. Cifras verificadas en `DOCUMENTACION_VIDEO.md`. La voz cuenta un relato: no lee lo que ya está escrito en la diapositiva. Hay karaoke en la toma de FlexSim y en el Acto 6, donde habla el equipo. En la web habla la IA, sin subtítulos.

Los actos 1 y 2 están en beats del grid. Desde el Acto 3 los tiempos son duraciones objetivo y se fijan en beats al construir cada acto.

| Acto | Tiempo | Texto locución | Audio |
|------|--------|----------------|-------|
| D1 chispa | b0–16 | (sin voz) | SIN VOZ |
| D2 portada | b16–40 | Simulación de líneas de hamburguesas Paty. | HABLA |
| D3–D6 integrantes y muro | b40–55 | (música e impactos) | SIN VOZ |
| D7 problema | b55–65 | En toda planta hay un lugar donde la producción se frena. Encontrarlo es nuestro problema. | HABLA |
| D8 sistema | b65–87 | La carne entra en pallets, atraviesa ocho etapas y sale convertida en cajas de hamburguesas. Las líneas siete y ocho hacen ese viaje en paralelo, todos los días. | HABLA |
| D9 nave | b87–95 | Todo pasa dentro de esta nave. | HABLA |
| D10–D12 escala | b95–119 | La mezcla se prepara en tandas grandes. En cada turno llegan los camiones con la materia prima, y a lo largo del día entra mucha más carne de la que parece. | HABLA |
| D13 sospechosa | b119–147 | Cada máquina tiene su propio ritmo, y la línea entera avanza al ritmo de la más lenta. La pregunta es cuál. | HABLA |
| D14 evidencia | b147–181 | Todas las miradas iban a la formadora, la máquina que le da forma a las hamburguesas. Trabaja bastante por debajo de lo que marca el estándar de la línea. | HABLA |
| D15 por qué la formadora | 8 s | ¿Por qué ella? Porque rinde apenas la mitad de su estándar, y una línea avanza al ritmo de su máquina más lenta. | HABLA |
| D16 cómo | b181–207 | Pero una sospecha no alcanza. Para saberlo, había que construir la planta y hacerla producir. | HABLA |
| D16–D17 referencia | b207–231 | Y para saber si el modelo es válido, tenemos contra qué compararlo: lo que la planta real produce por día. | HABLA |
| D19 por dónde arrancamos | 7 s | ¿Por dónde se empieza a simular una planta? Por los planos, después el modelo en tres dimensiones, FlexSim, y al final, comprobar que sea válido. | HABLA |
| D20 planos | b231–247 | Empezamos por el principio: le pedimos a la planta los planos de Elaborados. | HABLA |
| D19 Blender | b247–263 | Con ellos levantamos la planta completa en Blender, que tuvimos que aprender a usar para esto. | HABLA |
| D20 código | b263–287 | No la dibujamos a mano. Con ayuda de la IA escribimos el código que la construye, sector por sector, hasta tener cada máquina en su lugar. | HABLA |
| D21 intro | 0:00–0:06 | Acá está nuestra planta ya dentro de FlexSim, y al costado un tablero propio que se completa solo. | HABLA |
| D21 Producción | 0:07–0:27 | En la primera hoja vemos cuántos pallets terminados salen, comparados con lo que pide el programa. La meta es de 36 pallets por día en cada línea. Más abajo, lo que produce cada máquina. | HABLA |
| D21 Colas y WIP | 0:28–0:47 | Después miramos dónde se acumula el material: las cámaras, las colas y lo que hay en proceso. Si una máquina trabaja más lento que la anterior, ahí se forma la fila. Eso es lo que buscamos. | HABLA |
| D21 Paradas | 0:47–1:04 | Las máquinas también se rompen: acá vemos cuántas veces se paró cada equipo y por cuánto tiempo. Esas paradas salen de datos reales: cada cuánto falla cada equipo y cuánto tarda en repararse. | HABLA |
| D21 Velocidad | 1:05–1:22 | En velocidad vemos cuántos kilos por hora se producen, sobre la última hora simulada. Y lo comparamos con la formadora: 982 kilos por hora de capacidad, contra 1843 del estándar. | HABLA |
| D21 Balance de masa | 1:22–1:34 | El balance de masa cuida las cuentas: cuánta carne entra y cuánta sale en cajas. Un pallet de materia prima son 1500 kilos; uno terminado, 144 cajas. | HABLA |
| D21 Montacargas | 1:35–1:46 | Cada montacargas tiene su cuenta de traslados. Son cuatro, de la recepción a la expedición. | HABLA |
| D21 Estadística | 1:47–1:51 | Calentamiento de cuatro horas, y la ocupación por estación. | HABLA |
| D24 conclusiones | 12 s | Con todo esto, la simulación ya nos dice algo. Producimos casi cincuenta y cinco toneladas por día. La línea se frena en las mezcladoras, ocupadas el noventa y uno por ciento, por los treinta minutos de lavado de cada batch. La formadora no era el cuello. | HABLA |
| D25 necesidad | 12 s | Un tablero muestra lo que pasa, pero cada escenario son diez réplicas: abrir, correr, copiar los datos y comparar, todo a mano. Queríamos pedírselo a una inteligencia artificial y que lo hiciera ella. | HABLA |
| D26 qué es un MCP | 15 s | Para eso existe el MCP: un protocolo abierto que estandariza cómo las aplicaciones de inteligencia artificial se conectan con herramientas y datos externos. En un chat, la IA solo opina. Con un MCP, puede abrir el programa, hacerlo correr y medirlo. | HABLA |
| D27 no existía | 11 s | Para FlexSim no había ninguno. Cero. Así que construimos el nuestro, y hoy es uno. | HABLA |
| D28 el puente | 15 s | Funciona como un mozo: vos le pedís algo a la inteligencia artificial, el servidor elige la herramienta, la orden llega a FlexSim, y el resultado vuelve. | HABLA |
| D29 herramientas | 22,5 s | El MCP tiene setenta y tres herramientas propias, repartidas en ocho categorías: correr el modelo, leer sus datos, construir objetos, lanzar experimentos y hasta armar gráficos. | HABLA |
| D30 en uso | 15 s | Con esas herramientas la IA puede crear máquinas, conectarlas, asignarles recursos, cargar distribuciones y correr réplicas por su cuenta. | HABLA |
| D31 idea de la web | 17 s | Y si toda esa información ya salía de FlexSim, ¿por qué quedarnos ahí? Se nos ocurrió llevarla a una aplicación propia: en el celular, con la planta en la mano, y en cualquier navegador, para ver la simulación en tiempo real. | HABLA |
| D32 Elaborados | 52 s | Todo esto también se puede mirar desde afuera de FlexSim. Armamos una página web que recibe los datos del modelo mientras corre, y la planta se mueve en tres dimensiones. Recorremos el sector de elaborados: los trenes de picado, las líneas, las cámaras y, al final, las dos líneas que simulamos. | HABLA |
| D31 Seguir un lote | 48 s | Ahora seguimos un lote de mil quinientos kilos por las ocho etapas. En cada una, la web calcula cuánto tiempo pasa ahí con la ley de Little: lo que hay adentro, dividido por lo que pasa por hora. De punta a punta, un lote tarda poco más de dos horas, y casi todo ese tiempo se va antes de formar. | HABLA |
| D31 Producción | 9 s | Producción: cuántos pallets y cajas salen, comparados con lo programado. | HABLA |
| D31 Paradas | 9 s | Paradas: cuándo se frena cada máquina y qué tan seguido. | HABLA |
| D31 Colas y WIP | 9 s | Colas: dónde se acumula el material, y otra vez la ley de Little. | HABLA |
| D31 Velocidad | 9 s | Velocidad: los kilos por hora de cada línea contra su capacidad. | HABLA |
| D31 Balance de masa | 9 s | Balance de masa: lo que entra de carne y lo que sale en cajas. | HABLA |
| D31 Montacargas | 9 s | Montacargas: cuántos traslados hace cada uno. | HABLA |
| D31 Estadística | 9 s | Estadística: ajustes de distribuciones e intervalos de confianza. | HABLA |
| D31 Escenarios | 9 s | Y escenarios: qué pasaría si cambiamos la planta. De eso hablamos ahora. | HABLA |
| 6 stats y escenarios | 5:05 | (ver `guion_equipo.md`) | CALLA |
| D40 conclusiones | 12 s | En resumen: el modelo es válido, el cuello son las mezcladoras, acelerar las formadoras suma casi un veinte por ciento, y todo lo probamos sin tocar la planta. | HABLA |
| D41 cierre | 25 s | Gracias por recorrer la planta con nosotros. El modelo, la página web y el programa que conecta a FlexSim con el asistente quedan en estos repositorios. | HABLA |
| D42 final | 7 s | (música) | SIN VOZ |
