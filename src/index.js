import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function getDirectories(rootDir, dirName, depth = -1) {
  const result = []

  if (depth === 0)
    return result

  const dirs = fs.readdirSync(rootDir)
  for (const dir of dirs) {
    try {
      const filePath = path.join(rootDir, dir)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        if (dir.toLowerCase().includes(dirName.toLowerCase())) {
          result.push({
            title: dir,
            subtitle: filePath,
            arg: filePath,
            icon: {
              path: './icon.png',
            },
          })
        }

        result.push(...getDirectories(filePath, dirName, depth - 1))
      }
    }
    catch (e) {}
  }

  return result
}

function getRecentProjects() {
  const workspaceStoragePath = path.join(
    os.homedir(),
    'Library/Application Support/Code/User/workspaceStorage',
  )
  const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000

  const dirs = fs
    .readdirSync(workspaceStoragePath)
    .map(name => ({
      name,
      path: path.join(workspaceStoragePath, name),
      stat: fs.statSync(path.join(workspaceStoragePath, name)),
    }))
    .map((dir) => {
      const workspaceJsonPath = path.join(dir.path, 'workspace.json')

      if (!fs.existsSync(workspaceJsonPath))
        return false

      const workspaceJson = fs.readFileSync(workspaceJsonPath, 'utf8')
      const workspaceObj = JSON.parse(workspaceJson)
      const folderUrl = workspaceObj.folder
      const folderPath = decodeURIComponent(folderUrl.slice(7)) // "file:///Users/frankie/web/demo"

      try {
        if (fs.statSync(folderPath).isDirectory())
          return { ...dir, targetPath: folderPath }
        return false
      }
      catch {
        return false
      }
    })
    .filter(dir => dir && dir.stat.mtimeMs >= yearAgo)
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    .map(dir => dir.targetPath)
    .slice(0, 10)

  // Convert to alfred items
  return dirs.map((projectPath) => {
    return {
      title: path.basename(projectPath),
      subtitle: projectPath,
      arg: projectPath,
      icon: { path: './icon.png' },
    }
  })
}

(function main() {
  const input = process.argv[2].trim().toLowerCase().replace(/\s/g, '')
  const query = input || ''
  const searchDir = process.argv[3].trim()

  let projectList = []

  if (input)
    projectList = getDirectories(searchDir, query, 3)
  else projectList = getRecentProjects()

  const items = []
  projectList.forEach((project) => {
    items.push({
      title: project.title,
      subtitle: project.subtitle,
      arg: project.arg,
      icon: project.icon,
    })
  })

  if (items.length) {
    console.log(JSON.stringify({ items }))
  }
  else {
    const item = {
      title: 'No matching project...',
      subtitle: 'Please check if your input is correct.',
      arg: ' ',
    }
    console.log(JSON.stringify({ items: [item] }))
  }
})()
