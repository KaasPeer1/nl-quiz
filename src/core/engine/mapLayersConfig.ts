import type L from 'leaflet';
import type { GameFeature } from '../types';

export type LayerKind = 'bg' | 'correct' | 'wrong' | 'current' | 'selected';

export interface MapLayersConfig<T extends GameFeature> {
  getStyle: (type: LayerKind, feature?: any) => L.PathOptions;
  featureToProperties?: (feature: T) => Record<string, any>;
  featureToGeometry?: (feature: T) => any;
  showCurrent?: boolean;
  interactive?: Partial<Record<LayerKind, boolean>>;
  flashBold?: boolean;
}
