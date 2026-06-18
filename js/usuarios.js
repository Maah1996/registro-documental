/* =====================================================
GESTION DE USUARIOS (solo admin)
===================================================== */

function abrirModalUsuarios(){
if((rolActual||"").toLowerCase()!=="admin") return
document.getElementById("nu-usuario").value=""
document.getElementById("nu-error").textContent=""
const m=document.getElementById("modal-usuarios")
if(m){ m.style.display="flex"; m.classList.add("open") }
cargarListaUsuarios()
}
function cerrarModalUsuarios(){
const m=document.getElementById("modal-usuarios")
if(m){m.classList.remove("open");m.style.display="none"}
}
async function cargarListaUsuarios(){
const lista=document.getElementById("lista-usuarios")
lista.innerHTML="<div style='color:#718096;font-size:12px;'>Cargando...</div>"
try{
const bloqueados=new Set(JSON.parse(localStorage.getItem("rgdoc_bloqueados")||"[]"))
const users=await leerSheetGviz("usuarios",["usuario","clave","rol"])
lista.innerHTML=users.map(us=>{
const esAdmin=(us.rol||"").toLowerCase()==="admin"
const esBloqueado=bloqueados.has(us.usuario)
const esSelf=us.usuario===usuarioActual
return `<div class="usuario-item ${esAdmin?"admin-u":""} ${esBloqueado?"bloqueado-u":""}">
<div style="flex:1"><div class="usuario-nombre">${esc(us.usuario)}</div><div class="usuario-rol">${esAdmin?"Administrador":"Usuario"}</div></div>
${!esSelf?`
<button class="btn-toggle-bloqueo ${esBloqueado?"bloqueado":""}" data-uname="${esc(us.usuario)}">${esBloqueado?"🔴 Bloqueado":"🟢 Activo"}</button>
<button class="btn-gantt-sync" data-uname="${esc(us.usuario)}" data-rol="${esc(us.rol||'usuario')}" title="Crear usuario en Gantt OCGR" style="font-size:11px;padding:3px 8px;border-radius:4px;border:1px solid #b3d9f7;background:#e8f4fd;color:#1a3f6f;cursor:pointer;font-weight:700;">📅</button>
<button class="btn-del-user" data-uname="${esc(us.usuario)}">✕</button>
`:'<span style="font-size:11px;color:#718096;">(tú)</span>'}
</div>`
}).join("")||"<div style='color:#718096;font-size:12px;'>Sin usuarios.</div>"
lista.querySelectorAll(".btn-del-user[data-uname]").forEach(btn=>{
btn.addEventListener("click",()=>eliminarUsuario(btn.dataset.uname))
})
lista.querySelectorAll(".btn-toggle-bloqueo[data-uname]").forEach(btn=>{
btn.addEventListener("click",()=>toggleBloqueoUsuario(btn.dataset.uname))
})
lista.querySelectorAll(".btn-gantt-sync[data-uname]").forEach(btn=>{
btn.addEventListener("click",()=>sincronizarUsuarioEnGantt(btn.dataset.uname, btn.dataset.rol))
})
}catch(e){lista.innerHTML="<div style='color:#c62828;font-size:12px;'>Error al cargar usuarios.</div>"}
}

function toggleBloqueoUsuario(nombre){
const bloqueados=new Set(JSON.parse(localStorage.getItem("rgdoc_bloqueados")||"[]"))
if(bloqueados.has(nombre)) bloqueados.delete(nombre)
else bloqueados.add(nombre)
localStorage.setItem("rgdoc_bloqueados",JSON.stringify([...bloqueados]))
cargarListaUsuarios()
}
async function crearUsuario(){
const u=document.getElementById("nu-usuario").value.trim().toUpperCase()
const r=document.getElementById("nu-rol").value
const errEl=document.getElementById("nu-error")
errEl.textContent=""
if(!u){errEl.textContent="Ingrese nombre de usuario.";return}
const claveInicial="1234"
try{
await _fbCrearUsuario(u, claveInicial, r)
// también GAS como respaldo para Sheets
fetch(API_URL,{method:"POST",mode:"no-cors",body:JSON.stringify({action:"crearUsuario",adminUsuario:usuarioActual,adminClave:sessionStorage.getItem("rdClave"),nuevoUsuario:u,clave:claveInicial,rol:r}),headers:{"Content-Type":"application/json"}}).catch(()=>{})
errEl.style.color="#0F6E56"
errEl.textContent="✅ Usuario creado con clave 1234. Recargando..."
document.getElementById("nu-usuario").value=""
localStorage.setItem("rgdoc_new_user", JSON.stringify({nombre: u, pass: claveInicial, rol: r, ts: Date.now()}))
setTimeout(()=>{ errEl.textContent=""; errEl.style.color=""; cargarListaUsuarios() },2000)
}catch(e){ errEl.textContent="❌ Error al crear usuario: "+e.message }
}
async function eliminarUsuario(nombreUsuario){
if(!confirm("¿Eliminar usuario "+nombreUsuario+"?")) return
try{
await fetch(API_URL,{method:"POST",mode:"no-cors",body:JSON.stringify({action:"eliminarUsuario",adminUsuario:usuarioActual,adminClave:sessionStorage.getItem("rdClave"),usuarioEliminar:nombreUsuario}),headers:{"Content-Type":"application/json"}})
setTimeout(()=>cargarListaUsuarios(),1000)
}catch(e){ alert("Error al eliminar usuario.") }
}
