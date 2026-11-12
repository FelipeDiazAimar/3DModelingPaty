# Guion del equipo: qué dice cada uno y en qué minuto (video final de 14:45)

Tiempos en **minuto:segundo,décima del video terminado** (`min:seg`). *Máx.* es lo que dura la ventana de esa frase en pantalla: si la dicen más largo, la voz pisa la siguiente imagen. Hablan a ritmo normal (unos 13 caracteres por segundo); si les queda largo, acorten el texto sin cambiar las cifras.

## Cómo grabar
- **Una frase = un archivo.** Nómbrenlo con el código de la primera columna (por ejemplo `M01.wav`) y pásenmelos en una carpeta. Yo los ubico en su segundo exacto; no hace falta cuidar los silencios.
- Mismo micrófono y distancia para los tres, sin música ni ventilador, un par de segundos de silencio al principio y al final. WAV o MP3.
- Si una frase sale larga, regrábenla más corta antes que acelerar la voz.
- **Sin voz de IA en estos tramos**: la IA cubre todo lo demás del video (actos 1 a 5 y el cierre). Cuando tengan los audios, la voz de reserva del Acto 6 se apaga.

## Reparto (contiguo, para que cada uno hable de corrido un tema)
| Quién | Tema | Del minuto | Al minuto | Habla en total |
|---|---|---|---|---|
| **Matías (M)** | Datos de entrada, pruebas de bondad de ajuste y escenario base | 7:14 | 9:28 | 2:15 |
| **Felipe (F)** | Escenario E2 (formadoras rápidas) y E3 (más materia prima), con sus videos | 9:29 | 12:20 | 2:45 |
| **Jeremías (J)** | Escenario E4 (batch de 1200 kg), comparación y conclusión | 12:21 | 14:09 | 1:45 (+0:56 si graban también el Acto 3, de 2:45 a 3:40) |

Si quieren otro reparto, se cambia la letra de la primera columna y listo: los bloques son contiguos.

## Acto 6 · Estadística y escenarios (7:14 a 14:09)

### Matías · Datos de entrada y bondad de ajuste (diapositivas de distribuciones)
| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| M01 | 7:14,3 |  5.1 s | Los camiones llegan al azar: cantidad, tamaño y horario salen de datos reales. |
| M02 | 7:19,8 |  3.4 s | Tiempos fijos, salvo el ritmo diario de formado. |
| M03 | 7:23,6 |  6.2 s | Los pesos salen de pallets reales, y las fallas son exponenciales. |
| M04 | 7:30,2 |  5.1 s | Y la reparación, lognormal: muchas cortas y pocas largas. |
| M05 | 7:36,3 |  8.5 s | Antes de simular miramos los datos reales de la planta y les hicimos pruebas de bondad de ajuste. |
| M06 | 7:45,3 |  8.5 s | Kolmogorov-Smirnov mide la mayor distancia entre los datos y la curva teórica; si pasa el límite, se rechaza. |
| M07 | 7:54,2 |  4.3 s | Los arribos llegan en ráfagas: la exponencial queda rechazada. |
| M08 | 7:59,0 |  8.1 s | Las paradas tienen cola pesada: tampoco ajustan a una lognormal, aunque es la que mejor se acerca. |
| M09 | 8:07,5 |  8.5 s | Y el peso de los pallets es una mezcla de productos, así que la normal también se rechaza. |
| M10 | 8:16,5 |  3.8 s | No forzamos una distribución porque sí: lo decimos. |
| M11 | 8:21,3 |  8.1 s | En el modelo varían los camiones, el peso de los pallets, el ritmo de formado de cada día y las fallas. |
| M12 | 8:29,8 |  8.1 s | Corrimos diez réplicas de veinticuatro horas y calculamos intervalos de confianza del noventa y cinco por ciento. |
| M13 | 8:38,3 |  6.7 s | La línea tarda unas cuatro horas en llenarse desde vacía: ese es el transitorio. |
| M14 | 8:45,4 | 12.8 s | Y la entrada de materia prima cambia mucho de un día a otro, de ocho a ochenta batches: por eso los intervalos de confianza son anchos. |

### Matías · Escenario base E1
| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| M15 | 8:59,3 |  6.5 s | Este es el escenario base: cuarenta y nueve coma uno pallets por día. |
| M16 | 9:06,2 | 12.5 s | Sospechábamos de la formadora, pero el cuello real son las mezcladoras: setenta y cinco por ciento ocupadas y sesenta coma cinco toneladas de capacidad por día. |
| M17 | 9:19,2 |  9.0 s | La causa es el lavado de treinta minutos por cada batch, un dato que nos dio la planta. |

### Felipe · E2: formadoras más rápidas
| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| F01 | 9:29,3 | 14.8 s | ¿Y si las formadoras fueran más rápidas? Las subimos de novecientos ochenta y dos a mil ochocientos cuarenta y tres kilos por hora. |
| F02 | 9:44,5 | 12.2 s | Para comparar bien usamos las mismas diez réplicas, con números aleatorios comunes, y miramos la diferencia de a pares. |

**Durante el video de la corrida (9:56,9 a 10:29,6)**: en pantalla aparecen estos subtítulos. Léanlos tal cual, cada uno en su momento:

| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| F03 | 9:56,9 |  5.9 s | La propuesta: llevar las formadoras al estándar de línea. |
| F04 | 10:03,2 |  7.5 s | Corremos el modelo con ese cambio, veinticuatro horas, con las mismas semillas. |
| F05 | 10:11,1 |  8.3 s | El cuello se corre al desencajado, y el mezclado deja de limitar. |
| F06 | 10:19,7 |  9.8 s | Resultado: más pallets por día, con un intervalo de confianza que no incluye el cero. |

