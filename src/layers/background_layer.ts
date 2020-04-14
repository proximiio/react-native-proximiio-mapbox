import BaseLayer, { Serializable } from './base_layer'

export class PaintProperties extends Serializable {
  backgroundColor: string
  backgroundPattern?: string
  backgroundOpacity: string

  constructor(data: any) {
    super()
    this.backgroundColor = data['background-color'] || '#000000'
    this.backgroundPattern = data['background-pattern']
    this.backgroundOpacity = data['background-opacity'] || 1
  }
}

export class LayoutProperties extends Serializable {
  visibility: 'visible' | 'none'

  constructor(data: any) {
    super()
    this.visibility = data.visibility || 'visible'
  }
}

export default class BackgroundLayer extends BaseLayer {
  paint: PaintProperties
  layout: LayoutProperties

  constructor(data: any) {
    super(data)
    this.paint = new PaintProperties(data.paint || {})
    this.layout = new LayoutProperties(data.layout || {})
  }
}