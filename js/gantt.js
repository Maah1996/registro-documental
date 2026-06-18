/* =====================================================
GANTT OCGR — IDs en Gantt (persiste en localStorage)
===================================================== */

function _ganttIds(){
  try{ return new Set(JSON.parse(localStorage.getItem(LS_GANTT_IDS))||[]) }
  catch(e){ return new Set() }
}
function _ganttGuardar(set){
  localStorage.setItem(LS_GANTT_IDS, JSON.stringify([...set]))
}
// Clave de identificación: usa identMateria (único por documento), fallback a rowId
function _ganttKey(r){
  if(!r) return null
  if(r.identMateria && String(r.identMateria).trim()) return "im:" + String(r.identMateria).trim().toUpperCase()
  if(r.rowId) return "r:" + String(r.rowId)
  return null
}
function estaEnGantt(r){
  const k = _ganttKey(r)
  if(!k) return false
  return _ganttIds().has(k)
}
function _construirActoGantt(r){
  const ts = Date.now()
  return {
    id: ts,
    nonce: ts,
    act: (r.materia||"").substring(0,120),
    obs: "PLAZO | " + (r.procedencia||"—"),
    fecha: normalizarFechaISO(r.plazo),
    fechaInicio: null,
    type: "plazo",
    freq: "puntual",
    priori: true,
    fromRGDOC: true,
    rgdocNumero: r.identMateria || r.numero || "",
    targetUserName: usuarioActual
  }
}
function _marcarEnGantt(r){
  const k = _ganttKey(r)
  if(!k) return
  const ids = _ganttIds()
  ids.add(k)
  _ganttGuardar(ids)
}
function _desmarcarDeGantt(r){
  const k = _ganttKey(r)
  if(!k) return
  const ids = _ganttIds()
  ids.delete(k)
  _ganttGuardar(ids)
  // Señal para que la Gantt elimine la actividad
  try{ localStorage.setItem("rgdoc_remove_gantt", JSON.stringify({rgdocNumero: r.identMateria||r.numero||"", act: (r.materia||"").toUpperCase().trim()})) }catch(e){}
}

// Llamado desde el botón del formulario
function enviarFormAGantt(){
  const r = {
    numero:       mayus(document.getElementById("numero").value),
    fecha:        normalizarFechaISO(document.getElementById("fecha").value),
    materia:      mayus(document.getElementById("materia").value),
    plazo:        normalizarFechaISO(document.getElementById("plazo").value),
    procedencia:  mayus(document.getElementById("procedencia").value),
    autoridad:    mayus(document.getElementById("autoridad").value),
    clasificacion:mayus(document.getElementById("clasificacion").value)
  }
  if(!r.plazo){ alert("Debes ingresar una fecha de Plazo antes de enviar a la Gantt."); return }
  if(!r.numero && !r.materia){ alert("Completa al menos Número o Materia antes de enviar."); return }
  if(estaEnGantt(r)){ alert("Este documento ya está en la Carta Gantt OCGR."); return }
  const _payload = _construirActoGantt(r)
  localStorage.setItem("rgdoc_to_gantt", JSON.stringify(_payload))
  _marcarEnGantt(r)
  render()
  const _iframe = document.getElementById("gantt-iframe")
  if(_iframe && _iframe.contentWindow && _ganttIframeCargado){
    _iframe.contentWindow.postMessage({type:"rgdoc_import", payload: _payload}, "*")
  }
}

function sincronizarUsuarioEnGantt(nombre, rol){
const payload = {nombre: nombre, pass: "1234", rol: rol, ts: Date.now()}
localStorage.setItem("rgdoc_new_user", JSON.stringify(payload))
const iframe = document.getElementById("gantt-iframe")
if(iframe && iframe.contentWindow){
  iframe.contentWindow.postMessage({type: "rgdoc_new_user", payload: payload}, "*")
  alert("✅ Usuario " + nombre + " enviado a Gantt OCGR.")
} else {
  alert("⚠️ Abre el tab Gantt OCGR primero y vuelve a intentarlo.")
}
}

// ── Vista Gantt OCGR embebida ──────────────────────────────
const GANTT_OCGR_IFRAME_URL = "https://maah1996.github.io/Carta-Gantt-Maah/"
let _ganttIframeCargado = false
let _ganttIframeUser = null

function mostrarVistaGantt(){
  document.getElementById("tab-regdoc").classList.remove("active")
  document.getElementById("tab-gantt").classList.add("active")
  const wrap = document.getElementById("gantt-iframe-wrap")
  wrap.style.display = "block"
  // Recargar iframe si cambió el usuario (ej: admin → LUIS)
  if(!_ganttIframeCargado || _ganttIframeUser !== usuarioActual){
    document.getElementById("gantt-iframe").src = GANTT_OCGR_IFRAME_URL
    _ganttIframeCargado = true
    _ganttIframeUser = usuarioActual
  }
}

function mostrarVistaRegDoc(){
  document.getElementById("tab-gantt").classList.remove("active")
  document.getElementById("tab-regdoc").classList.add("active")
  document.getElementById("gantt-iframe-wrap").style.display = "none"
}
