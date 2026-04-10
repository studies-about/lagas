# LAGAS – Guía para Claude

## ¿Qué es LAGAS?

LAGAS es una aplicación web que conecta rutas de Strava con opciones de nutrición deportiva para ciclistas. Los usuarios pueden recibir recomendaciones personalizadas de nutrición según sus rutas, comprar kits únicos o suscribirse a planes recurrentes.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + shadcn/ui (Radix UI) |
| Formularios | react-hook-form + Zod |
| Routing | react-router-dom v6 |
| State/Data | TanStack Query v5 |
| Animaciones | Framer Motion |
| Gráficos | Recharts |
| Testing | Vitest + Testing Library + Playwright |
| Package manager | Bun (bun.lock presente) |

---

## Arquitectura de la Aplicación

### Autenticación
- Google OAuth 2.0
- Strava OAuth 2.0
- El usuario puede autenticarse con cualquiera de los dos

### Base de Datos (modelo conceptual)
- **profiles**: datos del usuario (edad, tipo ciclista, preferencias nutricionales)
- **routes**: rutas importadas desde Strava (máximo 10 por usuario)
- **kits**: productos de nutrición disponibles (por ruta única o por suscripción)
- **orders**: compras y suscripciones activas

### Flujos principales
1. Login → Conectar Strava → Importar rutas
2. Seleccionar ruta → Ver recomendación nutricional → Agregar kit al carro
3. Elegir modalidad: kit único / suscripción mensual / suscripción flexible
4. Pago → Confirmación → Historial de pedidos

---

## Archivos Clave del Proyecto

```
LAGAS/
├── src/
│   ├── components/    # Componentes reutilizables (shadcn/ui + propios)
│   ├── pages/         # Páginas por ruta (react-router-dom)
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilidades, clientes API, helpers
│   └── types/         # Tipos TypeScript compartidos
├── lagas_form_script.gs   # Google Apps Script para formulario de caracterización
├── CLAUDE.md              # Esta guía
└── vite.config.ts         # Configuración de build
```

---

## Convenciones de Código

- **Componentes**: PascalCase, un componente por archivo
- **Hooks**: `use` prefix, camelCase (ej: `useStravaRoutes`)
- **Types/Interfaces**: PascalCase con `I` prefix para interfaces de dominio
- **Archivos de utilidad**: camelCase (ej: `stravaClient.ts`)
- **Variables de entorno**: siempre prefijadas con `VITE_` para el cliente
- Usar `shadcn/ui` para todos los componentes UI base antes de crear propios
- Validación con `Zod` en todos los formularios

---

## Integraciones Externas

### Strava API
- OAuth 2.0 con scope `read,activity:read`
- Endpoint clave: `GET /athlete/activities` (últimas 10 rutas)
- Almacenar `access_token` y `refresh_token` en base de datos del usuario
- Docs: https://developers.strava.com/docs/reference/

### Google OAuth
- Scope mínimo: `openid email profile`
- Usar para login sin necesitar Strava

### Pagos
- Plataforma por definir (Stripe o similar para Chile/LATAM)
- Soportar pago único y suscripciones recurrentes

---

## Formulario de Caracterización de Usuarios

El archivo `lagas_form_script.gs` contiene un Google Apps Script que genera automáticamente el formulario de onboarding.

### Cómo usarlo
1. Ir a [script.google.com](https://script.google.com)
2. Crear nuevo proyecto → pegar el contenido de `lagas_form_script.gs`
3. Ejecutar la función `crearFormularioLAGAS()`
4. Autorizar permisos cuando se solicite
5. El formulario aparecerá en Google Drive con el link en el Logger

### Preguntas del formulario
- Rango de edad
- Tipo de ciclista
- Kilómetros semanales
- Kilómetros en salida de fin de semana
- Tipo de alimentación
- Conocimiento de nutrición deportiva
- Productos usados en ruta (checkbox múltiple)
- Estrategia de avituallamiento
- Preferencia entre polvos / geles / queques (grilla de valoración)
- Formato preferido de kit LAGAS
- Modalidad de compra preferida
- Uso de Strava e interés en integración automática

---

## Comandos Útiles

```bash
# Desarrollo
bun dev          # o: npm run dev

# Tests unitarios
bun test         # o: npm test

# Tests E2E
npx playwright test

# Build producción
bun run build
```

---

## Notas para Claude

- El proyecto usa **Bun** como package manager principal (hay `bun.lock`)
- Siempre usar componentes de `shadcn/ui` antes de inventar uno nuevo
- Los formularios deben validarse con `Zod` + `react-hook-form`
- Máximo **10 rutas** por usuario (limitación de dominio, no técnica)
- El objetivo es que la app sea usable en **Chile y LATAM** → considerar moneda CLP, idioma español
- Las rutas de Strava alimentan el cálculo nutricional: distancia + desnivel + duración → calorías → productos necesarios
- Todo el copy de la app va en **español**
