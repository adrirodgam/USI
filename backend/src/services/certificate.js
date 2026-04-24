const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");
const supabaseAdmin = require("./supabaseAdmin");

async function generateCertificate(data) {
  console.log('--- 🚀 INICIANDO GENERACIÓN ---');
  console.time('Tiempo Total'); // Cronómetro principal

  console.log('Looking for template at:', path.resolve(__dirname, "../templates/template.docx"))

  let signatureBuffer = null
  if (data.signature_url) {
    console.time('⏱️ Descarga Firma (Supabase)');
    const { data: signatureData, error } = await supabaseAdmin
      .storage
      .from('Signatures') 
      .download(data.signature_url)
    
    if (!error && signatureData) {
      const arrayBuffer = await signatureData.arrayBuffer()
      signatureBuffer = Buffer.from(arrayBuffer)
      console.log('Signature downloaded, size:', signatureBuffer.length)
      console.timeEnd('⏱️ Descarga Firma (Supabase)');
    } else {
      console.log('Could not download signature:', error)
      console.timeEnd('⏱️ Descarga Firma (Supabase)');
    }
  }

  const imageModule = new ImageModule({
    centered: false,
    getImage: function(tagValue, tagName) {
      console.log('getImage called, returning buffer size:', signatureBuffer ? signatureBuffer.length : 'NULL')
      return signatureBuffer
    },
    getSize: function(img, tagValue, tagName) {
      return [115, 35]
    }
  })

  console.time('⏱️ Lectura Plantilla (Disco)');
  const content = fs.readFileSync(
    path.resolve(__dirname, "../templates/template.docx"),
    "binary"
  )
  console.timeEnd('⏱️ Lectura Plantilla (Disco)');

  const zip = new PizZip(content)

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" }
  })

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const today = new Date()

  console.time('⏱️ Renderizado Docx');
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
    date: `${today.getDate()}-${months[today.getMonth()]}-${today.getFullYear()}`,
    comments: data.comments,
    signature: "signature"
  })

  const buf = doc.toBuffer()
  console.timeEnd('⏱️ Renderizado Docx');

  console.log('Buffer generated, size:', buf.length)
  console.timeEnd('Tiempo Total');
  console.log('--- ✅ FIN DEL PROCESO ---');
  
  return buf
}

module.exports = generateCertificate