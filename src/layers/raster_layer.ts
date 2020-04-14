import BaseLayer, { Serializable } from './base_layer'

export class PaintProperties extends Serializable {
  rasterOpacity: number
  rasterHueRotate: number
  rasterBrightnessMin: number
  rasterBrightnessMax: number
  rasterSaturation: number
  rasterContrast: number
  rasterResampling: 'linear' | 'nearest'
  rasterFadeDuration: number

  constructor(data: any) {
    super()
    this.rasterOpacity = data['raster-opacity'] || 1
    this.rasterHueRotate = data['raster-hue-rotate'] || 0
    this.rasterBrightnessMin = data['raster-brightness-min'] || 0
    this.rasterBrightnessMax = data['raster-brightness-max'] || 1
    this.rasterSaturation = data['raster-saturation'] || 0
    this.rasterContrast = data['raster-contrast'] || 0
    this.rasterResampling = data['raster-resampling'] || 'linear'
    this.rasterFadeDuration = data['raster-fade-duration'] || 300
  }
}

export class LayoutProperties extends Serializable {
  visibility: 'visible' | 'none'

  constructor(data: any) {
    super()
    this.visibility = data.visibility || 'visible'
  }
}

export default class RasterLayer extends BaseLayer {
  paint: PaintProperties
  layout: LayoutProperties

  constructor(data: any) {
    super(data)
    this.paint = new PaintProperties(data.paint || {})
    this.layout = new LayoutProperties(data.layout || {})
  }
}