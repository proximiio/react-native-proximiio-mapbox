import * as React from 'react';
import MapboxGL, {
  CircleLayerStyle,
  SymbolLayerStyle
} from '@react-native-mapbox-gl/maps';
import ProximiioMapbox, {ProximiioMapboxEvents}  from './instance';
import Proximiio, {ProximiioLocation} from 'react-native-proximiio';
import CompassHeading from 'react-native-compass-heading';
// @ts-ignore
import headingImage from './assets/heading_cone.png';
// @ts-ignore
import Annotation from '@react-native-mapbox-gl/maps/javascript/components/annotations/Annotation';
import Constants from './constants';
import { EmitterSubscription } from 'react-native';

interface Props {
  onAccuracyChanged?: (accuracy: number) => void;
  onHeadingChanged?: (heading: number) => void;
  headingStyle?: SymbolLayerStyle;
  markerOuterRingStyle?: CircleLayerStyle;
  markerMiddleRingStyle?: CircleLayerStyle;
  markerInnerRingStyle?: CircleLayerStyle;
  showHeadingIndicator?: boolean;
  visible?: boolean;
}
interface State {
  heading?: number;
  location?: ProximiioLocation;
}

export class UserLocationSource extends React.Component<Props, State> {
  private styleSub?: EmitterSubscription;
  private featuresSub?: EmitterSubscription;
  private locationSub?: EmitterSubscription;

  private accuracy = undefined;
  state = {
    location: Proximiio.location,
    heading: 0,
  } as State;

  componentDidMount() {
    this.styleSub = ProximiioMapbox.subscribe(ProximiioMapboxEvents.STYLE_CHANGED, this.onChange);
    this.featuresSub = ProximiioMapbox.subscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange);
    this.locationSub =ProximiioMapbox.subscribe(ProximiioMapboxEvents.LOCATION_UPDATED, this.onLocationUpdated);

    CompassHeading.start(2, ({heading, accuracy}) => {
      this.setState({heading: heading});
      if (this.accuracy !== accuracy && this.props.onAccuracyChanged) {
        this.accuracy = accuracy;
        this.props.onAccuracyChanged(accuracy);
      }
      if (this.props.onHeadingChanged) {
        this.props.onHeadingChanged(heading);
      }
    });
  }

  componentWillUnmount() {
    this.styleSub?.remove();
    this.featuresSub?.remove();
    this.locationSub?.remove();
    CompassHeading.stop();
  }

  render() {
    if (!this.props.visible || !this.state.location) {
      return null;
    }

    let styles = getDefaultStyle(this.state.heading || 0);
    styles.outerRing = {...styles.outerRing, ...this.props.markerOuterRingStyle};
    styles.middleRing = {...styles.middleRing, ...this.props.markerMiddleRingStyle};
    styles.innerRing = {...styles.innerRing, ...this.props.markerInnerRingStyle};
    styles.heading = {...styles.heading, ...this.props.headingStyle};

    return (
      <Annotation
        id="proximiUserLocation"
        animated={true}
        key={'proximiioUserAnnotation'}
        coordinates={this.state.location ? [this.state.location.lng, this.state.location.lat] : null}>
        {createIcon(styles, this.props.showHeadingIndicator)}
      </Annotation>
    );
  }

  private onLocationUpdated = (location: ProximiioLocation) => {
    this.setState({location: location});
  };

  private onChange = () => {
    this.forceUpdate();
  };
}

export const createIcon = (styles: Styles, showsUserHeadingIndicator?: boolean) => {
  const layerCount = ProximiioMapbox.style?.layers.length ?? 100;
  const coneIndex = layerCount + 1;
  const markerIndex = coneIndex + 1;

  return [
    (showsUserHeadingIndicator ?
      <MapboxGL.SymbolLayer
        key={Constants.LAYER_USER_MARKER_CONE}
        id={Constants.LAYER_USER_MARKER_CONE}
        // aboveLayerID={Constants.LAYER_ROUTING_SYMBOLS}
        layerIndex={coneIndex}
        style={styles.heading}
      /> : []),
    <MapboxGL.CircleLayer
      key={Constants.LAYER_USER_MARKER_1}
      id={Constants.LAYER_USER_MARKER_1}
      style={styles.outerRing}
      layerIndex={markerIndex}
      aboveLayerID={showsUserHeadingIndicator ? Constants.LAYER_USER_MARKER_CONE : Constants.LAYER_ROUTING_SYMBOLS}
    />,
    <MapboxGL.CircleLayer
      key={Constants.LAYER_USER_MARKER_2}
      id={Constants.LAYER_USER_MARKER_2}
      aboveLayerID={Constants.LAYER_USER_MARKER_1}
      style={styles.middleRing}
    />,
    <MapboxGL.CircleLayer
      key={Constants.LAYER_USER_MARKER_3}
      id={Constants.LAYER_USER_MARKER_3}
      aboveLayerID={Constants.LAYER_USER_MARKER_2}
      style={styles.innerRing}
    />,
  ]
};

const proximiBlue = 'rgb(59,143,214)';


interface Styles {
  heading: SymbolLayerStyle;
  outerRing: CircleLayerStyle;
  middleRing: CircleLayerStyle;
  innerRing: CircleLayerStyle;
}

const getDefaultStyle = (heading: number): Styles => {
  return {
    heading: getHeadingIndicatorStyle(heading),
    outerRing: {
      circleRadius: 16,
      circleColor: proximiBlue,
      circleOpacity: 0.2,
      circlePitchAlignment: 'map',
    },
    middleRing: {
      circleRadius: 15,
      circleColor: '#fff',
      circlePitchAlignment: 'map',
    },
    innerRing: {
      circleRadius: 10,
      circleColor: proximiBlue,
      circlePitchAlignment: 'map',
    }
  };
};

const getHeadingIndicatorStyle = (iconRotation?: number):SymbolLayerStyle => {
  return {
    iconImage: headingImage,
    iconSize: 1.2,
    iconAllowOverlap: true,
    iconRotate: iconRotation,
    iconRotationAlignment: 'map',
  } as SymbolLayerStyle;
};
