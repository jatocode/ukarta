declare namespace THREE {
  class CannonDebugRenderer {
      constructor(scene: THREE.Scene, world: CANNON.World);
      update(): void;
  }
}