### Felipe · E2: resultado
| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| F07 | 10:30,1 |  7.7 s | Son nueve pallets más por día: un diecinueve por ciento. |
| F08 | 10:38,2 | 12.2 s | El intervalo va de cuatro coma cinco a catorce coma uno. No incluye el cero, así que la mejora es real, aunque ancha. |
| F09 | 10:50,9 | 10.3 s | Pero el cuello se mueve: ahora manda la primera etapa, donde se abren las cajas de materia prima, con setenta y cuatro coma siete toneladas por día. |

### Felipe · E3: más materia prima
| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| F10 | 11:02,2 |  6.7 s | Ahora lo obvio: si queremos producir más, traigamos más materia prima. |
| F11 | 11:09,3 |  7.3 s | Sobre las formadoras rápidas, uno coma cinco veces la materia prima que entra. |

**Durante el video de la corrida (11:16,8 a 11:50,8)**: en pantalla aparecen estos subtítulos. Léanlos tal cual, cada uno en su momento:

| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| F12 | 11:16,8 |  6.8 s | La propuesta: sumar uno coma cinco veces la materia prima. |
| F13 | 11:24,0 |  7.6 s | Corremos diez réplicas de veinticuatro horas, con las mismas semillas. |
| F14 | 11:32,0 |  8.4 s | La materia prima se acumula en cámara: entra más de lo que el desencajado consume. |
| F15 | 11:40,8 | 10.0 s | Contra el escenario anterior, el intervalo incluye el cero: no se distingue. |

### Felipe · E3: resultado
| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| F16 | 11:51,2 |  7.3 s | Contra el escenario anterior da tres coma seis pallets más por día. |
| F17 | 11:59,0 | 11.6 s | El intervalo va de menos cero coma tres a siete coma cinco: incluye el cero, así que no se distingue. |
| F18 | 12:11,1 |  9.2 s | La materia prima se acumula: las cámaras pasan de diecinueve a treinta pallets en promedio. |

### Jeremías · E4: batch de 1200 kg
| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| J01 | 12:21,3 | 10.7 s | Después probamos un batch más grande: mil doscientos kilos, ocho cargas, en lugar de mil cincuenta, siete cargas. |

**Durante el video de la corrida (12:32,0 a 13:06,0)**: en pantalla aparecen estos subtítulos. Léanlos tal cual, cada uno en su momento:

| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| J02 | 12:32,0 |  6.8 s | La propuesta: batch de mil doscientos kilos, ocho cargas en lugar de siete. |
| J03 | 12:39,2 |  7.6 s | Corremos el modelo con ese cambio, con las mismas semillas. |
| J04 | 12:47,2 |  8.4 s | El cuello sigue siendo el mezclado: lo que se ahorra en lavados casi se compensa. |
| J05 | 12:56,0 | 10.0 s | La diferencia es de cero coma seis pallets y no se distingue de cero. |

### Jeremías · E4: resultado
| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| J06 | 13:06,5 | 12.2 s | Rinde apenas cero coma seis pallets más por día, y esa diferencia no se distingue de cero. |
| J07 | 13:19,1 | 15.2 s | El intervalo va de cero a uno coma dos e incluye el cero: con este modelo, el tamaño del batch casi no cambia el resultado. |

### Jeremías · Comparación y conclusión
| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| J08 | 13:35,4 |  9.0 s | Comparando: base, cuarenta y nueve; formadoras rápidas, cincuenta y ocho; más materia prima, sesenta y dos; batch de 1200, cincuenta. |
| J09 | 13:45,4 |  4.8 s | La conclusión: lo que mueve la producción son las formadoras más rápidas. |
| J10 | 13:50,6 |  8.0 s | Más materia prima o un batch más grande, por sí solos, no se distinguen de cero. |
| J11 | 13:59,0 | 10.4 s | Y todo esto lo sabemos porque comparamos intervalos de confianza, no corridas sueltas. |

## Acto 3 · Tablero de FlexSim (opcional: hoy lo dice la IA)
En pantalla la toma del tablero con el karaoke en rojo; cada frase dura 8 s (una hoja del tablero). Si lo graban ustedes, avísenme y quito la voz de IA de este tramo.

| Código | Minuto | Máx. | Texto |
|---|---|---|---|
| J12 | 2:44,9 |  7.2 s | La planta en FlexSim y, al costado, nuestro tablero: pallets terminados contra la meta del programa. |
| J13 | 2:52,9 |  7.2 s | Después, dónde se acumula el material: cámaras, colas y lo que hay en proceso. Ahí se forma la fila. |
| J14 | 3:00,9 |  7.2 s | Las máquinas también se rompen: cuántas veces se paró cada equipo y por cuánto tiempo, con datos reales. |
| J15 | 3:08,9 |  7.2 s | En velocidad, los kilos por hora: la formadora tiene 982 de capacidad, contra 1843 del estándar. |
| J16 | 3:16,9 |  7.2 s | El balance de masa cuida las cuentas: un batch son mil cincuenta kilos, siete cargas. |
| J17 | 3:24,9 |  7.2 s | Cada montacargas tiene su cuenta de traslados: son cuatro, de la recepción a la expedición. |
| J18 | 3:32,9 |  7.2 s | Y las estadísticas: calentamiento de cuatro horas y ocupación de cada estación. |

## Lo que dice la IA (para que no lo repitan)
Actos 1 a 5 y cierre: portada, rubro, problema, sistema, base, hipótesis, planos y Blender, el MCP, la web y las conclusiones y los agradecimientos finales. Texto completo en `guion_ia.md`; las frases ya generadas están en `film/assets/audio/voz.mp3`.
