/**
 * Shared Book Pilot access-request modal.
 * Opens from any [data-book-pilot] trigger; POSTs to /api/access-request.
 */
(function () {
  const ACCESS_REQUEST_KEY = "converza_access_request_id";

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
    if (message.length < 30) return "Describe your challenge in at least 30 characters.";
    if (phone.length < 9) return "Enter a valid phone number (e.g. +998901234567).";
    if (username.length < 3) return "Enter your Telegram @username.";
    return null;
  }

  function parseApiError(result, fallback) {
    if (typeof result.detail === "string") return result.detail;
    if (Array.isArray(result.detail)) {
      return result.detail.map(d => d.msg || d).join("; ");
    }
    return fallback || "Request failed.";
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
              <h2 id="pilot-modal-title">Book Pilot Access</h2>
              <p>Request early access to Converza DM Closer. We'll review and approve within 24 hours.</p>
            </div>
            <button type="button" class="pilot-modal-close" aria-label="Close">&times;</button>
          </div>
          <form class="pilot-form" id="pilot-access-form">
            <label for="pilot-name">Full name *</label>
            <input id="pilot-name" name="full_name" required minlength="2" placeholder="Ali Valiyev" autocomplete="name" />
            <label for="pilot-business">Business name *</label>
            <input id="pilot-business" name="business_name" required minlength="2" placeholder="Nafis Beauty Salon" autocomplete="organization" />
            <label for="pilot-message">Main challenge *</label>
            <textarea id="pilot-message" name="message" required minlength="30" maxlength="500" placeholder="We lose leads after hours because nobody replies to Telegram DMs..."></textarea>
            <label for="pilot-contact">Phone number *</label>
            <input id="pilot-contact" name="contact" type="tel" required placeholder="+998901234567" autocomplete="tel" />
            <label for="pilot-telegram">Telegram @username *</label>
            <input id="pilot-telegram" name="telegram_username" required placeholder="@username" autocomplete="username" />
            <p class="pilot-form-hint" id="pilot-form-hint">Use the same @username you'll log in with.</p>
            <button type="submit" class="btn-pilot btn-submit">Submit Request</button>
          </form>
        </div>
        <div id="pilot-success-view" hidden>
          <div class="pilot-modal-head">
            <div></div>
            <button type="button" class="pilot-modal-close" aria-label="Close">&times;</button>
          </div>
          <div class="pilot-success">
            <strong>Request submitted</strong>
            <p>We'll review your application and notify you via Telegram once approved. Then use <strong>Sign in</strong> on this page to access your workspace.</p>
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

  function openModal() {
    formView.hidden = false;
    successView.hidden = true;
    form.reset();
    hint.textContent = "Use the same @username you'll log in with.";
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
    hint.textContent = "Submitting...";
    try {
      const response = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  form.addEventListener("submit", submitForm);

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-book-pilot]");
    if (trigger) {
      e.preventDefault();
      openModal();
    }
  });

  window.ConverzaPilotModal = { open: openModal, close: closeModal };
})();
