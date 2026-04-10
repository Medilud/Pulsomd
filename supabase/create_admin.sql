-- ============================================================
-- PulsoMD — Crear primer usuario administrador
-- ============================================================
-- Ejecutar DESPUÉS de que el usuario haya completado
-- su primer login (el trigger crea el registro en public.users).
-- ============================================================

-- Opción A: El usuario ya hizo login al menos una vez
UPDATE public.users
SET role = 'admin'
WHERE email = 'ia@medilud.com';

-- Verificar resultado
SELECT id, email, full_name, role, created_at
FROM public.users
WHERE email = 'ia@medilud.com';

-- ============================================================
-- Opción B: Si el usuario existe en auth pero aún no en users
-- ============================================================
-- INSERT INTO public.users (id, email, full_name, role)
-- SELECT id, email, 'Admin Medilud', 'admin'
-- FROM auth.users
-- WHERE email = 'ia@medilud.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
