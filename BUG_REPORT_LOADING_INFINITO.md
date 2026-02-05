# 🐛 Reporte de Bug: Carga Infinita en Helen OS

**Fecha:** 2026-02-03  
**Estado:** Pendiente de Corrección  
**Severidad:** CRÍTICA  
**Síntoma:** Todas las páginas se quedan en "Cargando..." infinitamente

---

## 📍 Resumen Ejecutivo

El sitio web no carga ninguna página. El navegador muestra el spinner de Chrome con "Cargando..." pero nunca termina. El problema está en la inicialización de Prisma que crashea antes de que el servidor pueda responder.

---

## 🔴 PROBLEMAS CRÍTICOS A RESOLVER

### 1. `lib/prisma.ts` - Throw en top-level (PRINCIPAL CAUSA)

**Ubicación:** `c:\Users\Renzo\Documents\helen-os\lib\prisma.ts` líneas 7-8

**Código problemático:**
```typescript
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}
```

**Por qué falla:**
- Este `throw` ocurre en el **nivel superior del módulo** (fuera de funciones)
- Cuando cualquier archivo importa `prisma`, este código se ejecuta inmediatamente
- Si `DATABASE_URL` no está en el entorno en ese momento, **crashea toda la app**
- Next.js puede no tener las variables de entorno disponibles en el edge en ciertos contextos

**Solución recomendada:**
```typescript
// Lazy initialization - no throw at import time
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getPrisma(): PrismaClient {
    if (!globalForPrisma.prisma) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL not set');
        }
        const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
        const adapter = new PrismaPg(pool);
        globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    return globalForPrisma.prisma;
}

export const prisma = getPrisma();
```

---

### 2. `lib/prisma.ts` - Pool de conexiones síncrono

**Ubicación:** `c:\Users\Renzo\Documents\helen-os\lib\prisma.ts` líneas 11-17

**Código problemático:**
```typescript
const pool = new Pool({ 
    connectionString,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10
});
```

**Por qué puede fallar:**
- El Pool se crea sincrónicamente cuando se importa el módulo
- Si hay problemas de DNS o red, la primera query se cuelga
- El timeout de 5000ms puede no ser suficiente o no aplicarse al handshake inicial

---

### 3. `prisma.config.ts` - Dependencia faltante

**Ubicación:** `c:\Users\Renzo\Documents\helen-os\prisma.config.ts` línea 3

**Código problemático:**
```typescript
import "dotenv/config";
```

**Por qué falla:**
- `dotenv` NO está en `package.json`
- Cuando ejecutas `npx prisma migrate` o `npx prisma db push`, puede fallar

**Solución:**
```bash
npm install dotenv --save-dev
```

---

## 🟠 PROBLEMAS SECUNDARIOS

### 4. Cadena de dependencias de Prisma

**Archivos afectados:**
- `lib/auth.ts` → importa `lib/prisma.ts`
- `app/api/*/route.ts` → importan `lib/auth.ts`
- Todas las APIs fallan si Prisma no inicializa

**Flujo del error:**
```
Usuario visita /user
  → middleware.ts valida sesión via Supabase REST (OK)
  → página /user carga
    → llama a /api/user/feed
      → importa lib/auth.ts
        → importa lib/prisma.ts
          → THROW antes de ejecutar cualquier código
            → 500 Internal Server Error
              → Frontend se queda esperando
```

---

## 📁 ARCHIVOS CLAVE A REVISAR

| Archivo | Rol | Estado |
|---------|-----|--------|
| `lib/prisma.ts` | Conexión a DB | ⚠️ PROBLEMÁTICO |
| `prisma.config.ts` | Config CLI | ⚠️ Falta dotenv |
| `prisma/schema.prisma` | Schema | ✅ OK |
| `middleware.ts` | Auth rutas | ✅ OK |
| `lib/auth.ts` | Auth APIs | ✅ OK (depende de prisma) |
| `.env` | Variables | ✅ OK (verificar que exista) |

---

## 🛠️ PASOS PARA ARREGLAR

### Paso 1: Verificar variables de entorno
```bash
# El archivo .env debe existir con:
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

### Paso 2: Instalar dotenv
```bash
npm install dotenv --save-dev
```

### Paso 3: Reescribir `lib/prisma.ts` con lazy loading
(Ver solución en sección 1 arriba)

### Paso 4: Regenerar cliente Prisma
```bash
npx prisma generate
```

### Paso 5: Limpiar caché y reiniciar
```bash
rm -rf .next
npm run dev
```

---

## 🔍 CÓMO DIAGNOSTICAR

### Ver logs del servidor:
Buscar en la terminal donde corre `npm run dev` errores como:
- `DATABASE_URL environment variable is not set`
- `Connection refused`
- `ENOTFOUND` (DNS)
- `timeout` (conexión lenta)

### Probar conexión a DB directamente:
```bash
# En Node REPL
node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1')"
```

### Verificar que Supabase responde:
```bash
curl https://bjbomjzkflmizftoaeuh.supabase.co/rest/v1/
```

---

## 📝 NOTAS ADICIONALES

- Prisma 7.x requiere configuración diferente a Prisma 5.x
- No usar `url` y `directUrl` en `schema.prisma` (van en `prisma.config.ts`)
- El middleware ya tiene timeout de 3s y manejo de AbortError
- Las APIs excluidas del middleware manejan su propia auth

---

## ✅ VALIDACIÓN FINAL

Después de aplicar los fixes, verificar:
1. `http://localhost:3000/login` carga el formulario
2. Login con credenciales funciona
3. Redirección a `/admin` o `/user` según rol
4. Dashboard muestra estadísticas (no spinner infinito)
