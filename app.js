// Vehicle Tracker — behold Supabase-nøkkelen som publishable key. Aldri legg SVV API-nøkkelen her.
const SUPABASE_URL = "https://nvokgifszhhbjxkhnhga.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_L-ipz6FQF-o90K7abcGuCA_RuW8l0UH";

const $ = (id) => document.getElementById(id);
const authView = $("auth-view");
const dashboardView = $("dashboard-view");
const authForm = $("auth-form");
const authMessage = $("auth-message");
const submitButton = $("submit-button");
const passwordInput = $("password");
const emailInput = $("email");
const resetButton = $("reset-button");
let supabaseClient;
let currentMode = "login";
let latestVehicleData = null;
let latestVehicle = null;
let activeVehicle = null;
let lookupCount = 0;

const categoryLabels = {
  kjoretoyId: "Identifikasjon",
  forstegangsregistrering: "Førstegangsregistrering",
  kjennemerke: "Kjennemerker",
  registrering: "Registrering og status",
  godkjenning: "Godkjenning og tekniske data",
  periodiskKjoretoyKontroll: "EU-kontroll",
  tekniskeData: "Tekniske data",
  akslinger: "Akslinger",
  bremser: "Bremser",
  dekkOgFelg: "Dekk og felger",
  dimensjoner: "Mål",
  generelt: "Generelt",
  karosseriOgLasteplan: "Karosseri og lasteplan",
  miljodata: "Miljø og drivstoff",
  motorOgDrivverk: "Motor og drivverk",
  ovrigeTekniskeData: "Øvrige tekniske data",
  persontall: "Sitteplasser",
  tilhengerkopling: "Tilhengerkobling",
  vekter: "Vekter",
  fabrikant: "Fabrikant",
  merke: "Merke",
  handelsbetegnelse: "Modell / handelsbetegnelse",
  tekniskGodkjenning: "Teknisk godkjenning",
  forstegangsGodkjenning: "Førstegangsgodkjenning",
  krav: "Krav og kravoppfyllelse",
  registreringsbegrensninger: "Registreringsbegrensninger",
  kjoretoymerknad: "Merknader",
  tilleggsgodkjenninger: "Tilleggsgodkjenninger",
  akselGruppe: "Akselgrupper",
  akselListe: "Akselliste",
  akselDekkOgFelgKombinasjon: "Godkjente dekk- og felgkombinasjoner",
  drivstoff: "Drivstoff",
  miljoOgdrivstoffGruppe: "Miljø- og drivstoffgruppe",
  forbrukOgUtslipp: "Forbruk og utslipp",
  motor: "Motor",
  sitteplassListe: "Sitteplasser"
};
const fieldLabels = {
  kjennemerke: "Registreringsnummer",
  understellsnummer: "Understellsnummer (VIN)",
  fabrikantNavn: "Fabrikant",
  handelsbetegnelse: "Modell",
  merke: "Merke",
  registrertForstegangNorgeDato: "Førstegangsregistrert i Norge",
  kontrollfrist: "Kontrollfrist",
  sistGodkjent: "Sist godkjent",
  egenvekt: "Egenvekt",
  nyttelast: "Nyttelast",
  tillattTotalvekt: "Tillatt totalvekt",
  lengde: "Lengde",
  bredde: "Bredde",
  hoyde: "Høyde",
  maksimumHastighet: "Maksimal hastighet",
  sitteplasserTotalt: "Sitteplasser totalt",
  sitteplasserForan: "Sitteplasser foran",
  elEnergiforbruk: "Energiforbruk",
  rekkeviddeKm: "Oppgitt rekkevidde",
  maksNettoEffekt: "Maksimal nettoeffekt",
  maksEffektPrTime: "Effekt per time",
  drivstoffKode: "Drivstoff",
  girkassetype: "Girkasse",
  abs: "ABS",
  antallAksler: "Antall aksler",
  registreringsstatus: "Registreringsstatus",
  kodeBeskrivelse: "Beskrivelse",
  kodeNavn: "Navn",
  kodeVerdi: "Kodeverdi",
  fomTidspunkt: "Fra tidspunkt",
  registrertForstegangPaEierskap: "Registrert på eierskap fra",
  forstegangRegistrertDato: "Førstegangsregistrert dato",
  dekkdimensjon: "Dekkdimensjon",
  felgdimensjon: "Felgdimensjon",
  drivAksel: "Drivaksel",
  styreAksel: "Styreaksel",
  tekniskTillattAkselLast: "Teknisk tillatt aksellast",
  tillattTilhengervektMedBrems: "Tillatt tilhengervekt med brems",
  tillattTilhengervektUtenBrems: "Tillatt tilhengervekt uten brems",
  farge: "Farge",
  rFarge: "Farge",
  euroKlasse: "Euro-/utslippsklasse",
  arbeidsprinsipp: "Arbeidsprinsipp",
  motorKode: "Motorkode",
  karosseritype: "Karosseritype"
};

