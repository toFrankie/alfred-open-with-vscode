const AdmZip = require('adm-zip')
const pkg = require('../package.json')

const zip = new AdmZip()

zip.addLocalFile('./icon.png')
zip.addLocalFile('./bundle.js')
zip.addLocalFile('./info.plist')

zip.writeZip(`${pkg.name}.alfredworkflow`)
