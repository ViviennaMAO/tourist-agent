import { Vector3 } from 'three';

// Polar angles beyond PI/2 allow looking upwards. Stop short of the pole so
// horizontal movement and drag direction stay well defined.
export const EXPLORE_POLAR_LIMIT = Math.PI - .14;
export const EXPLORE_DISTANCE_LIMIT = 240;
export function configureExploreCamera(controls, overview = false) {
  controls.minPolarAngle = .04;
  controls.maxPolarAngle = overview ? Math.PI * .48 : EXPLORE_POLAR_LIMIT;
  controls.maxDistance = overview ? 5000 : EXPLORE_DISTANCE_LIMIT;
  controls.minDistance = 4.5;
  controls.enablePan = false;
}

// At street height, keep the upward angle by raising the orbit target along
// with the camera. Clamping only the camera would flatten the view again.
export function keepCameraAboveGround(camera, controls, groundY, clearance = 1, previousPosition = null) {
  const lift = Math.max(0, groundY + clearance - camera.position.y);
  if (lift) {
    // Once the lens reaches street height, pitch from this viewing position
    // instead of letting the orbit pull it horizontally into the tower base.
    if (previousPosition) {
      const dx=previousPosition.x-camera.position.x,dz=previousPosition.z-camera.position.z;
      camera.position.x+=dx; camera.position.z+=dz;
      controls.target.x+=dx; controls.target.z+=dz;
    }
    camera.position.y += lift; controls.target.y += lift;
  }
  return lift;
}

export function resetWalkingCamera(camera, controls, player, yaw = null) {
  // Drain residual drag inertia before placing the new view, so a reset during
  // a touch/mouse drag cannot immediately swing the view back up.
  const damping = controls.enableDamping;
  controls.enableDamping = false; controls.update();
  const offset = camera.position.clone().sub(controls.target).setY(0);
  if (Number.isFinite(yaw)) offset.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  if (offset.lengthSq() < .001) offset.set(0, 0, 1);
  offset.setLength(24).y = 13;
  configureExploreCamera(controls);
  controls.target.copy(player).add(new Vector3(0, 2, 0));
  camera.position.copy(player).add(offset);
  controls.update(); controls.enableDamping = damping;
}
