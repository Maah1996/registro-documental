/* =====================================================
VALIDACION DE ACCESO
===================================================== */

function mostrarLogin(){
document.getElementById("login-overlay").style.display = "flex"
}

function ocultarLogin(){
document.getElementById("login-overlay").style.display = "none"
}

function mostrarSegunRol(){
const badge = document.getElementById("badge-usuario")
const badgeRol = document.getElementById("badge-rol")
const btnAdmin = document.getElementById("btn-usuarios-admin")
if(badge) badge.textContent = "👤 " + usuarioActual
const esAdmin = (rolActual||"").toLowerCase()==="admin"
if(badgeRol) badgeRol.textContent = esAdmin ? "ADMINISTRADOR" : "USUARIO"
if(btnAdmin) btnAdmin.style.display = esAdmin ? "" : "none"
}

async function hacerLogin(){
const u = (document.getElementById("login-usuario").value || "").trim().toUpperCase()
const c = (document.getElementById("login-clave").value || "").trim()
const errEl = document.getElementById("login-error")
errEl.textContent = ""
if(!u || !c){ errEl.textContent = "Complete usuario y clave."; return }
const _bloqueados=new Set(JSON.parse(localStorage.getItem("rgdoc_bloqueados")||"[]"))
if(_bloqueados.has(u)){ errEl.textContent="❌ Usuario bloqueado. Contacte al administrador."; return }
errEl.textContent = "Verificando..."
// Intentar Firebase primero
try{
const fbEntry = await _fbBuscarUsuario(u, c)
if(fbEntry){
const fbRol = fbEntry[1].rol === 'admin' ? 'admin' : 'usuario'
sessionStorage.setItem("rdUsuario",u); sessionStorage.setItem("rdClave",c); sessionStorage.setItem("rdRol",fbRol)
usuarioActual=u; rolActual=fbRol
localStorage.setItem("rgdoc_session",JSON.stringify({nombre:u,clave:c,rol:fbRol,expira:Date.now()+30*60*1000}))
ocultarLogin(); mostrarSegunRol(); iniciarControlInactividad()
await cargarDatos()
document.getElementById("login-usuario").value=""; document.getElementById("login-clave").value=""
return
}
}catch(eFb){ console.warn('[RegDoc] Firebase login error:', eFb) }
// Fallback GAS/gviz
try{
const data = await fetchGAS(API_URL + "?u=" + encodeURIComponent(u) + "&c=" + encodeURIComponent(c))
if(data.status === "ok"){
sessionStorage.setItem("rdUsuario", u)
sessionStorage.setItem("rdClave", c)
sessionStorage.setItem("rdRol", data.rol || "usuario")
usuarioActual = u
rolActual = data.rol || "usuario"
registros = (data.registros || []).map(r=>({...r, fecha: normalizarFechaISO(r.fecha), plazo: normalizarFechaISO(r.plazo)}))
localStorage.setItem("registros", JSON.stringify(registros))
localStorage.setItem("rgdoc_session", JSON.stringify({nombre: u, clave: c, rol: rolActual, expira: Date.now() + 30*60*1000}))
ocultarLogin()
mostrarSegunRol()
iniciarControlInactividad()
render()
document.getElementById("login-usuario").value = ""
document.getElementById("login-clave").value = ""
if(c==="1234") setTimeout(()=>alert("⚠️ Estás usando la clave inicial 1234. Pide al administrador que la actualice en el sistema."),300)
}else{
// GAS rechazó — intentar fallback gviz antes de mostrar error
try{
const users2 = await leerSheetGviz("usuarios",["usuario","clave","rol"])
const _normClave=v=>String(v||'').replace(/[\s ]/g,'')
const su2 = users2.find(x => String(x.usuario||'').trim().toUpperCase()===u && _normClave(x.clave)===_normClave(c))

if(su2){
const rol2 = String(su2.rol||'usuario').toLowerCase()
sessionStorage.setItem("rdUsuario",u); sessionStorage.setItem("rdClave",c); sessionStorage.setItem("rdRol",rol2)
usuarioActual=u; rolActual=rol2
localStorage.setItem("rgdoc_session",JSON.stringify({nombre:u,clave:c,rol:rol2,expira:Date.now()+30*60*1000}))
ocultarLogin(); mostrarSegunRol(); iniciarControlInactividad()
await cargarDatos()
document.getElementById("login-usuario").value=""; document.getElementById("login-clave").value=""
if(c==="1234") setTimeout(()=>alert("⚠️ Estás usando la clave inicial 1234. Pide al administrador que la actualice en el sistema."),300)
}else{ errEl.textContent="❌ "+(data.mensaje||"Usuario o clave incorrectos.") }
}catch(e3){ errEl.textContent="❌ "+(data.mensaje||"Usuario o clave incorrectos.") }
}
}catch(e){
// Fallback: validar contra hoja "usuarios" del Sheet (gviz)
errEl.textContent = "Verificando..."
try{
const users = await leerSheetGviz("usuarios",["usuario","clave","rol"])
const _nc=v=>String(v||'').replace(/[\s ]/g,'')
const sheetUser = users.find(x => String(x.usuario||'').trim().toUpperCase()===u && _nc(x.clave)===_nc(c))

if(sheetUser){
const rol = String(sheetUser.rol||'usuario').toLowerCase()
sessionStorage.setItem("rdUsuario", u)
sessionStorage.setItem("rdClave", c)
sessionStorage.setItem("rdRol", rol)
usuarioActual = u
rolActual = rol
localStorage.setItem("rgdoc_session", JSON.stringify({nombre: u, clave: c, rol: rolActual, expira: Date.now() + 30*60*1000}))
ocultarLogin()
mostrarSegunRol()
iniciarControlInactividad()
await cargarDatos()
document.getElementById("login-usuario").value=""
document.getElementById("login-clave").value=""
if(c==="1234") setTimeout(()=>alert("⚠️ Estás usando la clave inicial 1234. Pide al administrador que la actualice en el sistema."),300)
}else{
errEl.textContent="❌ Usuario o clave incorrectos."
}
}catch(e2){ errEl.textContent="❌ Sin conexión. Verifica usuario y clave." }
}
}

