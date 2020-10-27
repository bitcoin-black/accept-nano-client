import { el, setStyle, setChildren, mount, unmount } from 'redom'
import { Spinner } from 'spin.js'
import QRCode from 'qrcode'
import Big from 'big.js';

const multNANO = Big('1000000000000000000000000000000');

class DOM {
  constructor({ onClose }) {
    this.onClose = onClose

    this.container = el('div', {
      id: 'accept-nano',
      style: `
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        background: rgba(32, 36, 47, 0.8)!important;
        position: fixed!important;
        top: 0!important;
        left: 0!important;
        width: 100%!important;
        height: 100%!important;
        z-index: 999999999999999!important;
        overflow: scroll!important;
      `
    })

    this.main = el('div', {
      style: `
        position: absolute!important;
        margin: 5% 0!important;
        background: #F8F8F8!important;
        width: 360px!important;
        height: auto!important;
        text-align: center!important;
        border-radius: ${DOM.sharedStyles.mainBorderRadius}!important;
        box-shadow: 0 2px 32px 0 rgba(0, 0, 0, 0.85)!important;
        top: 20%!important;
        left: 50%!important;
        transform: translate(-50%, -20%)!important;
      `
    })

    this.statusBar = el('div', {
      style: `
        color: white!important;
        background: ${DOM.colors.navy}!important;
        font-size: 12px!important;
        padding: 8px!important;
      `
    }, 'Starting...')


    this.content = el('div', {
      style: `
        padding: 20px 30px!important;
      `,
    })

    this.createHeader()
    this.createFooter()

    setChildren(this.main, [
      this.header,
      this.statusBar,
      this.content,
      this.footer,
    ])
  }

