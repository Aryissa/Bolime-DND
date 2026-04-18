
// =========================
// NORMALISATION
// =========================
const normalize = str =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");

// =========================
// GLOBAL STATE
// =========================
let encounterMode = false;
let allCards = [];

// =========================
// LOAD SCRIPT DYNAMIQUE
// =========================
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// =========================
// DESIGN HELPERS
// =========================
function getCardColor(html) {
  if (html.includes("At-Will")) return "border-success";
  if (html.includes("Encounter")) return "border-warning";
  if (html.includes("Daily")) return "border-danger";
  return "";
}

// =========================
// UI RENDER
// =========================
function renderCards(data) {

  const container = document.getElementById("result");
  container.innerHTML = "";

  const row = document.createElement("div");
  row.className = "row g-3";

  data.forEach((power, index) => {

    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4 d-flex";
    col.style.setProperty("--i", index);

    const card = document.createElement("div");
    card.className = `card h-100 shadow-sm w-100 ${getCardColor(power.html)}`;

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const front = document.createElement("div");
    front.className = "card-face card-front card-body";
    front.innerHTML = power.html;

    const back = document.createElement("div");
    back.className = "card-face card-back";
    back.innerHTML = `
      <div>
        <div style="font-size:18px;">⚔️ Utilisé</div>
        <div style="font-size:12px;opacity:0.7;">Rencontre terminée</div>
      </div>
    `;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    // =========================
    // FLIP LOGIC
    // =========================
    card.addEventListener("click", () => {

      if (!encounterMode) return;

      if (power.html.includes("Encounter")) {
        card.classList.add("flipped");
        card.style.pointerEvents = "none";
      }
    });

    col.appendChild(card);
    row.appendChild(col);
  });

  container.appendChild(row);
}

// =========================
// FILTER / SEARCH / SORT
// =========================
function applyFilters() {

  let filtered = [...allCards];

  const search = document.getElementById("searchInput").value.toLowerCase();
  const filter = document.getElementById("filterSelect").value;
  const sort = document.getElementById("sortSelect").value;

  // SEARCH
  if (search) {
    filtered = filtered.filter(p =>
      p.html.toLowerCase().includes(search)
    );
  }

  // FILTER TYPE
  if (filter !== "all") {
    filtered = filtered.filter(p =>
      p.html.includes(filter)
    );
  }

  // SORT
  if (sort === "name") {
    filtered.sort((a, b) =>
      a.html.localeCompare(b.html)
    );
  }

  renderCards(filtered);
}

// =========================
// MAIN
// =========================
document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // BUTTON TOGGLE RENCONTRE
  // =========================
  const btn = document.getElementById("encounterBtn");

  btn.addEventListener("click", () => {
    encounterMode = !encounterMode;

    btn.textContent = encounterMode
      ? "Mode Rencontre : ON"
      : "Mode Rencontre : OFF";

    if (!encounterMode) {
      document.querySelectorAll(".card").forEach(card => {
        card.classList.remove("flipped");
        card.style.pointerEvents = "auto";
      });
    }
  });

  // =========================
  // UI EVENTS
  // =========================
  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("filterSelect").addEventListener("change", applyFilters);
  document.getElementById("sortSelect").addEventListener("change", applyFilters);

  // =========================
  // LOAD XML + DATA
  // =========================
  fetch("Bard.dnd4e")
    .then(res => res.text())
    .then(xmlString => {

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      const powers = xmlDoc.getElementsByTagName("Power");

      const powerNames = [];
      for (let i = 0; i < powers.length; i++) {
        const name = powers[i].getAttribute("name");
        if (name) powerNames.push(name);
      }

      const normalizedPowerSet = new Set(powerNames.map(normalize));

      const filtered = window.listingData.filter(entry =>
        normalizedPowerSet.has(normalize(entry[1]))
      );

      const powerIds = filtered.map(entry => entry[0]);

      // LOAD DATA FILES
      const scripts = [];
      for (let i = 0; i <= 19; i++) {
        scripts.push(loadScript(`database/power/data${i}.js`));
      }

      return Promise.all(scripts).then(() => powerIds);
    })
    .then(powerIds => {

      const detailedPowers = powerIds
        .map(id => ({
          id,
          html: window.powerDetails[id] || null
        }))
        .filter(p => p.html);

      allCards = detailedPowers;

      renderCards(allCards);
    })
    .catch(err => console.error("Erreur :", err));

});