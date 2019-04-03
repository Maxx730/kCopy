module.exports.ShowToast = function ( mes,duration ) {
    let toast = document.getElementById('toast-message');
    let message = document.getElementById('message-content');

    message.innerText = mes;
    toast.classList.add('open');

    setTimeout(() => {
        toast.classList.remove('open')
    },duration )
}