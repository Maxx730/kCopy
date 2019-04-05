const { ipcRenderer,shell } = require( 'electron' )
const { getGlobal } = require('electron').remote
const Track = getGlobal('TrackEvent')
const User = getGlobal('User')
const UiBuilder = require('./lib/ui-builder.js')
const Toast = require('./lib/toast.js')
const uuid = require('uuid')
const appVersion = require('electron').remote.app.getVersion()

let data;
let screen = "clipboard";

const hasUpdate = new Promise( ( resolve,reject ) => {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            try {
                let result = JSON.parse( xhttp.responseText )

                if ( appVersion < result.name ) {
                    resolve( xhttp.responseText )
                    //document.getElementById('update-indicator').classList.remove('hide')
                    //document.getElementById('update-text').innerHTML = "Click <a id='update-link' href = '" + result.url + "'>here</a> to download the latest update."
                } else {
                    reject( "APPLICATION UP TO DATE" )
                }
            } catch ( error ){
                reject( "ERROR PARSING JSON DATA" )
            }
        }
    };
    xhttp.open("GET", "https://api.github.com/repos/Maxx730/kCopy/releases/latest", true);
    xhttp.send();
})

ipcRenderer.on( 'loaded-data',( event,arg ) => {

    let test = hasUpdate.then( ( message ) => {
        Toast.ShowToast( 'New Update Found',1500,{
            static: true
        } )
    } ).catch( ( err ) => {
        Toast.ShowToast( message,1500 )
    } )

    Track( User,'DATA LOADED','LOADED' )
    //Once the data has been loaded we can fill out the data however we want in the ui;
    switch ( screen ) {
        case "notes" :
            RenderInputs( arg )
        break;
        case "clipboard":
            RenderClipBoard( arg )
        break;
    }

    document.getElementById('shortcutTimeout').value = arg.preferences.shortcutTimeout;
    
    data = arg;
    UiBuilder.Build( data,( tar ) => {
        screen = tar;
    
        switch ( screen ) {
            case "clipboard":
                RenderClipBoard ( data )
            break;
        }
    },[{
        id:'search-clipboard-field',
        callback: ( term ) => {
            RenderClipBoard( data,term )
        }
    },{
        id:'export-clipboard',
        callback: () => {
            Track( User,'CLIPBOARD','EXPORTED' )
            ipcRenderer.send( 'export-clipboard',data )
        }
    },{
        id:'import-clipboard',
        callback: () => {
            Track( User,'CLIPBOARD','IMPORTED' )
            ipcRenderer.send( 'import-clipboard',null )
        }
    },{
        id:'clipboard-cleard',
        callback: () => {
            TrackEvent( User,'CLIPBOARD','CLEARED' )
        }
    },{
        id:'set-timeout',
        callback: ( val ) => {
            data.preferences.shortcutTimeout = val;
            Track( User,'SHORTCUT','TIME CHANGED' )
        }
    },{
        id:'apply-changes',
        callback: () => {
            Track( User,'SETTINGS','APPLIED' )
            Toast.ShowToast( 'Settings Saved',2500 )
            ipcRenderer.send( 'save-data',data )
        }
    },{
        id:'setting-input',
        callback: ( target,value ) => {
            Object.keys( data.preferences ).forEach( key => {
                if ( key === target ) {
                    data.preferences[ key ] = value
                }
            })
        }
    }]);
})

ipcRenderer.on('update-message',( event,args ) => {
    document.getElementsByTagName('BODY')[0].innerHTML = args;
})

ipcRenderer.on('data-imported',( event,args ) => {
    data = args;
    Toast.ShowToast( 'Clipboard Imported!',2500 )
    RenderClipBoard( data )
})

//Renders all the input lines based on the size of the window.
function RenderInputs ( data ) {
    let list = document.getElementById( 'note-list' );
    let fields = document.getElementsByClassName( 'note-field' );
    let amount = Math.floor(window.innerHeight / fields[0].offsetHeight);
    let output;

    if ( fields.length < amount ) {
        output = list.innerHTML
    } else {
        output = ''
    }

    for ( let i = 0;i < amount;i++ ) {
        let value = '';

        if ( data.notes[i] !== undefined ) {
            value = data.notes[i].title
        }

        output += '<li id = "note-' + i + '" class = "note-field"><input id = "note-input-' + i + '" type = "text" value="' + value + '"/></li>';
    }

    list.innerHTML = output;
    InitInputEvents()
}

function InitInputEvents () {
    let fields = document.getElementsByClassName( 'note-field' );

    for ( let i = 0;i < fields.length;i++ ) {
        fields[i].addEventListener('change', ( event ) => {
            let id = event.target.id.split('-')[2]

            data.notes[i] = {
                id: id,
                title: event.target.value,
                body: ""
            }

            ipcRenderer.send( 'save-data',data )
        });
    }
}

function RenderClipBoard ( data,search ) {
    document.getElementById('clipboard-list').innerHTML = ''
    let items = [];

    for ( let i = 0;i < data.clipboard.length;i++ ) {
        if ( search !== undefined) {
            if ( data.clipboard[i].includes( search ) ) {
                item = document.createElement('LI');
                item.classList.add('clip');
                item.innerText = data.clipboard[i]
                item.addEventListener('click', ( event ) => {   
                    document.getElementById('search-clipboard-field').value = '';
                    ipcRenderer.send( 'apply-clipboard',event.target.innerText )
                    Toast.ShowToast( 'Saved to Clipboard!',1500 )
                })

                items.push( item )
            }
        } else {
            item = document.createElement('LI');
            item.classList.add('clip');
            item.innerText = data.clipboard[i]
            item.addEventListener('click', ( event ) => {
                ipcRenderer.send( 'apply-clipboard',event.target.innerText )
                Toast.ShowToast( 'Saved to Clipboard!',1500 )
            })
            items.push( item )
        }
    }
    
    items.forEach( item => {
        document.getElementById('clipboard-list').appendChild( item )
    })
}

window.onresize = function () {
    if ( screen === "notes" ) {
        //We need to determine how many inputs are already there and 
        //add if it gets bigger.
        RenderInputs( data )        
    }
}