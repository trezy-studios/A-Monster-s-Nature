-- Get current sprite
local sourceSprite = app.activeSprite

-- Exit if we're not currently looking at a sprite
if not sourceSprite then
  return app.alert('There is no active sprite')
end

-- Import libraries
local JSON = dofile('./jsonStorage.lua')

-- Initiate the important variables
local spriteFilename = string.gsub(sourceSprite.filename, '^.+/', '')
local baseFilename = string.gsub(spriteFilename, '.aseprite$', '')
local basePath = string.gsub(sourceSprite.filename, spriteFilename, '')
local chunkHeight = 0
local chunkWidth = 0
local exportOptions = {
  flipped = true,
  layers = true,
  slices = true,
  tags = true,
}
local layerCount = 0
local outputHeight = 0
local outputImage = nil
local outputWidth = 0
local originalLayerStates = {}
local scaleOptions = {
  '1x',
  '2x',
  '3x',
  '4x',
  '5x',
}
local scales = {
  {
    prefix = '',
    scale = '1x',
    suffix = '@1x',
  },
}
local spriteData = {
  ['chunks'] = {},
  ['frames'] = {},
  ['meta'] = {
    ['chunk'] = {
      ['size'] = {},
    },
    ['images'] = {},
    ['scales'] = {},
    ['sprite'] = {
      ['size'] = {
        ['height'] = sourceSprite.height,
        ['width'] = sourceSprite.width,
      },
    },
  },
  ['slices'] = {},
  ['tags'] = {},
}
local tagCount = 0

function doTheThing ()
  -- Set the output width to the width of the source * the length of the longest tag
  -- Also count how many tags there are
  for i, tag in ipairs(sourceSprite.tags) do
    local tagData = {
      ['frames'] = {},
      ['length'] = tag.frames,
      ['name'] = tag.name,
      ['offset'] = {
        ['x'] = 0,
        ['y'] = sourceSprite.height * (i - 1),
      },
    }
    local newWidth = tag.frames * sourceSprite.width

    if newWidth < outputWidth then
      newWidth = outputWidth
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
        ['offset'] = {
          ['x'] = currentFrameIndex * sourceSprite.width,
          ['y'] = (i - 1) * sourceSprite.height,
        },
      })

      table.insert(tagData.frames, (currentFrame.frameNumber - 1))

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

  chunkHeight = sourceSprite.height * tagCount

  -- Cache original layer visibility states, then hide all layers
  -- Also count how many top level layers there are
  for i, layer in ipairs(sourceSprite.layers) do
    local offsetY = (i - 1) * (tagCount * sourceSprite.height)

    originalLayerStates[i] = layer.isVisible
    layer.isVisible = false

    table.insert(spriteData.chunks, {
      ['blendMode'] = layer.blendMode,
      ['name'] = layer.name,
      ['offset'] = {
        ['x'] = 0,
        ['y'] = offsetY,
      },
      ['opacity'] = layer.opacity,
    })

    if exportOptions['flipped'] then
      table.insert(spriteData.chunks, {
        ['blendMode'] = layer.blendMode,
        ['name'] = layer.name .. '-flipped',
        ['offset'] = {
          ['x'] = chunkWidth,
          ['y'] = offsetY,
        },
        ['opacity'] = layer.opacity,
      })
    end

    layerCount = layerCount + 1
  end

  outputHeight = chunkHeight * layerCount

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

  spriteData.meta.chunk.size.height = chunkHeight
  spriteData.meta.chunk.size.width = chunkWidth

  -- Resize the output
  if exportOptions['flipped'] then
    outputWidth = outputWidth * 2
  end

  outputImage = Image(outputWidth, outputHeight, sourceSprite.colorMode)

  -- Loop over every frame once for every layer, copying the content of that frame into the output
  for i, layer in ipairs(sourceSprite.layers) do
    layer.isVisible = true

    for j, tag in ipairs(sourceSprite.tags) do
      local framesExported = 0
      local flipOffset = tagCount * sourceSprite.width

      while framesExported < tag.frames do
        local frame = tag.fromFrame.frameNumber + framesExported
        local x = sourceSprite.width * framesExported
        local y = (j + (tagCount * (i - 1)) - 1) * sourceSprite.height

        outputImage:drawSprite(sourceSprite, frame, Point(x, y))

        if exportOptions['flipped'] then
          app.command.Flip()
          outputImage:drawSprite(sourceSprite, frame, Point(x + chunkWidth, y))
          app.command.Undo()
        end

        framesExported = framesExported + 1
      end
    end

    layer.isVisible = false
  end

  -- Reset the layers in the source sprite to their original states
  for i, layer in ipairs(sourceSprite.layers) do
    layer.isVisible = originalLayerStates[i]
  end

  -- Save sprite sheets at each of the desired scales
  for i, scale in ipairs(scales) do
    local filename = scale.prefix .. baseFilename .. scale.suffix .. '.png'
    local scaleFactor = tonumber(string.gsub(scale.scale, 'x', ''), 10)
    local scaledImage = Image(outputImage)

    scaledImage:resize(scaledImage.width * scaleFactor, scaledImage.height * scaleFactor)
    scaledImage:saveAs(basePath .. filename)

    spriteData.meta.images[scale.scale] = filename
    table.insert(spriteData.meta.scales, scale.scale)
  end

  -- Write the JSON file
  local jsonOutputFile = io.open(basePath .. baseFilename .. '.json', 'w')
  jsonOutputFile:write(JSON.encode(spriteData))
  jsonOutputFile:close()
