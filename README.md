# Estamos Buscando

> Plataforma web comunitaria para ayudar a localizar personas desaparecidas, registrar personas encontradas, personas sin identificar (NN) y mascotas durante situaciones de emergencia.

## ⚠️ Aviso importante

**Estamos Buscando es una iniciativa independiente y comunitaria.**

No representa oficialmente al Gobierno de Colombia, alcaldías, gobernaciones, Cruz Roja, Bomberos, Defensa Civil, Policía, hospitales ni ninguna otra institución pública o privada.

La plataforma está diseñada como una herramienta complementaria de información y coordinación comunitaria.

La información publicada debe ser verificada antes de utilizarla para tomar decisiones críticas. En situaciones de emergencia, se deben seguir siempre las instrucciones de las autoridades y organismos oficiales de atención de emergencias.

---

# 📖 Sobre el proyecto

Durante una emergencia o desastre natural, uno de los problemas más críticos es la pérdida de comunicación entre familiares y la dificultad para saber dónde se encuentran las personas afectadas.

En situaciones de caos pueden existir simultáneamente:

* Personas desaparecidas.
* Personas encontradas pero todavía no identificadas.
* Personas trasladadas a hospitales o centros de atención.
* Personas que han sido ubicadas pero todavía no han podido reunirse con sus familiares.
* Mascotas perdidas o encontradas.
* Información reportada por diferentes personas y organizaciones.

**Estamos Buscando** nace como una plataforma web para centralizar esta información y facilitar la búsqueda.

El objetivo es proporcionar una interfaz sencilla donde una persona pueda:

1. Buscar a un familiar.
2. Consultar personas encontradas.
3. Consultar personas sin identificar.
4. Consultar mascotas perdidas o encontradas.
5. Filtrar información por zona.
6. Consultar ubicaciones en un mapa.
7. Reportar información nueva.
8. Conocer cuándo fue actualizado un registro.

---

# 🎯 Objetivos

## Objetivo general

Crear una plataforma web responsive que permita centralizar y consultar información sobre personas desaparecidas, encontradas, sin identificar y mascotas durante una emergencia.

## Objetivos específicos

* Facilitar la búsqueda de personas por nombre.
* Permitir filtros por zona y estado.
* Registrar personas desaparecidas.
* Registrar personas encontradas.
* Registrar personas sin identificar.
* Registrar mascotas perdidas y encontradas.
* Asociar los registros con ubicaciones.
* Mostrar hospitales y centros de atención.
* Permitir visualizar información mediante un mapa.
* Mantener un historial de actualización.
* Mantener privados los datos personales del reportante.
* Preparar la plataforma para sincronización con Supabase.
* Diseñar una arquitectura escalable para futuras funcionalidades.

---

# 🧩 Funcionalidades principales

## Personas desaparecidas

Permite consultar registros de personas que han sido reportadas como desaparecidas.

Información pública:

* Fotografía.
* Nombre.
* Edad o edad aproximada.
* Sexo.
* Descripción.
* Última ubicación conocida.
* Fecha y hora.
* Zona.
* Estado.
* Fecha de última actualización.

---

## Personas encontradas

Permite registrar y consultar personas encontradas durante una emergencia.

El registro puede indicar:

* Nombre, cuando se conoce.
* Fotografía.
* Lugar donde fue encontrada.
* Fecha y hora.
* Zona.
* Estado.
* Ubicación actual.
* Hospital.
* Centro de atención.
* Refugio.

---

## Personas sin identificar — NN

La plataforma permite registrar personas que han sido encontradas pero cuya identidad todavía no ha sido confirmada.

Se utilizan identificadores como:

```text
NN-0001
NN-0002
NN-0003
```

La información puede incluir:

* Fotografía.
* Sexo.
* Edad aproximada.
* Descripción física.
* Ropa.
* Características particulares.
* Lugar donde fue encontrada.
* Fecha y hora.
* Ubicación actual.

---

