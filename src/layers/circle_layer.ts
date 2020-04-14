import BaseLayer, { Serializable } from './base_layer'

export class PaintProperties extends Serializable {
  circleRadius: number
  circleColor: string
  circleBlur: number
  circleOpacity: number
  circleTranslate: [number, number]
  circleTranslateAnchor: 'map' | 'viewport'
  circlePitchScale: 'map' | 'viewport'
  circlePitchAlignment: 'map' | 'viewport'
  circleStrokeWidth: number
  circleStrokeColor: string
  circleStrokeOpacity: number

  constructor(data: any) {
    super()
    this.circleRadius = data['circle-radius'] || 5
    this.circleColor = data['circle-color'] || '#000000'
    this.circleBlur = data['circle-blur'] || 0
    this.circleOpacity = data['circle-opacity'] || 1
    this.circleTranslate = data['circle-translate'] || [0, 0]
    this.circleTranslateAnchor = data['circle-translate-anchor'] || 'map'
    this.circlePitchScale = data['circle-pitch-scale'] || 'map'
    this.circlePitchAlignment = data['circle-pitch-alignment'] || 'viewport'
    this.circleStrokeWidth = data['circle-stroke-width'] || 1
    this.circleStrokeColor = data['circle-stroke-color'] || '#000000'
    this.circleStrokeOpacity = data['circle-stroke-opacity'] || 1
  }
}

export class LayoutProperties extends Serializable {
  visibility: 'visible' | 'none'
  circleSortKey: number

  constructor(data: any) {
    super()
    this.visibility = data.visibility || 'visible'
    this.circleSortKey = data['circle-sort-key'] || 0
  }
}

export default class CircleLayer extends BaseLayer {
  paint: PaintProperties
  layout: LayoutProperties

  constructor(data: any) {
    super(data)
    this.type = 'circle'
    this.paint = new PaintProperties(data.paint || {})
    this.layout = new LayoutProperties(data.layout || {})
  }
}