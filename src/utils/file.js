import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const HOME_DIR = os.homedir()

export function searchDirectories({searchDir, searchDepth, ignoreDir, query}) {
  const result = []
  const ignoreDirs = ignoreDir.split(',').map(name => name.trim())

  if (searchDepth === 0) return result

  const dirs = fs.readdirSync(searchDir)
  for (const dir of dirs) {
    try {
      const filePath = path.join(searchDir, dir)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        const filename = path.basename(filePath)
        if (ignoreDirs.includes(filename)) continue

        if (dir.toLowerCase().includes(query.toLowerCase())) {
          result.push({
            title: dir,
            subtitle: filePath.replace(HOME_DIR, '~'),
            arg: filePath,
            icon: {path: './icon.png'},
          })
        }

        result.push(
          ...searchDirectories({
            searchDir: filePath,
            searchDepth: searchDepth - 1,
            ignoreDir,
            query,
          })
        )
      }
    } catch (e) {}
  }

  return result
}

export function getRecentDirectories() {
  const workspaceStoragePath = path.join(
    HOME_DIR,
    'Library/Application Support/Code/User/workspaceStorage'
  )
  const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000

  const dirs = fs
    .readdirSync(workspaceStoragePath)
    .map(name => ({
      name,
      path: path.join(workspaceStoragePath, name),
      stat: fs.statSync(path.join(workspaceStoragePath, name)),
    }))
    .map(dir => {
      const workspaceJsonPath = path.join(dir.path, 'workspace.json')

      if (!fs.existsSync(workspaceJsonPath)) return false

      const workspaceJson = fs.readFileSync(workspaceJsonPath, 'utf8')
      const workspaceObj = JSON.parse(workspaceJson)
      const folderUrl = workspaceObj.folder
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

  // Convert to alfred items
  return dirs.map(projectPath => {
    return {
      title: path.basename(projectPath),
      subtitle: projectPath,
      arg: projectPath,
      icon: {path: './icon.png'},
    }
  })
}
