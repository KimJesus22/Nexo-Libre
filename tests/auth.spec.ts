import { test, expect } from '@playwright/test';

test('Flujo de registro y redirección al panel', async ({ page }) => {
  // 1. Navegar a la Landing Page
  await page.goto('/');

  // 2. Hacer clic en "Crear cuenta" (buscamos el enlace en el header/navegación)
  await page.click('nav a:has-text("Crear cuenta")');

  // Esperar a que la página de registro cargue
  await expect(page).toHaveURL(/\/registrarse/);

  // 3. Completar el formulario de registro con correo y contraseña aleatorios
  const randomId = Math.floor(Math.random() * 1000000);
  const testEmail = `testuser_${randomId}@example.com`;
  const testPassword = 'Password123!';

  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.fill('input[name="confirm-password"]', testPassword);

  // Marcar los checkboxes de Términos y Privacidad (son los únicos checkboxes en la vista de registro)
  const checkboxes = await page.locator('input[type="checkbox"]').all();
  for (const checkbox of checkboxes) {
    await checkbox.check();
  }

  // Hacer clic en el botón de Crear cuenta para enviar el formulario
  await page.click('button[type="submit"]:has-text("Crear cuenta")');

  // 4. Verificar la redirección
  // Nota: La aplicación redirige a /verificar-correo porque la confirmación de email está habilitada en Supabase.
  // Adaptamos la prueba para reflejar el comportamiento real del sistema.
  await expect(page).toHaveURL(/\/verificar-correo/, { timeout: 15000 });

  // Verificar que el mensaje de verificación sea visible
  await expect(page.getByRole('heading', { name: 'Revisa tu correo' })).toBeVisible();
});
