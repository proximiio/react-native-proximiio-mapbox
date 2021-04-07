import BaseLayer, { Serializable } from './base_layer'
import { isIOS } from '../helpers'

export class PaintProperties extends Serializable {
  lineColor: string | string[]
  lineOpacity: number
  lineTranslate: [number, number]
  lineTranslateAnchor: 'map' | 'viewport'
  lineWidth: number
  lineGapWidth: number
  lineOffset: number
  lineBlur: number
  lineDasharray?: [number, number]
  linePattern?: string
  lineGradient?: string

  constructor(data: any) {
    super()
    if (isIOS) {
      this.lineColor = data['line-color'] ? ['to-color', data['line-color'], '#000000'] : '#000000'
    } else {
      if (data['line-color'].property) {
        this.lineColor = ['to-color', ['get', data['line-color'].property] as unknown as string]
      } else {
        this.lineColor = data['line-color']
      }
    }
    this.lineOpacity = data['line-opacity'] || 1
    this.lineTranslate = data['line-translate'] || [0, 0]
    this.lineTranslateAnchor = data['line-translate-anchor'] || 'map'
    this.lineWidth = data['line-width'] || 1
    this.lineGapWidth = data['line-gap-width'] || 0
    this.lineOffset = data['line-offset'] || 0
    this.lineBlur = data['line-blur'] || 0
    this.lineDasharray = data['line-dasharray']
    this.linePattern = data['line-pattern']
    this.lineGradient = data['line-gradient']
  }
}

export class LayoutProperties extends Serializable {
  visibility: 'visible' | 'none'
  lineCap: 'butt' | 'round' | 'square'
  lineJoin: 'bevel' | 'round' | 'miter'
  lineMiterLimit: number
  lineRoundLimit: number

  constructor(data: any) {
    super()
    this.visibility = data.visibility || 'visible'
    this.lineCap = data['line-cap'] || 'butt'
    this.lineJoin = data['line-join'] || 'miter'
    this.lineMiterLimit = data['line-miter-limit'] || 2
    this.lineRoundLimit = data['line-round-limit'] || 1.05
  }
}

export default class LineLayer extends BaseLayer {
  paint: PaintProperties
  layout: LayoutProperties

  constructor(data: any) {
    super(data)
    this.paint = new PaintProperties(data.paint || {})
    this.layout = new LayoutProperties(data.layout || {})
  }
}
