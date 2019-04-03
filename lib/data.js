const filesystem = require('fs')
const uuid = require('uuid')
const DEVMODE = true;
const { TrackEvent } = require('./analytics.js')

//On first load we want to check if the file exists, if not 
//then we want to create the baseline preferences and data files.
module.exports.CheckForFile =  function ( filename,callback ) {
    try {
        if ( filesystem.existsSync( 'data/' + filename + '.json' ) ) {
            if ( DEVMODE ) {
               console.log( "ATTEMPTING TO LOAD FILE" ) 
            }
            
            filesystem.readFile( 'data/' + filename + '.json',( err,data ) => {
                if ( !err ) {
                    if ( DEVMODE ) {
                        console.log( "SUCCESSFULLY LOADED FILE" ) 
                     }
                    callback( JSON.parse( data ) )
                } else {
                    console.log( err );
                    callback( null )
                }
            });
        } else {
            if ( DEVMODE ) {
                console.log( "CREATING NEW FILE" ) 
            }
            let data = {};

            if ( filename === 'data' ) {
                data = {
                    preferences: {
                        userId: uuid(),
                        shortcutTimeout: 5
                    },
                    notes:[],
                    clipboard:[]
                }
            }
            //If the file does not exist we want to then create the default template
            //for the file.
            module.exports.CreateFile ( 'data/' + filename + '.json',data,( file ) => {
                callback( file )
            })
        }
    } catch ( err ) {
        if ( DEVMODE ) {
            console.log( "ERROR FINDING FILE" )
            console.log( err )
         }
        return callback( null );
    }
}

module.exports.CreateFile = function ( filename,data,callback ) {
    filesystem.writeFile( filename,JSON.stringify( data ), ( err ) => {
        if ( DEVMODE ) {
            console.log( "FILE CREATED" ) 
        }

        if ( callback !== undefined && callback !== null) {
            callback ( data )
        }
    })
}

module.exports.ReadFile = function ( path,callback ) {
    filesystem.readFile( path,'utf8',( err,data ) => {
        if ( !err ) {
            callback( data )
        } else {
            console.log( err );
        }
    });
}

module.exports.FileExists = function ( path ) {
    try {
        if ( filesystem.existsSync ( path ) ) {
            return true;
        } else {
            return false;
        }
    } catch ( err ) {
        return false;
    }
}