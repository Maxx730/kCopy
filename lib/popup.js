const { ipcRenderer } = require( 'electron' )

ipcRenderer.on( 'shortcut-tapped',( event,arg ) => {
    document.getElementById('message-content').innerText = arg;
})