/* =====================================================
CONTROL DE INACTIVIDAD Y BLOQUEO MANUAL
===================================================== */

var tiempoInactivo
let segundosInactividad = Math.floor(TIEMPO_BLOQUEO / 1000)
const eventosActividad = ["click","mousemove","keydown","input","scroll","touchstart"]

function formatearTemporizador(segundos){
let minutos = Math.floor(segundos / 60)
let resto = segundos % 60
return `${String(minutos).padStart(2,"0")}:${String(resto).padStart(2,"0")}`
}

function actualizarTemporizadorSesion(){
if(temporizadorSesion){
temporizadorSesion.innerText = formatearTemporizador(segundosInactividad)
}
}

function cerrarSesion(){
sessionStorage.removeItem("rdUsuario")
sessionStorage.removeItem("rdClave")
sessionStorage.removeItem("rdRol")
localStorage.removeItem("rgdoc_session")
// Cierra también cualquier sesión REAL de Firebase Auth que haya quedado
// activa (ej. porque alguien inició sesión dentro de la pestaña Carta Gantt
// OCGR, que comparte origen y proyecto Firebase). Sin esto, el siguiente
// usuario que entre a RGDOC y abra la Gantt hereda esa sesión ajena en vez
// de la suya propia.
try{
if(firebase && firebase.auth && firebase.auth().currentUser && !firebase.auth().currentUser.isAnonymous){
firebase.auth().signOut().catch(()=>{}).finally(()=>location.reload())
return
}
}catch(e){}
location.reload()
}

function bloquearSesion(manual){
clearInterval(tiempoInactivo)
const lockEl=document.getElementById("lock-overlay")
const lockUser=document.getElementById("lock-usuario-text")
const lockClave=document.getElementById("lock-clave")
const lockErr=document.getElementById("lock-error")
if(lockUser) lockUser.textContent="👤 "+(usuarioActual||"—")
if(lockClave) lockClave.value=""
if(lockErr) lockErr.textContent=""
if(lockEl) lockEl.style.display="flex"
setTimeout(()=>{ if(lockClave) lockClave.focus() },150)
}

