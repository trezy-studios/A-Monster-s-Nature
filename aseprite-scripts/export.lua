-- Get current sprite
local sourceSprite = app.activeSprite

-- Exit if we're not currently looking at a sprite
if not sourceSprite then
  return app.alert('There is no active sprite')
end

-- Import libraries
local JSON = dofile('./jsonStorage.lua')

-- Initiate the important variables
local chunkHeight = 0
local chunkWidth = 0
local executionDialog = Dialog('AwesomeExport is creating your sprite...   ')
local jsonOutputFilename = string.gsub(sourceSprite.filename, 'aseprite$', 'json')
local jsonOutputFile = io.open(jsonOutputFilename, 'w')
local layerCount = 0
local outputHeight = 0
local outputSprite = Sprite(sourceSprite.width, sourceSprite.height, sourceSprite.colorMode)
local outputWidth = 0
local originalLayerStates = {}
local spriteData = {
  ['chunks'] = {},
  ['frames'] = {},
  ['meta'] = {
    ['chunk'] = {
      ['size'] = {},
    },
    ['image'] = {},
    ['scale'] = { '1x' },
    ['size'] = {
      ['height'] = sourceSprite.height,
      ['width'] = sourceSprite.width,
    },
  },
  ['slices'] = {},
  ['tags'] = {},
}
local tagCount = 0

-- Open the execution dialog to indicate that we're busy
executionDialog:show{ wait=false }

-- Cache original layer visibility states, then hide all layers
-- Also count how many top level layers there are
for i, layer in ipairs(sourceSprite.layers) do
  originalLayerStates[i] = layer.isVisible
  layer.isVisible = false

  table.insert(spriteData.chunks, {
    ['blendMode'] = layer.blendMode,
    ['name'] = layer.name,
    ['opacity'] = layer.opacity,
  })

  layerCount = layerCount + 1
end

-- Set the output width to the width of the source * the length of the longest tag
-- Also count how many tags there are
for i, tag in ipairs(sourceSprite.tags) do
  local tagData = {
    ['frames'] = {},
    ['length'] = tag.frames,
    ['name'] = tag.name,
    ['offset'] = sourceSprite.height * (i - 1),
  }
  local newWidth = tag.frames * sourceSprite.width

  if newWidth < outputSprite.width then
    newWidth = outputSprite.width
  end

  if (tag.aniDir == 0) then
    tagData.direction = 'forward'
  end

  if (tag.aniDir == 1) then
    tagData.direction = 'reverse'
  end

  if (tag.aniDir == 2) then
    tagData.direction = 'pingpong'
  end

  local currentFrame = tag.fromFrame
  local currentFrameIndex = 0
  local shouldContinue = true

  while currentFrameIndex < tag.frames do
    table.insert(spriteData.frames, {
      ['duration'] = math.floor(currentFrame.duration * 1000),
      ['id'] = currentFrame.frameNumber,
      ['position'] = {
        ['x'] = currentFrameIndex * sourceSprite.width,
        ['y'] = (i - 1) * sourceSprite.height,
      },
    })

    table.insert(tagData.frames, currentFrame.frameNumber)

    if not currentFrame.next then
      shouldContinue = false
    end

    currentFrameIndex = currentFrameIndex + 1
    currentFrame = currentFrame.next
  end

  table.insert(spriteData.tags, tagData)

  chunkWidth = newWidth
  outputWidth = newWidth
  tagCount = tagCount + 1
end

-- Compile slice data
for i, slice in ipairs(sourceSprite.slices) do
  local sliceData = {
    ['bounds'] = {
      ['height'] = slice.bounds.height,
      ['width'] = slice.bounds.width,
      ['x'] = slice.bounds.x,
      ['y'] = slice.bounds.y,
    },
    ['data'] = slice.data,
    ['name'] = slice.name,
  }

  function decodeData ()
    local decodedData = JSON.decode(slice.data)

    sliceData.data = decodedData
  end

  pcall(decodeData)

  table.insert(spriteData.slices, sliceData)
end

-- Update the output height based on the number of layers and tags
chunkHeight = sourceSprite.height * tagCount
outputHeight = chunkHeight * layerCount

spriteData.meta.chunk.size.height = chunkHeight
spriteData.meta.chunk.size.width = chunkWidth

-- Resize the output
outputSprite:resize(outputWidth, outputHeight)

-- Loop over every frame once for every layer, copying the content of that frame into the output
local cel = outputSprite:newCel(outputSprite.layers[1], 1)

for i, layer in ipairs(sourceSprite.layers) do
  layer.isVisible = true

  for j, tag in ipairs(sourceSprite.tags) do
    local framesExported = 0

    while framesExported < tag.frames do
      local x = sourceSprite.width * framesExported
      local y = (j + (tagCount * (i - 1)) - 1) * sourceSprite.height
      local frame = tag.fromFrame.frameNumber + framesExported

      cel.image:drawSprite(sourceSprite, frame, Point(x, y))

      framesExported = framesExported + 1
    end
  end

  layer.isVisible = false
end

-- Reset the layers in the source sprite to their original states
for i, layer in ipairs(sourceSprite.layers) do
  layer.isVisible = originalLayerStates[i]
end

-- TODO: Create flipped copies of layers
-- TODO: Render to export file

-- for i, layer in ipairs(spriteData.layers) do
--   print('blendMode', layer.blendMode)
--   print('opacity', layer.opacity)
--   print('name', layer.name)
-- end

jsonOutputFile:write(JSON.encode(spriteData))

jsonOutputFile:close()
outputSprite:close()
executionDialog:close()