## Mascotas

Permite registrar:

* Mascotas perdidas.
* Mascotas encontradas.

Información:

* Fotografía.
* Nombre.
* Especie.
* Raza.
* Color.
* Sexo.
* Características.
* Zona.
* Fecha.
* Hora.
* Estado.
* Ubicación actual cuando corresponda.

---

# 🗺️ Sistema de zonas

El MVP contempla inicialmente seis zonas principales:

* Cali
* Pereira
* Quibdó
* Manizales
* Buenaventura
* Armenia

Estas zonas son configurables y forman parte de la primera versión del proyecto.

La arquitectura permite posteriormente:

* Agregar nuevas ciudades.
* Agregar nuevos municipios.
* Crear nuevas zonas.
* Modificar coordenadas.
* Asociar registros a zonas.
* Consultar estadísticas por zona.

---

# 📍 Mapa

El mapa permitirá visualizar:

### Personas desaparecidas

🔴

### Personas encontradas

🟢

### Personas sin identificar

🟡

### Hospitales y centros de atención

🔵

### Mascotas

🐾

El mapa permitirá posteriormente:

* Filtrar por zona.
* Filtrar por estado.
* Filtrar por tipo.
* Seleccionar registros.
* Consultar información.
* Mostrar agrupaciones cuando existan muchos registros.
* Centrar el mapa en una zona determinada.

---

# 📝 Sistema de reportes

La aplicación diferencia entre la persona reportada y la persona que realiza el reporte.

## Tipos de reportante

* Familiar.
* Testigo.
* Voluntario.
* Otra persona.

## Familiar

Puede registrar:

* Nombre.
* Identificación.
* Teléfono.
* Relación con la persona.

## Testigo

Puede registrar:

* Nombre.
* Teléfono.
* Identificación cuando corresponda.

## Voluntario

Cuando el usuario esté autenticado, el sistema utilizará posteriormente su identidad registrada:

* reporterId.
* Nombre.
* Organización.
* Rol.

El voluntario no debería tener que introducir manualmente sus datos cada vez que realiza un reporte.

---

# 🔐 Privacidad

La aplicación separa la información pública de la información privada.

Los datos del reportante se almacenarán posteriormente en la base de datos asociados mediante un identificador:

```text
reporter_id
```

Los datos privados pueden incluir:

* Nombre.
* Número de identificación.
* Teléfono.
* Relación.
* Organización.
* Rol.
* Identificador del voluntario.

Estos datos **no deben mostrarse en la vista pública**.

La vista pública solamente muestra la información necesaria para facilitar la identificación o localización de una persona.

La futura implementación con Supabase deberá utilizar políticas de Row Level Security (RLS) para restringir el acceso a información sensible.

---

# 🧱 Arquitectura

La aplicación utiliza una arquitectura frontend modular preparada para conectarse con servicios externos.

```text
React
   │
   ├── Pages
   │
   ├── Components
   │
   ├── Features
   │
   ├── Hooks
   │
   └── Services
          │
          ▼
       Supabase
          │
          ├── PostgreSQL
          ├── Auth
          ├── Storage
          └── Realtime
```

La interfaz no debe realizar llamadas directamente al proveedor de datos.

La comunicación seguirá el patrón:

```text
UI
 ↓
Hook
 ↓
Service
 ↓
Supabase
```

Esto permite cambiar la fuente de datos sin modificar los componentes visuales.

---

# 🛠️ Stack tecnológico

## Frontend

* React
* Vite
* TypeScript
* Tailwind CSS

## Routing

* React Router

## Formularios

* React Hook Form
* Zod

## Estado y consultas

* TanStack Query

## Iconos

* Lucide React

## Backend / infraestructura futura

* Supabase

## Base de datos futura

* PostgreSQL mediante Supabase

## Almacenamiento futuro

* Supabase Storage

## Autenticación futura

* Supabase Auth

## Hosting

* Vercel

## Mapa