async function desbloquear(){
const clave=document.getElementById("lock-clave").value.trim()
const errEl=document.getElementById("lock-error")
errEl.textContent=""
if(!clave){errEl.textContent="Ingresa tu contraseña.";return}
// Validar contra sessionStorage
const claveGuardada=sessionStorage.getItem("rdClave")||""
if(clave===claveGuardada){
  document.getElementById("lock-overlay").style.display="none"
  iniciarControlInactividad()
  return
}
// Fallback: validar contra Sheet
errEl.textContent="Verificando..."
try{
  const users=await leerSheetGviz("usuarios",["usuario","clave","rol"])
  const found=users.find(x=>String(x.usuario||'').trim().toUpperCase()===usuarioActual&&String(x.clave||'').trim()===clave)
  if(found){
    sessionStorage.setItem("rdClave",clave)
    document.getElementById("lock-overlay").style.display="none"
    iniciarControlInactividad()
  }else{
    errEl.textContent="❌ Clave incorrecta."
  }
}catch(e){errEl.textContent="❌ Sin conexión. Verifica tu clave."}
}

function iniciarControlInactividad(){
resetTimer()

eventosActividad.forEach(evento=>{
document.addEventListener(evento,resetTimer,{ passive:true })
})

if(btnBloquearManual){
btnBloquearManual.addEventListener("click",()=>bloquearSesion(true))
}
}

function resetTimer(){
clearInterval(tiempoInactivo)
segundosInactividad = Math.floor(TIEMPO_BLOQUEO / 1000)
actualizarTemporizadorSesion()

tiempoInactivo = setInterval(()=>{
segundosInactividad--
actualizarTemporizadorSesion()
if(segundosInactividad <= 0){
bloquearSesion(false)
}
},1000)
}

/* =====================================================
MODULO 20
CAMBIAR CLAVE DESDE LA PAGINA
===================================================== */

var _cambioClaveObligatorio=false
function abrirModalClave(obligatorio){
obligatorio=!!obligatorio
_cambioClaveObligatorio=obligatorio
document.getElementById("mc-actual").value=obligatorio?(sessionStorage.getItem("rdClave")||""):""
document.getElementById("mc-nueva").value=""
document.getElementById("mc-confirmar").value=""
document.getElementById("mc-error").textContent=""
const aviso=document.getElementById("mc-aviso")
const actualWrap=document.getElementById("mc-actual-wrap")
const btnCanc=document.getElementById("btn-cancelar-clave")
const titulo=document.getElementById("mc-titulo")
if(aviso) aviso.style.display=obligatorio?"block":"none"
if(actualWrap) actualWrap.style.display=obligatorio?"none":"block"
if(btnCanc) btnCanc.style.display=obligatorio?"none":""
if(titulo) titulo.textContent=obligatorio?"🔐 Elige tu contraseña":"🔐 Cambiar contraseña"
document.getElementById("modal-clave").classList.add("open")
}
function cerrarModalClave(){
if(_cambioClaveObligatorio) return
document.getElementById("modal-clave").classList.remove("open")
}
async function guardarClave(){
const actual=_cambioClaveObligatorio?(sessionStorage.getItem("rdClave")||""):document.getElementById("mc-actual").value.trim()
const nueva=document.getElementById("mc-nueva").value.trim()
const confirmar=document.getElementById("mc-confirmar").value.trim()
const errEl=document.getElementById("mc-error")
errEl.textContent=""
if(!nueva||!confirmar){errEl.textContent="Complete los campos de nueva clave.";return}
if(!_cambioClaveObligatorio&&!actual){errEl.textContent="Ingresa tu clave actual.";return}
if(!_cambioClaveObligatorio&&actual!==(sessionStorage.getItem("rdClave")||"")){errEl.textContent="❌ La clave actual es incorrecta.";return}
if(nueva==="1234"){errEl.textContent="❌ No puedes usar 1234 como nueva clave.";return}
if(nueva===actual){errEl.textContent="❌ La nueva clave debe ser diferente a la actual.";return}
if(nueva!==confirmar){errEl.textContent="❌ Las claves nuevas no coinciden.";return}
if(nueva.length<3){errEl.textContent="❌ La clave debe tener al menos 3 caracteres.";return}
errEl.textContent="Guardando..."
try{
const eraObligatorio=_cambioClaveObligatorio
const fbOk = await _fbCambiarClave(usuarioActual, nueva)
if(!fbOk) throw new Error("Usuario no encontrado en Firebase")
// también GAS como respaldo
fetch(API_URL,{method:"POST",mode:"no-cors",body:JSON.stringify({action:"cambiarClave",usuario:usuarioActual,claveActual:actual,claveNueva:nueva}),headers:{"Content-Type":"application/json"}}).catch(()=>{})
sessionStorage.setItem("rdClave",nueva)
localStorage.setItem("rgdoc_session",JSON.stringify({nombre:usuarioActual,clave:nueva,rol:rolActual,expira:Date.now()+30*60*1000}))
_cambioClaveObligatorio=false
document.getElementById("modal-clave").classList.remove("open")
if(!eraObligatorio) alert("✅ Clave cambiada correctamente.")
}catch(e){
errEl.textContent="❌ Error al guardar: "+e.message
}
}

