/**
 * Landing page interactive components.
 */
(function () {
  // Card shuffler
  const cards = [
    { id: 1, title: "Node 01: Brand Passport", status: "ACTIVE" },
    { id: 2, title: "Node 08: DM Response Engine", status: "SYNCHING" },
    { id: 3, title: "Node 19: Click Payments", status: "READY" }
  ];
  let order = [0, 1, 2];
  const stage = document.getElementById("shuffler-stage");
  if (stage) {
    function renderCards() {
      stage.innerHTML = "";
      order.forEach((idx, i) => {
        const card = cards[idx];
        const el = document.createElement("div");
        el.className = "shuffle-card";
        const isTop = i === 2;
        const isMid = i === 1;
        el.style.opacity = isTop ? "1" : isMid ? "0.8" : "0.4";
        el.style.transform = `translateY(${isTop ? 0 : isMid ? -15 : -30}px) scale(${isTop ? 1 : isMid ? 0.95 : 0.9})`;
        el.style.zIndex = String(i);
        el.innerHTML = `
          <div class="card-head">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
            <span class="status ${isTop ? "active" : "idle"}">${card.status}</span>
          </div>
          <div class="title">${card.title}</div>`;
        stage.appendChild(el);
      });
    }
    renderCards();
    setInterval(() => {
      order = [order[2], order[0], order[1]];
      renderCards();
    }, 3000);
  }

  // Typewriter terminal
  const terminal = document.getElementById("terminal-text");
  if (terminal) {
    const fullText = "SYS.COMMAND\n> Init DM closer bounds\n[OK] Brand passport loaded\n> Generating 24/7 replies\n[████████░░] 80%\n> EST. Go-live: 24h\n\nSTATUS: ONLINE";
    let current = 0;
    let interval;

    function startTyping() {
      current = 0;
      terminal.textContent = "";
      interval = setInterval(() => {
        terminal.textContent = fullText.slice(0, current);
        current++;
        if (current > fullText.length) {
          clearInterval(interval);
          setTimeout(startTyping, 4000);
        }
      }, 40);
    }
    startTyping();
  }

  // Scheduler cursor animation
  const cursor = document.getElementById("scheduler-cursor");
  const cells = document.querySelectorAll(".week-grid .day-cell");
  if (cursor && cells.length) {
    const positions = [
      { x: 10, y: 10, day: null, opacity: 0 },
      { x: 10, y: 10, day: null, opacity: 1 },
      { x: 110, y: 35, day: 2, opacity: 1 },
      { x: 110, y: 35, day: 2, opacity: 1, click: true },
      { x: 220, y: 120, day: 2, opacity: 1 },
      { x: 220, y: 120, day: 2, opacity: 1, click: true },
      { x: 220, y: 120, day: null, opacity: 0 }
    ];
    let step = 0;

    function runStep() {
      const p = positions[step];
      cursor.style.opacity = p.opacity;
      cursor.style.transform = `translate(${p.x}px, ${p.y}px) scale(${p.click ? 0.8 : 1})`;
      cells.forEach((c, i) => c.classList.toggle("active", p.day === i));
      step = (step + 1) % positions.length;
      if (step === 0) cells.forEach(c => c.classList.remove("active"));
    }

    setInterval(runStep, 800);
    runStep();
  }
})();