end

-- Open the options dialog
function openOptionsDialog ()
  local optionsDialog = Dialog('AwesomeExport!')

  function handleAddScaleClick ()
    local lastScale = scales[#scales]
    local newScale = {
      prefix = '',
      scale = (tonumber(string.gsub(lastScale.scale, 'x$', ''), 10) + 1) .. 'x',
    }
    newScale.suffix = string.gsub(lastScale.suffix, lastScale.scale, newScale.scale)

    table.insert(scales, newScale)

    optionsDialog:close()

    openOptionsDialog()
  end

  function handleOKClick ()
    local optionsData = optionsDialog.data

    exportOptions['flipped'] = optionsDialog.data['export-flipped']
    exportOptions['layers'] = optionsDialog.data['export-layers']
    exportOptions['slices'] = optionsDialog.data['export-slices']
    exportOptions['tags'] = optionsDialog.data['export-tags']

    for i, scale in ipairs(scales) do
      local scaleIDPrefix = 'scale-' .. i

      scales[i] = {
        prefix = optionsData[scaleIDPrefix .. '-prefix'],
        scale = optionsData[scaleIDPrefix .. '-scale'],
        suffix = optionsData[scaleIDPrefix .. '-suffix'],
      }
    end

    optionsDialog:close()
    doTheThing()
  end

  optionsDialog:separator({ text = 'Scales' })

  for i, scale in ipairs(scales) do
    if i > 1 then
      optionsDialog:separator()
    end

    local scaleIDPrefix = 'scale-' .. i
    optionsDialog:combobox({
      decimals = 0,
      id = scaleIDPrefix .. '-scale',
      label = 'Scale',
      option = scale.scale,
      options = scaleOptions,
      text = 'x',
    })

    optionsDialog:entry({
      id = scaleIDPrefix .. '-prefix',
      label = 'Prefix',
      text = scale.prefix,
    })

    optionsDialog:entry({
      id = scaleIDPrefix .. '-suffix',
      label = 'Suffix',
      text = scale.suffix,
    })
  end

  optionsDialog:button({
    onclick = handleAddScaleClick,
    text = '+ Add scale',
  })

  optionsDialog:separator({ text = 'Export' })

  optionsDialog:check({
    id = 'export-layers',
    label = 'Layers',
    selected = true,
  })

  optionsDialog:check({
    id = 'export-slices',
    label = 'Slices',
    selected = true,
  })

  optionsDialog:check({
    id = 'export-tags',
    label = 'Tags',
    selected = true,
  })

  optionsDialog:check({
    id = 'export-flipped',
    label = 'Create flipped images',
    selected = true,
  })

  optionsDialog:separator()
  optionsDialog:button({
    onclick = handleOKClick,
    text = 'OK',
  })
  optionsDialog:button({
    onclick = optionsDialog:close(),
    text = 'Cancel',
  })

  optionsDialog:show()
end

openOptionsDialog()
