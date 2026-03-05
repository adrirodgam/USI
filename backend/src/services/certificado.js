
const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");

// Builtin file system utilities
const fs = require("fs");
const path = require("path");

function generarCertificado(data) {
console.log('Buscando template en:', path.resolve(__dirname, "../templates/template.docx"))

// Load the docx file as binary content
const content = fs.readFileSync(
    path.resolve(__dirname, "../templates/template.docx"),
    "binary"
);

// Unzip the content of the file
const zip = new PizZip(content);

/*
 * Parse the template.
 * This function throws an error if the template is invalid,
 * for example, if the template is "Hello {user" (missing closing tag)
 */
const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: {
        start: "{{",
        end: "}}"
    }
});

/*
 * Render the document : Replaces :
 * - {first_name} with John
 * - {last_name} with Doe,
 * ...
 */
doc.render({
    customer_name: data.customer_name,
    purchase_name: data.purchase_name,
    packing_slip: data.packing_slip,
    sales_order: data.sales_order,
    date_code: data.date_code,
    part_number: data.part_number,
    drawing_number: data.drawing_number,
    revision: data.revision,
    work_order: data.work_order,
    quantity: data.quantity,
    serial_number: data.serial_number,
    inspector: data.inspector,
    date: data.date,
});


const buf = doc.toBuffer()
console.log('Buffer generado, tamaño:', buf.length)
return buf
}

module.exports = generarCertificado
