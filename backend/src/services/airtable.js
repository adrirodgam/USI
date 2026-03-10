const Airtable = require('airtable')

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN })
  .base(process.env.AIRTABLE_BASE_ID)

async function registrarEnAirtable(nombre, iniciales) {
  await base('Factory Operator Checklist').create([
    {
      fields: {
        'Operator Name': nombre,
        'Operator Initials': inicial,
      }
    }
  ])
}

module.exports = registrarEnAirtable
