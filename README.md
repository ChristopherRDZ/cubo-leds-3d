# Cubo de LEDs · montaje 3D paso a paso

Simulación 3D interactiva del montaje en protoboard de un cubo de LEDs con **PIC16F628A**, **ULN2803**, DIP switch de 3 y fuente de 4,5 V.

**Abrir:** https://christopherrdz.github.io/cubo-leds-3d/

- **Montaje:** 16 pasos con *Siguiente* / *Anterior*. Cada paso muestra en 3D qué pieza va y en qué hueco.
- **Probar:** muevan el DIP switch y vean qué debe hacer el cubo con el programa `CUBO.c`, incluida la falla de reinicio por bajo voltaje (BOREN).
- Toquen cualquier pieza o hueco para ver a qué está conectado.

Código fuente en `src/main.js` (three.js). Para reconstruir: `npm install` y `npx esbuild src/main.js --bundle --minify --format=iife --target=es2018 --outfile=docs/app.js`.
