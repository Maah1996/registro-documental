/* =====================================================
MODULO 5
VARIABLES DEL SISTEMA
===================================================== */

const fecha=document.getElementById("fecha")
const numero=document.getElementById("numero")
const identMateria=document.getElementById("identMateria")
const identDoc=document.getElementById("identDoc")
const autoridad=document.getElementById("autoridad")
const ejs=document.getElementById("ejs")
const hjs=document.getElementById("hjs")
const materia=document.getElementById("materia")
const plazo=document.getElementById("plazo")
const procedencia=document.getElementById("procedencia")
const clasificacion=document.getElementById("clasificacion")
const archivo=document.getElementById("archivo")
const llegsal=document.getElementById("llegsal")
const observ=document.getElementById("observ")

const buscarNumero=document.getElementById("buscarNumero")
const buscarFecha=document.getElementById("buscarFecha")
const buscarProcedencia=document.getElementById("buscarProcedencia")
const buscarArchivo=document.getElementById("buscarArchivo")

const temporizadorSesion=document.getElementById("temporizadorSesion")
const btnBloquearManual=document.getElementById("btnBloquearManual")
const relojHora=document.getElementById("relojHora")
const relojFecha=document.getElementById("relojFecha")
const relojDiaNumero=document.getElementById("relojDiaNumero")

const tabla=document.getElementById("tabla")
const printArea=document.getElementById("printArea")

let usuarioActual = sessionStorage.getItem("rdUsuario") || ""
let rolActual = sessionStorage.getItem("rdRol") || "usuario"
// Permiso "ver todo": un usuario normal autorizado por el admin ve y puede
// editar TODOS los documentos (no solo los propios), sin ser admin completo.
let verTodoActual = sessionStorage.getItem("rdVerTodo") === "1"

/* =====================================================
MODULO 6
CONFIGURACION API (AQUI VA EL SCRIPT)
===================================================== */

const API_URL="https://script.google.com/macros/s/AKfycbydfREY_WSruchtCyrjzOHhuppUrSyVefZPnGM5_purq8SOYYuv6Pf-2gEd--C7KRjW/exec"
const SHEET_ID_RGDOC="19AX5vrwhUjl8Pa_gtUWxFPjt2cw4RjL5-lP_wl1MBps"

const CAMPOS_RGDOC=["fecha","numero","identMateria","identDoc","autoridad","ejs","hjs","materia","plazo","procedencia","clasificacion","archivo","llegsal","observ","usuario"]
const TIEMPO_BLOQUEO = 120000

let registros=[]
let editIndex=null

/* =====================================================
GANTT OCGR — constantes
===================================================== */

const GANTT_OCGR_URL = "https://maah1996.github.io/Carta-Gantt-Maah/"
const LS_GANTT_IDS   = "rgdoc_en_gantt_v6"

// Limpiar versiones anteriores
try{
  ["rgdoc_en_gantt","rgdoc_en_gantt_v2","rgdoc_en_gantt_v3","rgdoc_en_gantt_v4","rgdoc_en_gantt_v5"].forEach(k=>localStorage.removeItem(k))
}catch(e){}

/* =====================================================
MODULO 7
CARGA LOCAL
===================================================== */

try{
const _u=(sessionStorage.getItem("rdUsuario")||"").toUpperCase().trim()
const _key=_u?"registros_"+_u:"registros"
registros=JSON.parse(localStorage.getItem(_key))||[]
}catch(error){
registros=[]
}

/* =====================================================
MODULO 19
USUARIO ACTUAL
===================================================== */

if(!localStorage.getItem("usuario")){
localStorage.setItem("usuario","ADMIN") // ← SOLO TU
}
