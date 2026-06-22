/* =====================================================
MODULO 11
RENDER TABLA Y LOGICA VISUAL
===================================================== */

function render(){
let tbody=document.querySelector("#tabla tbody")
tbody.innerHTML=""

let lista=obtenerRegistrosFiltrados()

// Cada usuario ve solo sus propios documentos.
// Documentos sin dueño (legado, columna USUARIO vacía) solo los ve el admin.
const esAdminVista=(rolActual||"").toLowerCase()==="admin"||(rolActual||"").toLowerCase()==="administrador"
lista=lista.filter(r=>{
const owner=(r.usuario||"").toUpperCase().trim()
if(owner==="") return esAdminVista
return owner===usuarioActual.toUpperCase().trim()
})

lista.sort((a,b)=>{
let fechaA=normalizarFechaISO(a.fecha)
let fechaB=normalizarFechaISO(b.fecha)
if(!fechaA) return 1
if(!fechaB) return -1
return new Date(fechaB) - new Date(fechaA)
})

lista.forEach(r=>{
let d=diasNumero(r.plazo)
let clasePlazo=obtenerClasePlazo(d)
let textoDia=obtenerTextoDia(d)
let claseClasif=r.clasificacion==="SECRETO"?"secret-cell":""

let tr=document.createElement("tr")

const enGantt = estaEnGantt(r)
const claseFecha = enGantt ? "fecha-en-gantt" : ""

tr.innerHTML=`
<td class="${esc(claseFecha)}">${esc(fechaCL(r.fecha))}</td>
<td>${esc(valorSeguro(r.numero))}</td>
<td>${esc(valorSeguro(r.identMateria))}</td>
<td>${esc(valorSeguro(r.identDoc))}</td>
<td>${esc(valorSeguro(r.autoridad))}</td>
<td>${esc(valorSeguro(r.ejs))}</td>
<td>${esc(valorSeguro(r.hjs))}</td>
<td class="col-materia">${esc(valorSeguro(r.materia))}</td>
<td>${esc(fechaCL(r.plazo))}</td>
<td class="${esc(clasePlazo)}">${esc(String(textoDia))}</td>
<td>${esc(valorSeguro(r.procedencia))}</td>
<td class="${esc(claseClasif)}">${esc(valorSeguro(r.clasificacion))}</td>
<td>${esc(valorSeguro(r.archivo))}</td>
<td>${esc(valorSeguro(r.llegsal))}</td>
<td>${esc(valorSeguro(r.observ))}</td>
<td>
<div class="acciones-wrap">
<button class="btn-tabla btn-editar" data-action="editar" data-index="${esc(String(r.indexOriginal))}" title="Editar">✏</button>
<button class="btn-tabla btn-borrar" data-action="borrar" data-index="${esc(String(r.indexOriginal))}" title="Eliminar">🗑</button>
</div>
</td>
`
tbody.appendChild(tr)
})

actualizarResumen()
}

function actualizarResumen(){
let res=0, sec=0, pub=0, vencer=0, enGantt=0

registros.forEach(r=>{
if(r.clasificacion==="RESERVADO") res++
if(r.clasificacion==="SECRETO") sec++
if(r.clasificacion==="PÚBLICO") pub++
let d=diasNumero(r.plazo)
if(d!==null && d<=5 && d>=0) vencer++
if(estaEnGantt(r)) enGantt++
})

document.getElementById("res").innerText=res
document.getElementById("sec").innerText=sec
document.getElementById("pub").innerText=pub
document.getElementById("total").innerText=registros.length
document.getElementById("porVencer").innerText=vencer
document.getElementById("enGanttCount").innerText=enGantt
}