La arquitectura permitirá utilizar posteriormente:

* Leaflet / OpenStreetMap
* Mapbox
* Google Maps

El proveedor de mapas no debe estar acoplado al resto de la aplicación.

---

# 📁 Estructura del proyecto

```text
src/
│
├── app/
│   ├── router/
│   ├── providers/
│   └── config/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   └── common/
│
├── features/
│   │
│   ├── persons/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── types/
│   │
│   ├── reports/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── types/
│   │
│   ├── pets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── map/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   └── admin/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── layouts/
│
├── services/
│   └── api/
│
├── hooks/
│
├── lib/
│   ├── utils.ts
│   ├── constants.ts
│   └── supabase.ts
│
├── data/
│   └── mock/
│
├── types/
│
├── App.tsx
└── main.tsx
```

---

# 🗃️ Modelo de datos futuro

La aplicación está preparada para utilizar entidades como:

```text
profiles
users
persons
reports
reporters
locations
emergency_zones
facilities
person_events
pets
organizations
```

Una relación simplificada:

```text
User
 │
 ▼
Reporter
 │
 ▼
Report
 │
 ▼
Person
 │
 ├── Location
 ├── Facility
 └── PersonEvent
```

---

# 🔄 Estados de una persona

Una persona puede pasar por diferentes estados:

```text
MISSING
   ↓
FOUND
   ↓
IDENTIFIED
   ↓
TRANSFERRED
   ↓
REUNITED
```

Una persona también puede permanecer temporalmente como:

```text
UNIDENTIFIED
```

Los estados definitivos dependerán posteriormente de las reglas de negocio implementadas.

---

# 📜 Historial y trazabilidad

La arquitectura contempla eventos asociados a las personas.

Ejemplo:

```text
10:32
Persona registrada

10:47
Persona encontrada

11:15
Trasladada a Hospital Central

11:42
Identidad confirmada

12:10
Entregada a familiar
```

Esto permitirá posteriormente reconstruir el historial de atención y ubicación.

---

# 🔎 Búsqueda y filtros

La plataforma permitirá buscar y filtrar por:

* Nombre.
* Estado.
* Zona.
* Tipo.
* Fecha.
* Ubicación.

Ejemplo:

```text
Zona: Cali
Tipo: Persona
Estado: Desaparecido
```

Resultado:

```text
Personas desaparecidas registradas en Cali
```

---

# 📱 Responsive Design

El proyecto utiliza un enfoque mobile-first.

La interfaz está diseñada para:

* Teléfonos.
* Tablets.
* Computadores.

Se priorizan:

* Botones grandes.
* Formularios sencillos.
* Buena legibilidad.
* Alto contraste.
* Navegación sencilla.
* Información clara.
* Accesibilidad.

---

# ♿ Accesibilidad

La interfaz debe contemplar:

* HTML semántico.
* Labels para formularios.
* Navegación por teclado.
* Focus visible.
* Contraste adecuado.
* Texto alternativo para imágenes.
* Áreas táctiles adecuadas.
* Estados que no dependan únicamente del color.

---

# 🧪 Datos de prueba

Durante el desarrollo se utilizan datos ficticios.

No deben utilizarse datos reales de personas en los mocks del repositorio.

Las fotografías de prueba deben utilizar imágenes libres, placeholders o recursos creados específicamente para desarrollo.

---

# 🔒 Seguridad

Nunca almacenar en el frontend:

* claves secretas.
* service role keys.
* contraseñas.
* tokens privados.

Cuando Supabase sea integrado, solamente se utilizarán variables públicas apropiadas en el frontend.

Ejemplo:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

La seguridad de datos sensibles deberá implementarse mediante:

* Supabase Auth.
* Row Level Security.
* Políticas de acceso.
* Separación entre información pública y privada.

---

# 🌐 Variables de entorno

Crear:

```text
.env.example
```

Con:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No subir `.env` al repositorio.

---

# 🚀 Instalación