  createHeader() {
    this.header = el('div', {
      style: `
        background: ${DOM.colors.blue}!important;
        padding: 20px!important;
        height: 18px!important;
        border-top-left-radius:  ${DOM.sharedStyles.mainBorderRadius}!important;
        border-top-right-radius:  ${DOM.sharedStyles.mainBorderRadius}!important;
      `,
    })

    const headerTitle = el('img', {
      src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMCIgd2lkdGg9IjE1MHB0IiBoZWlnaHQ9IjUwcHQiIHZpZXdCb3g9IjAgMCA2NTYuMDAwMDAwIDEyNy4wMDAwMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiIGNsYXNzPSJpbmplY3RlZC1zdmcgVmVydExvZ28gZC1ub25lIGQtbWQtYmxvY2siIGRhdGEtc3JjPSIvc3RhdGljL21lZGlhL1ZlcnQgTG9nby5jOWFmMTZiYi5zdmciPgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCwxMjcuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNMzM1IDEwODkgbC00MCAtOSAtMzIgLTE4MyBjLTE4IC0xMDAgLTQ5IC0yNzYgLTY5IC0zOTIgLTIxIC0xMTYgLTQxIC0yMTEgLTQ2IC0yMTMgLTQgLTIgLTggLTE2IC04IC0zMiAwIC0yNSA1IC0yOSA1OCAtNDQgMzYgLTEwIDk2IC0xNiAxNTUgLTE2IDg2IDAgMTA1IDMgMTYwIDI5IDEwNCA0OCAxNzIgMTMyIDIwMyAyNTEgMzQgMTMyIDMgMjU0IC03OCAzMDcgLTUyIDM1IC0xNjEgNDQgLTIzMyAxOSAtNDMgLTE0IC00NiAtMTQgLTQxIDIgMyA5IDE1IDcxIDI2IDEzNyAxMSA2NiAyMyAxMjggMjYgMTM4IDYgMTkgLTE0IDIxIC04MSA2eiBtMjMwIC0zOTkgYzM3IC0zNSA0OSAtOTAgMzUgLTE2OCAtMTcgLTEwMCAtNDggLTE1MCAtMTIyIC0xOTcgLTIxIC0xMyAtNDggLTE3IC0xMDkgLTE3IC00NSAxIC04MyAzIC04NSA1IC0yIDIgOSA4MiAyNiAxNzggMTYgOTYgMzAgMTc3IDMwIDE4MCAwIDUgNDUgMjcgOTAgNDMgMzQgMTMgMTExIC0xIDEzNSAtMjR6Ij48L3BhdGg+CjxwYXRoIGQ9Ik0zNzMyIDEwODcgbC01MiAtMTAgMiAtNDIwIDMgLTQyMCA2MCAtMTUgYzMzIC04IDEwNyAtMTUgMTY1IC0xNiA4NyAwIDExMyAzIDE1MSAyMSA2NCAzMCAxMTYgNzcgMTQ3IDEzNyAyNSA0NyAyNyA2MCAyNyAxNjYgLTEgMTA1IC0zIDEyMCAtMjcgMTY2IC0zNCA2NCAtOTUgMTE4IC0xNTQgMTM0IC00MyAxMiAtMTQwIDkgLTE3NiAtNSAtMTcgLTcgLTE4IDQgLTE4IDEzNCBsMCAxNDEgLTM3IC0xIGMtMjEgLTEgLTYyIC02IC05MSAtMTJ6IG0yODEgLTQyNyBjMzEgLTI0IDUzIC0xMTIgNDIgLTE2OSAtMTcgLTk0IC01OSAtMTMxIC0xNTAgLTEzMSBsLTQ1IDAgMCAxNTQgYzAgMTE0IDMgMTU2IDEzIDE1OSA2IDMgMzUgNiA2MyA2IDM3IDEgNTggLTUgNzcgLTE5eiI+PC9wYXRoPgo8cGF0aCBkPSJNNDQwOCAxMDg3IGwtNTggLTEwIDAgLTM0NiBjMCAtMzU0IDUgLTQwNSAzNyAtNDUwIDI1IC0zNSA5OCAtNzAgMTYwIC03NyA1OCAtNyA1OCAtNyA2OSA4NCBsNiA2MCAtMzUgMTEgYy0yNiA5IC0zOCAyMSAtNDYgNDMgLTcgMjAgLTExIDE1MSAtMTEgMzY0IGwwIDMzNCAtMzIgLTEgYy0xOCAtMSAtNTkgLTYgLTkwIC0xMnoiPjwvcGF0aD4KPHBhdGggZD0iTTU5NjMgMTA4NyBsLTUzIC0xMCAwIC00MjggMCAtNDI5IDkwIDAgOTAgMCAwIDEyNyAwIDEyNyAzOSAtMzggYzIxIC0yMCA2NSAtNzggOTcgLTEyNyBsNTkgLTg5IDEwMiAwIGM1NyAwIDEwMyAyIDEwMyA1IDAgMTQgLTEwMiAxNjEgLTE2NiAyNDEgLTQxIDUxIC03NCA5NCAtNzQgOTggMCAzIDM1IDQzIDc4IDg4IDkxIDk2IDE1MiAxNjQgMTUyIDE2OSAwIDIgLTQ4IDMgLTEwNyAxIGwtMTA4IC0zIC0zNSAtNDIgYy0xOSAtMjMgLTU5IC02OCAtODcgLTk5IGwtNTMgLTU4IDAgMjQwIDAgMjQwIC0zNyAtMSBjLTIxIC0xIC02MiAtNiAtOTAgLTEyeiI+PC9wYXRoPgo8cGF0aCBkPSJNOTczIDEwNDUgYy01NSAtMjMgLTcxIC04NyAtMzIgLTEyNiAyNyAtMjcgNzUgLTIwIDEwNyAxNyA1NCA2MSAwIDE0MCAtNzUgMTA5eiI+PC9wYXRoPgo8cGF0aCBkPSJNMjg3MyAxMDQ1IGMtMzggLTE2IC01NSAtNDUgLTUxIC04OCA0IC00NSA0MyAtNjYgODcgLTQ3IDUzIDIyIDc4IDkyIDQ0IDEyMiAtMjggMjQgLTQ3IDI3IC04MCAxM3oiPjwvcGF0aD4KPHBhdGggZD0iTTEyNTUgOTgzIGMtMTYgLTMgLTMzIC04IC0zNyAtMTEgLTkgLTkgLTEwOCAtNTc3IC0xMDggLTYyMiAwIC00OCAyOCAtMTAwIDY5IC0xMjcgMjcgLTE5IDQ4IC0yMyAxMDYgLTIzIDM5IDAgOTIgNyAxMTcgMTYgbDQ3IDE1IC0yIDUwIGMtMiA0OCAtMyA0OSAtMjcgNDIgLTE0IC00IC01NiAtOCAtOTUgLTggLTY3IDAgLTcwIDEgLTg0IDI5IC0xMiAyNiAtMTAgNDggMTUgMTk3IGwyOSAxNjkgMTExIDAgMTEyIDAgNiAzMSBjMTQgNzEgMTcgNjkgLTEwMiA2OSBsLTEwOSAwIDEzIDY4IGM3IDM3IDEzIDc3IDE0IDkwIDAgMjMgLTcgMjQgLTc1IDE1eiI+PC9wYXRoPgo8cGF0aCBkPSJNNDgwNSA4MjYgYy0zMyAtNiAtNjAgLTE1IC02MCAtMjEgMSAtNSA1IC00MSA5IC03OCA4IC02NCAxMCAtNjggMzAgLTYyIDExIDQgNjIgOSAxMTEgMTIgMTAwIDYgMTI4IC02IDE0MCAtNTcgbDYgLTI1IC03NCAzIGMtMTY5IDkgLTI3NyAtNjQgLTI3NyAtMTg2IDAgLTY5IDEyIC0xMDQgNTAgLTE0MiA2OCAtNjggMTk2IC04NiAzNzcgLTUzIGw5MyAxNiAwIDIxMiBjMCAyNDcgLTggMjg0IC03MiAzMzkgLTYzIDU0IC0xODcgNzAgLTMzMyA0MnogbTIzNSAtNDE1IGwwIC01OCAtNDAgLTYgYy00NyAtNiAtMTEwIDYgLTEyMSAyNSAtNSA3IC05IDI1IC05IDQwIDAgNDAgMzMgNTggMTA3IDU4IGw2MyAwIDAgLTU5eiI+PC9wYXRoPgo8cGF0aCBkPSJNNTUyNCA4MjIgYy03MyAtMjUgLTEyNiAtNzIgLTE2NCAtMTQ0IC0zMiAtNTkgLTM0IC02OSAtMzQgLTE1OCAwIC03OCA0IC0xMDQgMjMgLTE0NyAyNyAtNjEgODMgLTExNSAxNDkgLTE0NiA1NyAtMjUgMTkxIC0zMCAyNjYgLTggbDQ4IDE0IC02IDUxIGMtMTMgOTcgLTEzIDk3IC02MCA4OCAtNjUgLTExIC0xNTEgLTggLTE3OSA3IC0zNyAyMCAtNTcgNjkgLTU3IDE0MCAwIDc2IDI2IDEzMyA2OSAxNTEgMzEgMTIgMTQwIDEwIDE3MiAtNCAxMyAtNiAxOSA1IDMzIDU4IDkgMzYgMTYgNzAgMTYgNzUgMCAxNyAtOTkgNDEgLTE2NCA0MSAtMzQgLTEgLTg0IC05IC0xMTIgLTE4eiI+PC9wYXRoPgo8cGF0aCBkPSJNMTc2MSA4MDIgYy02NSAtMjUgLTE0NSAtMTAyIC0xODAgLTE3NSAtNTAgLTEwMyAtNjAgLTI0NSAtMjIgLTMxNSAxNyAtMzEgNzUgLTgxIDExMyAtOTYgNDUgLTE5IDE4NyAtMjAgMjM4IC0yIDMzIDEyIDM1IDE1IDM4IDY2IDMgNDcgMSA1MiAtMTUgNDUgLTY2IC0yNiAtMTc5IC0yNCAtMjIxIDMgLTUyIDM0IC02NiAxMTUgLTM4IDIyMCAyMSA3NyA1MyAxMTggMTE0IDE0OSA0NSAyMiA2MSAyNSAxMTAgMjAgMzEgLTMgNjcgLTkgNzkgLTEyIDE4IC02IDI0IDAgNDIgNDEgMTIgMjYgMjAgNDggMTkgNDkgLTM4IDI4IC0yMDkgMzMgLTI3NyA3eiI+PC9wYXRoPgo8cGF0aCBkPSJNMjI1NCA3OTQgYy0xOTggLTk1IC0yNzcgLTQwNiAtMTM3IC01MzUgNDggLTQ2IDg2IC01OSAxNjUgLTU5IDE1NyAxIDI4MCAxMDcgMzI0IDI4MCAzNyAxNDQgLTUgMjY4IC0xMDggMzIxIC01NyAyOSAtMTc3IDI2IC0yNDQgLTd6IG0yMDEgLTEwNCBjNzkgLTc1IDMzIC0zMDEgLTc1IC0zNjQgLTQ2IC0yNyAtMTMwIC0yOCAtMTYwIC0xIC0zNSAzMiAtNTAgNzAgLTUwIDEyNyAwIDg3IDM4IDE4MiA5MCAyMjYgNTUgNDcgMTUxIDUzIDE5NSAxMnoiPjwvcGF0aD4KPHBhdGggZD0iTTMxNDggODA2IGMtMzIgLTcgLTU5IC0xNCAtNjEgLTE3IC0yIC0yIC0xMSAtNDcgLTIwIC05OSAtNjUgLTM2NyAtNzcgLTQzOCAtNzcgLTQ1NyAwIC0yMSA1IC0yMyA1NCAtMjMgNjAgMCA1OSAwIDcxIDc1IDQgMjIgMTMgNzQgMjAgMTE1IDcgNDEgMjEgMTE4IDMwIDE3MCA5IDUyIDE4IDEwNSAyMSAxMTcgMyAxOCAxMyAyMiA2OCAyOCA3MyA4IDEzMCAtNiAxNDYgLTM1IDIwIC0zOCAyIC0yMjEgLTQ2IC00NDMgbC02IC0yNyA2MSAwIGMzNCAwIDYxIDIgNjEgNCAwIDIgMTQgNzkgMzEgMTcyIDQwIDIxNCA0MyAzMDUgMTEgMzU2IC0zNiA1OSAtODkgNzggLTIwOCA3NyAtNTQgMCAtMTI1IC02IC0xNTYgLTEzeiI+PC9wYXRoPgo8cGF0aCBkPSJNOTA1IDc5OCBjLTIgLTcgLTkgLTQwIC0xNCAtNzMgLTUgLTMzIC0xNiAtOTggLTI1IC0xNDUgLTggLTQ3IC0yNCAtMTM5IC0zNiAtMjA1IC0xMiAtNjYgLTI0IC0xMzAgLTI3IC0xNDIgLTUgLTIyIC0yIC0yMyA1NiAtMjMgNTUgMCA2MSAyIDY1IDIzIDMgMTIgMTIgNjMgMjAgMTEyIDUzIDMwMSA3NiA0MzYgNzYgNDUwIDAgMTkgLTEwOCAyMiAtMTE1IDN6Ij48L3BhdGg+CjxwYXRoIGQ9Ik0yODAwIDc5OCBjMCAtNyAtNyAtNDkgLTE1IC05MyAtNyAtNDQgLTIzIC0xMzQgLTM1IC0yMDAgLTEyIC02NiAtMjggLTE1NiAtMzUgLTIwMCAtOCAtNDQgLTE1IC04MyAtMTUgLTg3IDAgLTUgMjcgLTggNjAgLTggMzMgMCA2MCA0IDYwIDEwIDAgNSAyMyAxMzcgNTAgMjkyIDI4IDE1NSA1MCAyODYgNTAgMjkwIDAgNCAtMjcgOCAtNjAgOCAtNDEgMCAtNjAgLTQgLTYwIC0xMnoiPjwvcGF0aD4KPC9nPgo8L3N2Zz4=',
      style: `
        width: 120px!important;
        height: 16px!important;
        float: left!important;
      `
    })

    const headerCloseButton = el('button', {
      style: `
        font-size: 16px!important;
        color: rgba(255, 255, 255, 0.5)!important;
        background: transparent!important;
        padding: 0!important;
        margin: 0!important;
        border: none!important;
        outline: none!important;
        cursor: pointer!important;
        float: right!important;
      `,
      onclick: this.onClose,
    }, 'X')

    setChildren(this.header, [headerTitle, headerCloseButton])
  }

