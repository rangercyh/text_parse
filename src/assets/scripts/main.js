// import { webFrame, ipcRenderer, shell, remote } from 'electron'
const { webFrame, ipcRenderer, shell, remote } = require('electron')

// Prevent file dropping on document
document.addEventListener('dragover', e => { e.preventDefault(); return false; }, false)
document.addEventListener('drop', e => { e.preventDefault(); return false; }, false)

const Vue = require('vue/dist/vue.min')
const feather = require('feather-icons')

feather.replace()

// Create Vue app
let app = new Vue({
  el: '#app',
  components: {
  },
  data: {
  },
  methods: {
    loadText: () => ipcRenderer.send('loadFile'),

    showAbout: () => ipcRenderer.send('showAbout'),

    run: function() {

    },
  },

  // Only show the application window when Vue has mounted
  mounted: () => remote.getCurrentWindow().show()
})

ipcRenderer.on('filesSelected', (e, args) => {
  if (args) args.forEach(file => {

  })
})
