import React from 'react'
import MapboxGL from "@react-native-mapbox-gl/maps"

import BackgroundLayer from './layers/background_layer'
import CircleLayer from './layers/circle_layer'
import FillLayer from './layers/fill_layer'
import FillExtrusionLayer from './layers/fill_extrusion_layer'
import HeatmapLayer from './layers/heatmap_layer'
import LineLayer from './layers/line_layer'
import RasterLayer from './layers/raster_layer'
import SymbolLayer from './layers/symbol_layer'

export default (style: any, source: string, level: number = 0) => {
  if (!style || !Array.isArray(style.layers)) {
    return []
  }

  const avoidedLayers = style.layers
    .filter((layer: any) => layer.source !== source)

  const layers = style.layers
    .filter((layer: any) => layer.source === source)

  return layers.map((layer: any, index: number) => {
    // let belowLayer = index === 0 ? undefined : constants.LAYER_USER_ACCURACY
    let layerIndex = avoidedLayers.length + index

    if (layer.type === 'background') {
      const entity = new BackgroundLayer(layer)
      entity.setFilterLevel(level)
      return <MapboxGL.BackgroundLayer {...entity} key={`layer-${layer.id}`} layerIndex={layerIndex} style={entity.style}/>
    }
    if (layer.type === 'raster') {
      const entity = new RasterLayer(layer)
      entity.setFilterLevel(level)
      return <MapboxGL.RasterLayer {...entity} key={`layer-${layer.id}`} layerIndex={layerIndex} style={entity.style}/>
    }
    if (layer.type === 'fill') {
      const entity = new FillLayer(layer)
      entity.setFilterLevel(level)
      return <MapboxGL.FillLayer {...entity} key={`layer-${layer.id}`} layerIndex={layerIndex} style={entity.style}/>
    }
    if (layer.type === 'line') {
      const entity = new LineLayer(layer)
      entity.setFilterLevel(level)
      const indexed = source === 'route' ? 800 : undefined
      // if (source === 'route') {
      //   belowLayer = undefined
      // }
      return <MapboxGL.LineLayer {...entity} key={`layer-${layer.id}`} layerIndex={indexed} style={entity.style}/>
    }
    if (layer.type === 'fill-extrusion') {
      const entity = new FillExtrusionLayer(layer)
      entity.setFilterLevel(level)
      return <MapboxGL.FillExtrusionLayer {...entity} key={`layer-${layer.id}`} layerIndex={layerIndex} style={entity.style}/>
    }
    if (layer.type === 'symbol') {
      const entity = new SymbolLayer(layer)
      entity.setFilterLevel(level)
      return <MapboxGL.SymbolLayer {...entity} key={`layer-${layer.id}`} layerIndex={layerIndex} style={entity.style}/>
    }
    if (layer.type === 'heatmap') {
      const entity = new HeatmapLayer(layer)
      entity.setFilterLevel(level)
      return <MapboxGL.HeatmapLayer {...entity} key={`layer-${layer.id}`} layerIndex={layerIndex} style={entity.style}/>
    }
    if (layer.type === 'circle') {
      const entity = new CircleLayer(layer)
      entity.setFilterLevel(level)
      return <MapboxGL.CircleLayer {...entity} key={`layer-${layer.id}`} layerIndex={layerIndex} style={entity.style}/>
    }

    return null
  }) as any[]
}
