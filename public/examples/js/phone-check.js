window.tru = {}
window.tru.ID = {}

/**
 * 
 * @param {String} checkUrl The tru.ID `check_url` to be requested over the mobile data network as part of the verification workflow.
 * @param {Object} config 
 * @param {String} config.checkMethod When set to `image` the library will load the `check_url` using a zero pixel image loaded within an <iframe>. When set to `window` the check_url will briefly launch a window that will then be closed.
 * @param {Number} config.windowCloseTimeout The timeout period in milliseconds where the window is closed if `config.checkMethod` is set to `window`. Defaults to 3000 milliseconds.
 */
window.tru.ID.phoneCheck = function(checkUrl, config = {checkMethod: "image", debug: false}) {
    config.windowCloseTimeout = config.windowCloseTimeout ?? 3000

    function log() {
        if(config.debug) {
            console.log.apply(null, arguments)
        }
    }

    log('tru.ID:phoneCheck')
    if(!checkUrl) {
        throw new Error('tru.ID:phoneCheck: checkUrl is required')
    }

    return new Promise(function(resolve) {
        if(config.checkMethod === "image") {
            const imageScript = `
            const debug = ${config.debug}
            const img = new Image()
            img.style.height = 0
            img.style.width = 0
            img.setAttribute('referrerpolicy', 'no-referrer')
            img.src = "${checkUrl}"
        
            function handleEndEvent() {
                if(debug) {
                    console.log('image loaded')
                }
                window.parent.postMessage({check_url: "${checkUrl}"}, "${window.origin}")
            }
        
            img.onload = handleEndEvent
            img.onerror = handleEndEvent
            document.body.appendChild(img)
            `

            var iframe = document.createElement('iframe');
            iframe.style.display = "none"
            iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts')
            var html = `<body><script>${imageScript}</script></body>`;
            iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);

            function handleIFrameMessage(event) {
                log(event)
                if(event.data.check_url === checkUrl) {
                    window.removeEventListener('message', handleIFrameMessage)
                    document.body.removeChild(iframe)
                    resolve()
                }
            }
            window.addEventListener('message', handleIFrameMessage)

            document.body.appendChild(iframe);
        }
        else {
            const win = window.open(checkUrl)
            setTimeout(() => {
                win.close()
                resolve()
            }, config.windowCloseTimeout)
        }

    })
}