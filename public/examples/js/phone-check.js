window.truID = {}
window.truID.phoneCheck = function(checkUrl) {
    console.log('truId:phoneCheck')
    if(!checkUrl) {
        throw new Error('truId:phoneCheck: checkUrl is required')
    }

    return new Promise(function(resolve) {
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
    })
}