  createFooter() {
    this.footer = el('div', {
      style: `
        position: absolute!important;
        bottom: -30px!important;
        right: 0!important;
        width: 100%!important;
        text-align: center!important;
        font-size: 12px!important;
        font-style: italic!important;
        color: #ccc!important;
      `,
    })

    const footerSpan = el('span', 'Powered by')

    const footerLink = el('a', {
      href: 'https://bitcoinblack.info/payment',
      target: '_blank',
      style: `
        padding-left: 5px!important;
        color: #ccc!important;
      `,
    }, 'https://bitcoinblack.info/payment')

    setChildren(this.footer, [footerSpan, footerLink])
  }

  mount() {
    mount(document.body, this.container)
  }

  unmount() {
    unmount(document.body, this.container)
  }

  showLoading() {
    const loading = el('div', {
      style: {
        width: '100%',
        height: '100%',
      }
    })

    const styles = `
       @keyframes spinner-line-fade-quick {
        0%, 39%, 100% {
          opacity: 0.25;
        }
        40% {
          opacity: 1;
        }
      }
    `

    const styleNode = document.createElement('style')
    styleNode.innerHTML = styles

    const spinner = new Spinner(DOM.sharedStyles.spinner).spin()

    setChildren(loading, [spinner.el, styleNode])
    setChildren(this.container, loading)
  }

