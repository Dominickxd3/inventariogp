# Preguntas pendientes para definir la arquitectura

## 1. ¿Qué información se obtiene mediante el linked server?

Además de trabajadores, áreas y cargos, ¿qué otros datos trae actualmente el linked server?

- [ ] Trabajadores
- [ ] Áreas
- [ ] Cargos
- [ ] Usuarios del sistema
- [ ] Sedes / Locales
- [ ] Jefaturas / Responsables de área
- [ ] Equipos ya existentes
- [ ] Otro: _________________________

Esto determina qué datos controla InventarioGP y cuáles solamente consulta.

## 2. ¿Cómo se identifica al jefe de cada área?

- [ ] Está registrado en una tabla propia
- [ ] Se obtiene desde el linked server
- [ ] Se determina por su cargo
- [ ] Se asigna manualmente
- [ ] Puede visualizar una o varias áreas

Sin esto no se puede diseñar correctamente el acceso al inventario por área.

## 3. ¿Qué significa exactamente "equipo asignado al área"?

**Caso A — asignación directa:**
Equipo → trabajador → área del trabajador.
El jefe ve los equipos de los trabajadores que pertenecen a su área.

**Caso B — asignación institucional:**
Equipo → área.
El equipo pertenece al área sin estar asignado a una persona (televisor de sala,
impresora compartida, celular de guardia, laptop de contingencia, proyector,
equipo almacenado temporalmente).

Si solo se deduce el área desde el trabajador, se pierde trazabilidad cuando
el trabajador cambia de área.

## 4. ¿Qué debe pasar cuando una persona cambia de área?

Ejemplo: Juan recibe una laptop en Finanzas. Tres meses después pasa a Logística.
La laptop sigue asignada a Juan.

- [ ] ¿La laptop ahora pertenece a Logística?
- [ ] ¿Debe seguir figurando históricamente como entregada en Finanzas?
- [ ] ¿Se genera automáticamente un traslado?
- [ ] ¿El jefe anterior deja de verla inmediatamente?
- [ ] ¿El nuevo jefe empieza a verla automáticamente?

La solución correcta separa:
- Área de la asignación (área en el momento de la entrega)
- Área actual del trabajador (obtenida del sistema corporativo)
- Historial de movimientos (cambios posteriores)

## 5. ¿Qué alcance tendrá la trazabilidad?

- [ ] Registro → asignación → devolución
- [ ] Ciclo completo:
  Adquisición → ingreso → almacenamiento → asignación → traslado →
  mantenimiento → préstamo → devolución → reasignación → baja

## Lectura técnica actual del proponente

```
Equipo
  ├── características permanentes
  ├── estado actual
  ├── ubicación actual
  └── historial de movimientos

Asignación
  ├── trabajador
  ├── área al momento de asignar
  ├── responsable que entrega
  ├── fechas
  └── acta asociada

Área
  ├── jefe o responsables
  └── equipos propios y equipos de trabajadores

Movimiento
  ├── tipo de movimiento
  ├── origen
  ├── destino
  ├── usuario responsable
  ├── fecha
  └── evidencia
```

El error más común: usar solo el estado actual del equipo y sobrescribir datos.
La trazabilidad real exige que cada cambio quede como un nuevo movimiento,
sin eliminar el estado anterior.
