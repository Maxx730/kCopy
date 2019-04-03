
function TrackEvent ( ua,category,action ) {
    ua.event( category,action ).send()
}

module.exports = { TrackEvent }