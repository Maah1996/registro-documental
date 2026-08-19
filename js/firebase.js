// Firebase — mismo proyecto que Gantt OCGR (comparten maah_usuarios)
let _fbdb = null
;(function(){
  try{
    const cfg={apiKey:"AIzaSyB0f_Sh2xiDgvB9_-nyp76Ol-XvhhyvcXA",authDomain:"gantt-maah.firebaseapp.com",databaseURL:"https://gantt-maah-default-rtdb.firebaseio.com",projectId:"gantt-maah",storageBucket:"gantt-maah.firebasestorage.app",appId:"1:299934642229:web:87681b489cdc2a5452c17c"}
    if(!firebase.apps.length) firebase.initializeApp(cfg)
    _fbdb = firebase.database()
    // Mantener siempre una sesión (anónima si no hay una real) para poder leer
    // maah_usuarios — las reglas exigen auth != null. No pisa sesiones reales
    // (ej. la de Carta Gantt, que comparte origen y proyecto Firebase).
    firebase.auth().onAuthStateChanged(u=>{
      if(!u) firebase.auth().signInAnonymously().catch(e=>console.warn('[RegDoc] Firebase anon auth:',e))
    })
  }catch(e){ console.warn('[RegDoc] Firebase no disponible:', e) }
})()

async function _fbBuscarUsuario(nombre, pass){
  if(!_fbdb) return null
  const snap = await _fbdb.ref('maah_usuarios').once('value')
  const users = snap.val() || {}
  return Object.entries(users).find(([k,u]) =>
    (u.nombre||'').toUpperCase().trim() === nombre.toUpperCase().trim() && u.pass === pass
  ) || null
}

async function _fbCrearUsuario(nombre, pass, rol){
  if(!_fbdb) return
  const ganttRol = (rol==='admin'||rol==='administrador') ? 'admin' : 'user'
  // RGDOC solo tiene una sesión ANÓNIMA de Firebase, y las reglas de
  // seguridad de la Carta Gantt no permiten a una sesión anónima crear
  // usuarios directamente en maah_usuarios (con toda razón: cualquiera que
  // abriera la página podría crearse una cuenta). En vez de eso, se deja la
  // solicitud en una cola (maah_pending_gantt_users) — la Carta Gantt la
  // procesa sola la próxima vez que el administrador inicia sesión ahí,
  // usando su sesión real para crear la cuenta completa (con login e
  // índice de autenticación incluidos).
  await _fbdb.ref('maah_pending_gantt_users').push({nombre: nombre.toUpperCase().trim(), pass: pass, rol: ganttRol, ts: Date.now()})
}

// Deja encolada en Firebase una actividad para importar a la Carta Gantt
// (documento guardado con el checkbox "GANTT" marcado). El mecanismo
// existente (localStorage + postMessage) solo funciona si la pestaña Gantt
// ya está abierta en ESE mismo navegador — si nadie la abre ahí, el
// documento se queda esperando para siempre. Esta cola es el respaldo
// durable: cualquier administrador que abra la Gantt, desde cualquier
// computador, la procesa sola (ver procesarColaImportsPendientes en
// Carta-Gantt-Maah/js/rgdoc.js).
async function _fbEncolarImportGantt(payload){
  if(!_fbdb) return
  try{ await _fbdb.ref('maah_pending_gantt_imports').push(payload) }
  catch(e){ console.warn('[RegDoc] No se pudo encolar el envío a la Gantt:', e) }
}

// Deja encolada en Firebase la solicitud de activar/desactivar, para un
// usuario, el permiso de ver la Carta Gantt OCGR compartida (la misma que
// ve el administrador) en vez de su Gantt personal — se aplica junto con
// el permiso "ver todo" de RGDOC. Igual que las otras colas: RGDOC no
// tiene permiso para escribir maah_usuarios directo, así que lo procesa
// la Carta Gantt sola cuando el administrador inicia sesión ahí (ver
// procesarColaPermisosPendientes en Carta-Gantt-Maah/js/rgdoc.js).
async function _fbEncolarPermisoGantt(nombre, verOCGR){
  if(!_fbdb) return
  try{ await _fbdb.ref('maah_pending_gantt_permisos').push({nombre: nombre.toUpperCase().trim(), verOCGR: !!verOCGR, ts: Date.now()}) }
  catch(e){ console.warn('[RegDoc] No se pudo encolar el permiso de la Gantt:', e) }
}

async function _fbCambiarClave(nombre, nuevaPass){
  if(!_fbdb) return false
  const snap = await _fbdb.ref('maah_usuarios').once('value')
  const users = snap.val() || {}
  const entry = Object.entries(users).find(([k,u]) => (u.nombre||'').toUpperCase().trim() === nombre.toUpperCase().trim())
  if(!entry) return false
  await _fbdb.ref('maah_usuarios/' + entry[0] + '/pass').set(nuevaPass)
  return true
}