function setMessage(element, message, type = "") {
  element.textContent = message;
  element.className = `message ${type}`.trim();
}
function setMode(mode) {
  currentMode = mode;
  const isLogin = mode === "login";
  $("login-tab").classList.toggle("active", isLogin);
  $("signup-tab").classList.toggle("active", !isLogin);
  $("auth-title").textContent = isLogin ? "Velkommen tilbake" : "Opprett en konto";
  $("auth-description").textContent = isLogin ? "Logg inn for å åpne dashboardet ditt." : "Opprett en konto for å komme i gang.";
  submitButton.innerHTML = isLogin ? 'Logg inn <span>→</span>' : 'Opprett konto <span>→</span>';
  passwordInput.autocomplete = isLogin ? "current-password" : "new-password";
  resetButton.hidden = !isLogin;
  setMessage(authMessage, "");
}
function showDashboard(user) {
  authView.hidden = true;
  dashboardView.hidden = false;
  $("user-email").textContent = user.email || "";
  refreshDashboard();
}
function showAuth() {
  dashboardView.hidden = true;
  authView.hidden = false;
}
function isConfigured() {
  return SUPABASE_URL.startsWith("https://") && SUPABASE_PUBLISHABLE_KEY.length > 20;
}
async function init() {
  if (!isConfigured()) {
    setMessage(authMessage, "Supabase er ikke konfigurert. Kontroller innstillingene i app.js.", "error");
    submitButton.disabled = true;
    return;
  }
  if (!window.supabase?.createClient) {
    setMessage(authMessage, "Supabase-biblioteket kunne ikke lastes. Kontroller internettilkoblingen.", "error");
    submitButton.disabled = true;
    return;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user) showDashboard(session.user);
    else showAuth();
  });
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) setMessage(authMessage, "Kunne ikke hente innloggingsstatus. Last siden på nytt.", "error");
  else if (data.session?.user) showDashboard(data.session.user);
  else showAuth();
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return setMessage(authMessage, "Supabase er ikke klart ennå.", "error");
  submitButton.disabled = true;
  setMessage(authMessage, "");
  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (currentMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session && data.user) showDashboard(data.user);
      else setMessage(authMessage, "Kontoforespørselen er sendt. Sjekk e-posten for å bekrefte kontoen.", "success");
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showDashboard(data.user);
    }
  } catch (error) {
    setMessage(authMessage, error.message || "Noe gikk galt. Prøv igjen.", "error");
  } finally { submitButton.disabled = false; }
});
$("login-tab").addEventListener("click", () => setMode("login"));
$("signup-tab").addEventListener("click", () => setMode("signup"));
resetButton.addEventListener("click", async () => {
  if (!supabaseClient) return;
  const email = emailInput.value.trim();
  if (!email) { setMessage(authMessage, "Skriv inn e-postadressen din først.", "error"); emailInput.focus(); return; }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
  setMessage(authMessage, error ? "Kunne ikke sende forespørselen. Prøv igjen." : "Hvis adressen kan brukes, får du en e-post med videre instruksjoner.", error ? "error" : "success");
});
$("logout-button").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) setMessage(authMessage, "Utlogging mislyktes. Prøv igjen.", "error");
});

