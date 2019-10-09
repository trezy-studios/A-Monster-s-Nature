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
      container.onload = resolve
      container.src = `/game/${spritePath}@1x.png`
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
