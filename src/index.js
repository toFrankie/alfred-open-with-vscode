const os = require('os')
const fs = require('fs')
const path = require('path')

// 获取指定目录下所有子目录及文件
function getDirectories(rootDir, dirName, depth = -1) {
  const result = []

  if (depth === 0) return result

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
  let recentFilesPath = path.join(
    os.homedir(),
    '/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.ApplicationRecentDocuments/com.microsoft.vscode.sfl2'
  )
  let projectPaths = []

  try {
    let data = fs.readFileSync(recentFilesPath)
    let plist = require('simple-plist')
    let recentFiles = plist.parse(data).customListItems

    recentFiles.forEach(recentFile => {
      let filePath = recentFile.URL.filePath
      if (filePath.endsWith('.code-workspace')) {
        projectPaths.push(filePath)
      }
    })
  } catch (err) {
    console.log(err)
  }

  return projectPaths
}

// 获取 Windows 平台上所有打开的项目
function getRecentProjectsWindows() {
  let appDataPath = process.env.APPDATA || process.env.USERPROFILE + '/AppData/Roaming'
  let recentFilesPath = path.join(
    appDataPath,
    'Microsoft',
    'Windows',
    'Recent',
    'CustomDestinations',
    'af678b1d089b0bb7.customDestinations-ms'
  )
  let projectPaths = []

  try {
    let data = fs.readFileSync(recentFilesPath)
    let zlib = require('zlib')
    let buf = zlib.inflateSync(data)
    let plist = require('simple-plist')
    let recentFiles = plist.parse(buf.toString()).RecentDestinations

    recentFiles.forEach(recentFile => {
      let filePath = recentFile.path
      if (filePath.endsWith('.code-workspace')) {
        projectPaths.push(filePath)
      }
    })
  } catch (err) {
    console.log(err)
  }

  return projectPaths
}

// 获取打开项目的次数
function getProjectOpenCount(projectPath) {
  let settingsPath = path.join(os.homedir(), '.vscode', 'recently-opened.json')
  let openCount = 0

  try {
    let data = fs.readFileSync(settingsPath)
    let settings = JSON.parse(data.toString())
    settings.workspaces2.forEach(workspace => {
      if (workspace.configPath === projectPath) {
        openCount = workspace.folderUri.length
      }
    })
  } catch (err) {
    console.log(err)
  }

  return openCount
}

// 获取最近打开的项目列表
function getRecentProjectList() {
  let projectPaths = getRecentProjects()
  let projects = []

  // 将打开的项目转换为 Alfred items
  projectPaths.forEach(projectPath => {
    let stats = fs.statSync(projectPath)

    if (stats.isDirectory()) {
      projects.push({
        title: path.basename(projectPath),
        subtitle: projectPath,
        arg: projectPath,
        icon: {
          path: 'icons/folder.png',
        },
      })
    } else {
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
    let aCount = getProjectOpenCount(a.arg)
    let bCount = getProjectOpenCount(b.arg)

    return bCount - aCount
  })

  return projects
}

void (function main() {
  const input = process.argv[2].trim().toLowerCase().replace(/\s/g, '')

  const query = input || ''
  const dirPath = '/Users/frankie/Web' // 替换为你自己的项目目录

  let projectList = []

  if (query) {
    projectList = getDirectories(dirPath, query, 2)
  } else {
    projectList = getRecentProjectList()
  }

  const items = []
  projectList.forEach(project => {
    items.push({
      title: project.title,
      subtitle: project.subtitle,
      arg: project.arg,
      icon: project.icon,
    })
  })

  if (items.length) {
    console.log(JSON.stringify({ items }))
  } else {
    const item = {
      title: 'No matching project...',
      subtitle: 'Please check if your input is correct.',
      arg: ' ',
    }
    console.log(JSON.stringify({ items: [item] }))
  }
})()
