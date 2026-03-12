(function () {
  function crossProduct(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  function grahamScan(points) {
    const steps = [];

    if (points.length < 3) {
      return { hull: points.slice(), steps };
    }

    const pivot = points.reduce((best, point) => {
      if (point.y < best.y || (point.y === best.y && point.x < best.x)) {
        return point;
      }
      return best;
    }, points[0]);

    steps.push({
      message: `Choose the pivot point at (${Math.round(pivot.x)}, ${Math.round(pivot.y)}) with the lowest y-coordinate.`,
      pivot,
      candidatePoints: [pivot],
      hull: []
    });

    const sorted = points
      .filter((point) => point !== pivot)
      .sort((a, b) => {
        const angleDiff = Math.atan2(a.y - pivot.y, a.x - pivot.x) - Math.atan2(b.y - pivot.y, b.x - pivot.x);
        if (angleDiff !== 0) {
          return angleDiff;
        }
        return distanceSquared(pivot, a) - distanceSquared(pivot, b);
      });

    steps.push({
      message: "Sort all remaining points by polar angle around the pivot.",
      pivot,
      candidatePoints: sorted,
      hull: [pivot]
    });

    const stack = [pivot, sorted[0]];
    steps.push({
      message: "Start the hull stack with the pivot and the first sorted point.",
      pivot,
      hull: stack.slice(),
      candidateEdge: [pivot, sorted[0]]
    });

    for (let i = 1; i < sorted.length; i += 1) {
      const point = sorted[i];

      steps.push({
        message: `Inspect point (${Math.round(point.x)}, ${Math.round(point.y)}) and check whether it keeps a left turn.`,
        pivot,
        candidatePoints: [point],
        hull: stack.slice(),
        candidateEdge: [stack[stack.length - 1], point]
      });

      while (stack.length >= 2 && crossProduct(stack[stack.length - 2], stack[stack.length - 1], point) <= 0) {
        const removed = stack[stack.length - 1];
        steps.push({
          message: `Right turn detected, so remove (${Math.round(removed.x)}, ${Math.round(removed.y)}) from the stack.`,
          pivot,
          candidatePoints: [point, removed],
          hull: stack.slice(),
          checkingEdge: [stack[stack.length - 2], removed]
        });
        stack.pop();
      }

      stack.push(point);
      steps.push({
        message: `Push (${Math.round(point.x)}, ${Math.round(point.y)}) onto the hull stack.`,
        pivot,
        hull: stack.slice(),
        candidateEdge: stack.length >= 2 ? [stack[stack.length - 2], stack[stack.length - 1]] : null
      });
    }

    const hull = stack.slice();
    steps.push({
      message: "Close the polygon to obtain the final convex hull.",
      pivot,
      hull: hull.slice(),
      final: true
    });

    return { hull, steps };
  }

  window.grahamScan = grahamScan;
})();
