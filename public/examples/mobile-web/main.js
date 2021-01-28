function handleError(errorMessage) {
    document.getElementById('error_notice_message').innerText = errorMessage
    document.body.classList = ['error']
}

function progressUpdate(updateMsg) {
    const el = document.getElementById('check_progress')
    const updateEl = document.createElement('div')
    updateEl.innerText = updateMsg
    el.append(updateEl)
}

function clearProgress() {
    document.getElementById('check_progress').innerHTML = ''
}

// Get coverage based on device IP.
// If there's no coverage then prompt the user to turn off WiFi if it's enabled and recheck.
async function checkCoverage() {
    document.body.classList = ['loading']
    clearProgress()

    console.log('requesting coverage')
    try {
        const deviceCoverageResult = await axios.get('/device', {
            validateStatus: function (status) {
                return status >= 200 && status <= 404;
            },
        })
        console.log(deviceCoverageResult)

        if(deviceCoverageResult.status === 200) {
            // tru.ID has coverage
            document.body.classList = ['has-coverage']
        }
        else if(deviceCoverageResult.status === 404) {
            // No coverage
            document.body.classList = ['no-coverage']
        }
    }
    catch(ex) {
        handleError('An error occurred while checking device coverage.')
    }
}

async function phoneCheckFormSubmit(ev) {
    ev.preventDefault()

    progressUpdate('Initiating Phone Verification')
    const phoneNumberEl = document.getElementById('phone_number')
    let phoneNumberValue = phoneNumberEl.value

    phoneNumberValue = phoneNumberValue.replace(/\s+/g, '')
    phoneNumberEl.value = phoneNumberValue

    try {
        const phoneCheckCreateResult = await axios.post('/phone-check', {phone_number: phoneNumberValue})
        console.log(phoneCheckCreateResult)
        if(phoneCheckCreateResult.status === 200) {
            progressUpdate('Creating Mobile Data Session')
            await truID.phoneCheck(phoneCheckCreateResult.data.check_url)

            getPhoneCheckResult(phoneCheckCreateResult.data.check_id)
        }
        else {
            console.error(phoneCheckFormSubmit)
            handleError('An error occurred while creating a PhoneCheck.')
        }
    }
    catch(error) {
        console.error(error)
        handleError('An error occurred while creating a PhoneCheck.')
    }
}

async function getPhoneCheckResult(checkId) {
    try {
        const phoneCheckResult = await axios.get(`/phone-check?check_id=${checkId}`)
        console.log(phoneCheckResult)

        progressUpdate(`Phone Number match: ${phoneCheckResult.data.match? '✅': '❌'}`)
    }
    catch(error) {
        console.error(error)
        handleError('An error occurred while retrieving the PhoneCheck result.')
    }
}

document.getElementById('wifi_retry').addEventListener('click', checkCoverage, false)
document.getElementById('error_retry').addEventListener('click', checkCoverage, false)
document.getElementById('phone_check_form').addEventListener('submit', phoneCheckFormSubmit, false)

checkCoverage()