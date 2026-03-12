const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");
const supabaseAdmin = require("./supabaseAdmin");

async function generateCertificate(data) {
  console.log('Looking for template at:', path.resolve(__dirname, "../templates/template.docx"))

  let signatureBuffer = null
  if (data.signature_url) {
    const { data: signatureData, error } = await supabaseAdmin
      .storage
      .from('Signatures') // Asegúrate de que el bucket en Supabase también se llame 'Signatures'
      .download(data.signature_url)
    
    if (!error && signatureData) {
      const arrayBuffer = await signatureData.arrayBuffer()
      signatureBuffer = Buffer.from(arrayBuffer)
      console.log('Signature downloaded, size:', signatureBuffer.length)
    } else {
      console.log('Could not download signature:', error)
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

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const today = new Date()

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
  console.log('Buffer generated, size:', buf.length)
  return buf
}

module.exports = generateCertificate