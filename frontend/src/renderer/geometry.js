export function facingToDirection(facing) {
  const angle = (facing % 8) * (Math.PI / 4);
  return {
    x: Math.sin(angle),
    z: -Math.cos(angle),
  };
}
