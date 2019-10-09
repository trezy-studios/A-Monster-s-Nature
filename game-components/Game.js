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
const moveSpeed = 5





class Game {
  /***************************************************************************\
    Local Properties
  \***************************************************************************/

  characters = {}

  currentCharacterID = null

  database = null

  keysPressed = {}

  mainCanvas = null

  currentMap = null

  isReady = false

  unsubscribes = []





  /***************************************************************************\
    Private Methods
  \***************************************************************************/

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
                frameDelta: performance.now(),
                id: characterDoc.id,
                isLoading: true,
                previousState: 'idle',
                sprite: null,
                state: 'idle',
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
        const isMoving = (originalCharacterData.x !== characterData.x) || (originalCharacterData.y !== characterData.y)

        this.characters[characterDoc.key] = {
          ...this.characters[characterDoc.key],
          direction: characterData.direction,
          previousX: originalCharacterData.x,
          previousY: originalCharacterData.y,
          previousState: originalCharacterData.state,
          state: isMoving ? 'walk' : 'idle',
          x: characterData.x,
          y: characterData.y,
        }
      }
    }))
  }

  _drawCharacter = (characterData, offset, context) => {
    if (!characterData.isLoading) {
      const { sprite } = characterData
      const characterSpriteHeight = sprite.meta.sprite.size.height
      const characterSpriteWidth = sprite.meta.sprite.size.height
      const halfCanvasHeight = context.canvas.height / 2
      const halfCanvasWidth = context.canvas.width / 2
      const halfCharacterSpriteHeight = characterSpriteHeight / 2
      const halfCharacterSpriteWidth = characterSpriteWidth / 2
      let spriteChunkName = characterData.gender

      if (characterData.direction === 'left') {
        spriteChunkName += '-flipped'
      }

      const currentTag = sprite.tags.find(({ name }) => name === characterData.state)
      const spriteChunk = sprite.chunks.find(({ name }) => name === spriteChunkName)
      const sourceOffsetY = spriteChunk.offset.y + currentTag.offset.y
      const currentFrame = sprite.frames[characterData.currentFrame]
      const currentFrameIsLastFrame = (characterData.currentFrame === currentTag.frames[currentTag.length - 1])
      const stateHasChanged = (characterData.state !== characterData.previousState)

      const now = performance.now()


      if (stateHasChanged) {
        characterData.currentFrame = currentTag.frames[0]
      } else if ((now - characterData.frameDelta) > currentFrame.duration) {
        characterData.frameDelta = now

        if (currentFrameIsLastFrame) {
          characterData.currentFrame = currentTag.frames[0]
        } else if (Math.random() > 0.5) {
          characterData.currentFrame += 1
        }
      }

      if (characterData.state === 'walk') {
        const characterXHasChanged = characterData.previousX === characterData.x
        const characterYHasChanged = characterData.previousY === characterData.y

        if (characterXHasChanged && characterYHasChanged) {
          this._stopMoving(characterData)
        }

        characterData.previousX = characterData.x
        characterData.previousY = characterData.y
      } else if ((characterData.state === 'idle') && characterData.previousState === 'walk') {
        characterData.previousState = 'idle'
      }

      const sourceOffsetX = spriteChunk.offset.x + currentFrame.offset.x

      let destinationX = null
      let destinationY = null

      if (characterData.id === this.currentCharacterID) {
        destinationX = halfCanvasWidth - halfCharacterSpriteWidth
        destinationY = halfCanvasHeight - halfCharacterSpriteHeight
      } else {
        destinationX = (characterData.x - offset.x) - halfCharacterSpriteWidth
        destinationY = (characterData.y - offset.y) - halfCharacterSpriteHeight
      }

      context.font = '1em Cormorant, serif'
      context.fillStyle = 'white'
      context.textAlign = 'center'
      context.fillText(
        characterData.name.substring(0, 20),
        destinationX + halfCharacterSpriteWidth,
        destinationY - 10,
      )
      context.drawImage(
        characterData.sprite.container,
        sourceOffsetX,
        sourceOffsetY,
        characterSpriteWidth,
        characterSpriteHeight,
        destinationX,
        destinationY,
        characterSpriteWidth,
        characterSpriteHeight,
      )
    }
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
    const myCharacter = this.characters[this.currentCharacterID]
    const sortedCharacters = Object.values(this.characters).sort((a, b) => ((a.y > b.y) ? 1 : -1))

    const halfCanvasHeight = context.canvas.height / 2
    const halfCanvasWidth = context.canvas.width / 2

    const offset = {
      x: myCharacter.x - halfCanvasWidth,
      y: myCharacter.y - halfCanvasHeight,
    }

    context.clearRect(0, 0, context.canvas.width, context.canvas.height)

    context.drawImage(
      this.currentMap.offscreenCanvas,
      offset.x,
      offset.y,
      context.canvas.width,
      context.canvas.height,
      0,
      0,
      context.canvas.width,
      context.canvas.height,
    )

    sortedCharacters.forEach(characterData => this._drawCharacter(characterData, offset, context))
  }

  _stopMoving = debounce(characterData => {
    characterData.previousState = characterData.state
    characterData.state = 'idle'
  })





  /***************************************************************************\
    Public Methods
  \***************************************************************************/

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

  teardown = () => {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
  }
}





export { Game }
