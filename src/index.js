const os = require('node:os')
const fs = require('node:fs')
const path = require('node:path')

// 获取指定目录下所有子目录及文件
function getDirectories(rootDir, dirName, depth = -1) {
  const result = []

  if (depth === 0)
    return result

  const dirs = fs.readdirSync(rootDir)
  for (const dir of dirs) {
    const filePath = path.join(rootDir, dir)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (dir.toLowerCase().includes(dirName.toLowerCase())) {
        result.push({
          title: dir,
          subtitle: filePath,
          arg: filePath,
          icon: {
            path: 'icons/folder.png',
          },
        })
      }

      result.push(...getDirectories(filePath, dirName, depth - 1))
    }
  }

  return result
}

// 获取所有打开的项目
function getRecentProjects() {
  let projectPaths = []

  switch (process.platform) {
    case 'darwin':
      projectPaths = getRecentProjectsMacOS()
      break
    case 'win32':
      projectPaths = getRecentProjectsWindows()
      break
    default:
      break
  }

  return projectPaths
}

// 获取 macOS 平台上所有打开的项目
function getRecentProjectsMacOS() {
  const recentFilesPath = path.join(
    os.homedir(),
    '/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.ApplicationRecentDocuments/com.microsoft.vscode.sfl2',
  )
  const projectPaths = []

  try {
    const data = fs.readFileSync(recentFilesPath)
    const plist = require('simple-plist')
    const recentFiles = plist.parse(data).customListItems

    recentFiles.forEach((recentFile) => {
      const filePath = recentFile.URL.filePath
      if (filePath.endsWith('.code-workspace'))
        projectPaths.push(filePath)
    })
  }
  catch (err) {
    console.log(err)
  }

  return projectPaths
}

// 获取 Windows 平台上所有打开的项目
function getRecentProjectsWindows() {
  const appDataPath = process.env.APPDATA || `${process.env.USERPROFILE}/AppData/Roaming`
  const recentFilesPath = path.join(
    appDataPath,
    'Microsoft',
    'Windows',
    'Recent',
    'CustomDestinations',
    'af678b1d089b0bb7.customDestinations-ms',
  )
  const projectPaths = []

  try {
    const data = fs.readFileSync(recentFilesPath)
    const zlib = require('node:zlib')
    const buf = zlib.inflateSync(data)
    const plist = require('simple-plist')
    const recentFiles = plist.parse(buf.toString()).RecentDestinations

    recentFiles.forEach((recentFile) => {
      const filePath = recentFile.path
      if (filePath.endsWith('.code-workspace'))
        projectPaths.push(filePath)
    })
  }
  catch (err) {
    console.log(err)
  }

  return projectPaths
}

// 获取打开项目的次数
function getProjectOpenCount(projectPath) {
  const settingsPath = path.join(os.homedir(), '.vscode', 'recently-opened.json')
  let openCount = 0

  try {
    const data = fs.readFileSync(settingsPath)
    const settings = JSON.parse(data.toString())
    settings.workspaces2.forEach((workspace) => {
      if (workspace.configPath === projectPath)
        openCount = workspace.folderUri.length
    })
  }
  catch (err) {
    console.log(err)
  }

  return openCount
}

// 获取最近打开的项目列表
function getRecentProjectList() {
  const projectPaths = getRecentProjects()
  const projects = []

  // 将打开的项目转换为 Alfred items
  projectPaths.forEach((projectPath) => {
    const stats = fs.statSync(projectPath)

    if (stats.isDirectory()) {
      projects.push({
        title: path.basename(projectPath),
        subtitle: projectPath,
        arg: projectPath,
        icon: {
          path: 'icons/folder.png',
        },
      })
    }
    else {
      projects.push({
        title: path.basename(projectPath),
        subtitle: projectPath,
        arg: projectPath,
        icon: {
          path: 'icons/file.png',
        },
      })
    }
  })

  // 按打开次数排序
  projects.sort((a, b) => {
    const aCount = getProjectOpenCount(a.arg)
    const bCount = getProjectOpenCount(b.arg)

    return bCount - aCount
  })

  return projects
}

(function main() {
  const input = process.argv[2].trim().toLowerCase().replace(/\s/g, '')

  const query = input || ''
  const dirPath = '/Users/frankie/Web' // 替换为你自己的项目目录

  let projectList = []

  if (query)
    projectList = getDirectories(dirPath, query, 2)
  else projectList = getRecentProjectList()

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
