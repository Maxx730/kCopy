const Files = require('./lib/data.js')
const {app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron')
const clipboard = require('electron-clipboard-extended')
const { toKeyEvent } = require('keyboardevent-from-electron-accelerator');
const type = require('file-type')
const buff = require('read-chunk')
const ua = require('universal-analytics')
let user;
const { TrackEvent } = require('./lib/analytics.js')

let mainWindow,shortWindow;
let data;
let lastKey = 0;
let fadeTimeout, shortcutIndex = 0;
let dialogOpen = false;


function createWindow ( data ) {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    applicationData: data
  })

mainWindow.loadFile('index.html')
  mainWindow.on('closed', function () {
    TrackEvent( user,'APPLICATION','CLOSED' )
    mainWindow = null
  })
}

ipcMain.on( 'save-data',( event,args ) => {
    Files.CreateFile( 'data/data.json',args,() => {
        console.log("FILE SUCCESSFULLY SAVED!")
        Files.CheckForFile( 'data',( file ) => {
            data = file;
            mainWindow.webContents.send( 'loaded-data',file )
        })
    })
})

ipcMain.on('export-clipboard',( event,args ) => {
  if ( !dialogOpen ) {
    dialogOpen = true;
    dialog.showSaveDialog( mainWindow,{
        defaultPath: 'kcopy-backup.json'
    },( path ) => {
        if ( path !== null && path !== undefined ) {
            Files.CreateFile( path,data,() => {
              
            } )
        }

        dialogOpen = false;
    })
  }
})

ipcMain.on('import-clipboard',( event,args ) => {
  if ( !dialogOpen ) {
    dialogOpen = true;
    dialog.showOpenDialog( mainWindow,{
        filters:[
            { name:'JSON',extensions:['json'] }
        ]
    },( path ) => {
        if ( path !== null && path !== undefined && path.length > 0 ) {
            let chunk = buff.sync( path[0],0,type.minimumBytes );

            if ( type(chunk) === null ) {
                Files.ReadFile( path[0],( data ) => {
                    let temp = JSON.parse( data )
                    
                    if ( temp.clipboard !== null ) {
                        data = temp;
                        Files.CreateFile( 'data/data.json',data,() => {
                            mainWindow.webContents.send('data-imported',data)
                            
                        })
                    }
                })
            }
        }

        dialogOpen = false;
    })
  }
})

ipcMain.on( 'apply-clipboard',(event,args) => {
    TrackEvent( user,'CLIPBOARD','APPLIED' )
    clipboard.writeText( args )
})

app.on('ready', () => {
    Files.CheckForFile( 'data',( file ) => {
        createWindow( file );
        data = file;
        user = ua( 'UA-85720731-3',data.preferences.userId )
    
        global.TrackEvent = TrackEvent;
        global.User = user;
        
        TrackEvent( user,"APPLICATION","OPENED" )
        mainWindow.webContents.on( 'did-finish-load',() => {
            mainWindow.webContents.send( 'loaded-data',file )
        })
    })

    shortWindow = new BrowserWindow({
      height: 100,
      width: 260,
      x: 20,
      y: 20,
      frame: false,
      useContentSize: true
    })

    shortWindow.loadFile('popup.html')
    shortWindow.hide()

    //ADD OUR GLOBAL KEYBOARD SHORTCUTS HERE.
    globalShortcut.register('CommandOrControl+Right',( event ) => {
      shortWindow.show()

      if ( data.clipboard.length > 0) {
        if ( shortcutIndex === data.clipboard.length - 1 ) {
          shortcutIndex = 0;
        } else {
          shortcutIndex++;
        }
      }

      TrackEvent( user,'SHORTCUT','RIGHT' )

      shortWindow.webContents.send('shortcut-tapped',data.clipboard[ shortcutIndex ])
      clipboard.writeText( data.clipboard[ shortcutIndex ] )

      clearTimeout( fadeTimeout )

      fadeTimeout = setTimeout( function() {
        shortWindow.hide()
      },data.preferences.shortcutTimeout * 1000 )
    })

    globalShortcut.register('CommandOrControl+Left',( event ) => {
      shortWindow.show()
      
      if ( data.clipboard.length > 0) {
        if ( shortcutIndex === 0 ) {
          shortcutIndex = data.clipboard.length - 1
        } else {
          shortcutIndex--;
        }
      }

      TrackEvent( user,'SHORTCUT','LEFT' )

      shortWindow.webContents.send('shortcut-tapped',data.clipboard[ shortcutIndex ])
      clipboard.writeText( data.clipboard[ shortcutIndex ] )

      clearTimeout( fadeTimeout )

      fadeTimeout = setTimeout( function() {
        shortWindow.hide()
      },data.preferences.shortcutTimeout * 1000 )
    })

    globalShortcut.register('CommandOrControl+Enter',() => {
      shortWindow.hide()
    })
})

app.on('window-all-closed', function () {
    app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

//Logic for jumpcut type features.
clipboard.on('text-changed', () => {
    if ( data !== undefined ) {
        data.clipboard.push( clipboard.readText() )
        Files.CreateFile( 'data/data.json',data,() => {
            mainWindow.webContents.send( 'loaded-data',data )
        })
    }
}).startWatching()
