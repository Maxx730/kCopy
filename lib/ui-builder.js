const { ipcRenderer } = require( 'electron' )
const { getGlobal } = require('electron').remote
const Track = getGlobal('TrackEvent')
const User = getGlobal('User')


module.exports.Build = function( data,callback,actions ) {
        let toggles = document.getElementsByClassName('toggle');
        let contents = document.getElementsByClassName('content');
        
        for ( let i = 0;i < toggles.length;i++ ) {
            toggles[i].addEventListener('click',( event ) => {

                for ( let k = 0;k < toggles.length;k++ ) {
                    toggles[k].classList.remove('selected')
                    contents[k].classList.remove('focused')
                }

                if ( !event.target.classList.contains('selected') ) {
                    event.target.classList.add('selected')
                    callback ( event.target.id ) 
                    document.getElementById( event.target.id + '-content' ).classList.add('focused')
                }
            })
        }
        
        document.getElementById('clear-clipboard').addEventListener('click', () => {
            data.clipboard = [];
            ipcRenderer.send( 'save-data',data )
        })

        document.getElementById('search-clipboard-field').addEventListener('keyup',( event ) => {
            if ( actions !== undefined ) {
                for ( let i = 0;i < actions.length;i++ ) {
                    if ( actions[i].id === 'search-clipboard-field' ) {
                        actions[i].callback( event.target.value )
                    }
                }
            }
        })

        document.getElementById('export-clipboard').addEventListener('click',( event ) => {
            if ( actions !== undefined ) {
                for ( let i = 0;i < actions.length;i++ ) {
                    if ( actions[i].id === 'export-clipboard' ) {
                        actions[i].callback( event.target.value )
                    }
                }
            }
        })

        document.getElementById('import-clipboard').addEventListener('click',( event ) => {
            if ( actions !== undefined ) {
                for ( let i = 0;i < actions.length;i++ ) {
                    if ( actions[i].id === 'import-clipboard' ) {
                        actions[i].callback( event.target.value )
                    }
                }
            }
        })

        document.getElementById('shortcutTimeout').addEventListener('change',( event ) => {
            if ( event.target.value !== "" && event.target.value !== undefined) {
                if ( actions !== undefined ) {
                    for ( let i = 0;i < actions.length;i++ ) {
                        if ( actions[i].id === 'set-timeout' ) {
                            actions[i].callback( event.target.value )
                            document.getElementById('save-changes').removeAttribute('disabled')
                        }
                    }
                }    
            }        
        })

        document.getElementById('save-changes').addEventListener('click',() => {
            if ( actions !== undefined ) {
                for ( let i = 0;i < actions.length;i++ ) {
                    if ( actions[i].id === 'apply-changes' ) {
                        actions[i].callback()
                        document.getElementById('save-changes').setAttribute('disabled',true)
                    }
                }
            }           
        })
}