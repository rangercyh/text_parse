// Lib imports
const { app, dialog, ipcMain, shell } = require('electron')
const fs = require('fs')
const path = require('path')
const util = require('util')

// Get package
const package = require('./package.json')

// Async
const readFile = util.promisify(fs.readFile)
const rename = util.promisify(fs.rename)
const writeFile = util.promisify(fs.writeFile)
const stat = util.promisify(fs.stat)

function registerIpcListeners(mainWindow) {
  ipcMain.on('showAbout', e => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: [
        '忽略',
        '查看代码'
      ],
      cancelId: 0,
      defaultId: 0,
      title: '文字切割机 - 关于',
      message: `文字切割机 v${package.version}\nCreated by 蔡毅恒`,
      detail: '文字切割机，方便按照标点和字数要求切割句子'
    }, async result => {
      if (result === 1) {
        shell.openExternal('https://github.com/rangercyh/text_parse', e => {})
      }
    })
  })

  ipcMain.on('loadFile',  e => {
    dialog.showOpenDialog(mainWindow, {
      title: '文字切割机 - 添加文本',
      defaultPath: app.getPath('documents'),
      filters: [
        { name: 'Texts', extensions: ['txt'] }
      ],
      properties: [
        'openFile'
      ]
    }, async paths => {
      if (!paths) return
      let files = []
      for (let fPath of paths) {
        let fileSize = await stat(fPath).size
        files.push({
          path: fPath,
          size: fileSize
        })
      }
      e.sender.send('filesSelected', files)
    })
  })
}

module.exports = registerIpcListeners
