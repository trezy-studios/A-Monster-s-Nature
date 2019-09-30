// Module imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, {
  useState,
  useEffect,
} from 'react'
import PropTypes from 'prop-types'
import Router from 'next/router'





// Local imports
import handleRouterEvent from '../effects/handleRouterEvent'
import handleKeyboardEvent from '../effects/handleKeyboardEvent'
import Nav from './Nav'
import withFirebase from './withFirebase'





// Local constants
const navItems = [
  {
    href: '/',
    icon: 'home',
    title: 'Home',
  },
  {
    href: '/about',
    icon: 'user',
    title: 'About',
  },
  {
    href: '/play',
    icon: 'user',
    title: 'Play',
  },

  // Only while logged out
  {
    icon: 'sign-in-alt',
    title: 'Login',
    route: 'login',
    condition: ({ currentUser }) => !currentUser,
  },

  // Only while logged in
  {
    href: '/dashboard',
    icon: 'tachometer-alt',
    title: 'Dashboard',
    condition: ({ currentUser }) => Boolean(currentUser),
  },
  {
    icon: 'sign-out-alt',
    title: 'Logout',
    condition: ({ currentUser }) => Boolean(currentUser),
    onClick: (event, {
      close,
      signOut,
    }) => {
      signOut()
      close()
      Router.push('/login')
    },
  },
]
// const socialItems = [
//   {
//     extraProps: { rel: 'me' },
//     icon: 'twitter',
//     iconOnly: true,
//     iconPrefix: 'fab',
//     title: 'Twitter',
//     href: 'https://twitter.com/TrezyCodes',
//   },
//   {
//     extraProps: { rel: 'me' },
//     icon: 'discord',
//     iconOnly: true,
//     iconPrefix: 'fab',
//     title: 'Discord',
//     href: 'https://discord.gg/k3bth3f',
//   },
//   {
//     extraProps: { rel: 'me' },
//     icon: 'github',
//     iconOnly: true,
//     iconPrefix: 'fab',
//     title: 'Github',
//     href: 'https://github.com/trezy',
//   },
// ]





const Banner = props => {
  const {
    firebaseApp,
    signOut,
  } = props

  const { currentUser } = firebaseApp.auth()

  const [isOpen, setIsOpen] = useState(false)

  const close = () => {
    const focusedElement = document.querySelector('[role=banner] *:focus')

    if (focusedElement) {
      focusedElement.blur()
    }

    setIsOpen(false)
  }

  useEffect(handleRouterEvent('routeChangeComplete', close))
  useEffect(handleKeyboardEvent('keyup', ({ key }) => {
    if (key.toLowerCase() === 'escape') {
      close()
    }
  }), [isOpen])

  return (
    <>
      <input
        aria-label="Banner &amp; Navigation toggle"
        checked={isOpen}
        hidden
        id="banner-control"
        onChange={({ target: { checked } }) => setIsOpen(checked)}
        type="checkbox" />

      <header role="banner">
        {/* eslint-disable jsx-a11y/tabindex-no-positive */}
        <label
          aria-pressed={isOpen ? 'true' : 'false'}
          className="button iconic primary"
          htmlFor="banner-control"
          onKeyUp={({ key }) => ['enter', ' '].includes(key.toLowerCase()) && setIsOpen(!isOpen)}
          role="button"
          tabIndex="1"
          title="Expand/Collapse Menu">
          <FontAwesomeIcon
            data-animate
            data-animation={`fade-${isOpen ? 'out' : 'in'}`}
            data-animation-duration="0.2s"
            fixedWidth
            icon="bars" />

          <FontAwesomeIcon
            data-animate
            data-animation={`fade-${isOpen ? 'in' : 'out'}`}
            data-animation-duration="0.2s"
            fixedWidth
            icon="times" />

          <span className="screen-reader-only">Menu</span>
        </label>
        {/* eslint-disable jsx-a11y/tabindex-no-positive */}

        <h1 className="brand">&lt;trezy-who/&gt;</h1>

        <Nav
          close={close}
          isOpen={isOpen}
          items={navItems}
          signOut={signOut}
          currentUser={currentUser} />

        {/* <Nav
          className="social"
          isOpen={isOpen}
          items={socialItems} /> */}
      </header>
    </>
  )
}

Banner.propTypes = {
  firebaseApp: PropTypes.object.isRequired,
  signOut: PropTypes.func.isRequired,
}





export default withFirebase(Banner)