// ── RECUPERAR CLAVE ──────────────────────────────────────────
function abrirRecuperar(){
  document.getElementById('rec-usuario').value=''
  const res=document.getElementById('rec-result')
  res.className='modal-rec-result'; res.style.display='none'; res.innerHTML=''
  document.getElementById('modal-recuperar').classList.add('open')
  setTimeout(()=>document.getElementById('rec-usuario').focus(),150)
}

function cerrarRecuperar(){
  document.getElementById('modal-recuperar').classList.remove('open')
}

async function solicitarRecuperacion(){
  const u=(document.getElementById('rec-usuario').value||'').trim().toUpperCase()
  const res=document.getElementById('rec-result')
  const btn=document.getElementById('btn-rec-confirm')
  res.style.display='none'
  if(!u){
    res.className='modal-rec-result err'; res.style.display='block'
    res.textContent='⚠️ Ingresa tu nombre de usuario.'; return
  }
  btn.textContent='Enviando...'; btn.disabled=true
  try {
    const fbOk = await _fbCambiarClave(u, "1234")
    fetch(API_URL,{
      method:"POST",mode:"no-cors",
      body:JSON.stringify({action:"resetClave",usuario:u,claveNueva:"1234"}),
      headers:{"Content-Type":"application/json"}
    }).catch(()=>{})
    btn.textContent='Recuperar clave'; btn.disabled=false
    if(fbOk){
      res.className='modal-rec-result ok'; res.style.display='block'
      res.innerHTML=`✅ Solicitud enviada para <strong>${u}</strong>.<br>
Intenta ingresar con la clave <strong>1234</strong>.<br>
Si el sistema te pide cambiar la clave, fue restablecida correctamente.<br>
<span style="font-size:11px;color:#555">Si el problema persiste, contacta al administrador.</span>`
    }else{
      res.className='modal-rec-result err'; res.style.display='block'
      res.textContent='❌ Usuario no encontrado.'
    }
  } catch(e){
    btn.textContent='Recuperar clave'; btn.disabled=false
    res.className='modal-rec-result err'; res.style.display='block'
    res.textContent='❌ Error al procesar la solicitud.'
  }
}

/* =====================================================
FUNCION ADMIN — CAMBIAR CLAVE (versión legacy, línea 1919)
===================================================== */

function cambiarClave_legacy(){

let actual = prompt("🔐 Ingresa clave actual")

if(actual !== CLAVE_ACCESO){
alert("❌ Clave incorrecta")
return
}

let nueva = prompt("🆕 Ingresa nueva clave")

if(!nueva || nueva.length < 3){
alert("⚠️ Clave muy corta")
return
}

let confirmar = prompt("🔁 Confirma nueva clave")

if(nueva !== confirmar){
alert("❌ No coinciden")
return
}

localStorage.setItem("CLAVE_ADMIN", nueva)

alert("✅ Clave cambiada correctamente")

}

// cambiarClave (línea 2324) — versión activa del botón
function cambiarClave(){ abrirModalClave() }