  showPaymentInfo(data) {
    const { account, amount } = data

    const amount_raw = Big(amount).times(multNANO).toFixed().toString()

    const qrText = `bcb:${account}?amount=${amount_raw}`
    const qrCanvas= el('canvas', {
      style: `
        background: white!important;
        padding: 24px!important;
        border: 1px solid #e9e9e9!important;
        border-radius: 5px!important;
      `
    })

    const accountHeader = el('h5', { style: DOM.sharedStyles.infoHeader }, 'Account Address')
    const accountText = el('p', { style: DOM.sharedStyles.infoText }, account)

    const amountHeader = el('h5', { style: DOM.sharedStyles.infoHeader }, 'Amount')
    const amountText = el('p', { style: DOM.sharedStyles.infoText }, `${amount} BCB`)

    const paymentInfo = el('div', [accountHeader, accountText, amountHeader, amountText])

    QRCode.toCanvas(qrCanvas, qrText, (error) => {
      if (error) {
        console.error(error)
      }

      setChildren(this.content, [qrCanvas, paymentInfo])
      setChildren(this.container, this.main)
    })
  }

  updateTime(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    const display = [
      h,
      m > 9 ? m : (h ? '0' + m : m || '0'),
      s > 9 ? s : '0' + s,
    ].filter(a => a).join(':')

    this.statusBar.textContent = `Waiting For Payment (${display})`
  }

