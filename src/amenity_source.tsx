import React from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';
import ProximiioMapbox, { Amenity, ProximiioMapboxEvents } from './instance';
import {blueDot, blueDotWithCone} from './helpers';
import equal from 'fast-deep-equal/react';

export type URIImages = {
  [id: string]: { uri: string, scale: number };
};

interface Props {}

interface State {
  syncKey: string;
  images: URIImages;
}

export class AmenitySource extends React.Component<Props, State> {
  state = {
    syncKey: `proximiio-amenity-source-${new Date().getTime()}`,
    images: {} as URIImages,
  };

  constructor(props: Props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  async onChange() {
    const amenities = ProximiioMapbox.getAmenities();
    console.log('amenity source onChange, size: ', amenities.length);
    const images = {
      bluedot: { uri: blueDot, scale: 1 },
      bluedotWithCone: { uri: blueDotWithCone, scale: 1 }
    } as URIImages;
    amenities
      .filter(a => a.icon && a.icon.length > 256 )
      .forEach(amenity => ( images[amenity.id] = { uri: amenity.icon, scale: 1 }));
    this.setState({ images, syncKey: `proximiio-amenity-source-${new Date().getTime()}` });
  }

  componentDidMount() {
    this.onChange();
    ProximiioMapbox.subscribe(
      ProximiioMapboxEvents.AMENITIES_CHANGED,
      this.onChange
    );
  }

  componentWillUnmount() {
    ProximiioMapbox.unsubscribe(
      ProximiioMapboxEvents.AMENITIES_CHANGED,
      this.onChange
    );
  }

  shouldComponentUpdate(_nextProps: Props, nextState: State) {
    if (equal(nextState, this.state)) {
      return false
    }
    return true
  }

  render() {
    return (
      <MapboxGL.Images
        key={this.state.syncKey}
        images={this.state.images}
      />
    );
  }
}
