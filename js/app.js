// ============================================================
// CONFIGURA AQUÍ — pega tus links CSV publicados de Google Sheets
// ============================================================
const EVENTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTOzdnmowmizIpAtJa-BIQcC3aGZBrrk9q1gJnP0Qas5KETAFm7-38S37XlUvnIwiHTTqW3El0oyAM_/pub?gid=699316155&single=true&output=csv";
const MUSICOS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSoNZROQfxOStYwDsGDUX-toKlzmI_2Nx7IOe_S8whl826prr-gqmfpecb7y8guR2rv6AFrLc63MilW/pub?gid=1811664551&single=true&output=csv";

// Edita tu texto de "Sobre mí" aquí:
const ABOUT_TEXT = "Aquí va tu historia: quién es La Hija Mayor, desde cuándo organizas o conectas al público con el regional mexicano, y qué hace diferente a este espacio.";

// ============================================================
// Utilidades
// ============================================================

// Parser de CSV que respeta comillas y comas dentro de campos
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') { row.push(field); field = ""; }
      else if (char === '\r') { /* ignore */ }
      else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else { field += char; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

// Convierte filas CSV en objetos usando la fila de encabezado,
// pero por índice de columna (más confiable que el texto exacto del encabezado,
// porque las preguntas de Google Forms traen instrucciones largas pegadas al título).
function rowsToObjects(rows, columnMap) {
  const [, ...dataRows] = rows; // se descarta encabezado, se usa columnMap por índice
  return dataRows.map(r => {
    const obj = {};
    for (const key in columnMap) obj[key] = (r[columnMap[key]] || "").trim();
    return obj;
  });
}

async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar " + url);
  const text = await res.text();
  return parseCSV(text);
}

