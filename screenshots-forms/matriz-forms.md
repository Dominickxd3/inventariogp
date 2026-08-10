| Módulo | Acción | Detalle | Status | Estado |
|---|---|---|---|---|
| Login | Login | 200 → Dashboard | POST /api/auth/login | OK |
| Incidencias | Abrir modal Nueva Incidencia | Modal visible | UI | OK |
| Incidencias | Validación: descripción vacía | Mensaje mostrado | Zod | OK |
| Incidencias | Formulario completo listo para enviar | Datos llenos, payload revisable | POST /api/incidencias | OK |
| Incidencias | Cerrar modal sin guardar | Modal cerrado | UI | OK |
| Componentes | Abrir modal Nuevo Componente | Modal visible | UI | OK |
| Componentes | Validación: submit deshabilitado sin categoría | Botón deshabilitado | UI | OK |
| Componentes | Categoría+tipos cargados | 7 tipos disponibles | UI | OK |
| Componentes | Validación: submit habilitado tras seleccionar tipo | Sigue deshabilitado | UI | ROTO |
| Componentes | Formulario completo listo | Campos llenos, payload revisable | POST /api/componentes/rapido | OK |
| Asignaciones | Modal Nueva Asignación - Step 1 | Paso 1: Seleccionar trabajador | UI | OK |
| Asignaciones | Step 1: Buscar trabajador | 4 resultado(s) | GET /api/trabajadores?search=ORTIZ | OK |
| Asignaciones | Step 2: Seleccionar equipos | No avanza a paso 2 | UI | ROTO |
| EquipoDetalle | Datos técnicos: modal abierto | Modal con campos | UI | OK |
| EquipoDetalle | Datos técnicos: campos visibles | 8 campo(s) | UI | OK |
| EquipoDetalle | Datos técnicos: cancelar | Modal cerrado | UI | OK |
| EquipoDetalle | Agregar componente: modal abierto | Modal con campos | UI | OK |
| EquipoDetalle | Agregar componente: cancelar | Modal cerrado | UI | OK |
| EquipoDetalle | Nueva intervención: modal abierto | Modal con formulario | UI | OK |
| EquipoDetalle | Intervención: validación tipo vacío | Swal warning mostrado | Swal | OK |
| EquipoDetalle | Intervención: seleccionar tipo Mantenimiento | Tipo seleccionado | UI | OK |
| EquipoDetalle | Intervención: validación descripción vacía | Swal warning mostrado | Swal | OK |
| EquipoDetalle | Intervención: cancelar | Modal cerrado | UI | OK |
| Asignaciones | Cesar: confirmación mostrada | Dialog con opciones de accesorios | UI | OK |
| Asignaciones | Cesar: botón Cancelar presente | Cancelar visible | UI | OK |
| Asignaciones | Cesar: cancelar sin ejecutar | Dialog cerrado, acción no ejecutada | UI | OK |
| TrabajadorDetalle | Desasignar: confirmación mostrada | Dialog con advertencia | UI | OK |
| TrabajadorDetalle | Desasignar: botón Cancelar presente | Cancelar visible | UI | OK |
| TrabajadorDetalle | Desasignar: cancelar sin ejecutar | Dialog cerrado | UI | OK |
| Equipos | Paginación: siguiente página | Página 2 cargada | UI | OK |
| Componentes | Tabs: filtrar Accesorios | Tab activo, datos filtrados | UI | OK |
| Componentes | Tabs: volver a Todo | Tab reiniciado | UI | OK |
| Asignaciones | Tabs: Todas | Tab sin filtro | UI | OK |
| Asignaciones | Tabs: Cesadas | Solo cesadas visibles | UI | OK |
| Refrescar | F5 en Equipos | Datos recargados (10 filas) | GET /api/equipos | OK |
| Logout | Sin token: redirige a login | Redirigido a /login | ProtectedRoute | OK |
| Login | Re-login después de logout | Redirigido a Dashboard | POST /api/auth/login | OK |
| Seguridad | No se ejecutó ninguna acción destructiva | 2 petición(es) detectadas: POST /api/auth/login, POST /api/auth/login | Monitor | ⚠️ Se detectaron mutaciones |
