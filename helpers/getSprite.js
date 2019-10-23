// Local constants
const sprites = {}





const getSprite = async (type, name, scale = 1) => {
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
      container.onload = resolve
      container.src = `/game/${spritePath}@${scale}x.png`
    }))

    const [spriteDataResult] = await Promise.all(promises)
    const spriteData = await spriteDataResult.json()

    sprite = {
      ...sprite,
      ...spriteData,
      isLoaded: true,
    }

    sprites[type] = sprite
  }

  return sprite
}





export default getSprite