function parseFechaDDMMYYYY(str) {
  // Espera "DD/MM/AAAA" (con o sin hora pegada)
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

function formatFechaCorta(date) {
  const meses = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${String(date.getDate()).padStart(2,"0")} ${meses[date.getMonth()]}`;
}

const WHATSAPP_MENSAJE = "Hola! Encontré tu contacto en el sitio de La Hija Mayor..";

function whatsappLink(numero) {
  const limpio = numero.replace(/\D/g, "");
  if (!limpio) return null;
  return `https://wa.me/52${limpio.length === 10 ? limpio : limpio.slice(-10)}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`;
}

// ============================================================
// EVENTOS
// Columnas del Form (por índice): 0 Timestamp, 1 Nombre, 2 Categoria,
// 3 Fecha, 4 Lugar, 5 Link Maps, 6 Descripción, 7 Enlace boletos
// ============================================================
const EVENT_COLS = { nombre: 1, categoria: 2, fecha: 3, lugar: 4, mapsLink: 5, descripcion: 6, boletos: 7 };

let allEvents = [];
let currentCat = "todos";
let map = null;
let mapMarkers = [];

async function loadEvents() {
  const statusEl = document.getElementById("events-status");
  try {
    const rows = await fetchCSV(EVENTS_CSV_URL);
    const objs = rowsToObjects(rows, EVENT_COLS);
    const today = new Date();
    today.setHours(0,0,0,0);

    allEvents = objs
      .map(e => ({ ...e, fechaObj: parseFechaDDMMYYYY(e.fecha) }))
      .filter(e => e.nombre && (!e.fechaObj || e.fechaObj >= today)) // oculta eventos pasados
      .sort((a, b) => (a.fechaObj || 0) - (b.fechaObj || 0));

    statusEl.hidden = true;
    renderEvents();
  } catch (err) {
    statusEl.hidden = false;
    statusEl.textContent = "No se pudieron cargar los eventos en este momento.";
    console.error(err);
  }
}

function renderEvents() {
  const search = document.getElementById("event-search").value.toLowerCase();
  const list = document.getElementById("events-list");
  list.innerHTML = "";

  const filtered = allEvents.filter(e => {
    const matchesCat = currentCat === "todos" || e.categoria === currentCat;
    const matchesSearch = !search ||
      e.nombre.toLowerCase().includes(search) ||
      e.lugar.toLowerCase().includes(search);
    return matchesCat && matchesSearch;
  });

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "status-msg";
    empty.textContent = "No hay eventos que coincidan con tu búsqueda.";
    list.appendChild(empty);
    return;
  }

  filtered.forEach(e => {
    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <div>
        <span class="event-cat">${e.categoria.toUpperCase()}</span>
        <h3 class="event-name">${e.nombre}</h3>
        <p class="event-place">${e.lugar}</p>
        ${e.descripcion ? `<p class="event-desc">${e.descripcion}</p>` : ""}
        <div class="event-links">
          ${e.boletos ? `<a href="${e.boletos}" target="_blank" rel="noopener">Reservar / boletos</a>` : ""}
          ${e.mapsLink ? `<a href="${e.mapsLink}" target="_blank" rel="noopener">Ver en Maps</a>` : ""}
        </div>
      </div>
      <div class="event-date">${e.fechaObj ? formatFechaCorta(e.fechaObj) : ""}</div>
    `;
    list.appendChild(card);
  });
}

// ---- Mapa (Leaflet + geocodificación con Nominatim, cacheada) ----

function getGeocodeCache() {
  try { return JSON.parse(localStorage.getItem("lhm_geocode_cache") || "{}"); }
  catch { return {}; }
}
function saveGeocodeCache(cache) {
  try { localStorage.setItem("lhm_geocode_cache", JSON.stringify(cache)); } catch {}
}

async function geocode(address) {
  const cache = getGeocodeCache();
  if (cache[address]) return cache[address];

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.length) return null;

  const coords = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  cache[address] = coords;
  saveGeocodeCache(cache);
  return coords;
}

async function renderMap() {
  const container = document.getElementById("events-map");
  if (!map) {
    map = L.map(container).setView([23.6345, -102.5528], 5); // centro de México
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  }
  mapMarkers.forEach(m => map.removeLayer(m));
  mapMarkers = [];

  const search = document.getElementById("event-search").value.toLowerCase();
  const filtered = allEvents.filter(e => {
    const matchesCat = currentCat === "todos" || e.categoria === currentCat;
    const matchesSearch = !search || e.nombre.toLowerCase().includes(search) || e.lugar.toLowerCase().includes(search);
    return matchesCat && matchesSearch;
  });

  // Nominatim pide no más de ~1 request/seg, así que las hacemos en fila.
  for (const e of filtered) {
    const query = e.lugar;
    if (!query) continue;
    const coords = await geocode(query);
    if (!coords) continue;
    const marker = L.marker([coords.lat, coords.lng]).addTo(map);
    marker.bindPopup(`<strong>${e.nombre}</strong><br>${e.lugar}${e.fechaObj ? "<br>" + formatFechaCorta(e.fechaObj) : ""}`);
    mapMarkers.push(marker);
  }

  if (mapMarkers.length) {
    const group = L.featureGroup(mapMarkers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
  setTimeout(() => map.invalidateSize(), 100);
}

// ============================================================
// MÚSICOS
// Columnas del Form (por índice): 0 Timestamp, 1 Nombre, 2 Tipo,
// 3 Ciudad, 4 Red social, 5 Spotify, 6 Contacto
// ============================================================
const MUSICO_COLS = { nombre: 1, tipo: 2, ciudad: 3, redSocial: 4, spotify: 5, contacto: 6 };

let allMusicos = [];

async function loadMusicos() {
  const statusEl = document.getElementById("musicos-status");
  try {
    const rows = await fetchCSV(MUSICOS_CSV_URL);
    allMusicos = rowsToObjects(rows, MUSICO_COLS).filter(m => m.nombre);
    statusEl.hidden = true;
    renderMusicos();
  } catch (err) {
    statusEl.hidden = false;
    statusEl.textContent = "No se pudo cargar el directorio en este momento.";
    console.error(err);
  }
}

function renderMusicos() {
  const search = document.getElementById("musico-search").value.toLowerCase();
  const list = document.getElementById("musicos-list");
  list.innerHTML = "";

  const filtered = allMusicos.filter(m =>
    !search ||
    m.nombre.toLowerCase().includes(search) ||
    m.tipo.toLowerCase().includes(search) ||
    m.ciudad.toLowerCase().includes(search)
  );

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "status-msg";
    empty.textContent = "No hay músicos que coincidan con tu búsqueda.";
    list.appendChild(empty);
    return;
  }

  filtered.forEach(m => {
    const wa = whatsappLink(m.contacto);
    const card = document.createElement("article");
    card.className = "musico-card";
    card.innerHTML = `
      <h3>${m.nombre}</h3>
      <p class="musico-type">${m.tipo}</p>
      <div class="musico-meta">
        ${m.ciudad ? `<span>📍 ${m.ciudad}</span>` : ""}
        ${m.redSocial ? `<a href="${m.redSocial}" target="_blank" rel="noopener">Ver su trabajo</a>` : ""}
        ${m.spotify ? `<a href="${m.spotify}" target="_blank" rel="noopener">Escuchar en Spotify</a>` : ""}
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener">Contactar por WhatsApp</a>` : ""}
      </div>
    `;
    list.appendChild(card);
  });
}

// ============================================================
// Interacciones
// ============================================================
document.getElementById("about-text").textContent = ABOUT_TEXT;

document.getElementById("event-search").addEventListener("input", () => {
  renderEvents();
  if (!document.getElementById("events-map").hidden) renderMap();
});

document.getElementById("category-chips").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
  btn.classList.add("is-active");
  currentCat = btn.dataset.cat;
  renderEvents();
  if (!document.getElementById("events-map").hidden) renderMap();
});

document.querySelector(".view-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".view-btn");
  if (!btn) return;
  document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  const isMapa = btn.dataset.view === "mapa";
  document.getElementById("events-list").hidden = isMapa;
  document.getElementById("events-map").hidden = !isMapa;
  if (isMapa) renderMap();
});

document.getElementById("musico-search").addEventListener("input", renderMusicos);

loadEvents();
loadMusicos();
