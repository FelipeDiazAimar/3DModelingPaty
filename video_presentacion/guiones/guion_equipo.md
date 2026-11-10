# Guion equipo, Acto 6 (karaoke)

Se graba después, sobre el video terminado, siguiendo el barrido. Dura 5:00 (D32 a D38). La IA calla todo el acto. Cifras verificadas en `DOCUMENTACION_VIDEO.md`.

## D32 · Jeremias Micheloud · 8:55 (22 s)

1. La materia prima llega al azar: dieciséis pallets por turno, con la tabla real de arribos.
2. Los tiempos de máquina son constantes.
3. El peso de cada pallet sale de los quinientos reales, y las fallas son exponenciales.
4. Y la reparación, lognormal: muchas cortas y pocas largas.

## D33 · Jeremias Micheloud · 9:17 (45 s)

1. Antes de simular miramos los datos reales de la planta y les hicimos pruebas de bondad de ajuste.
2. Kolmogorov-Smirnov mide la mayor distancia entre los datos y la curva teórica; si pasa el límite, se rechaza.
3. Los arribos llegan en ráfagas: la exponencial queda rechazada.
4. Las paradas tienen cola pesada: tampoco ajustan a una lognormal, aunque es la que mejor se acerca.
5. Y el peso de los pallets es una mezcla de productos, así que la normal también se rechaza.
6. No forzamos una distribución porque sí: lo decimos.

## D34 · Jeremias Micheloud · 10:02 (38 s)

1. En el modelo varían los arribos, el peso de los pallets y las fallas: exponencial entre fallas y lognormal en la reparación.
2. Corrimos diez réplicas de veinticuatro horas y calculamos intervalos de confianza del noventa y cinco por ciento.
3. La línea tarda unas cuatro horas en llenarse desde vacía: ese es el transitorio.
4. El modelo da cincuenta y cuatro coma ocho toneladas por día contra cincuenta y seis de la planta: menos dos coma uno por ciento. En pallets, menos dos coma seis. Por eso es válido.

## D35 · Felipe Diaz Aimar · 10:40 (30 s)

1. Este es el escenario base: sesenta y tres coma dos pallets por día.
2. Sospechábamos de la formadora, pero el cuello real son las mezcladoras: noventa y uno por ciento ocupadas y sesenta y cinco toneladas de capacidad por día.
3. La causa es el lavado de treinta minutos por cada batch, un dato que nos dio la planta.

## D36 · Felipe Diaz Aimar · 11:10 (60 s)

1. ¿Y si las formadoras fueran más rápidas? Las subimos de novecientos ochenta y dos a mil ochocientos cuarenta y tres kilos por hora.
2. Para comparar bien usamos las mismas diez réplicas, con números aleatorios comunes, y miramos la diferencia de a pares.
3. Son doce pallets más por día: un diecinueve por ciento.
4. El intervalo va de diez coma ocho a trece coma dos. No incluye el cero, así que la mejora es real.
5. Pero el cuello se mueve: ahora manda el desencajado, con setenta y cuatro toneladas por día.

## D37 · Matias Buffa · 12:10 (45 s)

1. Ahora lo obvio: si queremos producir más, traigamos más materia prima.
2. Sobre las formadoras rápidas, veinticuatro pallets por turno en lugar de dieciséis.
3. Contra el escenario anterior da apenas cero coma cinco pallets más por día.
4. El intervalo va de cero coma uno a cero coma nueve: menos de uno por ciento, casi no suma.
5. La materia prima se acumula: las cámaras pasan de seis a veintidós pallets en promedio.

## D38 · Matias Buffa · 12:55 (40 s)

1. Después probamos un batch más chico: mil doscientos kilos en lugar de mil quinientos.
2. Rinde casi cuatro pallets menos por día, porque con batches chicos se lava más veces por tonelada.
3. El intervalo va de menos cuatro coma cuatro a menos tres. También es significativo: conviene el batch grande.

## D39 · Matias Buffa · 13:35 (10 s)

1. Comparando todo: las formadoras rápidas rinden setenta y cinco pallets por día; la base, sesenta y tres; y el batch chico, sesenta.

## D40 · Matias Buffa · 13:45 (25 s)

1. La conclusión: primero formadoras, después desencajado.
2. Traer más materia prima, por sí sola, casi no suma.
3. Y todo esto lo sabemos porque comparamos intervalos de confianza, no corridas sueltas.

## Reglas

- Una sola persona lee por vez. Nadie repite lo que dijo el anterior.
