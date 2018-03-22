function getLemniscatePoint(angle) {
  const f = ( 1 + Math.pow(Math.sin(angle),2));
  const c = Math.cos(angle);
  const x = c / f;
  const y = Math.sin(angle) * c / f;
  return {x,y};
}

export default getLemniscatePoint;
