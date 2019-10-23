/* eslint-disable id-length,no-magic-numbers,no-param-reassign */

// Module imports
import {
  Body,
  Composite,
  Engine,
  World,
} from 'matter-js'





// Local imports
import {
  firebase,
  firebaseApp,
} from '../helpers/firebase'
import { Character } from './Character'
import { Map } from './Map'





class Game {
  /***************************************************************************\
    Local Properties
  \***************************************************************************/

  characters = {}

  currentCharacterID = null

  database = null

  engine = null

  keysPressed = {}

  mainCanvas = null

  currentMap = null

  isReady = false

  scale = 1

  unsubscribes = []

  wireframe = true





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
              const character = new Character

              await character.initialize({
                ...characterData,
                id: characterDoc.id,
                isCurrentCharacter: this.currentCharacterID === characterDoc.id,
                engine: this.engine,
              })

              this.characters[characterDoc.id] = character

              World.addBody(this.engine.world, character.body)
            })()
            break

          case 'modified':
            this.characters[characterDoc.id] = {
              ...originalCharacterData,
              ...characterData,
            }
            break

          case 'removed':
            World.remove(this.engine.world, originalCharacterData.body)
            originalCharacterData.teardown()
            delete this.characters[characterDoc.id]
            break
        }
      })
    }))

    this.unsubscribes.push(characterRTCollection.on('child_changed', characterDoc => {
      const character = this.characters[characterDoc.key]

      if (character && (characterDoc.key !== this.currentCharacterID)) {
        const characterData = characterDoc.val()

        character.setPosition({
          x: characterData.x,
          y: characterData.y,
        })
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
      const currentFrame = sprite.frames[characterData.currentFrame]
      const [firstFrame] = currentTag.frames
      const lastFrame = currentTag.frames[currentTag.length - 1]
      const currentFrameIsLastFrame = (characterData.currentFrame === lastFrame)
      const currentFrameIsFirstFrame = (characterData.currentFrame === firstFrame)
      const stateHasChanged = (characterData.state !== characterData.previousState)

      const now = performance.now()

      if (stateHasChanged) {
        switch (currentTag.direction) {
          case 'forward':
          case 'pingpong':
            characterData.currentFrame = firstFrame
            break
          case 'reverse':
            characterData.currentFrame = lastFrame
            break
        }
      } else if ((now - characterData.frameDelta) > currentFrame.duration) {
        characterData.frameDelta = now

        if (Math.random() > 0.2) {
          switch (currentTag.direction) {
            case 'forward':
              if (currentFrameIsLastFrame) {
                characterData.currentFrame = firstFrame
              } else {
                characterData.currentFrame += 1
              }
              break

            case 'reverse':
              if (currentFrameIsFirstFrame) {
                characterData.currentFrame = lastFrame
              } else if (Math.random() > 0.2) {
                characterData.currentFrame -= 1
              }
              break

            case 'pingpong':
              if (currentFrameIsLastFrame) {
                characterData.pingpongDirection = 'reverse'
              } else if (currentFrameIsFirstFrame) {
                characterData.pingpongDirection = 'forward'
              }

              if (characterData.pingpongDirection === 'reverse') {
                characterData.currentFrame -= 1
              } else {
                characterData.currentFrame += 1
              }
              break
          }
        }
      }

      if (characterData.state === 'walk') {
        const characterXHasChanged = characterData.previousX === characterData.x
        const characterYHasChanged = characterData.previousY === characterData.y

        if (characterXHasChanged || characterYHasChanged) {
          characterData.stopMoving()
        }
      } else if ((characterData.state === 'idle') && characterData.previousState === 'walk') {
        characterData.previousState = 'idle'
      }

      const sourceOffsetX = spriteChunk.offset.x + currentFrame.offset.x
      const sourceOffsetY = spriteChunk.offset.y + currentTag.offset.y

      let destinationX = null
      let destinationY = null

      if (characterData.id === this.currentCharacterID) {
        destinationX = halfCanvasWidth
        destinationY = halfCanvasHeight
      } else {
        destinationX = (characterData.x - offset.x)
        destinationY = (characterData.y - offset.y)
      }

      destinationX -= halfCharacterSpriteWidth
      destinationY -= halfCharacterSpriteHeight

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
        sourceOffsetX * this.scale,
        sourceOffsetY * this.scale,
        characterSpriteWidth * this.scale,
        characterSpriteHeight * this.scale,
        destinationX,
        destinationY,
        characterSpriteWidth * this.scale,
        characterSpriteHeight * this.scale,
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
      const velocityMultiplier = 2

      if (!myCharacter.isLoading) {
        Body.setVelocity(myCharacter.body, {
          x: (Boolean(this.keysPressed.d) - Boolean(this.keysPressed.a)) * velocityMultiplier,
          y: (Boolean(this.keysPressed.s) - Boolean(this.keysPressed.w)) * velocityMultiplier,
        })

        Engine.update(this.engine)
      }

      this._render()
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

    if (this.wireframe) {
      const bodies = Composite.allBodies(this.engine.world)

      bodies.forEach(body => {
        context.lineWidth = 2

        switch (body.label) {
          case 'hitbox':
            context.strokeStyle = 'red'
            break

          case 'boundary':
          default:
            context.strokeStyle = 'purple'
            break
        }

        context.strokeRect(
          body.position.x - offset.x,
          body.position.y - offset.y,
          body.bounds.max.x - body.bounds.min.x,
          body.bounds.max.y - body.bounds.min.y,
        )
      })
    }
  }





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
      scale = 1,
      start = true,
    } = options

    this.currentCharacterID = characterID
    this.mainCanvas = canvasElement

    this.scale = scale

    this.engine = Engine.create()
    this.engine.world.gravity.y = 0

    this._bindEventListeners()
    await this._bindFirebaseListeners()

    this.currentMap = new Map({
      mapPath,
      mapName,
      scale,
    })

    await this.currentMap.initialize()

    if (start) {
      this.start()
    }
  }

  start = () => {
    World.add(this.engine.world, this.currentMap.bodies)
    Engine.run(this.engine)

    this._loop()
  }

  teardown = () => {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
    Object.values(this.characters).forEach(character => character.teardown())
  }
}





export { Game }
