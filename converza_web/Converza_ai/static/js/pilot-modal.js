/**
 * Shared Book Pilot access-request modal.
 */
(function () {
  const ACCESS_REQUEST_KEY = "converza_access_request_id";

  function t(key, vars) {
    return window.ConverzaI18n?.t(key, vars) || key;
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function validateForm(fd) {
    const message = String(fd.get("message") || "").trim();
    const phone = String(fd.get("contact") || "").replace(/\D/g, "");
    const username = String(fd.get("telegram_username") || "").trim().replace(/^@/, "");
    if (message.length < 30) return t("pilot.error.messageMin");
    if (phone.length < 9) return t("pilot.error.phone");
    if (username.length < 3) return t("pilot.error.username");
    return null;
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
    return fallback || t("app.error.requestFailed");
  }

  function createModal() {
    const overlay = document.createElement("div");
    overlay.className = "pilot-modal-overlay";
    overlay.id = "pilot-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "pilot-modal-title");
    overlay.innerHTML = `
      <div class="pilot-modal">
        <div id="pilot-form-view">
          <div class="pilot-modal-head">
            <div>
              <h2 id="pilot-modal-title" data-i18n="pilot.title">Book Pilot Access</h2>
              <p data-i18n="pilot.subtitle">Request early access.</p>
            </div>
            <button type="button" class="pilot-modal-close" data-i18n-title="pilot.close" aria-label="Close">&times;</button>
          </div>
          <form class="pilot-form" id="pilot-access-form">
            <label for="pilot-name" data-i18n="pilot.fullName">Full name *</label>
            <input id="pilot-name" name="full_name" required minlength="2" placeholder="Ali Valiyev" autocomplete="name" />
            <label for="pilot-business" data-i18n="pilot.businessName">Business name *</label>
            <input id="pilot-business" name="business_name" required minlength="2" placeholder="Nafis Beauty Salon" autocomplete="organization" />
            <label for="pilot-message" data-i18n="pilot.challenge">Main challenge *</label>
            <textarea id="pilot-message" name="message" required minlength="30" maxlength="500" placeholder="We lose leads after hours..."></textarea>
            <label for="pilot-contact" data-i18n="pilot.phone">Phone number *</label>
            <input id="pilot-contact" name="contact" type="tel" required placeholder="+998901234567" autocomplete="tel" />
            <label for="pilot-telegram" data-i18n="pilot.telegram">Telegram @username *</label>
            <input id="pilot-telegram" name="telegram_username" required placeholder="@username" autocomplete="username" />
            <p class="pilot-form-hint" id="pilot-form-hint" data-i18n="pilot.hint">Use the same @username you'll log in with.</p>
            <button type="submit" class="btn-pilot btn-submit" data-i18n="pilot.submit">Submit Request</button>
          </form>
        </div>
        <div id="pilot-success-view" hidden>
          <div class="pilot-modal-head">
            <div></div>
            <button type="button" class="pilot-modal-close" data-i18n-title="pilot.close" aria-label="Close">&times;</button>
          </div>
          <div class="pilot-success">
            <strong data-i18n="pilot.successTitle">Request submitted</strong>
            <p data-i18n="pilot.successDesc">We'll review your application.</p>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  let overlay = document.getElementById("pilot-modal-overlay");
  if (!overlay) overlay = createModal();

  const formView = overlay.querySelector("#pilot-form-view");
  const successView = overlay.querySelector("#pilot-success-view");
  const form = overlay.querySelector("#pilot-access-form");
  const hint = overlay.querySelector("#pilot-form-hint");

  function applyModalI18n() {
    window.ConverzaI18n?.applyTo(overlay);
  }

  function openModal() {
    formView.hidden = false;
    successView.hidden = true;
    form.reset();
    applyModalI18n();
    hint.textContent = t("pilot.hint");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => overlay.querySelector("#pilot-name")?.focus(), 100);
  }

  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  async function submitForm(event) {
    event.preventDefault();
    const fd = new FormData(form);
    const clientError = validateForm(fd);
    if (clientError) {
      hint.textContent = clientError;
      return;
    }
    hint.textContent = t("pilot.submitting");
    try {
      const headers = { "Content-Type": "application/json", ...(window.ConverzaI18n?.apiLangHeader?.() || {}) };
      const response = await fetch("/api/access-request", {
        method: "POST",
        headers,
        body: JSON.stringify({
          full_name: String(fd.get("full_name")).trim(),
          business_name: String(fd.get("business_name")).trim(),
          telegram_username: String(fd.get("telegram_username")).trim(),
          contact: String(fd.get("contact")).trim(),
          message: String(fd.get("message")).trim()
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(parseApiError(result, response.statusText));
      localStorage.setItem(ACCESS_REQUEST_KEY, result.request_id);
      formView.hidden = true;
      successView.hidden = false;
      applyModalI18n();
    } catch (error) {
      hint.textContent = error.message;
    }
  }

  overlay.querySelectorAll(".pilot-modal-close").forEach(btn => {
    btn.addEventListener("click", closeModal);
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });

  document.addEventListener("converza:langchange", applyModalI18n);

  form.addEventListener("submit", submitForm);

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-book-pilot]");
    if (trigger) {
      e.preventDefault();
      openModal();
    }
  });

  applyModalI18n();
  window.ConverzaPilotModal = { open: openModal, close: closeModal };
})();
