# 🎤 Debuggueo de Búsqueda por Voz

## ✅ Arreglos Realizados

Se corrigieron varios problemas para que la búsqueda por voz **funcione correctamente**:

### 1. Hook `useVoiceSearch.ts` - Mejorado
- ✅ Logging detallado para debugging
- ✅ Mejor captura de eventos `onresult`
- ✅ Manejo robusto de transcripción
- ✅ Callback para actualizar el SearchBox en tiempo real

### 2. SearchBox.tsx - Integración correcta
- ✅ Callback que actualiza el input al hablar
- ✅ Mejores validaciones de estado
- ✅ Mensajes de error más claros
- ✅ Input se deshabilita mientras escucha

## 🧪 Cómo Probar

### Paso 1: Abre la Consola del Navegador
```
Chrome/Firefox: F12 → Console
Safari: Cmd+Option+I → Console
Edge: F12 → Console
```

### Paso 2: Prueba la búsqueda por voz
1. Localiza la barra de búsqueda en TopNav
2. **Click en 🎤**
3. **Di algo**: "Arroz", "Leche", "Agua"
4. **Observa la consola** - Deberías ver:
   ```
   [Voice] Iniciando escucha...
   [Voice] Evento result: 1
   [Voice] Part 0: "Arroz" (final: true)
   [Voice] Transcript actualizado: Arroz
   [SearchBox] Actualizando q con transcript: Arroz
   ```

### Paso 3: Verifica los resultados
- El input debe mostrar el texto que dijiste
- Los resultados deben aparecer en el dropdown
- Los productos relacionados deben ser buscables

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "No hay sonido cuando hablo"
**Solución:**
1. Abre DevTools (F12)
2. Console → Verifica que dice `[Voice] Inicializando escucha...`
3. Habla más fuerte y claro
4. Verifica que tienes micrófono conectado

### Problema 2: "No veo los resultados"
**Solución:**
1. Abre Console
2. Verifica que aparece: `[SearchBox] Actualizando q con transcript:`
3. Si no aparece, el problema es con el hook
4. Intenta hacer una búsqueda manual (sin voz) para confirmar que el buscador funciona

### Problema 3: "El botón 🎤 no aparece"
**Solución:**
1. Tu navegador no soporta Web Speech API
2. Probablemente estés usando un navegador muy viejo (IE11, etc.)
3. Solución: Usa Chrome, Firefox, Safari o Edge recientes

### Problema 4: "Permiso de micrófono denegado"
**Solución:**
1. Abre Console
2. Deberías ver: `Error: "El navegador necesita permiso..."`
3. Verifica en la barra de direcciones (Chrome): 🔒 → Permisos → Micrófono → Permitir
4. Recarga la página y intenta de nuevo

## 📊 Logging Disponible

El código ahora tiene `console.log()` en puntos clave:

### En `useVoiceSearch.ts`:
```
[Voice] Iniciando escucha...
[Voice] Evento result: N
[Voice] Part X: "texto" (final: true/false)
[Voice] Transcript actualizado: texto completo
[Voice] Finalizando escucha
[Voice] Error: error-type
```

### En `SearchBox.tsx`:
```
[SearchBox] Transcript recibido: texto
[SearchBox] Actualizando q con transcript: texto
```

## 🔧 Configuración de Debugging

### Ver todos los logs de voz
En Console, ejecuta:
```javascript
localStorage.debug = 'voice:*';
```

### Desactivar logs (cuando no necesites)
En Console:
```javascript
localStorage.debug = '';
```

## 📱 Testing en Mobile

1. Abre tu app en mobile (iPhone o Android)
2. Acepta permiso de micrófono
3. Abre Console (en Android: remote debugging con Chrome)
4. Prueba el mismo flujo

## 🎯 Flujo de Trabajo Correcto

```
1. Usuario hace click en 🎤
   └─ Hook: setIsListening(true)
   └─ Hook: recognition.start()

2. Usuario habla "Arroz"
   └─ Hook: recognition.onresult captura eventos
   └─ Hook: setTranscript("Arroz")

3. Usuario deja de hablar
   └─ Hook: recognition.onend
   └─ Hook: setIsListening(false)

4. SearchBox ve que cambió transcript
   └─ SearchBox: useEffect detecta isListening=false
   └─ SearchBox: setQ(transcript)

5. SearchBox ve que cambió q
   └─ SearchBox: useEffect dispara doSearch(q)
   └─ SearchBox: Fetch a /api/buscar

6. Resultados aparecen
   └─ SearchBox: setItems(resultados)
   └─ UI: Dropdown muestra productos
```

## ✅ Checklist de Testing

- [ ] Botón 🎤 es visible
- [ ] Click en 🎤 inicia grabación
- [ ] Input muestra "Escuchando..."
- [ ] Input tiene fondo azul mientras escucha
- [ ] Digo algo y se captura en el input
- [ ] Los resultados aparecen
- [ ] Puedo hacer click en un producto
- [ ] Funciona en desktop (Chrome)
- [ ] Funciona en desktop (Firefox)
- [ ] Funciona en mobile
- [ ] El botón cambia a 🛑 mientras escucha
- [ ] El botón está rojo y parpadea
- [ ] Si hablo rápido, se captura todo
- [ ] Si hay ruido, intenta lo mejor que puede
- [ ] Los errores se muestran claramente

## 💾 Código de Debugging Manual

Si necesitas debuggear manualmente, puedes agregar esto al SearchBox:

```tsx
useEffect(() => {
    console.log("=== Estado SearchBox ===");
    console.log("q:", q);
    console.log("transcript:", transcript);
    console.log("isListening:", isListening);
    console.log("voiceSupported:", voiceSupported);
    console.log("error:", error);
}, [q, transcript, isListening, voiceSupported, error]);
```

## 🎁 Bonus: Probar API Manual

En Console, puedes hacer una búsqueda manual:

```javascript
fetch("/api/buscar?q=Arroz&limit=10")
  .then(r => r.json())
  .then(d => console.log("Resultados:", d));
```

Esto te ayuda a saber si el problema es con la voz o con la API de búsqueda.

## 📞 Si Aún No Funciona

1. Abre Console (F12)
2. Usa las rutas de debugging arriba
3. Captura los logs exactos que ves
4. Verifica que el navegador soporta Web Speech API

**Navegadores soportados:**
- ✅ Chrome 25+
- ✅ Firefox 77+
- ✅ Safari 14.1+
- ✅ Edge 79+
- ❌ Internet Explorer (no soportado)
