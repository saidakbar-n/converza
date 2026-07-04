/**
 * Telegram sign-in on the landing page.
 */
(function () {
  const AUTH_STORAGE_KEY = "converza_auth";

  function t(key, vars) {
    return window.ConverzaI18n?.t(key, vars) || key;
  }

  function parseApiError(result, fallback) {
    if (window.ConverzaI18n?.translateApiError) {
      const detail = typeof result.detail === "string" ? result.detail : fallback;
      return window.ConverzaI18n.translateApiError(detail, fallback);
    }
    if (typeof result.detail === "string") return result.detail;
    if (Array.isArray(result.detail)) {
      return result.detail.map(d => d.msg || d).join("; ");
    }
    return fallback || t("auth.error.failed");
  }

  function createAuthModal() {
    const overlay = document.createElement("div");
    overlay.className = "pilot-modal-overlay";
    overlay.id = "auth-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "auth-modal-title");
    overlay.innerHTML = `
      <div class="pilot-modal">
        <div class="pilot-modal-head">
          <div>
            <h2 id="auth-modal-title" data-i18n="auth.title">Sign in with Telegram</h2>
            <p data-i18n="auth.subtitle">For approved accounts only.</p>
          </div>
          <button type="button" class="pilot-modal-close" data-i18n-title="common.close" aria-label="Close">&times;</button>
        </div>
        <div id="landing-telegram-login"></div>
        <p class="auth-modal-hint" id="auth-modal-hint" data-i18n="auth.hint">If the button does not appear, check the domain in BotFather.</p>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  let overlay = document.getElementById("auth-modal-overlay");
  if (!overlay) overlay = createAuthModal();

  const loginContainer = overlay.querySelector("#landing-telegram-login");
  const hint = overlay.querySelector("#auth-modal-hint");

  function applyModalI18n() {
    window.ConverzaI18n?.applyTo(overlay);
  }

  function openModal() {
    applyModalI18n();
    hint.textContent = t("auth.hint");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    mountTelegramWidget();
  }

  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    loginContainer.innerHTML = "";
  }

  async function mountTelegramWidget() {
    loginContainer.innerHTML = "";
    try {
      const config = await fetch("/api/auth/config").then(r => r.json());
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", config.bot_username || "ConverzaApp_bot");
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "8");
      script.setAttribute("data-onauth", "onLandingTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      loginContainer.appendChild(script);
    } catch (_) {
      hint.textContent = t("auth.error.loadFailed");
    }
  }

  window.onLandingTelegramAuth = async function onLandingTelegramAuth(user) {
    hint.textContent = t("auth.signingIn");
    try {
      const headers = { "Content-Type": "application/json", ...(window.ConverzaI18n?.apiLangHeader?.() || {}) };
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers,
        body: JSON.stringify(user)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(parseApiError(result, response.statusText));
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: { first_name: result.first_name, username: result.username },
          orgId: result.org_id,
          token: result.token
        })
      );
      window.location.href = "/app/";
    } catch (error) {
      hint.textContent = error.message;
    }
  };

  async function redirectIfSessionValid() {
    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!cached) return false;
    try {
      const { token } = JSON.parse(cached);
      if (!token) return false;
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}`, ...(window.ConverzaI18n?.apiLangHeader?.() || {}) }
      });
      if (!response.ok) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return false;
      }
      window.location.replace("/app/");
      return true;
    } catch (_) {
      return false;
    }
  }

  overlay.querySelector(".pilot-modal-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-sign-in]");
    if (trigger) {
      e.preventDefault();
      openModal();
    }
  });
  document.addEventListener("converza:langchange", applyModalI18n);

  applyModalI18n();

  redirectIfSessionValid().then(redirected => {
    if (redirected) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
      openModal();
      window.history.replaceState({}, "", window.location.pathname);
    }
  });

  window.ConverzaLandingAuth = { open: openModal, close: closeModal };
})();
