import '@babel/polyfill'
import Api from './utils/api'
import DOM from './utils/dom'

class AcceptNano {
  constructor() {
    this.onClose = this.onClose.bind(this)
    this.tick = this.tick.bind(this)
  }

  setup(options = {}) {
    this.options = Object.assign({}, AcceptNano.DEFAULT_OPTIONS, options)
    this.api = new Api({ url: this.options.apiURL })
    this.dom = new DOM({ onClose: this.onClose })
    this.reset()

    return this
  }

  reset() {
    this.state = AcceptNano.STATES.UNINITIALIZED

    this.onStart = null
    this.onSuccess = null
    this.onFailure = null
    this.onCancel = null

    clearInterval(this.interval)
    this.remainingSeconds = 0

    return this
  }

  tick() {
    this.remainingSeconds = this.remainingSeconds - 1
    this.dom.updateTime(this.remainingSeconds)

    if (this.remainingSeconds === 0) {
      this.onClose()
    }
  }

  startPayment({ data, onStart, onSuccess, onFailure, onCancel }) {
    this.log('Payment Starting', data)

    this.dom.mount()
    this.dom.showLoading()
    this.state = AcceptNano.STATES.STARTING

    this.onStart = onStart
    this.onSuccess = onSuccess
    this.onFailure = onFailure
    this.onCancel = onCancel

    this.api.pay(data)
      .then(({ data }) => {
        this.state = AcceptNano.STATES.STARTED
        this.remainingSeconds = data.remainingSeconds
        this.interval = setInterval(this.tick, 1000)

        if (typeof this.onStart === 'function') {
          this.onStart(data)
        }

        this.dom.showPaymentInfo(data)

        this.shouldVerify = true
        this.verifyPayment(data.token)
      })
      .catch((error) => {
        this.onPaymentFailed(error)
      })
  }

  verifyPayment(token) {
    this.log('Payment Verifying', { token })

    this.api.verify(token)
      .then(({ data }) => {
        if (data.merchantNotified) {
          return this.onPaymentSucceeded(data)
        }

        if (this.shouldVerify) {
          return setTimeout(() => this.verifyPayment(token), this.options.pollInterval)
        }
      })
      .catch((error) => {
        this.onPaymentFailed(error)
      })
  }

  onPaymentSucceeded(data) {
    this.log('Payment Succeeded', data)
    this.state = AcceptNano.STATES.SUCCEEDED
    this.dom.showPaymentSucceededMessage(data)
    clearInterval(this.interval)

    if (typeof this.onSuccess === 'function') {
      this.onSuccess(data)
    }
  }

  onPaymentFailed(error) {
    this.log('Payment Failed', error)
    this.state = AcceptNano.STATES.FAILED
    this.dom.showPaymentFailureMessage(error)
    clearInterval(this.interval)

    if (typeof this.onFailure === 'function') {
      this.onFailure(error)
    }
  }

  onClose() {
    if (this.state === AcceptNano.STATES.STARTED) {
      this.shouldVerify = false
      this.log('Payment Cancelled')

      if (typeof this.onCancel === 'function') {
        this.onCancel()
      }
    }

    this.reset()
    this.dom.unmount()
  }

  log(message, payload = {}) {
    if (!this.options.debug) {
      return
    }

    console.log(`ACCEPT BCB -> ${message}`, payload)
  }
}

AcceptNano.DEFAULT_OPTIONS = {
  debug: false,
  pollInterval: 1500,
  apiURL: null,
}

AcceptNano.STATES = {
  UNINITIALIZED: 0,
  STARTING: 1,
  STARTED: 2,
  SUCCEEDED: 3,
  FAILED: 4,
}

module.exports = new AcceptNano()