Clonar el proyecto:

```bash
git clone <REPOSITORY_URL>
```

Entrar al proyecto:

```bash
cd estamos-buscando
```

Instalar dependencias:

```bash
npm install
```

Iniciar servidor de desarrollo:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

---

# 🔌 Integración con Supabase (Fase 1)

## Configuración local

1. Copia `.env.example` a `.env.local`.
2. Completa las variables públicas de tu proyecto Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

3. Ejecuta el esquema SQL desde `src/db/codeTable.sql` en tu proyecto Supabase (si aún no está aplicado).
4. Inicia la app con `npm run dev`.

> **Importante:** Nunca uses `SUPABASE_SERVICE_ROLE_KEY` en el frontend. La seguridad real depende de **RLS** en PostgreSQL.

## Modo de datos

La app detecta automáticamente el origen de datos:

| Condición | Modo |
|-----------|------|
| Sin `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | `mock` — datos ficticios locales |
| Con variables configuradas | `supabase` — consultas reales |

Implementado en `src/lib/dataSource.ts`.

## Cliente Supabase

Punto único de inicialización:

```text
src/lib/supabase.ts
```

Los componentes **nunca** importan `supabase` directamente. La cadena es:

```text
React Component
       ↓
TanStack Query Hook   (Fase 3+)
       ↓
Feature Service       (persons.service.ts, zones.service.ts, …)
       ↓
Supabase Client       (src/lib/supabase.ts)
       ↓
