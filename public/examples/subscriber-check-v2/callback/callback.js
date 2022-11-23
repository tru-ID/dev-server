const params = new URLSearchParams(window.location.search)
const code = params.get('code')
const check_id = params.get('check_id')
const errorMessage = params.get('error')

const jsonResultEl = document.getElementById('json-result')
const iconResultEl = document.getElementById('icon-result')
const errorResult = document.getElementById('error-result')

if (errorMessage === 'mno_redirect_unsupported') {
  errorResult.innerHTML = "The Mobile Network Operator (MNO) associated with phone number does not support redirects."
  iconResultEl.innerText = '❌'
} else if (!code) {
  errorResult.innerHTML = "No code provided. A code is required to complete the check."
  iconResultEl.innerText = '❌'
} else if (!check_id) {
  errorResult.innerText = "No check_id provided. A check_id is required to complete the check."
  iconResultEl.innerText = '❌'
}

if (code && check_id) {
  fetch('/v0.2/subscriber-check/exchange-code', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      check_id,
      code,
    }),
  })
    .then((res) => res.json())
    .then((json) => {
      console.log(JSON.stringify(json, null, 2))
      jsonResultEl.innerText = JSON.stringify(json)
      if (json.match && json.no_sim_change) {
        iconResultEl.innerText = 'Is a Match! And no SIM change! ✅'
      } else if (json.match && json.no_sim_change === false) {
        iconResultEl.innerText = 'Is a Match but SIM has recently changed! ❌'
      } else {
        iconResultEl.innerText = '❌'
      }
    })
    .catch((err) => {
      console.log(err)
      jsonResultEl.innerText = 'Error'
    })
}
