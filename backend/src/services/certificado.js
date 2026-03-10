const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");
const supabaseAdmin = require("./supabaseAdmin");


async function generarCertificado(data) {
  console.log('Buscando template en:', path.resolve(__dirname, "../templates/template.docx"))

  let firmaBuffer = null
  if (data.firma_url) {
    const { data: firmaData, error } = await supabaseAdmin
      .storage
      .from('Firmas')
      .download(data.firma_url)
    
    if (!error && firmaData) {
      const arrayBuffer = await firmaData.arrayBuffer()
      firmaBuffer = Buffer.from(arrayBuffer)
      console.log('Firma descargada, tamaño:', firmaBuffer.length)
    } else {
      console.log('No se pudo descargar la firma:', error)
    }
  }

  const imageModule = new ImageModule({
    centered: false,
    getImage: function(tagValue, tagName) {
      console.log('getImage llamado, retornando buffer de tamaño:', firmaBuffer ? firmaBuffer.length : 'NULL')
      return firmaBuffer
    },
    getSize: function(img, tagValue, tagName) {
      return [115, 35]
    }
  })

  const content = fs.readFileSync(
    path.resolve(__dirname, "../templates/template.docx"),
    "binary"
  )

  const zip = new PizZip(content)

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" }
  })

  const meses = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const hoy = new Date()

  doc.render({
    customer_name: data.customer_name,
    purchase_order: data.purchase_order,
    packing_slip: data.packing_slip,
    sales_order: data.sales_order,
    date_code: data.date_code,
    part_number: data.part_number,
    drawing_no: data.drawing_no,
    revision: data.revision,
    work_order: data.work_order,
    quantity: data.quantity,
    serial_numbers: data.serial_numbers,
    inspector: data.inspector,
    date: `${hoy.getDate()}-${meses[hoy.getMonth()]}-${hoy.getFullYear()}`,
    comments: data.comments,
    firma: "firma" 
  })

  const buf = doc.toBuffer()
  console.log('Buffer generado, tamaño:', buf.length)
  return buf
}

module.exports = generarCertificado