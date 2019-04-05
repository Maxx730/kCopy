module.exports.ShowToast = function ( mes,duration,options ) {
    let toast = document.getElementById('toast-message');
    let message = document.getElementById('message-content');

    message.innerText = mes;
    toast.classList.add('open');

    if ( options !== undefined && options !== null ) {
        if ( options.static !== undefined && options.static !== null && options.static ) {
            
        }
    } else {
        setTimeout(() => {
            toast.classList.remove('open')
        },duration )
    }
}