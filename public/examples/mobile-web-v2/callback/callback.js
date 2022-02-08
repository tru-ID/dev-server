const params = new URLSearchParams(window.location.search)
const code = params.get('code')
const check_id = params.get('check_id')

const jsonResultEl = document.getElementById('json-result')
const iconResultEl = document.getElementById('icon-result')

if (!code) {
  // TODO show error
}
if (!check_id) {
  // TODO show error
}

if (code && check_id) {
  fetch('/v0.2/phone-check/exchange-code', {
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
      if (json.match) {
        iconResultEl.innerText = '✅'
      } else {
        iconResultEl.innerText = '❌'
      }
    })
    .catch((err) => {
      console.log(err)
      jsonResultEl.innerText = 'Error'
    })
}
