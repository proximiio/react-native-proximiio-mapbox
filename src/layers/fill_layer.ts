import BaseLayer, { Serializable } from './base_layer'
import { isIOS } from '../helpers'

export class PaintProperties extends Serializable {
  fillAntialias: boolean
  fillOpacity: number
  fillColor: string | string[]
  fillOutlineColor?: string | string[]
  fillTranslate: [number, number]
  fillTranslateAnchor: 'map' | 'viewport'
  fillPattern?: string | string[]

  constructor(data: any) {
    super()
    this.fillAntialias = data['fill-antialias'] || true
    this.fillOpacity = data['fill-opacity'] || 1
    // this.fillColor = data['fill-color'] || ['to-color', '#0080c0']
    if (isIOS) {
      this.fillColor = data['fill-color'] ? ['to-color', data['fill-color'], '#0080c0'] : '#0080c0'
    } else {
      if (data['fill-color'].property) {
        this.fillColor = ['to-color', ['get', data['fill-color'].property] as unknown as string]
      } else {
        this.fillColor = data['fill-color']
      }
    }
    if (data['fill-outline-color']) {
      this.fillOutlineColor = ['to-color', data['fill-outline-color'], '#0080c0']
    }
    this.fillTranslate = data['fill-translate'] || [0, 0]
    this.fillTranslateAnchor = data['fill-translate-anchor'] || 'map'

    if (data['fill-pattern']) {
      if (typeof data['fill-pattern'] === 'string') {
        this.fillPattern = ['literal', data['fill-pattern']]
      }
      if (data['fill-pattern'].property) {
        this.fillPattern = ['get', data['fill-pattern'].property]
      }
    }
  }
}

export class LayoutProperties extends Serializable {
  fillSortKey?: number
  visibility: 'visible' | 'none'

  constructor(data: any) {
    super()
    // this.fillSortKey = data['fill-sort-key']
    this.visibility = data.visibility || 'visible'
  }
}

export default class FillLayer extends BaseLayer {
  paint: PaintProperties
  layout: LayoutProperties

  constructor(data: any) {
    super(data)
    this.paint = new PaintProperties(data.paint || {})
    this.layout = new LayoutProperties(data.layout || {})
  }
}
