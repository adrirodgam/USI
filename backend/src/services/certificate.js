const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");
const supabaseAdmin = require("./supabaseAdmin");

/**
 * Generates a CoC Word document with dynamic data and inspector signature
 * @param {Object} data - Certificate and Smartsheet data
 */
async function generateCertificate(data) {
  console.log('--- START PROCESS ---');
  console.time('Total Time');

  // Verify template file path
  console.log('Looking for template at:', path.resolve(__dirname, "../templates/template.docx"))

  let signatureBuffer = null
  
  // 1. Download inspector signature from Supabase Storage if URL exists
  if (data.signature_url) {
    console.time('Download Signature');
    const { data: signatureData, error } = await supabaseAdmin
      .storage
      .from('Signatures') 
      .download(data.signature_url)
    
    if (!error && signatureData) {
      // Convert Blob to Buffer for Docxtemplater compatibility
      const arrayBuffer = await signatureData.arrayBuffer()
      signatureBuffer = Buffer.from(arrayBuffer)
      console.log('Signature downloaded, size:', signatureBuffer.length)
      console.timeEnd('Download Signature');
    } else {
      console.log('Could not download signature:', error)
      console.timeEnd('Download Signature');
    }
  }

  // 2. Configure Image Module to handle the signature placeholder in the Word doc
  const imageModule = new ImageModule({
    centered: false,
    getImage: function(tagValue, tagName) {
      console.log('getImage called, returning buffer size:', signatureBuffer ? signatureBuffer.length : 'NULL')
      return signatureBuffer
    },
    getSize: function(img, tagValue, tagName) {
      // Fixed signature dimensions [width, height] in pixels
      return [115, 35]
    }
  })

  // 3. Load the Word template from local storage
  console.time('Read Template');
  const content = fs.readFileSync(
    path.resolve(__dirname, "../templates/template.docx"),
    "binary"
  )
  console.timeEnd('Read Template');

  // 4. Initialize PizZip and Docxtemplater with the image module
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" }
  })

  // 5. Date formatting for the document
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const today = new Date()

  // 6. Map data to template placeholders and render the document
  console.time('Render Word');
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
    signature: "signature" // Tag used in the .docx template
  })

  // 7. Generate final Buffer
  const buf = doc.toBuffer()
  console.timeEnd('Render Word');

  console.log('Buffer generated, size:', buf.length)
  console.timeEnd('Total Time');
  console.log('--- END PROCESS ---');
  
  return buf
}

module.exports = generateCertificate