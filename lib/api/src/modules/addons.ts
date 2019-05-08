import { ReactElement } from 'react';

import { Module, State } from '../index';
import { Options } from '../store';

export enum types {
  TAB = 'tab',
  PANEL = 'panel',
  TOOL = 'tool',
  PREVIEW = 'preview',
  NOTES_ELEMENT = 'notes-element',
}

export type Types = types | string;
export interface RenderOptions {
  active: boolean;
  key: string;
}

export interface RouteOptions {
  storyId: string;
}
export interface MatchOptions {
  viewMode: string;
}

export interface Addon {
  title: string;
  type?: Types;
  id?: string;
  route?: (routeOptions: RouteOptions) => string;
  match?: (matchOptions: MatchOptions) => boolean;
  render: (renderOptions: RenderOptions) => ReactElement<any>;
}
export interface Collection {
  [key: string]: Addon;
}

interface Panels {
  [id: string]: Addon;
}

export interface SubAPI {
  getElements: (type: Types) => Collection;
  getPanels: () => Collection;
  getSelectedPanel: () => string;
  setSelectedPanel: (panelName: string) => void;
  setAddonState: (addonId: string, state: any, options?: Options) => Promise<State>;
  getAddonState: (addonId: string) => any;
}

export function ensurePanel(panels: Panels, selectedPanel?: string, currentPanel?: string) {
  const keys = Object.keys(panels);

  if (keys.indexOf(selectedPanel) >= 0) {
    return selectedPanel;
  }

  if (keys.length) {
    return keys[0];
  }
  return currentPanel;
}

export default ({ provider, store }: Module) => {
  const api: SubAPI = {
    getElements: type => provider.getElements(type),
    getPanels: () => api.getElements(types.PANEL),
    getSelectedPanel: () => {
      const { selectedPanel } = store.getState();
      return ensurePanel(api.getPanels(), selectedPanel, selectedPanel);
    },
    setSelectedPanel: panelName => {
      store.setState({ selectedPanel: panelName }, { persistence: 'session' });
    },
    setAddonState: (addonId, state, options) => {
      if (typeof state === 'function') {
        const s = state(api.getAddonState(addonId));
        return store.setState({ addons: { [addonId]: s } }, options);
      }
      return store.setState({ addons: { [addonId]: state } }, options);
    },
    getAddonState: addonId => {
      return store.getState().addons[addonId];
    },
  };

  return {
    api,
    state: {
      selectedPanel: ensurePanel(api.getPanels(), store.getState().selectedPanel),
      addons: {},
    },
  };
};
