import path from 'node:path'
import os from 'node:os'

import {
  getAllDirectory,
  getTargetDirectories,
  getRecentDirectories,
  getStorageDirectories,
  updateStorageDirectories,
} from './utils/file'

const HOME_DIR = os.homedir()

main()

function main() {
  let [_exec, _script, query = '', searchPath = HOME_DIR, searchDepth = 3, ignoreDir = ''] =
    process.argv.map(arg => arg.trim())

  query = query.toLowerCase().replace(/\s/g, '')

  let allDir = []
  let targetDirs = []
  let storageDirs = []
  let notMatched = false
  let shouldUpdateStorage = false
  const storageKey = `${searchPath} | ${searchDepth}`

  if (query) {
    storageDirs = getStorageDirectories({storageKey, ignoreDir})

    if (storageDirs.length) {
      targetDirs = storageDirs
    } else {
      allDir = getAllDirectory({searchPath, searchDepth, ignoreDir})
      targetDirs = getTargetDirectories({allDir, query})

      if (!targetDirs.length) notMatched = true

      shouldUpdateStorage = true
    }
  }

  if (!query || notMatched) targetDirs = getRecentDirectories()

  const alfredItems = targetDirs.filter(Boolean).map(filePath => {
    const basename = path.basename(filePath)
    return {
      title: basename,
      subtitle: filePath.replace(HOME_DIR, '~'),
      arg: filePath,
      icon: {path: './icon.png'},
    }
  })

  if (notMatched) {
    alfredItems.unshift({
      title: 'Sorry, no matching results.',
      subtitle: 'Here are your recently folders opened with Visual Studio Code. 👇',
      arg: '',
      icon: {path: './404.png'},
    })
  }

  console.log(JSON.stringify({items: alfredItems}))

  if (shouldUpdateStorage) {
    updateStorageDirectories({storageKey, ignoreDir, dirs: allDir})
  }
}