  showPaymentSucceededMessage(data) {
    const title = el('h2', { style: DOM.sharedStyles.titleHeader }, 'Thank you')
    const message = el('p', { style: DOM.sharedStyles.messageBody }, `We've successfully received your payment.`)

    const button = el('button', {
      style: `
        ${DOM.sharedStyles.actionButton}
        background: ${DOM.colors.green}!important;
      `,
      onclick: this.onClose,
    }, 'Done')

    this.statusBar.textContent = 'Success'
    setStyle(this.statusBar, { background: DOM.colors.green })
    setChildren(this.content, [title, message, button])
    setChildren(this.container, this.main)
  }

  showPaymentFailureMessage(error) {
    const title = el('h2', { style: DOM.sharedStyles.titleHeader }, 'Oops!')
    const message = el('p', { style: DOM.sharedStyles.messageBody }, `An error occurred: ${error}`)

    const button = el('button', {
      style: `
        ${DOM.sharedStyles.actionButton}
        background: ${DOM.colors.red}!important;
      `,
      onclick: this.onClose,
    }, 'Close')

    this.statusBar.textContent = 'Error!'
    setStyle(this.statusBar, { background: DOM.colors.red})
    setChildren(this.content, [title, message, button])
    setChildren(this.container, this.main)
  }
}

DOM.colors = {
  blue: '#0b6cdc',
  navy: '#000134',
  green: '#06af76',
  red: '#B03738',
}

DOM.sharedStyles = {
  mainBorderRadius: '6px',
  actionButton: `
    border: none!important;
    outline: none!important;
    border-radius: 6px!important;
    font-size: 16px!important;
    padding: 12px 24px!important;
    font-weight: bold!important;
    color: white!important;
    margin: 20px!important;
    box-shadow: 0 4px 6px rgba(50,50,93,.11), 0 1px 3px rgba(0,0,0,.08)!important;
    cursor: pointer!important;
    text-transform: uppercase!important;
    letter-spacing: 0.5!important;
  `,
  titleHeader: `
    margin: 20px 0!important;
    font-size: 24px!important;
    color: black!important;
  `,
  messageBody: `
    color: black!important;
    margin: initial!important;
    padding: initial!important;
  `,
  infoHeader: `
    text-transform: uppercase!important;
    color: #000134!important;
    margin-top: 20px!important;
    margin-bottom: 5px!important;
    font-size: 13px!important;
  `,
  infoText: `
    word-wrap: break-word!important;
    margin-top: 0!important;
    font-size: 14px!important;
    color: #424754!important;
  `,
  spinner: {
    lines: 11,
    length: 5,
    width: 1.5,
    radius: 6,
    scale: 2,
    corners: 1,
    rotate: 0,
    direction: 1,
    speed: 1.5,
    trail: 60,
    fps: 20,
    zIndex: 2e9,
    shadow: false,
    hwaccel: false,
    color: '#ffffff',
    top: '20%',
    fadeColor: 'transparent',
    animation: 'spinner-line-fade-quick',
  },
}

export default DOM

