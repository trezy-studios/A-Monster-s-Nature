/* eslint-disable id-length,no-magic-numbers,no-param-reassign */
// Module imports
import {
  Bodies,
  Body,
  // Composite,
  Events,
} from 'matter-js'
import { debounce } from 'lodash'





// Local imports
import {
  // firebase,
  firebaseApp,
} from '../helpers/firebase'
import getSprite from '../helpers/getSprite'





class Character {
  /***************************************************************************\
    Local Properties
  \***************************************************************************/

  body = null

  currentFrame = 0

  database = firebaseApp.database()

  direction = 'right'

  engine = null

  firestore = firebaseApp.firestore()

  isCurrentCharacter = true

  isLoading = true

  pingpongDirection = 'forward'

  previousState = 'idle'

  previousX = 'idle'

  previousY = 'idle'

  scale = 1

  sprite = null

  state = 'idle'

  unsubscribes = []

  x = 0

  y = 0





  /***************************************************************************\
    Private Methods
  \***************************************************************************/

  _bindUpdateLoop = () => {
    const previousUpdateX = this.x
    const previousUpdateY = this.y

    const intervalID = setInterval(() => {
      const positionHasChanged = {
        x: previousUpdateX !== this.x,
        y: previousUpdateY !== this.y,
      }

      if (positionHasChanged.x || positionHasChanged.y) {
        const updates = {
          direction: this.direction,
          x: this.x,
          y: this.y,
        }

        this.database.ref(`game/characters/${this.id}`).update(updates)
      }
    }, 100)

    return () => clearInterval(intervalID)
  }

  _handleEngineAfterUpdate = () => {
    const { bounds } = this.boundarySlice

    this.setPosition({
      x: (this.body.position.x - bounds.x) + this.offset.x,
      y: (this.body.position.y - bounds.y) + this.offset.y,
    }, false)
  }

  _setBodyPosition = position => {
    const { bounds } = this.boundarySlice

    Body.setPosition(this.body, {
      x: (position.x - this.offset.x) + bounds.x,
      y: (position.y - this.offset.y) + bounds.y,
      // x: position.x + ((this.offset.x - bounds.x) * this.scale) - 16,
      // y: position.y + ((this.offset.y - bounds.y) * this.scale) - 16,
      // x: position.x + ((bounds.x - this.offset.x) * this.scale),
      // y: position.y + ((bounds.y - this.offset.y) * this.scale),
    })
  }





  /***************************************************************************\
    Public Methods
  \***************************************************************************/

  initialize = async data => {
    const promises = []

    Object.entries(data).forEach(([key, value]) => {
      this[key] = value
    })

    promises.push(getSprite('characters', data.profession, this.scale))
    promises.push(this.database.ref(`game/characters/${data.id}`).once('value'))

    const [sprite, positionDataSnapshot] = await Promise.all(promises)
    const positionData = positionDataSnapshot.val()
    const boundarySlice = sprite.slices.find(({ name }) => name === 'boundary')

    this.frameDelta = performance.now()
    this.isCurrentCharacter = data.isCurrentCharacter
    this.isLoading = false
    this.previousX = positionData.x
    this.previousY = positionData.y
    this.sprite = sprite
    this.x = positionData.x
    this.y = positionData.y

    this.offset = {
      x: sprite.meta.sprite.size.width / 2,
      y: sprite.meta.sprite.size.height / 2,
    }

    this.body = Bodies.rectangle(
      0,
      0,
      boundarySlice.bounds.width * this.scale,
      boundarySlice.bounds.height * this.scale,
      {
        label: 'boundary',
        restitution: 0,
      },
    )

    this._setBodyPosition(positionData)

    this.engine = data.engine

    if (this.isCurrentCharacter) {
      Events.on(data.engine, 'afterUpdate', this._handleEngineAfterUpdate)
      this.unsubscribes.push(() => Events.off(data.engine, 'afterUpdate', this._handleEngineAfterUpdate))
      this.unsubscribes.push(this._bindUpdateLoop())
    }
  }

  setPosition = (position, setBodyPosition = true) => {
    this.previousX = this.x
    this.previousY = this.y
    this.x = position.x
    this.y = position.y

    const isMoving = (this.x !== this.previousX) || (this.y !== this.previousY)

    if (this.x > this.previousX) {
      this.direction = 'right'
    } else if (this.x < this.previousX) {
      this.direction = 'left'
    }

    this.previousState = this.state
    this.state = isMoving ? 'walk' : 'idle'

    if (setBodyPosition) {
      this._setBodyPosition(position)
    }
  }

  stopMoving = debounce(() => {
    this.previousState = this.state
    this.previousX = this.x
    this.previousY = this.y
    this.state = 'idle'
  })

  teardown = () => {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
  }





  /***************************************************************************\
    Getters
  \***************************************************************************/

  get boundarySlice () {
    if (!this._boundarySlice) {
      this._boundarySlice = this.sprite.slices.find(({ name }) => name === 'boundary')
    }

    return this._boundarySlice
  }
}





export { Character }
