import { search } from './core.js';

self.onmessage = ({ data }) => {
  try {
    const result = search(data.board, data.options);
    self.postMessage({ id: data.id, result });
  } catch (error) {
    self.postMessage({ id: data.id, error: error.message });
  }
};
