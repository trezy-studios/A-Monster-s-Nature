// Module imports
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import PropTypes from 'prop-types'
import React from 'react'





// Local imports
import Brand from './Brand'
import getCurrentUserSelector from '../store/selectors/getCurrentUser'
import withFirebase from './withFirebase'





const Banner = props => {
  const { signOut } = props

  const currentUser = useSelector(getCurrentUserSelector)

  return (
    <header role="banner">
      <nav>
        <ul>
          <li>
            <Link href="/">
              <a className="brand-link">
                <Brand />
              </a>
            </Link>
          </li>

          <li>
            <Link href="/about">
              <a>Game</a>
            </Link>
          </li>

          <li>
            <Link href="/news">
              <a>News</a>
            </Link>
          </li>

          <li>
            <Link href="/store">
              <a>Store</a>
            </Link>
          </li>

          <li>
            <Link href="/play">
              <a>Play</a>
            </Link>
          </li>
        </ul>
      </nav>

      <menu type="toolbar">
        {!currentUser && (
          <Link href="/login">
            <a className="button">
              Login
            </a>
          </Link>
        )}

        {Boolean(currentUser) && (
          <button
            onClick={() => signOut()}
            type="button">
            Logout
          </button>
        )}
      </menu>
    </header>
  )
}

Banner.propTypes = {
  signOut: PropTypes.func.isRequired,
}





export default withFirebase(Banner)
