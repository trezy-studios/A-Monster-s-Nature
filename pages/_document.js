// Module imports
import buildCSP from 'content-security-policy-builder'
import React from 'react'
import uuid from 'uuid/v4'





// Module imports
import NextDocument, {
  Head,
  Main,
  NextScript,
} from 'next/document'





// Local constants
const additionalHeaders = {
  'Feature-Policy': {
    'ambient-light-sensor': "'none'",
    autoplay: "'none'",
    accelerometer: "'none'",
    camera: "'none'",
    'display-capture': "'none'",
    'document-domain': "'none'",
    'encrypted-media': "'none'",
    fullscreen: "'none'",
    geolocation: "'none'",
    gyroscope: "'none'",
    magnetometer: "'none'",
    microphone: "'none'",
    midi: "'none'",
    payment: "'none'",
    'picture-in-picture': "'none'",
    speaker: "'none'",
    'sync-xhr': "'none'",
    usb: "'none'",
    'wake-lock': "'none'",
    webauthn: "'none'",
    vr: "'none'",
    xr: "'none'",
  },
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': [
    '1',
    'mode=block',
  ],
  'X-Frame-Options': 'DENY',
}
const cspHeaderKeys = [
  'Content-Security-Policy',
  'X-Content-Security-Policy',
  'X-WebKit-CSP',
]





class Document extends NextDocument {
  static async getInitialProps (ctx) {
    const initialProps = await NextDocument.getInitialProps(ctx)
    const isDev = ctx.isServer
    const nonce = uuid()

    const cspDirectives = {
      baseUri: ["'none'"],
      connectSrc: [
        ...(isDev ? ['webpack://*'] : []),
        "'self'",
        'https://firestore.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://www.googleapis.com',
        'https://api.themoviedb.org',
        'wss://*.firebaseio.com',
      ],
      defaultSrc: [
        "'self'",
        'https://amonstersnature.firebaseapp.com',
        'https://*.firebaseio.com',
      ],
      fontSrc: [
        "'self'",
        'data:',
        'https://fonts.gstatic.com',
      ],
      imgSrc: [
        "'self'",
      ],
      mediaSrc: [
        "'self'",
      ],
      objectSrc: [
        "'self'",
      ],
      scriptSrc: [
        "'self'",
        "'strict-dynamic'",
        `'nonce-${nonce}'`,
        ...(isDev ? ["'unsafe-eval'"] : []),
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
    }

    const policyString = buildCSP({ directives: cspDirectives })
    cspHeaderKeys.forEach(key => ctx.res.setHeader(key, policyString))

    Object.entries(additionalHeaders).forEach(([header, value]) => {
      let valueString = value

      if (typeof value === 'object') {
        const arrayifiedObject = Object.entries(valueString)
        const mapper = ([entry, list]) => `${entry} ${Array.isArray(list) ? list.join(' ') : list}`

        valueString = arrayifiedObject.map(mapper)
      }

      if (Array.isArray(valueString)) {
        valueString = valueString.join('; ')
      }

      ctx.res.setHeader(header, valueString)
    })

    return { ...initialProps, nonce }
  }

  render () {
    const { nonce } = this.props

    return (
      <html lang="en">
        <Head nonce={nonce}>
          <meta name="viewport" content="initial-scale=1.0, viewport-fit=cover, width=device-width" />

          <meta name="application-name" content="A Monster's Nature" />
          <meta name="theme-color" content="#d65050" />

          <meta name="apple-mobile-web-app-title" content="A Monster's Nature" />

          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="msapplication-TileColor" content="#d65050" />
          <meta name="msapplication-TileImage" content="/static/favicon/mstile-144x144.png" />
          <meta name="msapplication-square70x70logo" content="/static/favicon/mstile-70x70.png" />
          <meta name="msapplication-square150x150logo" content="/static/favicon/mstile-150x150.png" />
          <meta name="msapplication-wide310x150logo" content="/static/favicon/mstile-310x150.png" />
          <meta name="msapplication-square310x310logo" content="/static/favicon/mstile-310x310.png" />

          <link rel="apple-touch-icon-precomposed" sizes="57x57" href="/static/favicon/apple-touch-icon-57x57.png" />
          <link rel="apple-touch-icon-precomposed" sizes="60x60" href="/static/favicon/apple-touch-icon-60x60.png" />
          <link rel="apple-touch-icon-precomposed" sizes="72x72" href="/static/favicon/apple-touch-icon-72x72.png" />
          <link rel="apple-touch-icon-precomposed" sizes="76x76" href="/static/favicon/apple-touch-icon-76x76.png" />
          <link rel="apple-touch-icon-precomposed" sizes="114x114" href="/static/favicon/apple-touch-icon-114x114.png" />
          <link rel="apple-touch-icon-precomposed" sizes="120x120" href="/static/favicon/apple-touch-icon-120x120.png" />
          <link rel="apple-touch-icon-precomposed" sizes="144x144" href="/static/favicon/apple-touch-icon-144x144.png" />
          <link rel="apple-touch-icon-precomposed" sizes="152x152" href="/static/favicon/apple-touch-icon-152x152.png" />

          <link rel="icon" type="image/png" href="/static/favicon/favicon-16.png" sizes="16x16" />
          <link rel="icon" type="image/png" href="/static/favicon/favicon-32.png" sizes="32x32" />
          <link rel="icon" type="image/png" href="/static/favicon/favicon-96.png" sizes="96x96" />

          <link rel="manifest" href="/manifest.json" />
          <link rel="shortcut icon" href="/favicon/favicon.ico" />

          {/* <link rel="webmention" href="https://webmention.io/trezy.com/webmention" /> */}
          {/* <link rel="pingback" href="https://webmention.io/trezy.com/xmlrpc" /> */}
        </Head>

        <body>
          <Main className="next-wrapper" />

          <NextScript nonce={nonce} />
        </body>
      </html>
    )
  }
}





export default Document
