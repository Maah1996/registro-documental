/* =====================================================
MODULO 15
IMPRESION PDF
Imprime solo desde FECHA hasta MATERIA
===================================================== */

function construirTablaImpresion(lista){

lista.sort((a,b)=>{
let fechaA = new Date(a.fecha)
let fechaB = new Date(b.fecha)
return fechaB - fechaA
})

let datos=obtenerDatosExportacion(lista)

let html=`
<h2>REGISTRO DOCUMENTAL</h2>
<table>
<thead>
<tr>
<th>FECHA</th>
<th>NUMERO</th>
<th>IDENT MATERIA</th>
<th>IDENT DOC</th>
<th>AUTORIDAD QUE FIRMA</th>
<th>EJS</th>
<th>HJS</th>
<th>MATERIA</th>
</tr>
</thead>
<tbody>
`

if(datos.length===0){
html+=`
<tr>
<td colspan="8">SIN REGISTROS PARA IMPRIMIR</td>
</tr>
`
}else{
datos.forEach(r=>{
html+=`
<tr>
<td>${esc(r["FECHA"])}</td>
<td>${esc(r["NUMERO"])}</td>
<td>${esc(r["IDENT MATERIA"])}</td>
<td>${esc(r["IDENT DOC"])}</td>
<td>${esc(r["AUTORIDAD QUE FIRMA"])}</td>
<td>${esc(r["EJS"])}</td>
<td>${esc(r["HJS"])}</td>
<td class="print-materia">${esc(r["MATERIA"])}</td>
</tr>
`
})
}

html+=`
</tbody>
</table>
`
return html
}

function imprimirPDF(){
let lista=obtenerRegistrosFiltrados()
printArea.innerHTML=construirTablaImpresion(lista)

requestAnimationFrame(()=>{
requestAnimationFrame(()=>{
window.print()
setTimeout(()=>{
printArea.innerHTML=""
},300)
})
})
}

/* =====================================================
MODULO 16
EXPORTAR EXCEL
Exporta solo desde FECHA hasta MATERIA
===================================================== */

function exportarExcel(){
let lista=obtenerRegistrosFiltrados()
let datosExcel=obtenerDatosExportacion(lista)

if(datosExcel.length===0){
alert("No hay registros para exportar.")
return
}

let ws=XLSX.utils.json_to_sheet(datosExcel)

ws["!cols"]=[
{wch:14},
{wch:14},
{wch:18},
{wch:18},
{wch:22},
{wch:10},
{wch:10},
{wch:40}
]

let wb=XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb,ws,"Registro")
XLSX.writeFile(wb,"registro_documental.xlsx")
}
