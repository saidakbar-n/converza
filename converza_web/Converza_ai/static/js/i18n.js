/**
 * Converza UI i18n — uz / ru / en
 * Requires /js/locales.js loaded first.
 */
(function (global) {
  const STORAGE_KEY = "converza_lang";
  const SUPPORTED = ["uz", "ru", "en"];
  const DEFAULT = "uz";

  function normalizeLang(raw) {
    if (!raw) return DEFAULT;
    const v = String(raw).trim().toLowerCase().replace("_", "-");
    if (v.startsWith("uz")) return "uz";
    if (v.startsWith("ru")) return "ru";
    if (v.startsWith("en")) return "en";
    return DEFAULT;
  }

  function detectBrowserLang() {
    if (typeof navigator === "undefined") return DEFAULT;
    return normalizeLang(navigator.language || navigator.userLanguage);
  }

  function getLang() {
    return normalizeLang(localStorage.getItem(STORAGE_KEY) || detectBrowserLang());
  }

  function interpolate(text, vars) {
    if (!vars) return text;
    return String(text).replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{${k}}`
    );
  }

  function t(key, vars) {
    const lang = getLang();
    const pack = global.CONVERZA_LOCALES || {};
    const bucket = pack[lang] || pack[DEFAULT] || {};
    const fallback = (pack[DEFAULT] || {})[key];
    const text = bucket[key] ?? fallback ?? key;
    return interpolate(text, vars);
  }

  function applyTo(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = t(key);
    });
    scope.querySelectorAll("[data-i18n-html]").forEach(el => {
      const key = el.getAttribute("data-i18n-html");
      if (!key) return;
      el.innerHTML = t(key);
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      el.setAttribute("placeholder", t(key));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      if (!key) return;
      el.setAttribute("title", t(key));
    });
    scope.querySelectorAll("[data-i18n-value]").forEach(el => {
      const key = el.getAttribute("data-i18n-value");
      if (!key) return;
      el.value = t(key);
    });
    scope.querySelectorAll("select[data-i18n-options]").forEach(select => {
      const prefix = select.getAttribute("data-i18n-options");
      [...select.options].forEach((opt, i) => {
        const key = `${prefix}.${i}`;
        if ((global.CONVERZA_LOCALES?.[getLang()] || {})[key]) {
          opt.textContent = t(key);
        }
      });
    });
    scope.querySelectorAll("option[data-i18n]").forEach(opt => {
      const key = opt.getAttribute("data-i18n");
      if (key) opt.textContent = t(key);
    });
    document.documentElement.lang = getLang();
    document.querySelectorAll("[data-lang]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === getLang());
      btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
    });
  }

  function setLang(lang) {
    const next = normalizeLang(lang);
    if (!SUPPORTED.includes(next)) return;
    localStorage.setItem(STORAGE_KEY, next);
    applyTo(document);
    document.dispatchEvent(new CustomEvent("converza:langchange", { detail: { lang: next } }));
  }

  function mountSwitchers() {
    document.querySelectorAll(".lang-switch").forEach(group => {
      if (group.dataset.i18nBound) return;
      group.dataset.i18nBound = "1";
      group.addEventListener("click", e => {
        const btn = e.target.closest("[data-lang]");
        if (btn) setLang(btn.getAttribute("data-lang"));
      });
    });
  }

  function apiLangHeader() {
    return { "X-Converza-Lang": getLang() };
  }

  /** Map known API error strings (any language) to translation keys. */
  const API_ERROR_MAP = [
    ["To'liq ismingizni kiriting", "access.full_name_required"],
    ["Biznes nomini kiriting", "access.business_required"],
    ["kamida 30 belgi", "access.message_short"],
    ["telefon raqamini", "access.phone_invalid"],
    ["@username majburiy", "access.telegram_required"],
    ["So'rov topilmadi", "access.not_found"],
    ["admin tasdig", "auth.approval_required"],
    ["Telegram autentifikatsiya", "auth.telegram_invalid"],
    ["Brend pasporti topilmadi", "passport.not_found"],
    ["Co-Pilot hali tayyor emas", "copilot.not_ready"],
    ["LLM sozlanmagan", "copilot.llm_missing"],
  ];

  function translateApiError(message, fallback) {
    const msg = String(message || "");
    for (const [needle, key] of API_ERROR_MAP) {
      if (msg.includes(needle)) return t(key);
    }
    return msg || fallback || t("app.error.requestFailed");
  }

  function init() {
    mountSwitchers();
    applyTo(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.ConverzaI18n = {
    t,
    getLang,
    setLang,
    applyTo,
    apiLangHeader,
    translateApiError,
    SUPPORTED,
  };
})(window);
