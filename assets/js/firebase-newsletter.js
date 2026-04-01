
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const CONFIG = window.ZTR_CONFIG || {};
const FIREBASE = CONFIG.firebase || {};
const COLLECTION = CONFIG.newsletterCollection || "newsletter_subscribers";
const ADMIN_ALLOWED_EMAIL = (CONFIG.admin?.allowedEmail || "").trim().toLowerCase();

const qs = (sel, root=document) => root.querySelector(sel);
const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
const esc = (str='') => String(str).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const brDateTime = (date) => {
  if (!date) return "-";
  const d = typeof date?.toDate === "function" ? date.toDate() : new Date(date);
  return d.toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
};
const sameDay = (a, b=new Date()) => {
  const d = typeof a?.toDate === "function" ? a.toDate() : new Date(a);
  return d.getFullYear()===b.getFullYear() && d.getMonth()===b.getMonth() && d.getDate()===b.getDate();
};

let app = null;
let auth = null;
let db = null;
let unsubscribeList = null;
let adminCache = [];

function localList(){
  try { return JSON.parse(localStorage.getItem("ztr-newsletter-subs")) || []; } catch { return []; }
}
function saveLocal(item){
  const list = localList();
  if (!list.find(i => i.email.toLowerCase() === item.email.toLowerCase())) {
    list.unshift(item);
    localStorage.setItem("ztr-newsletter-subs", JSON.stringify(list));
  }
  return list;
}
function removeLocal(email){
  const list = localList().filter(i => i.email.toLowerCase() !== email.toLowerCase());
  localStorage.setItem("ztr-newsletter-subs", JSON.stringify(list));
  return list;
}
function exportCsv(rows, filename){
  const csv = "email,source,status,data\n" + rows.map(i => `${i.email},${i.source || ""},${i.status || ""},${i.createdAtISO || i.createdAt || ""}`).join("\n");
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function hasFirebaseConfig(){
  return !!(FIREBASE.apiKey && FIREBASE.projectId && FIREBASE.appId);
}
function initFirebase(){
  if (!hasFirebaseConfig()) return null;
  if (app) return { app, auth, db };
  app = initializeApp(FIREBASE);
  auth = getAuth(app);
  db = getFirestore(app);
  return { app, auth, db };
}
function setText(sel, value){ const el = qs(sel); if (el) el.textContent = value; }
function paintLocalPreview(){
  const listRoot = qs("[data-subscribers-list]");
  if (!listRoot) return;
  const list = localList();
  listRoot.innerHTML = list.length ? list.slice(0,12).map(item => `<li>${esc(item.email)} <small>• ${brDateTime(item.date || item.createdAtISO)}</small></li>`).join("") : "<li>Nenhum cadastro salvo neste navegador.</li>";
}
async function submitNewsletter(email){
  const msg = qs("[data-newsletter-message]");
  const mode = qs("[data-newsletter-mode]");
  const payload = { email, source: "site-newsletter", status: "active", createdAtISO: new Date().toISOString(), date: new Date().toISOString() };
  if (!hasFirebaseConfig()) {
    saveLocal(payload);
    if (msg) msg.textContent = "Firebase ainda não configurado. Salvei no navegador para não quebrar o site.";
    if (mode) mode.textContent = "Modo atual: fallback local no navegador.";
    paintLocalPreview();
    return;
  }
  try {
    initFirebase();
    await addDoc(collection(db, COLLECTION), { email, source: payload.source, status: payload.status, createdAt: serverTimestamp() });
    saveLocal(payload);
    if (msg) msg.textContent = "Cadastro enviado para o Firebase com sucesso.";
    if (mode) mode.textContent = `Modo atual: Firebase Firestore (${COLLECTION}).`;
    paintLocalPreview();
  } catch (err) {
    console.error(err);
    saveLocal(payload);
    if (msg) msg.textContent = "Não consegui salvar no Firebase agora. Salvei localmente como fallback.";
    if (mode) mode.textContent = "Modo atual: fallback local após erro de conexão.";
    paintLocalPreview();
  }
}
function initNewsletterPage(){
  const form = qs("[data-newsletter-form]");
  if (!form) return;
  setText("[data-subscribers-source]", hasFirebaseConfig() ? "Fallback local ativo + Firebase pronto" : "Fallback local");
  const mode = qs("[data-newsletter-mode]");
  if (mode) mode.textContent = hasFirebaseConfig() ? `Modo atual: Firebase configurado para a coleção ${COLLECTION}.` : "Modo atual: aguardando configuração do Firebase.";
  paintLocalPreview();
  form.addEventListener("submit", async (e) => { e.preventDefault(); const email = qs('input[type="email"]', form)?.value.trim(); if (!email) return; await submitNewsletter(email); form.reset(); });
  const exportBtn = qs("[data-export-subs]"); if (exportBtn) exportBtn.addEventListener("click", () => exportCsv(localList(), "newsletter-local.csv"));
  const clearBtn = qs("[data-clear-subs]"); if (clearBtn) clearBtn.addEventListener("click", () => { localStorage.removeItem("ztr-newsletter-subs"); paintLocalPreview(); setText("[data-newsletter-message]", "Lista local apagada."); });
}
function mapDocSnap(snap){
  const data = snap.data();
  return { id: snap.id, email: data.email || "", source: data.source || "site-newsletter", status: data.status || "active", createdAt: data.createdAt || null, createdAtISO: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : "" };
}
function renderAdminRows(list){
  const tbody = qs("[data-admin-table]");
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="5"><div class="empty-box">Nenhum inscrito encontrado.</div></td></tr>'; return; }
  tbody.innerHTML = list.map(item => `<tr><td><strong>${esc(item.email)}</strong><br><small>${esc(item.id || "")}</small></td><td>${esc(item.source)}</td><td>${brDateTime(item.createdAt || item.createdAtISO)}</td><td><span class="status-badge">${esc(item.status)}</span></td><td><button class="btn btn-ghost btn-small" data-admin-delete="${esc(item.id || item.email)}">Excluir</button></td></tr>`).join("");
  qsa("[data-admin-delete]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.adminDelete;
      if (!confirm("Excluir este inscrito da newsletter?")) return;
      try {
        if (hasFirebaseConfig() && auth?.currentUser && adminCache.find(i => i.id === id)) {
          await deleteDoc(doc(db, COLLECTION, id));
          setText("[data-admin-message]", "Inscrito excluído do Firebase.");
        } else {
          const item = adminCache.find(i => i.email === id);
          if (item) removeLocal(item.email);
          setText("[data-admin-message]", "Inscrito excluído localmente.");
          adminCache = localList();
          renderAdminRows(adminCache);
          updateAdminKpis(adminCache);
        }
      } catch (err) {
        console.error(err);
        setText("[data-admin-message]", "Não foi possível excluir agora.");
      }
    });
  });
}
function updateAdminKpis(list){
  setText("[data-kpi-total]", String(list.length));
  setText("[data-kpi-active]", String(list.filter(i => (i.status || "").toLowerCase() === "active").length));
  setText("[data-kpi-today]", String(list.filter(i => sameDay(i.createdAt || i.createdAtISO)).length));
  setText("[data-kpi-mode]", hasFirebaseConfig() ? "Firebase" : "Local");
}
function bindAdminSearch(){
  const input = qs("[data-admin-search]");
  if (!input) return;
  input.addEventListener("input", () => {
    const term = input.value.toLowerCase().trim();
    const list = !term ? adminCache : adminCache.filter(i => [i.email, i.source, i.status].join(" ").toLowerCase().includes(term));
    renderAdminRows(list); updateAdminKpis(list);
  });
}
async function loadAdminOnce(){
  if (hasFirebaseConfig() && auth?.currentUser) {
    const snap = await getDocs(query(collection(db, COLLECTION), orderBy("createdAt", "desc")));
    adminCache = snap.docs.map(mapDocSnap);
  } else {
    adminCache = localList().map((i, idx) => ({ id: i.email || String(idx), email: i.email, source: i.source || "local", status: i.status || "active", createdAtISO: i.date || i.createdAtISO }));
  }
  renderAdminRows(adminCache); updateAdminKpis(adminCache);
}
function watchAdminCollection(){
  if (!hasFirebaseConfig() || !auth?.currentUser) return;
  if (unsubscribeList) unsubscribeList();
  unsubscribeList = onSnapshot(query(collection(db, COLLECTION), orderBy("createdAt", "desc")), (snap) => { adminCache = snap.docs.map(mapDocSnap); renderAdminRows(adminCache); updateAdminKpis(adminCache); }, (err) => { console.error(err); setText("[data-admin-message]", "Falha ao ouvir alterações em tempo real."); });
}
function isAllowedAdmin(user){ if (!user) return false; if (!ADMIN_ALLOWED_EMAIL) return true; return (user.email || "").toLowerCase() === ADMIN_ALLOWED_EMAIL; }
function initAdminPage(){
  const form = qs("[data-admin-login-form]");
  if (!form) return;
  if (!hasFirebaseConfig()) {
    setText("[data-admin-status]", "Firebase não configurado");
    setText("[data-admin-message]", "Preencha assets/js/config.js para ativar Auth e Firestore. Enquanto isso, o painel usa a lista local do navegador.");
    loadAdminOnce(); bindAdminSearch();
    const exportBtn = qs("[data-admin-export]"); if (exportBtn) exportBtn.addEventListener("click", ()=> exportCsv(adminCache, "newsletter-admin.csv"));
    const refreshBtn = qs("[data-admin-refresh]"); if (refreshBtn) refreshBtn.addEventListener("click", ()=> loadAdminOnce());
    return;
  }
  initFirebase(); bindAdminSearch();
  form.addEventListener("submit", async (e) => { e.preventDefault(); const email = form.email.value.trim(); const password = form.password.value; try { await signInWithEmailAndPassword(auth, email, password); setText("[data-admin-message]", "Login realizado."); form.reset(); } catch (err) { console.error(err); setText("[data-admin-message]", "Não foi possível entrar. Verifique e-mail, senha e se o método Email/Password está ativo."); } });
  const logoutBtn = qs("[data-admin-logout]"); if (logoutBtn) logoutBtn.addEventListener("click", async () => { try { await signOut(auth); setText("[data-admin-message]", "Sessão encerrada."); } catch (err) { console.error(err); } });
  const exportBtn = qs("[data-admin-export]"); if (exportBtn) exportBtn.addEventListener("click", ()=> exportCsv(adminCache, "newsletter-admin.csv"));
  const refreshBtn = qs("[data-admin-refresh]"); if (refreshBtn) refreshBtn.addEventListener("click", async ()=> { await loadAdminOnce(); watchAdminCollection(); });
  onAuthStateChanged(auth, async (user) => {
    if (!user) { setText("[data-admin-status]", "Desconectado"); setText("[data-admin-message]", "Entre para carregar os inscritos do Firestore."); if (unsubscribeList) unsubscribeList(); adminCache = []; renderAdminRows([]); updateAdminKpis([]); return; }
    if (!isAllowedAdmin(user)) { setText("[data-admin-status]", "Sem permissão"); setText("[data-admin-message]", `O usuário ${user.email || ""} entrou, mas não é o admin permitido em config.js.`); await signOut(auth); return; }
    setText("[data-admin-status]", `Conectado como ${user.email}`); setText("[data-admin-message]", "Painel conectado ao Firebase."); await loadAdminOnce(); watchAdminCollection();
  });
}
document.addEventListener("DOMContentLoaded", () => { initNewsletterPage(); initAdminPage(); });
