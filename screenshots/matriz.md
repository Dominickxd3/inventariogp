| Módulo | Pantalla | Acción | Endpoint | Status API | Resultado visual | Consola navegador | Estado |
|---|---|---|---|---|---|---|---|
| Login | Login | Cargar página | N/A | N/A | Formulario visible | Sin errores | OK |
| Login | Login | Enviar credenciales | POST /api/auth/login | 0 | Error visible | Sin errores | ROTO |
| Dashboard | Dashboard | Cargar dashboard | GET /api/equipos/dashboard | 0 | Sin datos visibles | Sin errores | Pendiente |
| Equipos | Equipos | Cargar lista | GET /api/equipos | no call | 11 filas visibles | Sin errores | OK |
| Equipos | Equipos | Buscar "CEL" | GET /api/equipos?search=CEL | no call | 11 resultados | Sin errores | OK |
| Trabajadores | Trabajadores | Cargar lista | GET /api/trabajadores | 0 | 11 filas visibles | Sin errores | OK |
| Trabajadores | Trabajadores | Buscar "ORTIZ" | GET /api/trabajadores?search=ORTIZ | 0 | Resultados: 3 filas | Sin errores | OK |
| Componentes | Componentes | Cargar lista | GET /api/componentes | 0 | 5 filas visibles | Sin errores | OK |
| Componentes | Componentes | Ver filtro tipo | N/A (UI) | N/A | Sin opciones | Sin errores | Pendiente |
| Asignaciones | Asignaciones | Cargar lista | GET /api/asignaciones | 0 | Sin datos | Sin errores | Pendiente |
| Incidencias | Incidencias | Cargar lista | GET /api/incidencias | 0 | 2 filas visibles | Sin errores | OK |
| Scan QR | Scan | Cargar página | N/A | N/A | Página cargada | 2 error(es) | OK |