function firstVehicleFromResponse(payload) {
  if (payload?.kjoretoydataListe && Array.isArray(payload.kjoretoydataListe)) return payload.kjoretoydataListe[0] || null;
  if (Array.isArray(payload)) return payload[0] || null;
  return payload?.kjoretoy || payload?.vehicle || payload || null;
}
function getAt(object, path) {
  return path.split(".").reduce((v, key) => v == null ? undefined : v[key], object);
}
function firstText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
    if (Array.isArray(value) && value.length) {
      const nested = firstText(...value);
      if (nested) return nested;
    }
    if (value && typeof value === "object") {
      const nested = firstText(value.merke, value.fabrikantNavn, value.kodeNavn, value.kodeBeskrivelse, value.handelsbetegnelse, value.navn);
      if (nested) return nested;
    }
  }
  return "";
}
function vehicleDetails(record) {
  const tech = record?.godkjenning?.tekniskGodkjenning?.tekniskeData || {};
  const general = tech.generelt || {};
  const id = record?.kjoretoyId || {};
  return {
    registration_number: firstText(id.kjennemerke, record?.kjennemerke?.[0]?.kjennemerke, latestVehicle?.registration_number).replace(/\s+/g, "").toUpperCase(),
    make: firstText(general.merke, general.fabrikant, record?.merke, record?.fabrikant),
    model: firstText(general.handelsbetegnelse, general.typebetegnelse),
    model_year: null,
    color: firstText(tech.karosseriOgLasteplan?.rFarge)
  };
}
function humanize(key) { return fieldLabels[key] || categoryLabels[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, c => c.toUpperCase()); }
function formatScalar(value, key = "") {
  if (value === null || value === undefined || value === "") return "Ikke oppgitt";
  if (typeof value === "boolean") return value ? "Ja" : "Nei";
  if (typeof value === "number") {
    if (["lengde", "bredde", "hoyde", "avstandTilNesteAksling", "sporvidde"].includes(key)) return `${value} mm`;
    if (/vekt|Last|egenvekt|nyttelast|tillattTotalvekt/i.test(key)) return `${value} kg`;
    if (key === "maksimumHastighet") return `${value} km/t`;
    if (key === "elEnergiforbruk") return `${value} Wh/km`;
    if (key === "rekkeviddeKm") return `${value} km`;
    if (/maks(Netto)?Effekt|maksEffektPrTime/i.test(key)) return `${value} kW`;
    return String(value);
  }
if (typeof value === "string") {
  // Vanlig dato: 2025-03-08 -> 08.03.2025
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}.${m}.${y}`;
  }

  // Dato med klokkeslett
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("nb-NO", {
        dateStyle: "short",
        timeStyle: "short"
      }).format(date);
    }
  }

  return value;
}
  return String(value);
}
function renderValue(value, key = "") {
  if (value === null || value === undefined || value === "") return `<span class="empty-value">Ikke oppgitt</span>`;
  if (Array.isArray(value)) {
    if (!value.length) return `<span class="empty-value">Ingen oppføringer</span>`;
    return `<div class="nested-list">${value.map((item, index) => `<details class="nested-item"><summary>${escapeHtml(humanize(key))} ${index + 1}</summary><div class="nested-content">${renderObject(item)}</div></details>`).join("")}</div>`;
  }
  if (typeof value === "object") return `<div class="nested-content">${renderObject(value)}</div>`;
  return `<span>${escapeHtml(formatScalar(value, key))}</span>`;
}
function renderObject(object) {
  if (!object || typeof object !== "object") return `<span>${escapeHtml(String(object ?? "Ikke oppgitt"))}</span>`;
  const entries = Object.entries(object);
  if (!entries.length) return `<span class="empty-value">Ingen opplysninger</span>`;
  return `<dl class="data-list">${entries.map(([key, value]) => `<div class="data-row"><dt>${escapeHtml(humanize(key))}</dt><dd>${renderValue(value, key)}</dd></div>`).join("")}</dl>`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function simpleSummary(record) {
  const info = vehicleDetails(record);
  const tech = record?.godkjenning?.tekniskGodkjenning?.tekniskeData || {};
  const env = tech.miljodata?.miljoOgdrivstoffGruppe?.[0] || {};
  const fuel = firstText(env.drivstoffKodeMiljodata);
  const regStatus = firstText(record?.registrering?.registreringsstatus);
  const control = record?.periodiskKjoretoyKontroll || {};
  return [
    ["Registreringsnummer", info.registration_number || "Ikke oppgitt"],
    ["Merke og modell", [info.make, info.model].filter(Boolean).join(" ") || "Ikke oppgitt"],
    ["Drivstoff", fuel || "Ikke oppgitt"],
    ["Registreringsstatus", regStatus || "Ikke oppgitt"],
    ["Kontrollfrist", formatScalar(control.kontrollfrist, "kontrollfrist")]
  ];
}
function renderTechnicalData(record) {
  const host = $("technical-sections");
  host.replaceChildren();
  const sections = [
    ["Identifikasjon", record.kjoretoyId],
    ["Førstegangsregistrering", record.forstegangsregistrering],
    ["Kjennemerker", record.kjennemerke],
    ["Registrering og status", record.registrering],
    ["Godkjenning og tekniske data", record.godkjenning],
    ["EU-kontroll", record.periodiskKjoretoyKontroll]
  ].filter(([, value]) => value !== undefined);
  if (record.tekniskeData !== undefined) sections.push(["Tekniske data", record.tekniskeData]);
  sections.forEach(([label, value]) => {
    const details = document.createElement("details");
    details.className = "technical-dropdown";
    const summary = document.createElement("summary");
    summary.innerHTML = `<span>${escapeHtml(label)}</span><span class="summary-hint">Åpne for detaljer</span>`;
    const body = document.createElement("div");
    body.className = "details-body";
    body.innerHTML = renderObject(value);
    details.append(summary, body);
    host.append(details);
  });
}
function renderLookup(payload, record) {
  latestVehicleData = payload;
  latestVehicle = vehicleDetails(record);
  $("lookup-results").hidden = false;
  $("result-title").textContent = [latestVehicle.make, latestVehicle.model].filter(Boolean).join(" ") || "Kjøretøy funnet";
  $("result-subtitle").textContent = latestVehicle.registration_number ? `Registreringsnummer ${latestVehicle.registration_number}` : "Tekniske opplysninger fra Statens vegvesen";
  const summary = $("vehicle-summary");
  summary.replaceChildren();
  simpleSummary(record).forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "summary-item";
    const term = document.createElement("span");
    term.className = "muted tiny";
    term.textContent = label;
    const data = document.createElement("strong");
    data.textContent = value;
    item.append(term, data);
    summary.append(item);
  });
  renderTechnicalData(record);
  $("raw-json-content").textContent = JSON.stringify(payload, null, 2);
  $("save-vehicle-button").disabled = false;
  $("lookup-results").scrollIntoView({ behavior: "smooth", block: "start" });
}
$("lookup-form").addEventListener("submit", async event => {
  event.preventDefault();
  const registration = $("registration-input").value.trim().replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9]{2,8}$/.test(registration)) {
    setMessage($("lookup-message"), "Skriv inn et gyldig registreringsnummer uten mellomrom.", "error");
    return;
  }
  const button = $("lookup-button");
  button.disabled = true;
  button.textContent = "Søker …";
  setMessage($("lookup-message"), "Henter tekniske data …");
  $("lookup-results").hidden = true;
  try {
    const { data, error } = await supabaseClient.functions.invoke("vehicle-lookup", { body: { kjennemerke: registration } });
    if (error) {
      let details = error.message || "Ukjent feil";
      if (error.context && typeof error.context.json === "function") {
        try { const body = await error.context.json(); if (body?.error) details = body.error; } catch {}
      }
      throw new Error(details);
    }
    if (data?.error) throw new Error(data.error);
    const record = firstVehicleFromResponse(data);
    if (!record || typeof record !== "object") throw new Error("API-et returnerte ingen kjøretøydata for dette nummeret.");
    lookupCount += 1;
    $("stat-last-lookup").textContent = new Date().toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" });
    renderLookup(data, record);
    setMessage($("lookup-message"), "Kjøretøydata hentet. Oppslaget er ikke registrert som en observasjon.", "success");
  } catch (error) {
    setMessage($("lookup-message"), `Oppslaget mislyktes: ${error.message || "Ukjent feil"}`, "error");
  } finally {
    button.disabled = false;
    button.innerHTML = 'Søk kjøretøy <span>→</span>';
  }
});

async function currentUserId() {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data?.user?.id) throw new Error("Fant ikke innlogget bruker. Logg inn på nytt.");
  return data.user.id;
}
async function saveCurrentVehicle() {
  if (!latestVehicleData || !latestVehicle) return;
  const userId = await currentUserId();
  const reg = latestVehicle.registration_number || $("registration-input").value.trim().replace(/\s+/g, "").toUpperCase();
  if (!reg) throw new Error("Fant ikke registreringsnummer i svaret.");
  const existing = await supabaseClient.from("vehicles").select("*").eq("registration_number", reg).maybeSingle();
  if (existing.error && existing.error.code !== "PGRST116") throw existing.error;
  if (existing.data) {
    activeVehicle = existing.data;
    setMessage($("lookup-message"), "Dette kjøretøyet ligger allerede i registeret ditt. Åpner profilen.", "success");
  } else {
    const row = {
      user_id: userId,
      registration_number: reg,
      make: latestVehicle.make || null,
      model: latestVehicle.model || null,
      model_year: latestVehicle.model_year,
      color: latestVehicle.color || null
    };
    const { data, error } = await supabaseClient.from("vehicles").insert(row).select().single();
    if (error) {
      // If the unique constraint fired due to a duplicate, load the user's existing record.
      if (error.code === "23505") {
        const retry = await supabaseClient.from("vehicles").select("*").eq("registration_number", reg).single();
        if (retry.error) throw retry.error;
        activeVehicle = retry.data;
      } else throw error;
    } else activeVehicle = data;
    setMessage($("lookup-message"), "Kjøretøyet er lagret i registeret ditt.", "success");
  }
  await refreshDashboard();
  openWorkspace(activeVehicle);
}
$("save-vehicle-button").addEventListener("click", async () => {
  const button = $("save-vehicle-button");
  button.disabled = true;
  try { await saveCurrentVehicle(); }
  catch (error) { setMessage($("lookup-message"), `Kunne ikke lagre kjøretøyet: ${error.message}`, "error"); }
  finally { button.disabled = false; button.textContent = "Lagre kjøretøy"; }
});

async function refreshDashboard() {
  if (!supabaseClient) return;
  const [vehicles, observations] = await Promise.all([
    supabaseClient.from("vehicles").select("id,registration_number,make,model,created_at").order("created_at", { ascending: false }),
    supabaseClient.from("observations").select("id,vehicle_id,observed_at,location,note,created_at").order("observed_at", { ascending: false }).limit(8)
  ]);
  $("stat-vehicles").textContent = vehicles.error ? "—" : String((vehicles.data || []).length);
  $("stat-observations").textContent = observations.error ? "—" : String((observations.data || []).length);
  const savedHost = $("saved-vehicles");
  savedHost.replaceChildren();
  if (vehicles.error) savedHost.innerHTML = `<p class="muted">Kunne ikke laste registeret. ${escapeHtml(vehicles.error.message)}</p>`;
  else if (!vehicles.data?.length) savedHost.innerHTML = `<p class="muted">Du har ikke lagret noen kjøretøy ennå. Søk opp et nummer og trykk «Lagre kjøretøy».</p>`;
  else vehicles.data.forEach(vehicle => savedHost.append(createVehicleRow(vehicle)));
  const obsHost = $("recent-observations");
  obsHost.replaceChildren();
  if (observations.error) obsHost.innerHTML = `<p class="muted">Kunne ikke laste observasjoner.</p>`;
  else if (!observations.data?.length) obsHost.innerHTML = `<p class="muted">Ingen observasjoner ennå.</p>`;
  else {
    const ids = [...new Set(observations.data.map(o => o.vehicle_id).filter(Boolean))];
    let vehicleMap = {};
    if (ids.length) {
      const lookup = await supabaseClient.from("vehicles").select("id,registration_number,make,model").in("id", ids);
      (lookup.data || []).forEach(v => vehicleMap[v.id] = v);
    }
    observations.data.forEach(o => obsHost.append(createObservationRow(o, vehicleMap[o.vehicle_id])));
  }
}
function createVehicleRow(vehicle) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "saved-row";
  const name = document.createElement("span");
  name.className = "saved-main";
  const title = document.createElement("strong");
  title.textContent = [vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.registration_number;
  const sub = document.createElement("span");
  sub.className = "muted tiny";
  sub.textContent = vehicle.registration_number;
  name.append(title, sub);
  const arrow = document.createElement("span");
  arrow.className = "row-arrow";
  arrow.textContent = "→";
  row.append(name, arrow);
  row.addEventListener("click", () => openWorkspace(vehicle));
  return row;
}
function createObservationRow(observation, vehicle) {
  const row = document.createElement("div");
  row.className = "saved-row observation-row";

  const main = document.createElement("span");
  main.className = "saved-main";

  const title = document.createElement("strong");
  title.textContent = vehicle?.registration_number || "Kjøretøy";

  const sub = document.createElement("span");
  sub.className = "muted tiny";

  const date = observation.observed_at || observation.created_at;
  sub.textContent = `${date ? new Date(date).toLocaleString("nb-NO") : "Ukjent tidspunkt"}${observation.location ? " · " + observation.location : ""}`;

  if (observation.note) {
    const note = document.createElement("span");
    note.className = "muted tiny";
    note.textContent = observation.note;
    main.append(title, sub, note);
  } else {
    main.append(title, sub);
  }

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "text-button danger-text";
  remove.textContent = "Slett observasjon";

  remove.addEventListener("click", async () => {
    if (!confirm("Er du sikker på at du vil slette denne observasjonen?")) return;

    remove.disabled = true;
    remove.textContent = "Sletter...";

    const { error } = await supabaseClient
      .from("observations")
      .delete()
      .eq("id", observation.id);

    if (error) {
      alert("Kunne ikke slette observasjonen: " + error.message);
      remove.disabled = false;
      remove.textContent = "Slett observasjon";
      return;
    }

    await refreshDashboard();
  });

  row.append(main, remove);
  return row;
}

$("refresh-button").addEventListener("click", refreshDashboard);

async function openWorkspace(vehicle) {
  activeVehicle = vehicle;
  $("vehicle-workspace").hidden = false;
  $("workspace-title").textContent = [vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.registration_number;
  $("workspace-subtitle").textContent = vehicle.registration_number || "";
  $("observation-date").value = toLocalDateTimeInput(new Date());
  $("observation-location").value = "";
  $("observation-note").value = "";
  $("note-title").value = "";
  $("note-content").value = "";
  setMessage($("workspace-message"), "");
  await loadNotes(vehicle.id);
  $("vehicle-workspace").scrollIntoView({ behavior: "smooth", block: "start" });
}
function toLocalDateTimeInput(date) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
$("close-workspace-button").addEventListener("click", () => { $("vehicle-workspace").hidden = true; activeVehicle = null; });

$("observation-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!activeVehicle) return;
  const dateValue = $("observation-date").value;
  let userId;
  try { userId = await currentUserId(); }
  catch (error) { setMessage($("workspace-message"), error.message, "error"); return; }
  const row = {
    user_id: userId,
    vehicle_id: activeVehicle.id,
    observed_at: dateValue ? new Date(dateValue).toISOString() : new Date().toISOString(),
    location: $("observation-location").value.trim() || null,
    note: $("observation-note").value.trim() || null
  };
  const { error } = await supabaseClient.from("observations").insert(row);
  if (error) setMessage($("workspace-message"), `Kunne ikke lagre observasjonen: ${error.message}`, "error");
  else {
    setMessage($("workspace-message"), "Observasjonen er registrert.", "success");
    $("observation-note").value = "";
    await refreshDashboard();
  }
});
$("note-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!activeVehicle) return;
  const title = $("note-title").value.trim() || "Notat";
  const content = $("note-content").value.trim();
  if (!content) {
    setMessage($("workspace-message"), "Skriv inn innhold, eller la notatformen stå ubrukt. Notater er valgfrie.", "error");
    return;
  }
  let userId;
  try { userId = await currentUserId(); }
  catch (error) { setMessage($("workspace-message"), error.message, "error"); return; }
  const { error } = await supabaseClient.from("vehicle_notes").insert({ user_id: userId, vehicle_id: activeVehicle.id, title, content });
  if (error) setMessage($("workspace-message"), `Kunne ikke lagre notatet: ${error.message}`, "error");
  else {
    setMessage($("workspace-message"), "Notatet er lagret.", "success");
    $("note-title").value = "";
    $("note-content").value = "";
    await loadNotes(activeVehicle.id);
  }
});
async function loadNotes(vehicleId) {
  const host = $("vehicle-notes");
  host.replaceChildren();
  const { data, error } = await supabaseClient.from("vehicle_notes").select("id,title,content,created_at").eq("vehicle_id", vehicleId).order("created_at", { ascending: false });
  if (error) { host.innerHTML = `<p class="muted tiny">Kunne ikke laste notater: ${escapeHtml(error.message)}</p>`; return; }
  if (!data?.length) { host.innerHTML = `<p class="muted tiny">Ingen notater lagret.</p>`; return; }
  data.forEach(note => {
    const article = document.createElement("article");
    article.className = "note-item";
    const title = document.createElement("strong");
    title.textContent = note.title || "Notat";
    const content = document.createElement("p");
    content.textContent = note.content || "";
    const meta = document.createElement("span");
    meta.className = "muted tiny";
    meta.textContent = note.created_at ? new Date(note.created_at).toLocaleString("no-NO") : "";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button danger-text";
    remove.textContent = "Slett notat";
    remove.addEventListener("click", async () => {
      if (!confirm("Vil du slette dette notatet?")) return;
      const { error: deleteError } = await supabaseClient.from("vehicle_notes").delete().eq("id", note.id);
      if (deleteError) setMessage($("workspace-message"), `Kunne ikke slette notatet: ${deleteError.message}`, "error");
      else { setMessage($("workspace-message"), "Notatet er slettet.", "success"); await loadNotes(vehicleId); }
    });
    article.append(title, content, meta, remove);
    host.append(article);
  });
}
setMode("login");
init();
