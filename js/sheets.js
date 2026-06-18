// ── Lee directamente desde Google Sheets vía gviz ──────────────
function _procesarGviz(resp){
  var cols=resp.table.cols||[]
  var rows=resp.table.rows||[]
  return rows.map(function(row,i){
    var obj={rowId:i+2}
    CAMPOS_RGDOC.forEach(function(campo,j){
      var cell=row.c?row.c[j]:null
      var v=''
      if(cell){
        var tipo=cols[j]?cols[j].type:''
        if(tipo==='date'&&cell.v){
          var mx=String(cell.v).match(/Date\((\d+),(\d+),(\d+)\)/)
          if(mx) v=mx[1]+'-'+String(Number(mx[2])+1).padStart(2,'0')+'-'+String(mx[3]).padStart(2,'0')
        }else{
          v=cell.f!==undefined&&cell.f!==null?String(cell.f):(cell.v!==null&&cell.v!==undefined?String(cell.v):'')
        }
      }
      obj[campo]=v
    })
    return obj
  })
}

var _gvizOcupado=false, _gvizCola=[]

function leerSheetGviz(sheetName, campos){
  var fields=campos||CAMPOS_RGDOC
  return new Promise(function(resolve,reject){
    function ejecutar(){
      if(!window.google) window.google={}
      if(!window.google.visualization) window.google.visualization={}
      if(!window.google.visualization.Query) window.google.visualization.Query={}
      var prev=window.google.visualization.Query.setResponse
      var done=false, timer
      function terminar(err,data){
        if(done) return; done=true; clearTimeout(timer)
        window.google.visualization.Query.setResponse=prev
        _gvizOcupado=false
        if(_gvizCola.length) _gvizCola.shift()()
        if(err) reject(err); else resolve(data)
      }
      window.google.visualization.Query.setResponse=function(resp){
        if(!resp||resp.status!=='ok'){terminar(new Error('gviz: '+(resp?resp.status:'error')));return}
        var cols=resp.table.cols||[], rows=resp.table.rows||[]
        var regs=rows.map(function(row,i){
          var obj={rowId:i+2}
          fields.forEach(function(campo,j){
            var cell=row.c?row.c[j]:null, v=''
            if(cell){
              var tipo=cols[j]?cols[j].type:''
              if(tipo==='date'&&cell.v){var mx=String(cell.v).match(/Date\((\d+),(\d+),(\d+)\)/);if(mx) v=mx[1]+'-'+String(Number(mx[2])+1).padStart(2,'0')+'-'+String(mx[3]).padStart(2,'0')}
              else v=cell.f!=null?String(cell.f):(cell.v!=null?String(cell.v):'')
            }
            obj[campo]=v
          })
          return obj
        })
        terminar(null,regs)
      }
      var s=document.createElement('script')
      s.onerror=function(){terminar(new Error('Sheet inaccesible'))}
      timer=setTimeout(function(){terminar(new Error('Tiempo agotado leyendo Sheet'))},20000)
      s.src='https://docs.google.com/spreadsheets/d/'+SHEET_ID_RGDOC+'/gviz/tq?sheet='+encodeURIComponent(sheetName)+'&_cb='+Date.now()
      document.head.appendChild(s)
    }
    if(_gvizOcupado){ _gvizCola.push(ejecutar) } else { _gvizOcupado=true; ejecutar() }
  })
}

// ── JSONP helper: bypasea CORS usando <script> ──────────────────
function fetchGAS(url){
return new Promise(function(resolve,reject){
var cb='_gcb'+Date.now()+Math.random().toString(36).slice(2,7)
var s=document.createElement('script')
var done=false
window[cb]=function(d){done=true;delete window[cb];s.parentNode&&s.parentNode.removeChild(s);resolve(d)}
s.onerror=function(){if(!done){done=true;delete window[cb];s.parentNode&&s.parentNode.removeChild(s);reject(new Error('JSONP error'))}}
setTimeout(function(){if(!done){done=true;delete window[cb];reject(new Error('Sin respuesta del servidor (timeout)'))}},15000)
s.src=url+(url.indexOf('?')>=0?'&':'?')+'callback='+cb
document.head.appendChild(s)
})
}
// ────────────────────────────────────────────────────────────────

/* =====================================================
MODULO 10
ENVIO A GOOGLE SHEETS
===================================================== */

function enviarAScript(datos){
fetch(API_URL,{
method:"POST",
mode:"no-cors",
body:JSON.stringify(datos),
headers:{"Content-Type":"application/json"}
})
console.log("Enviado a Apps Script:", datos.action||"guardar")
}

/* =====================================================
MODULO 17
CARGA DESDE GOOGLE SHEETS (MULTIUSUARIO)
===================================================== */

async function cargarDatos(){
const u = sessionStorage.getItem("rdUsuario")
const c = sessionStorage.getItem("rdClave")
if(!u || !c){ mostrarLogin(); return; }
try{
const todos = await leerSheetGviz("REGISTRO")
const rol = (sessionStorage.getItem("rdRol") || "usuario").toLowerCase()
const esAdminCarga = rol==="admin" || rol==="administrador"
// Los registros SIN dueño (columna USUARIO vacía en la hoja) son visibles para
// todos; los que tienen dueño quedan restringidos a ese usuario o al admin.
registros = esAdminCarga
  ? todos
  : todos.filter(r=>{
      const owner=String(r.usuario||'').trim().toUpperCase()
      return owner==='' || owner===u.trim().toUpperCase()
    })
localStorage.setItem("registros",JSON.stringify(registros))
mostrarEstadoAPI("")
}catch(e){
mostrarEstadoAPI("⚠️ "+(e.message||String(e)))
try{ registros = JSON.parse(localStorage.getItem("registros")) || [] }catch(err){ registros = [] }
}
render()
}

function mostrarEstadoAPI(msg){
const el = document.getElementById("api-status")
if(!el) return
el.textContent = msg
el.style.display = msg ? "block" : "none"
}
