/* =====================================================
MODULO 9
GUARDAR DATOS
===================================================== */

// Aplica los filtros de busqueda (numero, fecha, procedencia, archivo) sobre
// los registros y devuelve la lista con su indice original. init.js la
// reasigna para sumar tambien el filtro por tarjetas de resumen.
function obtenerRegistrosFiltrados(){
let numeroBuscado=normalizarComparacion(buscarNumero.value)
let fechaBuscada=buscarFecha.value
let procedBuscada=normalizarComparacion(buscarProcedencia.value)
let archivoBuscado=normalizarComparacion(buscarArchivo.value)

return registros
.map((r,indexOriginal)=>({ ...r, indexOriginal }))
.filter(r=>{
let fechaRegistro=normalizarFechaISO(r.fecha)
let okNumero=!numeroBuscado || normalizarComparacion(r.numero).includes(numeroBuscado)
let okFecha=!fechaBuscada || fechaRegistro===fechaBuscada
let okProced=!procedBuscada || normalizarComparacion(r.procedencia).includes(procedBuscada)
let okArchivo=!archivoBuscado || normalizarComparacion(r.archivo).includes(archivoBuscado)
return okNumero && okFecha && okProced && okArchivo
})
}

function buscarDuplicado(r, excluirIndex){
if(!r.fecha || !r.numero || !r.identMateria) return -1
// excluirIndex es el índice en el array registros[] (no el rowId del Sheet)
for(let i=0;i<registros.length;i++){
if(excluirIndex!==null && excluirIndex!==undefined && i===excluirIndex) continue
let reg=registros[i]
if(normalizarFechaISO(reg.fecha)===r.fecha && mayus(reg.numero)===r.numero && mayus(reg.identMateria)===r.identMateria){
return i
}
}
return -1
}

let _pendienteGuardar=null

function mostrarModalDuplicado(r){
_pendienteGuardar=r
document.getElementById("dup-fecha").textContent=fechaCL(r.fecha)
document.getElementById("dup-numero").textContent=r.numero
document.getElementById("dup-identmateria").textContent=r.identMateria
document.getElementById("modal-duplicado").classList.add("open")
}

function cerrarModalDuplicado(){
document.getElementById("modal-duplicado").classList.remove("open")
_pendienteGuardar=null
}

function confirmarGuardarDuplicado(){
document.getElementById("modal-duplicado").classList.remove("open")
if(_pendienteGuardar){
procesarGuardado(_pendienteGuardar)
_pendienteGuardar=null
}
}

function guardar(){
let r={
fecha:normalizarFechaISO(fecha.value),
numero:mayus(numero.value),
identMateria:mayus(identMateria.value),
identDoc:mayus(identDoc.value),
autoridad:mayus(autoridad.value),
ejs:mayus(ejs.value),
hjs:mayus(hjs.value),
materia:mayus(materia.value),
plazo:normalizarFechaISO(plazo.value),
procedencia:mayus(procedencia.value),
clasificacion:mayus(clasificacion.value),
archivo:mayus(archivo.value),
llegsal:mayus(llegsal.value),
observ:mayus(observ.value),
// Al editar un documento existente se conserva el dueño original (útil
// para usuarios con permiso "ver todo" que editan documentos ajenos, ej.
// del administrador) — solo un documento NUEVO queda a nombre de quien
// lo crea.
usuario: (editIndex!==null && registros[editIndex]) ? (registros[editIndex].usuario || usuarioActual) : usuarioActual
}

let dupIndex=buscarDuplicado(r, editIndex)
if(dupIndex!==-1){
mostrarModalDuplicado(r)
return
}

procesarGuardado(r)
}

function procesarGuardado(r){
if(editIndex!==null){
let rowId=registros[editIndex].rowId
r.rowId=rowId
registros[editIndex]=r
editIndex=null
enviarAScript({action:"actualizar", rowId, ...r})
}else{
registros.push(r)
enviarAScript({action:"guardar", ...r})
}

localStorage.setItem("registros",JSON.stringify(registros))
render()

const enviarGantt = document.getElementById("chkGantt") && document.getElementById("chkGantt").checked
const yaEstabaEnGantt = estaEnGantt(r)
limpiar()

if(!enviarGantt && yaEstabaEnGantt){
  // Desmarcó el checkbox → eliminar de la Gantt
  _desmarcarDeGantt(r)
  render()
  window.open(GANTT_OCGR_URL, "_blank")
} else if(enviarGantt && yaEstabaEnGantt){
  // Ya estaba en Gantt → enviar actualización silenciosa
  const payload = _construirActoGantt(r)
  payload.update = true
  localStorage.setItem("rgdoc_to_gantt", JSON.stringify(payload))
  _fbEncolarImportGantt(payload)
  _marcarEnGantt(r)
  render()
} else if(enviarGantt && !yaEstabaEnGantt){
  // Nuevo envío a la Gantt
  if(!r.plazo){ alert("El documento no tiene Plazo — no se puede enviar a la Gantt.") }
  else{
    const payload = _construirActoGantt(r)
    localStorage.setItem("rgdoc_to_gantt", JSON.stringify(payload))
    // Respaldo durable en Firebase — sin esto, si nadie abre la pestaña
    // Gantt en este mismo navegador, el documento nunca se escribe en la
    // base de datos (el localStorage no viaja entre navegadores/equipos).
    _fbEncolarImportGantt(payload)
    _marcarEnGantt(r)
    render()
    // Si el iframe ya está cargado, enviar postMessage para importar de inmediato
    const iframe = document.getElementById("gantt-iframe")
    if(iframe && iframe.contentWindow && _ganttIframeCargado){
      iframe.contentWindow.postMessage({type:"rgdoc_import", payload: payload}, "*")
    }
    // Se queda en RegDoc — el usuario va a la Gantt cuando quiera
  }
}
}

/* =====================================================
MODULO 13
FUNCIONES AGREGADAS (ARREGLOS)
===================================================== */

function editar(i){
let r=registros[i]
if(!r) return

fecha.value=normalizarFechaISO(r.fecha)||""
numero.value=r.numero||""
identMateria.value=r.identMateria||""
identDoc.value=r.identDoc||""
autoridad.value=r.autoridad||""
ejs.value=r.ejs||""
hjs.value=r.hjs||""
materia.value=r.materia||""
plazo.value=normalizarFechaISO(r.plazo)||""
procedencia.value=r.procedencia||""
clasificacion.value=r.clasificacion||"RESERVADO"
archivo.value=r.archivo||""
llegsal.value=r.llegsal||"LLEGADO"
observ.value=r.observ||""

editIndex=i
// Pre-marcar checkbox si el registro ya está en Gantt
const chk = document.getElementById("chkGantt")
if(chk) chk.checked = estaEnGantt(r)
window.scrollTo({top:0,behavior:"smooth"})
}

function borrar(i){
if(confirm("¿Eliminar registro?")){
let rowId=registros[i].rowId
if(rowId) enviarAScript({action:"eliminar", rowId})
registros.splice(i,1)
localStorage.setItem("registros",JSON.stringify(registros))
if(editIndex===i) editIndex=null
render()
}
}

function limpiar(){
fecha.value=""
numero.value=""
identMateria.value=""
identDoc.value=""
autoridad.value=""
ejs.value=""
hjs.value=""
materia.value=""
plazo.value=""
procedencia.value=""
clasificacion.value="RESERVADO"
archivo.value=""
llegsal.value="LLEGADO"
observ.value=""
editIndex=null
const chkGantt=document.getElementById("chkGantt")
if(chkGantt) chkGantt.checked=false
}
