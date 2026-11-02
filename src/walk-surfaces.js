/** Local surface heights shared by rendered paving and avatar navigation.
 * Buckets keep queries independent of the total number of paving slabs. */
export function createPavingSurface(tiles, ramps, clearance = .046) {
  const buckets = new Map(), size = 2;
  for (const tile of tiles) {
    for (let x = Math.floor((tile.x-tile.w/2)/size); x <= Math.floor((tile.x+tile.w/2)/size); x++) {
      for (let z = Math.floor((tile.z-tile.d/2)/size); z <= Math.floor((tile.z+tile.d/2)/size); z++) {
        const key = `${x},${z}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(tile);
      }
    }
  }
  return (x,z) => {
    for (const ramp of ramps) {
      const t=(x-ramp.x)*Math.sign(ramp.x)/ramp.length;
      if(t>=0&&t<=1&&Math.abs(z-ramp.z)<=ramp.width/2)
        return ramp.upper+(ramp.lower-ramp.upper)*t+clearance;
    }
    for(const tile of buckets.get(`${Math.floor(x/size)},${Math.floor(z/size)}`)||[]) {
      if(Math.abs(x-tile.x)<=tile.w/2+1e-6&&Math.abs(z-tile.z)<=tile.d/2+1e-6)return tile.y+clearance;
    }
    return null;
  };
}

export function refinedWalkHeight(ctx,x,z,fallback) {
  for(const surface of ctx.walkSurfaces||[]) {
    const y=surface(x,z);
    if(Number.isFinite(y))return y;
  }
  return fallback;
}
