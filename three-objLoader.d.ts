declare module 'three/examples/jsm/loaders/OBJLoader.js' {
  import { Loader } from 'three';
  import { Group } from 'three';

  export class OBJLoader extends Loader {
    constructor();
    load(
      url: string,
      onLoad: (group: Group) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}