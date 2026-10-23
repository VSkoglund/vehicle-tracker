# Vehicle Tracker – samlet første oppdatering

Pakken inneholder `index.html`, `app.js` og `style.css`.

## Funksjoner i denne versjonen
- Beholder Supabase-innlogging (logg inn, registrering, glemt passord, logg ut).
- Søker registreringsnummer via Supabase Edge Function `vehicle-lookup`.
- Viser oppslagsdata i kategorier med dropdowns lukket som standard.
- Viser hele API-svaret under dropdownen «Rådata (JSON)».
- Lar innlogget bruker lagre kjøretøy i `vehicles`.
- Dashboard-statistikk for lagrede kjøretøy og observasjoner.
- Viser lagrede kjøretøy og siste observasjoner.
- Lar brukeren registrere observasjoner separat fra API-oppslag.
- Lar brukeren legge til og slette valgfrie notater.

## Installer
1. Lag en sikker kopi av de nåværende tre filene.
2. Erstatt filene i GitHub-repoet med filene fra denne pakken.
3. Commit/push endringene og åpne GitHub Pages-nettsiden.
4. Logg inn, søk et gyldig registreringsnummer og test resultatet.
5. Trykk «Lagre kjøretøy» og sjekk at det dukker opp i registeret.

## Forutsetninger
- Supabase URL og publishable key i `app.js` peker til brukerens prosjekt.
- Edge Function heter nøyaktig `vehicle-lookup` og tar imot POST JSON `{ "kjennemerke": "AB12345" }`.
- Tabellene `vehicles`, `vehicle_notes` og `observations` finnes, med RLS-policyer for innlogget brukers egne data.
- `vehicles` har kolonnene `registration_number`, `make`, `model`, `model_year`, `color`, `user_id` og `created_at`; `user_id` må settes automatisk av database/default/trigger eller via policy. Hvis ikke, må schema/policy tilpasses.
- `vehicle_notes` har `vehicle_id`, `title`, `content`, `created_at`, `user_id` og `updated_at` som i tabellen som allerede ble opprettet.
- `observations` har `vehicle_id`, `observed_at`, `location`, `note`, `created_at`, `user_id`.

## Viktig
- SVV API-nøkkelen skal bare ligge som Supabase Edge Function secret `SVV_API_KEY`. Den skal ikke legges i `app.js`.
- Ingen eieropplysninger hentes eller vises.
- Bilder er ikke aktivert i denne pakken ennå, siden Storage-bucket og tilgangspolicyer må settes opp først.
