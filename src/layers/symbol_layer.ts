import BaseLayer, { Serializable } from './base_layer'
import { kebabize } from '../helpers'

export class PaintProperties extends Serializable {
  iconColor: string | string[]
  iconOpacity: number
  iconHaloColor: string
  iconHaloWidth: number
  iconHaloBlur: number
  iconTranslate: [number, number]
  iconTranslateAnchor: 'map' | 'viewport'
  textOpacity: number
  textColor: string | string[]
  textHaloColor: string
  textHaloWidth: number
  textHaloBlur: number
  textTranslate: [number, number]
  textTranslateAnchor: 'map' | 'viewport'

  constructor(data: any) {
    super()
    const iconColor = data['icon-color'] && data['icon-color'].property ? [ 'get', data['icon-color'].property ] : '#000000'
    this.iconColor = iconColor
    this.iconOpacity = data['icon-opacity'] || 1
    this.iconHaloColor = data['icon-halo-color'] || '#00000000'
    this.iconHaloWidth = data['icon-halo-width'] || 0
    this.iconHaloBlur = data['icon-halo-blur'] || 0
    this.iconTranslate = data['icon-translate'] || [0, 0]
    this.iconTranslateAnchor = data['icon-translate-anchor'] || 'map'
    this.textOpacity = data['text-opacity'] || 1
    const textColor = data['text-color'] && data['text-color'].property ? [ 'get', data['text-color'].property ] : '#000000'
    this.textColor = textColor
    this.textHaloColor = data['text-halo-color'] || '#00000000'
    this.textHaloWidth = data['text-halo-width'] || 0
    this.textHaloBlur = data['text-halo-blur'] || 0
    this.textTranslate = data['text-translate'] || [0, 0]
    this.textTranslateAnchor = data['text-translate-anchor'] || 'map'

  }
}

export type Placement = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type WritingMode = 'horizontal' | 'vertical'

export class LayoutProperties extends Serializable {
  visibility: 'visible' | 'none'
  symbolPlacement: 'point' | 'line' | 'line-center'
  symbolSpacing: number
  symbolAvoidEdges: boolean
  symbolSortKey?: number
  symbolZOrder: 'auto' | 'viewport-y' | 'source'
  iconAllowOverlap: boolean
  iconIgnorePlacement: boolean
  iconOptional: boolean
  iconRotationAlignment: 'map' | 'viewport' | 'auto'
  iconSize: number
  iconTextFit: 'none' | 'width' | 'height' | 'both'
  iconTextFitPadding: [number, number, number, number]
  iconImage?: string | string[]
  iconRotate: number
  iconPadding: number
  iconKeepUpright: boolean
  iconOffset: [number, number]
  iconAnchor: Placement
  iconPitchAlignment: 'map' | 'viewport' | 'auto'
  textPitchAlignment: 'map' | 'viewport' | 'auto'
  textRotationAlignment: 'map' | 'viewport' | 'auto'
  textField: string
  textFont: string[]
  textSize: number
  textMaxWidth: number
  textLineHeight: number
  textLetterSpacing: number
  textJustify: 'auto' | 'left' | 'right' | 'center'
  textRadialOffset: number
  textVariableAnchor?: Placement[]
  textAnchor: Placement
  textMaxAngle: number
  textWritingMode?: WritingMode[]
  textRotate: number
  textPadding: number
  textKeepUpright: boolean
  textTransform: 'none' | 'uppercase' | 'lowercase'
  textOffset: [number, number]
  textAllowOverlap: boolean
  textIgnorePlacement: boolean
  textOptional: boolean

  constructor(data: any) {
    super()
    this.visibility = data.visibility || 'visible'
    this.symbolPlacement = data['symbol-placement'] || 'point'
    this.symbolSpacing = data['symbol-spacing'] || 250
    this.symbolAvoidEdges = data['symbol-avoid-edges'] || false
    this.symbolSortKey = data['symbol-sort-key']
    this.symbolZOrder = data['symbol-z-order'] || 'auto'


    this.iconAllowOverlap = data['icon-allow-overlap'] || false
    this.iconIgnorePlacement = data['icon-ignore-placement'] || false
    this.iconOptional = data['icon-optional'] || false
    this.iconRotationAlignment = data['icon-rotation-alignment'] || 'auto'
    this.iconSize = data['icon-size'] || 1
    this.iconTextFit = data['icon-text-fit'] || 'none'
    this.iconTextFitPadding = data['icon-text-fit-padding'] || [0, 0, 0, 0]
    if (data['icon-image'] && data['icon-image'].property) {
      this.iconImage = ['get', data['icon-image'].property]
    }
    this.iconRotate = data['icon-rotate'] || 0
    this.iconPadding = data['icon-padding'] || 2
    this.iconKeepUpright = data['icon-keep-upright'] || false
    this.iconOffset = data['icon-offset'] || [0, 0]
    this.iconAnchor = data['icon-anchor'] || 'center'
    this.iconPitchAlignment = data['icon-pitch-alignment'] || 'auto'

    this.textPitchAlignment = data['text-pitch-alignment'] || 'auto'
    this.textRotationAlignment = data['text-rotation-alignment'] || 'auto'
    const textField = data['text-field'] && data['text-field'].property ? ['get', data['text-field'].property] : data['text-field']
    this.textField = textField
    this.textFont = data['text-font'] && data['text-font'].property ? ['get', data['text-font'].property] : [ "Klokantech Noto Sans Regular" ]
    const textSize = data['text-size'] && data['text-size'].property ? ['get', data['text-size'].property] : data['text-size']
    this.textSize = textSize
    this.textMaxWidth = data['text-max-width'] || 10
    this.textLineHeight = data['text-line-height'] || 1.2
    this.textLetterSpacing = data['text-letter-spacing'] || 0
    this.textJustify = data['text-justify'] || 'center'
    this.textRadialOffset = data['text-radial-offset'] || 0
    this.textVariableAnchor = data['text-variable-anchor']
    this.textAnchor = data['text-anchor'] || 'center'
    this.textMaxAngle = data['text-max-angle'] || 45
    this.textWritingMode = data['text-writing-mode']
    this.textRotate = data['text-rotate'] || 0
    this.textPadding = data['text-padding'] || 2
    this.textKeepUpright = data['text-keep-upright'] || true
    this.textTransform = data['text-transform'] || 'none'
    this.textOffset = data['text-offset'] || [0, 0]
    this.textAllowOverlap = data['text-allow-overlap'] || false
    this.textIgnorePlacement = data['text-ignore-placement'] || false
    this.textOptional = data['text-optional'] || false
  }

  get json() {
    const data = kebabize(this)
    data['symbol-z-order'] = this.symbolZOrder
    delete data['symbol-zorder']
    return data
  }
}

export default class SymbolLayer extends BaseLayer {
  paint: PaintProperties
  layout: LayoutProperties

  constructor(data: any) {
    super(data)
    this.paint = new PaintProperties(data.paint || {})
    this.layout = new LayoutProperties(data.layout || {})
  }
}
