import {searchDirectories, getRecentDirectories, HOME_DIR} from './utils/file'

main()

function main() {
  let [_exec, _script, query = '', searchDir = HOME_DIR, searchDepth = 3, ignoreDirName = ''] =
    process.argv.map(arg => arg.trim())

  query = query.toLowerCase().replace(/\s/g, '')

  let projectList = []
  let notMatches = false

  if (query) {
    projectList = searchDirectories({
      rootDir: searchDir,
      ignoreDirName,
      dirName: query,
      depth: searchDepth,
    }).filter(Boolean)

    if (!projectList.length) notMatches = true
  }

  if (!query || notMatches) {
    projectList = getRecentDirectories().filter(Boolean)

    if (notMatches) {
      projectList.unshift({
        title: 'Sorry, no matching results.',
        subtitle: 'Here are your recently folders opened with Visual Studio Code. 👇',
        arg: '',
        icon: {path: './404.png'},
      })
    }
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
  console.log(JSON.stringify({items}))
}
