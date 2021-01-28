window.tru = {}
window.tru.ID = {}
window.tru.ID.phoneCheck = function(checkUrl) {
    console.log('tru.ID:phoneCheck')
    if(!checkUrl) {
        throw new Error('tru.ID:phoneCheck: checkUrl is required')
    }

    return new Promise(function(resolve) {
        const userAgent = window.navigator.userAgent
        if( userAgent.toLowerCase().indexOf('Android') !== 0 &&
            userAgent.toLowerCase().indexOf('Chrome') !== 0) {
            // Chrome on Android
            const win = window.open(checkUrl)
            setTimeout(() => {
                win.close()
                resolve()
            }, 2000)
        }
        else {
            const img = new Image()
            img.style.height = 0
            img.style.width = 0
            img.setAttribute('referrerpolicy', 'no-referrer')
            img.src = checkUrl
        
            function handleEndEvent() {
                document.body.removeChild(img)
                resolve()
            }
        
            img.onload = handleEndEvent
            img.onerror = handleEndEvent
            document.body.appendChild(img)
        }
    })
}