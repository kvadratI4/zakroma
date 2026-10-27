/** Where the device keeps the chosen theme (T-009): "light", "dark" or nothing for the system theme. */
export const THEME_STORAGE_KEY = "zakroma.theme";

/**
 * Runs in <head> before the stylesheet is applied and before the app starts (T-009, AC-4): a chosen
 * theme is put on <html data-theme>; the system theme needs no script (themeCss() has a media query).
 * Shipped as a classic script file by plugins/themePlugin.ts, so the CSP keeps `script-src 'self'`.
 */
export const THEME_BOOT_SCRIPT =
  `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");` +
  `if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
