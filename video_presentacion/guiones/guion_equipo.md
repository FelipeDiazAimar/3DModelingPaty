# Guion equipo, Acto 6 (karaoke)

Se graba después, sobre el video terminado, siguiendo el barrido. Dura 5:00 (D32 a D38). La IA calla todo el acto. Cifras verificadas en `DOCUMENTACION_VIDEO.md`. No se compara contra valores de la planta.

## D32 · Jeremias Micheloud · 8:55 (22 s)

1. Los camiones llegan al azar: cantidad, tamaño y horario salen de datos reales.
2. Tiempos fijos, salvo el ritmo diario de formado.
3. Los pesos salen de pallets reales, y las fallas son exponenciales.
4. Y la reparación, lognormal: muchas cortas y pocas largas.

## D33 · Jeremias Micheloud · 9:17 (45 s)

1. Antes de simular miramos los datos reales de la planta y les hicimos pruebas de bondad de ajuste.
2. Kolmogorov-Smirnov mide la mayor distancia entre los datos y la curva teórica; si pasa el límite, se rechaza.
3. Los arribos llegan en ráfagas: la exponencial queda rechazada.
4. Las paradas tienen cola pesada: tampoco ajustan a una lognormal, aunque es la que mejor se acerca.
5. Y el peso de los pallets es una mezcla de productos, así que la normal también se rechaza.
6. No forzamos una distribución porque sí: lo decimos.

## D34 · Jeremias Micheloud · 10:02 (38 s)

1. En el modelo varían los camiones, el peso de los pallets, el ritmo de formado de cada día y las fallas.
2. Corrimos diez réplicas de veinticuatro horas y calculamos intervalos de confianza del noventa y cinco por ciento.
3. La línea tarda unas cuatro horas en llenarse desde vacía: ese es el transitorio.
4. Y la entrada de materia prima cambia mucho de un día a otro, de ocho a ochenta batches: por eso los intervalos de confianza son anchos.

## D35 · Felipe Diaz Aimar · 10:40 (30 s)

1. Este es el escenario base: cuarenta y nueve coma uno pallets por día.
2. Sospechábamos de la formadora, pero el cuello real son las mezcladoras: setenta y cinco por ciento ocupadas y sesenta coma cinco toneladas de capacidad por día.
3. La causa es el lavado de treinta minutos por cada batch, un dato que nos dio la planta.

## D36 · Felipe Diaz Aimar · 11:10 (60 s)

1. ¿Y si las formadoras fueran más rápidas? Las subimos de novecientos ochenta y dos a mil ochocientos cuarenta y tres kilos por hora.
2. Para comparar bien usamos las mismas diez réplicas, con números aleatorios comunes, y miramos la diferencia de a pares.
3. Son nueve pallets más por día: un diecinueve por ciento.
4. El intervalo va de cuatro coma cinco a catorce coma uno. No incluye el cero, así que la mejora es real, aunque ancha.
5. Pero el cuello se mueve: ahora manda el desencajado, con setenta y cuatro coma siete toneladas por día.

## D37 · Matias Buffa · 12:10 (45 s)

1. Ahora lo obvio: si queremos producir más, traigamos más materia prima.
2. Sobre las formadoras rápidas, uno coma cinco veces la materia prima que entra.
3. Contra el escenario anterior da tres coma seis pallets más por día.
4. El intervalo va de menos cero coma tres a siete coma cinco: incluye el cero, así que no se distingue.
5. La materia prima se acumula: las cámaras pasan de diecinueve a treinta pallets en promedio.

## D38 · Matias Buffa · 12:55 (40 s)

1. Después probamos un batch más grande: mil doscientos kilos, ocho cargas, en lugar de mil cincuenta, siete cargas.
2. Rinde apenas cero coma seis pallets más por día, y esa diferencia no se distingue de cero.
3. El intervalo va de cero a uno coma dos e incluye el cero: con este modelo, el tamaño del batch casi no cambia el resultado.

## D39 · Matias Buffa · 13:35 (10 s)

1. Comparando: base, cuarenta y nueve; formadoras rápidas, cincuenta y ocho; más materia prima, sesenta y dos; batch de 1200, cincuenta.

## D40 · Matias Buffa · 13:45 (25 s)

1. La conclusión: primero formadoras, después desencajado.
2. Traer más materia prima, por sí sola, no se distingue de cero.
3. Y todo esto lo sabemos porque comparamos intervalos de confianza, no corridas sueltas.

## Reglas

- Una sola persona lee por vez. Nadie repite lo que dijo el anterior.
