# auth_tests

Guía y registro de cuentas de prueba para la autenticación con Clerk (SigMed).

- App Clerk: `app_3KiMuLgX4rC8CujY0SpzQSMF3o6`
- Instancia: **development** `ins_3KiMuOv11wsxVQ0H159odbmhnRn`
- La app enlaza la identidad de Clerk con la fila `user_profile` de la base **por email**
  (`src/lib/actor.ts`, `getCurrentActor()`): en el primer login, si el email coincide con un
  usuario existente, adopta su rol y reemplaza el `clerk_user_id` provisorio (`seed_...`)
  por el real de Clerk.

> Todo lo de esta guía aplica a la **instancia de desarrollo**. En producción no existen los
> emails `+clerk_test` ni el OTP `424242`, y las cuentas seed deben recrearse contra la
> instancia prod si se la configura.

## 1. Usuarios seed (rol real) — ya creados en Clerk

Cuentas ficticias creadas por la Backend API de Clerk (el email queda **verificado
automáticamente**, no se envía ningún correo ni hace falta confirmación). Como usan los
mismos emails que `prisma/seed.ts`, al loguearse toman el rol de la base.

**Contraseña para todas:** `SigMed-Test-2026-x7Q!`

| Email | Nombre | Rol | Clerk user id |
|---|---|---|---|
| `admin@sigmed.dev` | Ana Ríos | ADMINISTRADOR | `user_3KkJ3MYaqE7lVAuV8KGxDrLhBkv` |
| `enfermera@sigmed.dev` | Lucía Ferreyra | ENFERMERA | `user_3KkJ3mPk8EJRZS8hZwpkX8ew9wR` |
| `medico1@sigmed.dev` | Martín Gómez | MEDICO | `user_3KkJ420iIOoH6GUCkYvyVI7o7Ll` |
| `medico2@sigmed.dev` | Sofía Duarte | MEDICO | `user_3KkJ4NuHTLvSxdhJCOM5CE8kWRC` |
| `paciente1@sigmed.dev` | Juan Pérez | PACIENTE | `user_3KkJ4qbLfzdKNSceCDs0QWdqH1S` |
| `paciente2@sigmed.dev` | Marta López | PACIENTE | `user_3KkJ5DVrR7WpuKk6zUWWFinG2lc` |
| `paciente3@sigmed.dev` | Diego Sosa | PACIENTE | `user_3KkJ5Vm9N8ww23YS4n8PhQ4wNOE` |

### Cómo recrearlas

La CLI global puede no estar en el PATH; usar el runner de npm (`npx -y clerk@latest`).

```sh
# Sanity check: login, link al repo y claves de la instancia dev
npx -y clerk@latest doctor --json

# (opcional) ver qué hay hoy
npx -y clerk@latest users list --json --limit 250
```

Un alta individual (previsualizar con `--dry-run` antes de ejecutar):

```sh
npx -y clerk@latest users create -d '{
  "email_address": ["admin@sigmed.dev"],
  "first_name": "Ana",
  "last_name": "Ríos",
  "password": "SigMed-Test-2026-x7Q!"
}' --dry-run
```

Para recrear los 7 de una (PowerShell). Nota: la contraseña debe cumplir el mínimo de la
instancia (`auth_password.min_length = 15`), por eso es larga.

```powershell
$password = 'SigMed-Test-2026-x7Q!'
$users = @(
  @{ email='admin@sigmed.dev';     first='Ana';    last='Ríos' },
  @{ email='enfermera@sigmed.dev'; first='Lucía';  last='Ferreyra' },
  @{ email='medico1@sigmed.dev';   first='Martín'; last='Gómez' },
  @{ email='medico2@sigmed.dev';   first='Sofía';  last='Duarte' },
  @{ email='paciente1@sigmed.dev'; first='Juan';   last='Pérez' },
  @{ email='paciente2@sigmed.dev'; first='Marta';  last='López' },
  @{ email='paciente3@sigmed.dev'; first='Diego';  last='Sosa' }
)
foreach ($u in $users) {
  $tmp = Join-Path $env:TEMP ("seed-" + ($u.email -replace '[^a-z0-9]','_') + ".json")
  $body = @{ email_address=@($u.email); first_name=$u.first; last_name=$u.last; password=$password } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText($tmp, $body, (New-Object System.Text.UTF8Encoding($false)))
  npx -y clerk@latest users create --file $tmp --yes
}
```

> Guardar el script en UTF-8 para no romper los acentos; los nombres son cosméticos (la app
> usa los de la base), así que un acento mal codificado no afecta el enlace por email.

## 2. Usuarios de prueba `+clerk_test` (probar el flujo de registro)

Para validar el formulario de `/sign-up` (que verifica el email con un código) **sin recibir
correos reales**, Clerk reconoce cualquier dirección con la subdirección `+clerk_test` y
acepta siempre el código fijo **`424242`** (solo instancia de desarrollo; no se envía ningún
email).

Pasos:

1. Entrar a `/sign-up`.
2. Usar un email de prueba, por ejemplo `nuevo+clerk_test@example.com`.
3. Completar nombre, apellido, DNI y contraseña (mínimo 15 caracteres).
4. Cuando pida el código de verificación, ingresar `424242`.
5. El usuario queda con **rol PACIENTE** (alta JIT: el email no coincide con ningún seed, y
   JIT solo autoprovisiona `Patient`).

Alta manual equivalente por CLI (el email queda verificado, sin pasar por el formulario):

```sh
npx -y clerk@latest users create -d '{
  "email_address": ["nuevo+clerk_test@example.com"],
  "first_name": "Test",
  "last_name": "User",
  "password": "SigMed-Test-2026-x7Q!"
}' --yes
```

> Para que un usuario nuevo sea MEDICO / ENFERMERA / ADMINISTRADOR hace falta una fila
> propia en la base (`user_profile` + `doctor` si corresponde) o setear
> `public_metadata.role`; el alta JIT por sí sola solo crea pacientes. Lo más rápido para
> probar esos roles es usar los usuarios seed de la sección 1.

## 3. Limpieza

```sh
# Borrar un usuario puntual
npx -y clerk@latest api /users/<user_id> -X DELETE --yes

# Listar para ubicar ids/emails
npx -y clerk@latest users list --json --limit 250
```
