import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import pkg from '../../package.json'

const HOME_DIR = os.homedir()
const STORAGE_DIR = `${HOME_DIR}/.config/${pkg.name}`
const STORAGE_FILE_PATH = `${STORAGE_DIR}/storage.json`
const VSCODE_STORAGE_FILE = `${HOME_DIR}/Library/Application Support/Code/User/workspaceStorage`

export function getTargetDirectories({allDir, query}) {
  return allDir.filter(dirPath => {
    const basename = path.basename(dirPath)
    if (!basename.toLocaleLowerCase().includes(query.toLowerCase())) return false
    return dirPath
  })
}

export function getAllDirectory({searchPath, searchDepth, ignoreDir}) {
  const result = []
  const ignoreDirs = ignoreDir.split(',')

  if (searchDepth === 0) return result

  const dirs = fs.readdirSync(searchPath)
  for (const dir of dirs) {
    try {
      const filePath = path.join(searchPath, dir)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        const dotDirectoryRegex = /^\..*/
        const basename = path.basename(filePath)
        if (ignoreDirs.includes(basename)) continue
        if (dotDirectoryRegex.test(basename)) continue

        result.push(filePath)

        result.push(
          ...getAllDirectory({
            searchPath: filePath,
            searchDepth: searchDepth - 1,
            ignoreDir,
          })
        )
      }
    } catch (e) {}
  }

  return result
}

export function getRecentDirectories() {
  const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000

  const result = fs
    .readdirSync(VSCODE_STORAGE_FILE)
    .map(name => ({
      name,
      path: path.join(VSCODE_STORAGE_FILE, name),
      stat: fs.statSync(path.join(VSCODE_STORAGE_FILE, name)),
    }))
    .map(dir => {
      const workspaceJsonPath = path.join(dir.path, 'workspace.json')

      if (!fs.existsSync(workspaceJsonPath)) return false

      const workspaceJson = fs.readFileSync(workspaceJsonPath, 'utf8')
      const workspaceObj = JSON.parse(workspaceJson)
      const folderUrl = workspaceObj.folder
      if (!folderUrl) return false
      const folderPath = decodeURIComponent(folderUrl.slice(7)) // "file:///Users/frankie/web/demo"

      try {
        if (fs.statSync(folderPath).isDirectory()) return {...dir, targetPath: folderPath}
        return false
      } catch {
        return false
      }
    })
    .filter(dir => dir && dir.stat.mtimeMs >= yearAgo)
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    .map(dir => dir.targetPath)
    .slice(0, 10)

  return result
}

export function getStorageDirectories({storageKey, ignoreDir}) {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, {recursive: true})
    }

    const now = new Date().getTime()
    if (!fs.existsSync(STORAGE_FILE_PATH)) {
      const content = {updated_at: now}
      fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(content, null, 2))
    }

    let storageJson = {}
    try {
      const storageData = fs.readFileSync(STORAGE_FILE_PATH, 'utf8')
      storageJson = JSON.parse(storageData)
    } catch (e) {
      fs.unlinkSync(STORAGE_FILE_PATH)
    }

    if (!storageJson.ignore_dir !== ignoreDir) return []

    const current = storageJson[storageKey]
    if (!current) return []

    const overOneMinute = now - current.updated_at > 60 * 1000
    if (overOneMinute) return []

    return current.dirs || []
  } catch (e) {
    return []
  }
}

export function updateStorageDirectories({storageKey, ignoreDir, dirs}) {
  try {
    const storageContents = fs.readFileSync(STORAGE_FILE_PATH, 'utf8')
    let storageJson = JSON.parse(storageContents) // { updated_at, [storageKey]: { updated_at: ignore_dir, dirs} }

    const shouldOverride = Object.keys(storageJson).length > 21

    const now = new Date().getTime()
    if (shouldOverride) {
      storageJson = {updated_at: now}
    } else {
      storageJson.updated_at = now
    }

    storageJson.ignore_dir = ignoreDir
    storageJson[storageKey] = {dirs, updated_at: now}

    fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(storageJson, null, 2))
  } catch (e) {}
}
