import BaseLayer, { Serializable } from './base_layer'

export class PaintProperties extends Serializable {
  heatmapRadius: number
  heatmapWeight: number
  heatmapIntensity: number
  heatmapOpacity: number
  heatmapColor: string

  constructor(data: any) {
    super()
    this.heatmapRadius = data['heatmap-radius'] || 30
    this.heatmapWeight = data['heatmap-weight'] || 1
    this.heatmapIntensity = data['heatmap-intensity'] || 1
    this.heatmapOpacity = data['heatmap-opacity'] || 1
    this.heatmapColor = data['heatmap-color'] || ''
  }
}

export class LayoutProperties extends Serializable {
  visibility: 'visible' | 'none'

  constructor(data: any) {
    super()
    this.visibility = data.visibility || 'visible'
  }
}

export default class HeatmapLayer extends BaseLayer {
  paint: PaintProperties
  layout: LayoutProperties

  constructor(data: any) {
    super(data)
    this.paint = new PaintProperties(data.paint || {})
    this.layout = new LayoutProperties(data.layout || {})
  }
}
