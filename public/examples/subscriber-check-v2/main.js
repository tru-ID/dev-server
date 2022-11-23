function setStatus(status) {
  console.log(status)
  document.body.classList = [status]
}

function handleError(errorMessage) {
  document.getElementById('error_notice_message').innerText = errorMessage
  setStatus('error')
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
async function checkCoverage() {
  setStatus('loading')
  clearProgress()

  console.log('requesting coverage')
  try {
    const deviceCoverageResult = await axios.get('/device', {
      validateStatus: (status) => status >= 200 && status <= 412,
    })
    console.log(deviceCoverageResult)

    // If there's no coverage then prompt the user to turn off WiFi if it's enabled and recheck.
    if (deviceCoverageResult.status === 200) {
      // tru.ID has coverage
      setStatus('has-coverage')
    } else if (deviceCoverageResult.status === 400) {
      // No coverage
      setStatus('no-coverage')
    } else if (deviceCoverageResult.status === 412) {
      // No coverage
      setStatus('no-mobile-ip')
    } else {
      handleError('Unexpected result from device coverage check.')
    }
  } catch (ex) {
    handleError('An error occurred while checking device coverage.')
  } finally {
    const subscriberCheckBox = document.getElementById('subscriber_check')
    subscriberCheckBox.classList.remove('hidden')
  }
}

async function subscriberCheckFormSubmit(ev) {
  ev.preventDefault()
  setStatus('checking')
  clearProgress()
  progressUpdate('✅ Initiating Phone Verification')

  const phoneNumberEl = document.getElementById('phone_number')
  let phoneNumberValue = phoneNumberEl.value

  // strip spaces out of the phone number and replace within input
  phoneNumberValue = phoneNumberValue.replace(/\s+/g, '')
  phoneNumberEl.value = phoneNumberValue
  phoneNumberEl.blur()

  try {
    // Create SubscriberCheck resource
    const subscriberCheckCreateResult = await axios.post('/v0.2/subscriber-check', {
      phone_number: phoneNumberValue,
      redirect_url: `${window.location.origin}/examples/subscriber-check-v2/callback`,
    })

    console.log(subscriberCheckCreateResult)

    if (subscriberCheckCreateResult.status === 200) {
      progressUpdate('✅ Creating Mobile Data Session')

      // Execute the SubscriberCheck
      const checkMethod = document.getElementById('check_method_image').checked
        ? 'image'
        : 'window'

      await tru.ID.openCheckUrl(subscriberCheckCreateResult.data.check_url, {
        checkMethod,
        debug: true,
        // we don't care here as we are already doing
        // the device coverage check automatically on page load
        // through the node server
        checkDeviceCoverage: false,
      })
    } else {
      console.error(subscriberCheckFormSubmit)

      handleError('An error occurred while creating a SubscriberCheck.')
    }
  } catch (error) {
    console.error(error)

    if (error.response.status === 400) {
      handleError(
        'Your Mobile Network is not supported or you may be on WiFi, if so disconnect from WiFi.',
      )
    } else {
      handleError('An error occurred while creating a SubscriberCheck.')
    }
  }
}

document
  .getElementById('wifi_retry')
  .addEventListener('click', checkCoverage, false)
document
  .getElementById('error_retry')
  .addEventListener('click', checkCoverage, false)
document
  .getElementById('subscriber_check_form')
  .addEventListener('submit', subscriberCheckFormSubmit, false)

const browser = bowser.getParser(window.navigator.userAgent)
const info = `Browser: ${browser.getBrowserName()} ${browser.getBrowserVersion()} | OS: ${browser.getOSName()} ${browser.getOSVersion()}`
document.getElementById('device_info').innerText = info

checkCoverage()
