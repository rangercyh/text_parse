// import { webFrame, ipcRenderer, shell, remote } from 'electron'
const { webFrame, ipcRenderer, shell, remote } = require('electron')
const vueTips = require('vue-tips')
const fs = require('fs')
const util = require('util')
const iconv = require('iconv-lite')

// Prevent file dropping on document
document.addEventListener('dragover', e => { e.preventDefault(); return false; }, false)
document.addEventListener('drop', e => { e.preventDefault(); return false; }, false)

const Vue = require('vue/dist/vue.min')
const feather = require('feather-icons')
const file_read = util.promisify(fs.readFile)

const reg_init = ["，", "。", "？", "！", "~", "、", "；", "……", "——"]

Vue.use(vueTips)
feather.replace()

function init_something() {
  this.talk_obj.clear()
  this.start_idx = this.npc_start_index
  this.talk_obj.set("玩家", this.player_index)
  this.origin_line_num = 0
  this.output_list = []
  this.output_text = ""
}

function split_msg(msg) {
  if (msg.length > 0) {
    let list = msg.split(/\r?\n/)
    if (list.length > 0) {
      return list
    }
  }
}

function split_sentence(msg) {
  if (msg.length > 0) {
    let list = msg.split(/{([^}]+)}/)
    if (list.length > 0) {
      return list
    }
  }
}

function add_to_list(list, idx, msg) {
  if (msg.length > 0) {
    list.push({
      idx: idx,
      msg: msg,
      len: msg.length
    })
  }
}

function create_split_sentence(match_list) {
  let name = match_list[1].trim()
  if (!this.talk_obj.has(name)) {
    this.talk_obj.set(name, this.start_idx++)
  }
  let idx = this.talk_obj.get(name)
  let msg = match_list[2].trim()
  if (msg.length > this.parse_text_max_num) {
    let temp = ""
    let sentence = msg.split(this.reg)
    sentence.forEach(str => {
      if (this.reg.test(str)) {
        temp += str
      } else {
        if ((temp + str).length < this.parse_text_max_num) {
          temp += str
        } else {
          add_to_list(this.output_list, idx, temp)
          temp = str
        }
      }
    })
    if (temp.length > 0) {
      add_to_list(this.output_list, idx, temp)
    }
  } else {
    add_to_list(this.output_list, idx, msg)
  }
}

function format_text_string(compact) {
  this.compact = compact
  if (this.output_list.length > 0) {
    this.output_text = ""
    this.output_list.forEach(item => {
      if (compact) {
        this.output_text += ('{' + item.idx + ',' + item.msg + '},')
      } else {
        this.output_text += (item.idx + ',' + item.msg + '   --->>> 长度：' + item.len + '\n')
      }
    })
    if (compact) {
      this.output_text = this.output_text.slice(0, -1)
    }
  }
}

function parse_text_string(compact) {
  this.compact = compact
  if (this.compact) {
    let list = split_msg(this.output_text)
    this.output_text = ""
    if (list != undefined) {
      list.forEach(str => {
        if (str.length > 0) {
          let match_list = str.match(/^(\d+?)[,](.+)--->>>/)
          if (match_list != null) {
            this.output_text += ('{' + match_list[1].trim() + ',' + match_list[2].trim() + '},')
          }
        }
      })
      this.output_text = this.output_text.slice(0, -1)
    }
  } else {
    let list = split_sentence(this.output_text)
    this.output_text = ""
    if (list != undefined) {
      list.forEach(str => {
        if (str.length > 0) {
          let match_list = str.match(/^(\d+?)[,](.+)/)
          if (match_list != null) {
            this.output_text += (match_list[1].trim() + ',' + match_list[2].trim() + '   --->>> 长度：' + match_list[2].trim().length + '\n')
          }
        }
      })
    }
  }
}

function concat_split_key(list) {
  let ret = ""
  list.forEach(key => {
    ret += key + '|'
  })
  return ret.slice(0, -1)
}

function get_split_reg(list) {
  let reg = "("
  list.forEach(key => {
    reg += key + '|'
  })
  return new RegExp(reg.slice(0, -1) + ')')
}

// Create Vue app
let app = new Vue({
  el: '#app',
  components: {
  },
  data: {
    output_list: [],
    origin_line_num: 0,
    max_parse_text_num: 50,
    parse_text_max_num: 27,
    message: "",
    talk_obj: new Map(),
    start_idx: 1,
    player_index: 10,
    npc_start_index: 20,
    output_text: "",
    compact: false,
    split_key: reg_init,
    split_str: concat_split_key(reg_init),
    reg: get_split_reg(reg_init),
  },
  watch: {
    parse_text_max_num: function(new_num, old_num) {
      this.run()
    },
    split_str: function(value) {
      this.split_key = value.split('|')
      this.reg = get_split_reg(this.split_key)
    },
  },
  methods: {
    loadText: () => ipcRenderer.send('loadFile'),

    showAbout: () => ipcRenderer.send('showAbout'),

    run: function() {
      let list = split_msg(this.message)
      if (list != undefined) {
        init_something.call(this)
        list.forEach(str => {
          if (str.length > 0) {
            let match_list = str.match(/^(.+?)[：:](.+)/)
            if (match_list != null) {
              this.origin_line_num++
              create_split_sentence.call(this, match_list)
            }
          }
        })
        format_text_string.call(this, false)
      }
    },

    str_format: function() {
      parse_text_string.call(this, !this.compact)
      // format_text_string.call(this, !this.compact)
    },

    reset_reg: function() {
      this.split_key = reg_init
      this.split_str = concat_split_key(reg_init)
      this.reg = get_split_reg(reg_init)
    }
  },

  // Only show the application window when Vue has mounted
  mounted: () => {
    remote.getCurrentWindow().show()
  }
})

ipcRenderer.on('filesSelected', (e, args) => {
  if (args) args.forEach(file => {
    file_read(file.path).then((data) => {
      app.message = iconv.decode(data, 'gbk')
    }).catch((error) => {
      console.error(error)
    })
  })
})
