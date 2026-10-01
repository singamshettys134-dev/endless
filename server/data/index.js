import { appConfig } from '../config.js';
import { createVideoCatalog } from './generator.js';

export function buildDataStore() {
  const catalog = createVideoCatalog(appConfig.videoCount);
  return {
    total: catalog.videos.length,
    ...catalog,
    getById(id) {
      return catalog.byId.get(Number(id));
    },
    getIdsByCategory(category) {
      return (catalog.byCategory.get(category) || []).map((video) => video.id);
    },
    getPopular(limit = 20) {
      return catalog.popularity.slice(0, limit);
    },
    getTrending(limit = 20) {
      return catalog.trending.slice(0, limit);
    },
    listByIds(ids) {
      return ids.map((id) => catalog.byId.get(Number(id))).filter(Boolean);
    },
  };
}

export const dataStore = buildDataStore();

export function getDataStore() {
  return dataStore;
}
