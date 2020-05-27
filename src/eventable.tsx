export type Observer = (event?: string, data?: any, eventable?: Eventable) => any

export class Eventable {
  _observers: Observer[] = []

  on(observer: Observer) {
    this._observers.push(observer)
  }

  off(observer: Observer) {
    const index = this._observers.findIndex(o => o === observer)
    if (index >= 0) {
      this._observers.splice(index, 1)
    }
  }

  notify(event?: string, data?: any) {
    this._observers.forEach(observer => observer(event, data, this))
  }
}
