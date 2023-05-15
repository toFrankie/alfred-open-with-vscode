# alfred-open-with-vscode

💻 An Alfred Workflow for opening folders with Visual Studio Code.

In Visual Studio Code, the `Ctrl + R` shortcut key provides a convenient way to switch between projects. Nonetheless, there are times when opening other projects in a new window is necessary, and this is the primary objective of this workflow.

## Features

Supports displaying the folders opened with Visual Studio Code most recently.

## Installation

```shell
# Install globally
$ npm i -g alfred-open-with-vscode

# Import to Alfred
$ alfred-open-with-vscode-import
```

After pressing the Alfred Hotkey, enter the `open` keyword to display the folders most recently opened with Visual Studio Code. Users can continue to enter the directory name to further search for the target folder, and then press `Enter` to open the folder with Visual Studio Code.

## Requirements

- Requires node 10+ environment.
- Requires zsh ([migrated to zsh](https://support.apple.com/en-ph/HT208050)).

## TODOs

- Support custom keywords.
- Sort by open frequency.
