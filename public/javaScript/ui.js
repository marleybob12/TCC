import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function setupMenu() {
  const btn = $("#menuButton");
  const nav = $("#mainNav");
  btn?.addEventListener("click", () => nav?.classList.toggle("open"));
}

export function setupLogout() {
  $$("[data-logout]").forEach((btn) => btn.addEventListener("click", async (event) => {
    event.preventDefault();
    await signOut(auth);
    window.location.href = "/login.html";
  }));
}

export function showMessage(text, type = "info", target = "#message") {
  const el = typeof target === "string" ? $(target) : target;
  if (!el) return;
  el.textContent = text;
  el.className = `message show ${type}`;
}

export function clearMessage(target = "#message") {
  const el = typeof target === "string" ? $(target) : target;
  if (!el) return;
  el.className = "message";
  el.textContent = "";
}

export function money(value = 0) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value) {
  if (!value) return "A definir";
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "A definir";
  return date.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

export function dateInputValue(date = new Date()) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function cover(url) {
  return url && String(url).trim() ? String(url).trim() : "/img/evento.jpg";
}

export async function getCurrentUser({ required = true } = {}) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user && required) {
        window.location.href = `/login.html?redirect=${encodeURIComponent(location.pathname + location.search)}`;
        return;
      }
      if (!user) return resolve(null);

      let profile = { nome: user.displayName || user.email?.split("@")[0] || "Usuário", email: user.email };
      try {
        const snap = await getDoc(doc(db, "Usuario", user.uid));
        if (snap.exists()) profile = { ...profile, ...snap.data() };
      } catch (error) {
        console.warn("Perfil não carregado", error);
      }
      resolve({ user, profile });
    });
  });
}

export async function hydrateHeader() {
  setupMenu();
  setupLogout();
  const session = await getCurrentUser({ required: false });
  const nameEl = $("[data-user-name]");
  if (nameEl && session) nameEl.textContent = session.profile.nome || session.user.email;
  if (nameEl && !session) nameEl.textContent = "Entrar";
}

export function renderAppHeader(active = "") {
  document.body.insertAdjacentHTML("afterbegin", `
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="/home/home.html" aria-label="EventFlow Home">
          <img src="/img/logo_barra.png" alt="EventFlow">
        </a>
        <button id="menuButton" class="btn btn-secondary btn-small mobile-menu" type="button">☰ Menu</button>
        <nav id="mainNav" class="nav">
          <a class="${active === "home" ? "is-active" : ""}" href="/home/home.html">Eventos</a>
          <a class="${active === "criar" ? "is-active" : ""}" href="/home/criarEvento.html">Criar evento</a>
          <a class="${active === "ingressos" ? "is-active" : ""}" href="/home/meusIngressos.html">Meus ingressos</a>
          <a class="${active === "organizador" ? "is-active" : ""}" href="/organizador/painelOrganizador.html">Organizador</a>
          <a href="/home/perfil.html" data-user-name>Perfil</a>
          <button data-logout type="button">Sair</button>
        </nav>
      </div>
    </header>
  `);
}

export function eventCard(id, evento) {
  return `
    <article class="event-card">
      <div class="event-cover" style="background-image:url('${cover(evento.imagemBanner)}')">
        <span class="event-chip">${evento.categoria || "Evento"}</span>
      </div>
      <div class="event-body">
        <h3>${evento.titulo || "Evento sem título"}</h3>
        <div class="meta-row">📍 <span>${evento.cidade || evento.local || "Local a definir"}</span></div>
        <div class="meta-row">🗓️ <span>${formatDate(evento.dataInicio)}</span></div>
        <p class="helper">${evento.descricao ? String(evento.descricao).slice(0, 110) : "Confira os detalhes e garanta seu ingresso."}</p>
        <a href="/home/evento.html?id=${id}" class="btn btn-primary">Ver detalhes</a>
      </div>
    </article>
  `;
}
