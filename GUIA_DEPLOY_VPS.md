# GUÍA DE ARQUITECTURA Y DEPLOY EN VPS (Anti-Borrado de Datos)

Esta guía contiene la estructura exacta de tu servidor y las instrucciones técnicas que debes darle a cualquier programador o IA para actualizar tu App SIN BORRAR la base de datos ni los archivos de los usuarios.

## 1. Estructura del Servidor (Jerarquía)

Tu VPS tiene dos zonas claramente separadas. Nunca deben mezclarse.

### A. La "Zona de Guerra" (Volátil - Se puede borrar)
Es donde vive el código de la aplicación.
*   **Ruta Técnica:** `/root/helen-os` (o el nombre de tu repo)
*   **Contenido:** Archivos de Next.js, `src`, `package.json`, `docker-compose.yml`.
*   **Regla:** Esta carpeta **SE PUEDE BORRAR** completa para hacer una instalación limpia.

### B. La "Caja Fuerte" (Persistente - PROHIBIDO TOCAR)
Es donde viven tus usuarios, pagos y fotos subidas. Está **FUERA** de la carpeta del proyecto.
*   **Ruta Técnica:** `/root/helen-data` (o similar, definido en `docker-compose.yml`)
*   **Contenido:** 
    *   `/postgres-data`: Archivos crudos de la base de datos.
    *   `/uploads`: Fotos y videos subidos por el admin.
*   **Regla:** Esta carpeta **JAMÁS SE TOCA** durante una actualización.

---

## 2. Instrucción de Seguridad (Bind Mounts)

La tecnología que conecta A con B se llama **Docker Bind Mounts** (Volúmenes enlazados).
En el archivo `docker-compose.yml`, se ve así:

```yaml
volumes:
  - /root/helen-data/postgres:/var/lib/postgresql/data  # <--- ESTO SALVA TUS DATOS
```

Esto le dice a la App: *"Aunque te borres y te reinstales, tus datos leen y escriben en la carpeta segura de afuera"*.

---

## 3. EL PROMPT DE SEGURIDAD (Copiar y Pegar)

Cuando pidas una actualización a una IA, usa este texto exacto para evitar catástrofes:

> **"Necesito actualizar la app `helen-os` en el VPS. Por favor, realiza un 'Deploy Limpio' SOLO en el directorio `/root/helen-os`.**
>
> **Instrucciones Críticas:**
> 1.  Detén los contenedores Docker (`docker-compose down`).
> 2.  Borra SOLO la carpeta de código (`rm -rf /root/helen-os`).
> 3.  Vuelve a clonar el repositorio en esa misma ruta.
> 4.  Levanta Docker nuevamente (`docker-compose up -d`).
>
> **¡IMPORTANTE!:** NO toques, borres ni modifiques ninguna carpeta fuera de `/root/helen-os`. Mis bases de datos están en volúmenes persistentes externos (`Bind Mounts`) y deben permanecer intactos."

---

## 4. Resumen para ti

*   **Si quieres actualizar código:** Borras la carpeta de la App y reinstalas. Docker se reconecta solo a los datos.
*   **Si borras el VPS completo:** Pierdes todo (a menos que tengas backups externos).
