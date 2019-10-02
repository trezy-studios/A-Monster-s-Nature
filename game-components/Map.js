/* eslint-disable id-length,no-bitwise,no-magic-numbers,no-param-reassign */

// Module imports
// import {
//   Bodies,
//   Composite,
// } from 'matter-js'
// import uuid from 'uuid/v4'





class Map {
  /***************************************************************************\
    Local Properties
  \***************************************************************************/

  anchorPoint = {
    x: 0,
    y: 0,
  }

  bodies = undefined

  isReady = false

  mapData = undefined

  offscreenCanvas = document.createElement('canvas')

  stackableCanvases = []

  options = undefined

  points = []

  size = {
    x: 0,
    y: 0,
  }

  tiles = {}





  /***************************************************************************\
    Private Methods
  \***************************************************************************/

  _mapTiles = async () => {
    const promises = []

    this.mapData.tilesets.forEach(tilesetDatum => {
      const imageURL = `${this.options.mapPath}/${tilesetDatum.image}`
      const image = document.createElement('img')

      promises.push(new Promise(resolve => {
        image.onload = resolve
      }))

      image.src = imageURL

      tilesetDatum.image = image
    })

    await Promise.all(promises)

    this.mapData.tilesets.forEach(tilesetDatum => {
      const { firstgid } = tilesetDatum
      // const lengthAfterProcessingLastTileset = Object.values(this.tiles).length
      let loopIndex = 0

      const finder = ({ id }) => id === (loopIndex - 1)

      while (loopIndex <= tilesetDatum.tilecount) {
        const tileIndex = (loopIndex - 1) + firstgid
        const tile = tilesetDatum.tiles.find(finder)

        this.tiles[tileIndex] = {
          ...(tile || {}),
          height: tilesetDatum.tileheight,
          image: tilesetDatum.image,
          width: tilesetDatum.tilewidth,
          x: (tilesetDatum.tilewidth * (loopIndex % tilesetDatum.columns)),
          y: Math.floor(loopIndex / tilesetDatum.columns) * tilesetDatum.tileheight,
        }

        loopIndex += 1
      }
    })
  }

  _renderTile = (context, tileID, destination) => {
    const tile = this.tiles[tileID]

    if (tile) {
      // if (tile.objectgroup) {
      //   for (const object of tile.objectgroup.objects) {
      //     const objectX = destination.x + object.x + (object.width / 2)
      //     const objectY = destination.y + object.y + (object.height / 2)

      //     Composite.add(this.bodies, Bodies.rectangle(objectX, objectY, object.width, object.height, {
      //       label: object.name,
      //       isStatic: true,
      //       render: {
      //         renderProps: [tile.image, tile.x, tile.y, tile.width, tile.height, destination.x, destination.y, tile.width, tile.height],
      //       },
      //     }))
      //   }
      // }

      context.drawImage(tile.image, tile.x, tile.y, tile.width, tile.height, destination.x, destination.y, tile.width, tile.height)
    }
  }





  /***************************************************************************\
    Public Methods
  \***************************************************************************/

  constructor (options) {
    window.maps = window.maps || []
    window.maps.push(this)
    this.options = options
  }

  initialize = async () => {
    const context = this.offscreenCanvas.getContext('2d', { alpha: false })

    this.mapData = await fetch(`${this.options.mapPath}/${this.options.mapName}.json`).then(response => response.json())

    await this._mapTiles()

    const {
      backgroundcolor,
      // height,
      layers,
      tileheight,
      tilewidth,
      // width,
    } = this.mapData

    const tileLayers = layers.filter(({ type }) => type === 'tilelayer')
    tileLayers.forEach(layer => {
      this.size = {
        x: Math.max(this.size.x, layer.width),
        y: Math.max(this.size.y, layer.height),
      }

      this.anchorPoint = {
        x: Math.min(this.anchorPoint.x, layer.startx),
        y: Math.min(this.anchorPoint.y, layer.starty),
      }
    })

    this.size = {
      x: this.size.x * tilewidth,
      y: this.size.y * tileheight,
    }

    this.anchorPoint = {
      x: ~(this.anchorPoint.x * tilewidth) + 1,
      y: ~(this.anchorPoint.y * tileheight) + 1,
    }

    this.offscreenCanvas.setAttribute('height', this.size.y)
    this.offscreenCanvas.setAttribute('width', this.size.x)

    if (backgroundcolor) {
      context.fillStyle = backgroundcolor
      context.fillRect(0, 0, this.size.x, this.size.y)
    }

    // this.bodies = Composite.create({ label: `map::${this.options.mapName}` })

    layers.forEach(layer => {
      // const {
      //   startx,
      //   starty,
      // } = layer

      switch (layer.type) {
        case 'objectgroup':
          layer.objects.forEach(object => {
            object.x += this.anchorPoint.x
            object.y += this.anchorPoint.y

            if (object.point) {
              this.points.push(object)
            } else {
              // Composite.add(this.bodies, Bodies.rectangle(object.x, object.y, object.width, object.height, {
              //   label: object.name,
              //   isStatic: true,
              // }))
            }
          })
          break

        case 'tilelayer':
        default:
          if (layer.chunks) {
            layer.chunks.forEach(chunk => {
              const chunkOffsetX = this.anchorPoint.x - (~(chunk.x * tilewidth) + 1)
              const chunkOffsetY = this.anchorPoint.y - (~(chunk.y * tileheight) + 1)

              Object.entries(chunk.data).forEach(([index, tileID]) => {
                this._renderTile(context, tileID - 1, {
                  x: (tilewidth * (index % chunk.width)) + chunkOffsetX,
                  y: (Math.floor(index / chunk.width) * tileheight) + chunkOffsetY,
                })
              })
            })
          } else {
            Object.entries(layer.data).forEach(([index, tileID]) => {
              this._renderTile(context, tileID - 1, {
                x: (tilewidth * (index % layer.width)) + layer.x,
                y: (Math.floor(index / layer.width) * tileheight) + layer.y,
              })
            })
          }
          break
      }
    })

    this.isReady = true
  }
}





export { Map }
