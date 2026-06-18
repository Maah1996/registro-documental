/* =====================================================
MODULO 8
FUNCIONES AUXILIARES
===================================================== */

function esc(v){
var s=(v==null?"":String(v))
return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")
}

function mayus(t){
t=(t||"").toString().toUpperCase().trim()
t=t.replace("PUBLICO","PÚBLICO")
return t
}

function normalizarFechaISO(valor){
if(!valor) return ""

if(Object.prototype.toString.call(valor)==="[object Date]" && !isNaN(valor)){
let y=valor.getFullYear()
let m=String(valor.getMonth()+1).padStart(2,"0")
let d=String(valor.getDate()).padStart(2,"0")
return `${y}-${m}-${d}`
}

let texto=String(valor).trim()

if(texto.includes("T")){
let fecha=new Date(texto)
if(!isNaN(fecha)){
let y=fecha.getFullYear()
let m=String(fecha.getMonth()+1).padStart(2,"0")
let d=String(fecha.getDate()).padStart(2,"0")
return `${y}-${m}-${d}`
}
}

if(/^\d{4}-\d{2}-\d{2}$/.test(texto)){
return texto
}

if(/^\d{2}-\d{2}-\d{4}$/.test(texto)){
let partes=texto.split("-")
return `${partes[2]}-${partes[1]}-${partes[0]}`
}

return texto
}

function fechaCL(f){
let normal=normalizarFechaISO(f)
if(!normal) return ""

let p=normal.split("-")
if(p.length!==3) return normal
return `${p[2]}-${p[1]}-${p[0]}`
}

function diasNumero(pl){
let normal=normalizarFechaISO(pl)
if(!normal) return null

let hoy=new Date()
hoy.setHours(0,0,0,0)

let p=normal.split("-")
if(p.length!==3) return null

let f=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]))
if(isNaN(f)) return null

return Math.floor((f-hoy)/86400000)
}

function valorSeguro(v){
return (v??"").toString()
}

function actualizarReloj(){
let ahora=new Date()

if(relojHora){
relojHora.innerText=ahora.toLocaleTimeString("es-CL",{
hour:"2-digit",
minute:"2-digit",
second:"2-digit",
hour12:false
})
}

if(relojFecha){
relojFecha.innerText=ahora.toLocaleDateString("es-CL",{
weekday:"long",
year:"numeric",
month:"long",
day:"numeric"
})
}

if(relojDiaNumero){
relojDiaNumero.innerText=`Día ${ahora.getDate()}`
}
}

function limpiarTextoBusqueda(v){
return mayus(v).normalize("NFD").replace(/[̀-ͯ]/g,"")
}

function normalizarComparacion(v){
return limpiarTextoBusqueda(v||"")
}

function obtenerClasePlazo(d){

if(d===null) return ""

// 🟢 VENCIDO
if(d < 0) return "plazoVencido"

// 🔴 0 a 5
if(d >= 0 && d <= 5) return "plazoRojo"

// 🔵 6 a 15
if(d > 5 && d <= 15) return "plazoAzul"

// 🟡 +15
return "plazoAmarillo"
}

function obtenerTextoDia(d){

if(d===null) return ""

// 🟢 VENCIDO → NO MOSTRAR NADA
if(d < 0) return ""

return d
}

function obtenerDatosExportacion(lista){
return lista.map(r=>({
"FECHA":fechaCL(r.fecha),
"NUMERO":valorSeguro(r.numero),
"IDENT MATERIA":valorSeguro(r.identMateria),
"IDENT DOC":valorSeguro(r.identDoc),
"AUTORIDAD QUE FIRMA":valorSeguro(r.autoridad),
"EJS":valorSeguro(r.ejs),
"HJS":valorSeguro(r.hjs),
"MATERIA":valorSeguro(r.materia)
}))
}
