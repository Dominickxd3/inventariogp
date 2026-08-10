| Módulo | Pantalla | Acción | Endpoint | Status API | Resultado visual | Consola | Estado |
|---|---|---|---|---|---|---|---|
| Login | Login | Cargar página | N/A | N/A | Formulario cargado | Sin errores | OK |
| Login | Login | Ingresar credenciales | POST /api/auth/login | 200 | Redirige a Dashboard | Sin errores | OK |
| Dashboard | Dashboard | Cargar dashboard | GET /api/equipos/dashboard | 200 | Stats, Gráficos, Últimas asignaciones | Sin errores | OK |
| Equipos | Equipos | Cargar lista | GET /api/equipos | 200 | 10 filas | Sin errores | OK |
| Equipos | Equipos | Buscar "CEL" | GET /api/equipos?search=CEL | 200 | 10 filas | Sin errores | OK |
| Equipos | Detalle de equipo | Abrir detalle (click fila) | GET /api/equipos/25 | 200 | Detalle cargado | Sin errores | OK |
| Trabajadores | Trabajadores | Cargar lista | GET /api/trabajadores | 200 | 10 filas | Sin errores | OK |
| Trabajadores | Trabajadores | Filtro área | GET /api/trabajadores/areas | 200 | 20 áreas | Sin errores | OK |
| Trabajadores | Trabajadores | Buscar "ORTIZ" | GET /api/trabajadores?search=ORTIZ | 200 (UI) | 2 filas | Sin errores | OK |
| Trabajadores | Detalle de trabajador | Abrir detalle (click fila) | GET /api/trabajadores/1721 | 200 | Datos visibles | Sin errores | OK |
| Trabajadores | Detalle de trabajador | Asignaciones activas | GET /api/asignaciones/trabajador/1721/activas | 200 | Sin asignaciones | Sin errores | OK |
| Componentes | Componentes | Cargar lista | GET /api/componentes | 200 | 3 filas | Sin errores | OK |
| Componentes | Componentes | Filtro por categoría | GET /api/componentes?categoria=... | 200 | 2 resultados | Sin errores | OK |
| Componentes | Componentes | Filtro estado | N/A (UI) | N/A | 5 opciones | Sin errores | OK |
| Asignaciones | Asignaciones | Cargar lista | GET /api/asignaciones?estado=VIGENTE | 200 | 1 filas | Sin errores | OK |
| Asignaciones | Asignaciones | Tabs Vigentes/Cesadas/Todas | N/A (UI) | N/A | 3 tabs presentes | Sin errores | OK |
| Asignaciones | Asignaciones | Filtrar Cesadas | GET /api/asignaciones?estado=CESADO | 200 | 1 filas | Sin errores | OK |
| Asignaciones | Asignaciones | Modal Nueva Asignación | N/A (UI) | N/A | Modal abierto | Sin errores | OK |
| Incidencias | Incidencias | Cargar lista | GET /api/incidencias | 200 | 1 filas | Sin errores | OK |
| Incidencias | Incidencias | Modal Nueva Incidencia | N/A (UI) | N/A | Modal con formulario | Sin errores | OK |
