customElements.define('wc-blink', class WCBlink extends HTMLElement { // Named the class WCBlink
  constructor () {
    super()
    const template = document.createElement('template')
    template.innerHTML = WCBlink.template() // Now, WCBlink is defined, so this works.
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(document.importNode(template.content, true))
  }

  static template () {
    return `
      <style>
      .blink {
        animation: 2s linear infinite condemned_blink_effect;
      }
      @keyframes condemned_blink_effect {
        0% {
          visibility: hidden;
        }
        50% {
          visibility: hidden;
        }
        100% {
          visibility: visible;
        }
      }
      </style>
      <p class="blink" style="width: inherit;"><span><slot></slot></span></p>
    `
  }
});
