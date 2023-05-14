const path = require('node:path')
const fs = require('node:fs')
const { promisify } = require('node:util')

const AdmZip = require('adm-zip')
const pkg = require('../package.json')

const readFileAsync = promisify(fs.readFile)

;(async function main() {
  const zip = new AdmZip()

  zip.addLocalFile('./icon.png')
  zip.addLocalFile('./bundle.js')
  zip.addFile('info.plist', await fillInfoPlist())

  zip.writeZip(`${pkg.name}.alfredworkflow`)
})()

async function fillInfoPlist() {
  const infoPlistPath = path.join(__dirname, '../info.plist')
  const changelogPath = path.join(__dirname, '../CHANGELOG.md')

  const infoPlist = await readFileAsync(infoPlistPath, 'utf8')
  const changelog = await readFileAsync(changelogPath, 'utf8')

  const replacedPlist = infoPlist
    .replace('$createdby', pkg.author.name)
    .replace('$version', pkg.version)
    .replace('$description', pkg.description)
    .replace('$webaddress', pkg.homepage)
    .replace('$readme', changelog)

  // eslint-disable-next-line n/prefer-global/buffer
  return Buffer.from(replacedPlist)
}