PostgreSQL + RLS
```

## Servicios disponibles (Fase 1)

| Servicio | Archivo | Tabla(s) |
|----------|---------|----------|
| Zonas | `features/map/services/zones.service.ts` | `emergency_zones` |
| Ubicaciones | `features/map/services/locations.service.ts` | `locations` |
| Centros | `features/map/services/facilities.service.ts` | `facilities` |
| Personas | `features/persons/services/persons.service.ts` | `persons` |
| Mascotas | `features/pets/services/pets.service.ts` | `pets` |
| Reportes | `features/reports/services/reports.service.ts` | `reports` |
| Eventos | `features/persons/services/person-events.service.ts` | `person_events` |
| Media | `features/reports/services/media.service.ts` | `report_media` + Storage |

## Tipos TypeScript

Tipos de dominio alineados con el esquema PostgreSQL:

```text
src/types/enums.ts          — enums de la BD
src/types/database.ts       — filas de tablas + Database
src/features/*/types/*.db.ts — aliases por feature
```

Los tipos de UI existentes (`PersonItem`, etc.) se mantienen para no romper componentes actuales. La migración a tipos de BD ocurrirá progresivamente en fases siguientes.

## Estado de integración

- [x] **Fase 1** — Cliente, tipos, servicios, `.env.example`
- [ ] **Fase 2** — Conectar zonas, ubicaciones, centros al mapa
- [ ] **Fase 3** — Conectar personas + TanStack Query hooks
- [ ] **Fase 4** — Mascotas
- [ ] **Fase 5** — Reportes
- [ ] **Fase 6** — Eventos de persona
- [ ] **Fase 7** — Storage / media
- [ ] **Fase 8** — Auth
- [ ] **Fase 9** — Admin
- [ ] **Fase 10** — Realtime

---

# 🏗️ Build

Para generar la versión de producción:

```bash
npm run build
```

Para comprobar localmente el build:

```bash
npm run preview
```

---

# 🚀 Deploy

El frontend está preparado para desplegarse en Vercel.

Proceso general:

```text
GitHub
   ↓
Vercel
   ↓
Build
   ↓
Aplicación web
```

Las variables de entorno deberán configurarse posteriormente desde Vercel.

---

# 🧭 Rutas principales

```text
/
```

Inicio.

```text
/search
```

Búsqueda.

```text
/missing
```

Personas desaparecidas.

```text
/found
```

Personas encontradas.

```text
/unidentified
```

Personas NN.

```text
/pets
```

Mascotas.

```text
/person/:id
```

Detalle de una persona.

```text
/report
```

Seleccionar tipo de reporte.

```text
/report/missing
```

Reportar desaparecido.

```text
/report/found
```

Reportar encontrado.

```text
/report/unidentified
```

Reportar NN.

```text
/report/pet
```

Reportar mascota.

```text
/map
```

Mapa.

```text
/admin
```

Dashboard administrativo.

```text
/admin/reports
```

Gestión de reportes.

---

# 🛣️ Roadmap

## Fase 1 — MVP frontend

* [x] Diseño responsive.
* [x] Inicio.
* [x] Búsqueda.
* [x] Personas desaparecidas.
* [x] Personas encontradas.
* [x] Personas NN.
* [x] Mascotas.
* [x] Formularios.
* [x] Mock data.
* [ ] Mapa real.
* [ ] Panel administrativo completo.

## Fase 2 — Supabase

* [ ] Crear proyecto Supabase.
* [ ] Diseñar PostgreSQL.
* [ ] Crear tablas.
* [ ] Crear relaciones.
* [ ] Crear índices.
* [ ] Crear RLS.
* [ ] Implementar Auth.
* [ ] Implementar Storage.
* [ ] Reemplazar mock services.
* [ ] Implementar consultas reales.

## Fase 3 — Mapa

* [ ] Integrar proveedor de mapas.
* [ ] Marcadores.
* [ ] Clustering.
* [ ] Filtros.
* [ ] Zonas.
* [ ] Hospitales.
* [ ] Centros de atención.
* [ ] Ubicaciones de personas.

## Fase 4 — Trazabilidad

* [ ] Historial de eventos.
* [ ] Registro de traslados.
* [ ] Registro de ubicación actual.
* [ ] Registro de hospital.
* [ ] Registro de recepción.
* [ ] Auditoría de cambios.

## Fase 5 — Offline

* [ ] PWA.
* [ ] IndexedDB.
* [ ] Cola de sincronización.
* [ ] Detección online/offline.
* [ ] Sincronización automática.
* [ ] Resolución de conflictos.

## Fase 6 — Mejoras

* [ ] Detección de posibles duplicados.
* [ ] Notificaciones.
* [ ] Compartir registros.
* [ ] Integraciones externas.
* [ ] Analítica.
* [ ] Herramientas de apoyo para organizaciones.

---

# ⚠️ Principios del proyecto

1. La información de las personas debe tratarse con responsabilidad.
2. No publicar información personal innecesaria.
3. No exponer datos privados de los reportantes.
4. Diferenciar información verificada de información pendiente.
5. Mantener fecha y hora de actualización.
6. Evitar duplicados.
7. Mantener historial de cambios.
8. No presentar la plataforma como una autoridad oficial.
9. Priorizar simplicidad durante una emergencia.
10. Diseñar para dispositivos móviles.
11. Preparar la arquitectura para funcionar con conectividad limitada.
12. No utilizar datos reales en ambientes de desarrollo.

---

# 🤝 Contribución

El proyecto puede evolucionar hacia una iniciativa colaborativa.

Antes de realizar cambios importantes:

1. Crear una rama.

```bash
git checkout -b feature/nombre-feature
```

2. Realizar cambios.

3. Ejecutar:

```bash
npm run build
```

4. Verificar el funcionamiento.

5. Crear commit:

```bash
git commit -m "feat: descripcion del cambio"
```

6. Crear Pull Request.

---

# 📄 Licencia

La licencia definitiva del proyecto debe establecerse antes de una publicación pública.

---

# ❤️ Propósito

El propósito de **Estamos Buscando** es utilizar tecnología para ayudar a las personas durante una situación de emergencia.

La plataforma busca facilitar algo fundamental:

> **Saber dónde está una persona y ayudar a reunirla con quienes la están buscando.**

La tecnología debe estar al servicio de las personas, especialmente durante momentos de vulnerabilidad.
