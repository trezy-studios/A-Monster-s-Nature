/* eslint-disable id-length,no-magic-numbers,no-param-reassign */

// Module imports
import { debounce } from 'lodash'





// Local imports
import {
  firebase,
  firebaseApp,
} from '../helpers/firebase'
import { Map } from './Map'
import getSprite from '../helpers/getSprite'





// Local constants
const characterSpriteSize = 64
const framesPerSecond = 20
const totalFrames = 10
const framesPerFrame = 60 / framesPerSecond
const moveSpeed = 5





class Game {
  characters = {}
  currentCharacterID = null
  database = null
  keysPressed = {}
  mainCanvas = null
  currentMap = null
  isReady = false
  unsubscribes = []

  _bindEventListeners () {
    window.addEventListener('keydown', this._handleKeydownEvent)
    window.addEventListener('keyup', this._handleKeyupEvent)
    window.addEventListener('resize', this._handleResizeEvent)

    this.unsubscribes.push(() => {
      window.removeEventListener('keydown', this._handleKeydownEvent)
      window.removeEventListener('keyup', this._handleKeyupEvent)
      window.removeEventListener('resize', this._handleResizeEvent)
    })
  }

  _bindFirebaseListeners = () => {
    this.database = firebaseApp.database()
    this.firestore = firebaseApp.firestore()

    const characterCollection = this.firestore.collection('characters')
    const characterRTCollection = this.database.ref('game/characters')

    this.database.ref('.info/connected').on('value', snapshot => {
      if (snapshot.val() === false) {
        return
      }

      const characterStatusRef = this.database.ref(`game/characters/${this.currentCharacterID}/status`)

      characterStatusRef.onDisconnect().update({
        active: false,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
      }).then(() => {
        characterStatusRef.update({
          active: true,
          updatedAt: firebase.database.ServerValue.TIMESTAMP,
        })
      })
    })

    this.unsubscribes.push(characterCollection.where('active', '==', true).onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        const characterDoc = change.doc
        const characterData = characterDoc.data()
        const originalCharacterData = this.characters[characterDoc.id]

        /* eslint-disable-next-line default-case */
        switch (change.type) {
          case 'added':
            (async () => {
              this.characters[characterDoc.id] = {
                ...characterData,
                currentFrame: 0,
                id: characterDoc.id,
                isLoading: true,
                isMoving: false,
                sprite: null,
              }

              const promises = []

              promises.push(getSprite('characters', characterData.profession))
              promises.push(this.database.ref(`game/characters/${characterDoc.id}`).once('value'))

              const [sprite, positionDataSnapshot] = await Promise.all(promises)

              const positionData = positionDataSnapshot.val()

              this.characters[characterDoc.id] = {
                ...this.characters[characterDoc.id],
                isLoading: false,
                previousX: positionData.x,
                previousY: positionData.y,
                sprite,
                x: positionData.x,
                y: positionData.y,
              }
            })()

            break

          case 'modified':
            this.characters[characterDoc.id] = {
              ...originalCharacterData,
              ...characterData,
            }
            break

          case 'removed':
            delete this.characters[characterDoc.id]
            break
        }
      })
    }))

    this.unsubscribes.push(characterRTCollection.on('child_changed', characterDoc => {
      const originalCharacterData = this.characters[characterDoc.key]

      if (originalCharacterData) {
        const characterData = characterDoc.val()

        this.characters[characterDoc.key] = {
          ...this.characters[characterDoc.key],
          direction: characterData.direction,
          isMoving: (originalCharacterData.x !== characterData.x) || (originalCharacterData.y !== characterData.y),
          previousX: originalCharacterData.x,
          previousY: originalCharacterData.y,
          x: characterData.x,
          y: characterData.y,
        }
      }
    }))
  }

  _handleKeydownEvent = ({ key }) => {
    this.keysPressed[key] = true
  }

  _handleKeyupEvent = ({ key }) => delete this.keysPressed[key]

  _handleResizeEvent = () => {
    console.log('TODO: handle resize events')
    // setDimensions({
    //   height: window.innerHeight,
    //   width: window.innerWidth,
    // })
  }

  _loop = () => {
    const myCharacter = this.characters[this.currentCharacterID]

    if (myCharacter) {
      this.isReady = true

      this._render()

      let newX = myCharacter.x
      let newY = myCharacter.y

      if (this.keysPressed.w) {
        newY -= moveSpeed
      }

      if (this.keysPressed.s) {
        newY += moveSpeed
      }

      if (this.keysPressed.a) {
        newX -= moveSpeed
      }

      if (this.keysPressed.d) {
        newX += moveSpeed
      }

      if ((newY !== myCharacter.y) || (newX !== myCharacter.x)) {
        const updates = {
          x: newX,
          y: newY,
        }

        if (newX > myCharacter.x) {
          updates.direction = 'right'
        } else if (newX < myCharacter.x) {
          updates.direction = 'left'
        }

        this.database.ref(`game/characters/${this.currentCharacterID}`).update(updates)
      }
    }

    requestAnimationFrame(this._loop)
  }

  _render = () => {
    const context = this.mainCanvas.getContext('2d')
    const sortedCharacters = Object.values(this.characters).sort((a, b) => ((a.y > b.y) ? 1 : -1))

    context.clearRect(0, 0, context.canvas.width, context.canvas.height)

    context.drawImage(
      )

      if (!characterData.isLoading) {
        let sourceOffsetY = (characterData.gender === 'male') ? 0 : characterSpriteSize * 5

        if (characterData.isMoving) {
          sourceOffsetY += characterSpriteSize * 2

          if ((characterData.previousX === characterData.x) && (characterData.previousY === characterData.y)) {
            this._stopMoving(characterData)
          }

          characterData.previousX = characterData.x
          characterData.previousY = characterData.y
        }

        let sourceOffsetX = characterSpriteSize * Math.floor((characterData.currentFrame / framesPerFrame) % 10)

        if (characterData.direction === 'left') {
          sourceOffsetX += 640
        }

        if (characterData.currentFrame >= (totalFrames * framesPerFrame)) {
          characterData.currentFrame = 0
        } else if (Math.random() > 0.5) {
          characterData.currentFrame += 1
        }

        context.drawImage(
          characterData.sprite.container,
          sourceOffsetX,
          sourceOffsetY,
          characterSpriteSize,
          characterSpriteSize,
          Math.floor(characterData.x),
          Math.floor(characterData.y),
          characterSpriteSize,
          characterSpriteSize,
        )
      }
    })
  }

  _stopMoving = debounce(characterData => {
    characterData.isMoving = false
  })

  _teardown = () => {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
  }

  constructor (options) {
    this.options = options
  }

  initialize = async options => {
    const {
      canvasElement,
      characterID,
      mapPath,
      mapName,
      start = true,
    } = options

    this.currentCharacterID = characterID
    this.mainCanvas = canvasElement

    this._bindEventListeners()
    await this._bindFirebaseListeners()

    this.currentMap = new Map({
      mapPath,
      mapName,
    })
    this.currentMap.initialize()

    if (start) {
      this.start()
    }
  }

  start = () => {
    this._loop()
  }
}





export { Game }
