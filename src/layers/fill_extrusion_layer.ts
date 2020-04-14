import BaseLayer, { Serializable } from './base_layer'

export class PaintProperties extends Serializable {
  fillExtrusionColor: string | string[]
  fillExtrusionOpacity: number
  fillExtrusionTranslate: [number, number]
  fillExtrusionTranslateAnchor: 'map' | 'viewport'
  fillExtrusionPattern?: 'string'
  fillExtrusionHeight: number
  fillExtrusionBase: number
  // fillExtrusionVerticalGradient: boolean

  constructor(data: any) {
    super()
    const color = data['fill-extrusion-color'] && data['fill-extrusion-color'].property ? [ 'get', data['fill-extrusion-color'].property ] : data['fill-extrusion-color']
    this.fillExtrusionColor = data['fill-extrusion-color'] ? color : '#000000'
    const opacity = data['fill-extrusion-opacity'] && data['fill-extrusion-opacity'].property  ? [ 'get', data['fill-extrusion-opacity'].property ] : data['fill-extrusion-opacity']
    this.fillExtrusionOpacity = opacity || 1
    this.fillExtrusionTranslate = data['fill-extrusion-translate'] || [0, 0]
    this.fillExtrusionTranslateAnchor = data['fill-extrusion-translate-anchor'] || 'map'
    this.fillExtrusionPattern = data['fill-extrusion-pattern']
    const height = data['fill-extrusion-height'] && data['fill-extrusion-height'].property ? [ 'get', data['fill-extrusion-height'].property ] : data['fill-extrusion-height']
    this.fillExtrusionHeight = height || 0
    const base = data['fill-extrusion-base'] && data['fill-extrusion-base'].property ? [ 'get', data['fill-extrusion-base'].property ] : data['fill-extrusion-base']
    this.fillExtrusionBase = base || 0
  }
}

export class LayoutProperties extends Serializable {
  visibility: 'visible' | 'none'

  constructor(data: any) {
    super()
    this.visibility = data.visibility || 'visible'
  }
}

export default class FillExtrusionLayer extends BaseLayer {
  paint: PaintProperties
  layout: LayoutProperties

  constructor(data: any) {
    super(data)
    this.paint = new PaintProperties(data.paint || {})
    this.layout = new LayoutProperties(data.layout || {})
  }
}
