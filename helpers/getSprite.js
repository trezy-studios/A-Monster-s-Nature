// Local constants
const sprites = {}





const getSprite = async (type, name) => {
  const spritePath = `${type}/${name}`
  let sprite = sprites[spritePath]

  if (!sprite) {
    const container = new Image
    const promises = []

    sprite = {
      container,
      isLoaded: false,
    }

    sprites[type] = sprite

    promises.push(fetch(`/game/${spritePath}.json`))

    promises.push(new Promise((resolve, reject) => {
      container.onerror = reject

      container.onload = () => {
        sprite.isLoaded = true
        resolve()
      }

      container.src = `/game/${spritePath}.png`
    }))

    const [spriteDataResult] = await Promise.all(promises)
    const spriteData = await spriteDataResult.json()

    sprites[type] = {
      ...sprite,
      ...spriteData,
    }
  }

  return sprite
}





export default getSprite
