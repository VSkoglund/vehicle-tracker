// Sett inn prosjektets Project URL og publishable key fra Supabase.
const SUPABASE_URL = "https://nvokgifszhhbjxkhnhga.supabase.co/auth/v1/signup";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_L-ipz6FQF-o90K7abcGuCA_RuW8l0UH";

const authView = document.getElementById("auth-view");
const dashboardView = document.getElementById("dashboard-view");
const authForm = document.getElementById("auth-form");
const authMessage = document.getElementById("auth-message");
const authTitle = document.getElementById("auth-title");
const authDescription = document.getElementById("auth-description");
const submitButton = document.getElementById("submit-button");
const passwordInput = document.getElementById("password");
const emailInput = document.getElementById("email");
const resetButton = document.getElementById("reset-button");

let supabaseClient;
let currentMode = "login";

function showMessage(message, type = "") {
  authMessage.textContent = message;
  authMessage.className = `message ${type}`;
}

function setMode(mode) {
  currentMode = mode;

  const isLogin = mode === "login";

  document.getElementById("login-tab").classList.toggle("active", isLogin);
  document.getElementById("signup-tab").classList.toggle("active", !isLogin);

  authTitle.textContent = isLogin ? "Velkommen tilbake" : "Opprett en konto";
  authDescription.textContent = isLogin
    ? "Logg inn for å åpne dashboardet ditt."
    : "Opprett en konto for å komme i gang.";

  submitButton.innerHTML = isLogin
    ? 'Logg inn <span>→</span>'
    : 'Opprett konto <span>→</span>';

  passwordInput.autocomplete = isLogin ? "current-password" : "new-password";

  resetButton.hidden = !isLogin;
  showMessage("");
}

function showDashboard(user) {
  authView.hidden = true;
  dashboardView.hidden = false;
  document.getElementById("user-email").textContent = user.email || "";
}

function showAuth() {
  dashboardView.hidden = true;
  authView.hidden = false;
}

function isConfigured() {
  return (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("DIN_SUPABASE") &&
    SUPABASE_PUBLISHABLE_KEY.length > 20 &&
    !SUPABASE_PUBLISHABLE_KEY.includes("DIN_SUPABASE")
  );
}

async function init() {
  if (!isConfigured()) {
    showMessage(
      "Supabase er ikke konfigurert ennå. Legg inn Project URL og publishable key i app.js.",
      "error"
    );
    submitButton.disabled = true;
    return;
  }

  if (!window.supabase?.createClient) {
    showMessage("Supabase-biblioteket kunne ikke lastes. Kontroller internettilkoblingen.", "error");
    submitButton.disabled = true;
    return;
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      showDashboard(session.user);
    } else {
      showAuth();
    }
  });

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    showMessage("Kunne ikke hente innloggingsstatus. Prøv å laste siden på nytt.", "error");
    return;
  }

  if (data.session?.user) {
    showDashboard(data.session.user);
  } else {
    showAuth();
  }
}

document.getElementById("login-tab").addEventListener("click", () => {
  setMode("login");
});

document.getElementById("signup-tab").addEventListener("click", () => {
  setMode("signup");
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    showMessage("Supabase er ikke konfigurert ennå.", "error");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  submitButton.disabled = true;
  showMessage("");

  try {
    if (currentMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (data.session && data.user) {
        showDashboard(data.user);
      } else {
        showMessage(
          "Kontoforespørselen er sendt. Sjekk e-posten din for å bekrefte kontoen før du logger inn.",
          "success"
        );
      }
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      showDashboard(data.user);
    }
  } catch (error) {
    showMessage(error.message || "Noe gikk galt. Prøv igjen.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

resetButton.addEventListener("click", async () => {
  if (!supabaseClient) {
    showMessage("Supabase er ikke konfigurert ennå.", "error");
    return;
  }

  const email = emailInput.value.trim();

  if (!email) {
    showMessage("Skriv inn e-postadressen din først.", "error");
    emailInput.focus();
    return;
  }

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

    if (error) throw error;

    showMessage(
      "Hvis adressen kan brukes til passordtilbakestilling, vil du motta en e-post med videre instruksjoner.",
      "success"
    );
  } catch {
    showMessage("Kunne ikke sende forespørselen. Kontroller e-postadressen og prøv igjen.", "error");
  }
});

document.getElementById("logout-button").addEventListener("click", async () => {
  if (!supabaseClient) return;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    document.getElementById("user-email").textContent =
      "Utlogging mislyktes. Prøv igjen.";
  }
});

setMode("login");
init();
