// The type of layer is specified  by the "type" property, and must be one of background, fill, line, symbol,
// raster, circle, fill-extrusion, heatmap, hillshade.
// Except for layers of the background type, each layer needs to refer to a source. Layers take the data that
// they get from a source, optionally filter features, and then define how those features are styled.

import { cloneDeep as clone } from 'lodash'
import { kebabize } from "../helpers"

export class Serializable {
  get json() {
    return kebabize(this)
  }
}

export default class BaseLayer {
  id: string
  source?: string // required for all layer types except 'background'
  sourceLayer?: string
  type: 'background' | 'fill' | 'line' | 'symbol' | 'raster' | 'circle' | 'fill-extrusion' | 'heatmap' | 'hillshade'
  minZoomLevel?: number
  maxZoomLevel?: number
  filter?: any
  paint?: Serializable
  layout?: Serializable
  metadata?: any

  constructor(data: any) {
    this.id = data.id
    this.type = data.type
    this.source = data.source
    this.sourceLayer = data['source-layer']
    this.minZoomLevel = data.minzoom
    this.maxZoomLevel = data.maxzoom
    this.filter = data.filter
    this.metadata = data.metadata
  }

  get json() {
    const { id, type, source, sourceLayer, minZoomLevel, maxZoomLevel, filter, metadata } = this
    const data: any = { id, type }
    if (source) data.source = source
    if (sourceLayer) data['source-layer'] = sourceLayer
    if (minZoomLevel) data.minZoomLevel = minZoomLevel
    if (maxZoomLevel) data.maxZoomLevel = maxZoomLevel
    if (filter) data.filter = filter

    if (this.metadata) {
      data.metadata = metadata
    }

    if (this.paint) {
      data.paint = this.paint.json
    }

    if (this.layout) {
      data.layout = this.layout.json
    }

    return data
  }

  get style() {
    const base = {...this.paint, ...this.layout} as any
    // const base = this.layout as any
    const style = {} as any
    Object.keys(base).forEach(key => {
      if (base[key]) {
        style[key] = base[key]
      }
    })
    return style
  }

  setFilterLevel(level: number) {
    const newFilter = clone(this.filter)

    this.filter.forEach((_filter: any, filterIndex: number) => {
      const filter = clone(_filter)
      let changed = false;

      if (this.id === 'proximiio-levelchangers') {
        const lvl = `__level_${level}`
        if (filterIndex === 3) {
          filter[1] = lvl;
          changed = true;
        }
        if (filterIndex === 4) {
          filter[1][1] = lvl;
          changed = true;
        }
      }

      if (Array.isArray(filter)) {
        if (filter[0] === '==') {
          const expression = filter[1]
          if (expression[0] === 'to-number') {
            if (expression[1][0] === 'get' && expression[1][1] === 'level') {
              filter[2] = level
              changed = true
            }
          }

          if (expression[0] === 'get' && expression[1] === 'level') {
            filter[2] = level
            changed = true
          }
        }

        if (filter[0] === '<=') {
          const expression = filter[1]
          if (expression[0] === 'to-number') {
            if (expression[1][0] === 'get' && expression[1][1] === 'level_min') {
              filter[2] = level
              changed = true
            }
          }

          if (expression[0] === 'get' && expression[1] === 'level_min') {
            filter[2] = level
            changed = true
          }
        }

        if (filter[0] === '>=') {
          const expression = filter[1]
          if (expression[0] === 'to-number') {
            if (expression[1][0] === 'get' && expression[1][1] === 'level_max') {
              filter[2] = level
              changed = true
            }
          }

          if (expression[0] === 'get' && expression[1] === 'level_max') {
            filter[2] = level
            changed = true
          }
        }
      }

      if (changed) {
        newFilter[filterIndex] = filter
      }
    })
    this.filter = newFilter
  }
}
