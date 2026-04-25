# VivaPantry Website Internationalization Verification

Manual checks for GitHub Pages deployment at `https://vivapantry.com`.

1. Browser language `pt-BR`
   - Clear `localStorage`.
   - Visit `https://vivapantry.com/`.
   - Expected: redirects to `https://vivapantry.com/pt-BR/`.

2. Browser language `es`
   - Clear `localStorage`.
   - Visit `https://vivapantry.com/`.
   - Expected: redirects to `https://vivapantry.com/es/`.

3. Browser language `en`
   - Clear `localStorage`.
   - Visit `https://vivapantry.com/`.
   - Expected: redirects to `https://vivapantry.com/en/`.

4. Manual language switch
   - Visit `/en/privacy`.
   - Switch to `Português Brasil`.
   - Expected: saves `vivapantry.locale=pt-BR` in `localStorage` and redirects to `/pt-BR/privacy`.

5. Static route refresh
   - Open `https://vivapantry.com/pt-BR/privacy`.
   - Refresh the page.
   - Expected: page loads without a 404 and remains in Portuguese.

6. Legal and support pages
   - Check `/en/privacy`, `/pt-BR/privacy`, `/es/privacy`.
   - Repeat for `terms`, `support`, and `delete-account`.
   - Expected: navigation, footer, content, buttons, title, and meta description match the selected language.

7. Metadata
   - Inspect the rendered document.
   - Expected: `<html lang>` is `en`, `pt-BR`, or `es`.
   - Expected: each localized page has `hreflang` alternates for `en`, `pt-BR`, `es`, plus `x-default` pointing to `/en/`.

8. Fallbacks
   - Visit `/privacy`.
   - Expected: redirects based on saved/browser language.
   - Visit `/fr/privacy`.
   - Expected: redirects to `/en/privacy`.
   - Visit `/en/unknown-page`.
   - Expected: localized 404 content is shown.
