// Module imports
import React, {
  useEffect,
  useRef,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import Router from 'next/router'





// Local imports
import { Game } from '../game-components'
import PageWrapper from '../components/PageWrapper'
import requireAuthentication from '../components/requireAuthentication'





// Local constants
const game = new Game





/* eslint-disable id-length,no-magic-numbers,no-param-reassign,react-hooks/rules-of-hooks */
const Play = ({ characterID }) => {
  if (typeof window === 'undefined') {
    return null
  }

  const canvasElement = useRef(null)
  const [gameIsReady, setGameIsReady] = useState(false)

  useEffect(() => {
    if (!characterID) {
      Router.push('/character-select')
    }
  }, [])

  useEffect(() => {
    if (characterID) {
      (async () => {
        await game.initialize({
          canvasElement: canvasElement.current,
          characterID,
          mapName: 'dungeon',
          mapPath: '/game/tiles/dungeon',
        })

        setGameIsReady(true)
      })()
    }
    return game.teardown
  }, [])

  return (
    <PageWrapper
      description="The MMOment you've all been waiting for..."
      title="A Monster's Nature">
      {!characterID && (
        <section>No character selected; returning to character selection...</section>
      )}

      {(Boolean(characterID) && !gameIsReady) && (
        <section>Loading...</section>
      )}

      <canvas
        height={window.innerHeight}
        hidden={!gameIsReady}
        ref={canvasElement}
        width={window.innerWidth} />
    </PageWrapper>
  )
}

Play.getInitialProps = ({ query }, setLayoutProps) => {
  setLayoutProps({ renderLayout: false })

  return { characterID: query.characterID }
}

Play.defaultProps = {
  characterID: null,
}

Play.propTypes = {
  characterID: PropTypes.string,
}





export default requireAuthentication(Play)
