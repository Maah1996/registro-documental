/* =====================================================
MODULO 12
INICIO DEL SISTEMA — event listeners globales
===================================================== */

buscarNumero.addEventListener("input",render)
buscarFecha.addEventListener("input",render)
buscarProcedencia.addEventListener("input",render)
buscarArchivo.addEventListener("input",render)

actualizarReloj()
setInterval(actualizarReloj,1000)

/* =====================================================
MODULO 14
EVENTOS DE ACCIONES EN TABLA
Editar y borrar con delegacion de eventos
===================================================== */

tabla.addEventListener("click",function(e){
let btn=e.target.closest("button[data-action]")
if(!btn) return

let accion=btn.dataset.action
let index=Number(btn.dataset.index)

if(accion==="editar"){
editar(index)
}

if(accion==="borrar"){
borrar(index)
}

})

/* =====================================================
INICIO DEL SISTEMA — window.onload
===================================================== */

window.onload = async ()=>{
const u = sessionStorage.getItem("rdUsuario")
const c = sessionStorage.getItem("rdClave")
if(u && c){
  usuarioActual = u
  rolActual = sessionStorage.getItem("rdRol") || "usuario"
  ocultarLogin()
  mostrarSegunRol()
  cargarDatos()
  iniciarControlInactividad()
} else {
  // Intentar restaurar sesión desde token SSO (abierto desde Gantt u otra ventana)
  try{
    const raw = localStorage.getItem("rgdoc_session")
    if(raw){
      const ticket = JSON.parse(raw)
      if(ticket && ticket.nombre && ticket.clave && ticket.expira && Date.now() < ticket.expira){
        sessionStorage.setItem("rdUsuario", ticket.nombre)
        sessionStorage.setItem("rdClave", ticket.clave)
        sessionStorage.setItem("rdRol", ticket.rol || "usuario")
        usuarioActual = ticket.nombre
        rolActual = ticket.rol || "usuario"
        ocultarLogin()
        mostrarSegunRol()
        await cargarDatos()
        iniciarControlInactividad()
        return
      }
    }
  }catch(e){}
  mostrarLogin()
}
}

/* =====================================================
MODULO 18
ACTUALIZACION AUTOMATICA
===================================================== */

setInterval(()=>{
cargarDatos()
},120000) // refresca cada 2 minutos desde el Sheet

/* =====================================================
MODULO 20.1
FILTROS POR TARJETAS DE RESUMEN
Permite pinchar Reservados, Secretos, Públicos y Por vencer
para mostrar solo los registros correspondientes.
===================================================== */

let filtroResumenActivo = null
const tarjetasResumen = document.querySelectorAll(".filter-card[data-resumen-filtro]")
const obtenerRegistrosFiltradosOriginal = obtenerRegistrosFiltrados

function actualizarTarjetasResumenActivas(){

tarjetasResumen.forEach(tarjeta=>{
let filtro = tarjeta.dataset.resumenFiltro
let activa = filtroResumenActivo === filtro
tarjeta.classList.toggle("active",activa)
tarjeta.setAttribute("aria-pressed",activa ? "true" : "false")
})
}

function alternarFiltroResumen(filtro){

if(filtro === "TOTAL"){
filtroResumenActivo = null
}else{
filtroResumenActivo = filtroResumenActivo === filtro ? null : filtro
}

actualizarTarjetasResumenActivas()
render()
}

tarjetasResumen.forEach(tarjeta=>{

tarjeta.addEventListener("click",()=>{
alternarFiltroResumen(tarjeta.dataset.resumenFiltro)
})

tarjeta.addEventListener("keydown",e=>{
if(e.key === "Enter" || e.key === " "){
e.preventDefault()
alternarFiltroResumen(tarjeta.dataset.resumenFiltro)
}
})
})

obtenerRegistrosFiltrados = function(){

let lista = obtenerRegistrosFiltradosOriginal()

if(filtroResumenActivo === "POR_VENCER"){
lista = lista.filter(r=>{
let d = diasNumero(r.plazo)
return d !== null && d <= 5 && d >= 0
})
}

if(["RESERVADO","SECRETO","PÚBLICO"].includes(filtroResumenActivo)){
lista = lista.filter(r=>mayus(r.clasificacion) === filtroResumenActivo)
}

if(filtroResumenActivo === "EN_GANTT"){
lista = lista.filter(r=>estaEnGantt(r))
}

return lista
}

actualizarTarjetasResumenActivas()
