| Módulo | Pantalla | Acción | Endpoint | Status API | Resultado visual | Consola navegador | Estado |
|---|---|---|---|---|---|---|---|
| Login | Login | Cargar página | N/A | N/A | Formulario visible | Sin errores | OK |
| Login | Login | Enviar credenciales | POST /api/auth/login | 200 | Redirigido a Dashboard | Sin errores | OK |
| Dashboard | Dashboard | Cargar dashboard | GET /api/equipos/dashboard | 200 | Stats cards visibles, Gráficos visibles, Últimas asignaciones visibles | Sin errores | OK |
| Equipos | Equipos | Cargar lista | GET /api/equipos | 200 | 10 filas en tabla | Sin errores | OK |
| Equipos | Equipos | Buscar "CEL" | GET /api/equipos?search=CEL | 200 | Resultados: 10 filas | Sin errores | OK |
| Equipos | Equipos | Ver filtro estado | N/A (UI) | N/A | Filtro sin opciones | Sin errores | Pendiente |
| Equipos | Detalle de equipo | Abrir detalle | N/A | N/A | No se encontró enlace a detalle en la lista | Sin errores | Pendiente |
| Trabajadores | Trabajadores | Cargar lista | GET /api/trabajadores | 200 | 10 filas en tabla | Sin errores | OK |
| Trabajadores | Trabajadores | Ver filtro área | GET /api/trabajadores/areas | 200 | 20 áreas disponibles | Sin errores | OK |
| Trabajadores | Trabajadores | Buscar "ORTIZ" | GET /api/trabajadores?search=ORTIZ | 200 | Resultados filtrados: 2 filas | Sin errores | OK |
| Trabajadores | Detalle de trabajador | Abrir detalle | N/A | N/A | No se encontró trabajador en lista | Sin errores | Pendiente |
| Componentes | Componentes | Cargar lista | GET /api/componentes | 200 | 3 filas en tabla | Sin errores | OK |
| Componentes | Componentes | Ver tabs de categoría | N/A (UI) | N/A | 4 tabs de categoría visibles | Sin errores | OK |
| Componentes | Componentes | Filtrar por categoría (tab) | GET /api/componentes?categoria=... | 200 | 2 resultados | Sin errores | OK |
| Componentes | Componentes | Filtro estado | N/A (UI) | N/A | 5 opciones en filtro estado | Sin errores | OK |
| Asignaciones | Asignaciones | Cargar lista | GET /api/asignaciones | 200 | Sin datos de asignaciones | Sin errores | Pendiente |
| Asignaciones | Asignaciones | Tabs de filtro | N/A (UI) | N/A | 3 tabs visibles | Sin errores | OK |
| Asignaciones | Asignaciones | Filtrar por Cesadas | GET /api/asignaciones?estado=CESADO | 200 | Sin cesadas (válido) | Sin errores | OK |
| Asignaciones | Asignaciones | Abrir modal Nueva Asignación | N/A (UI) | N/A | Modal abierto correctamente | Sin errores | OK |
| Incidencias | Incidencias | Cargar lista | GET /api/incidencias | 200 | Sin datos | Sin errores | Pendiente |
| Incidencias | Incidencias | Abrir modal Nueva Incidencia | N/A (UI) | N/A | Modal abierto con formulario | Sin errores | OK |
