/**
 * Telegram sign-in on the landing page.
 * Approved users authenticate here and are redirected to /app.
 */
(function () {
  const AUTH_STORAGE_KEY = "converza_auth";

  function parseApiError(result, fallback) {
    if (typeof result.detail === "string") return result.detail;
    if (Array.isArray(result.detail)) {
      return result.detail.map(d => d.msg || d).join("; ");
    }
    return fallback || "Sign in failed.";
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
            <h2 id="auth-modal-title">Sign in with Telegram</h2>
            <p>For approved accounts only. Use the same @username from your access request.</p>
          </div>
          <button type="button" class="pilot-modal-close" aria-label="Close">&times;</button>
        </div>
        <div id="landing-telegram-login"></div>
        <p class="auth-modal-hint" id="auth-modal-hint">If the button does not appear, check the domain in BotFather.</p>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  let overlay = document.getElementById("auth-modal-overlay");
  if (!overlay) overlay = createAuthModal();

  const loginContainer = overlay.querySelector("#landing-telegram-login");
  const hint = overlay.querySelector("#auth-modal-hint");

  function openModal() {
    hint.textContent = "If the button does not appear, check the domain in BotFather.";
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
      hint.textContent = "Could not load Telegram sign-in. Try again later.";
    }
  }

  window.onLandingTelegramAuth = async function onLandingTelegramAuth(user) {
    hint.textContent = "Signing in...";
    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      window.location.href = "/app";
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
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return false;
      }
      window.location.replace("/app");
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
