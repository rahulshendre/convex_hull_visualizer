(function () {
  function orientation(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  function distanceFromLine(a, b, p) {
    return Math.abs(orientation(a, b, p));
  }

  function sortHull(points) {
    if (points.length <= 1) {
      return points.slice();
    }

    const center = points.reduce(
      (acc, point) => ({
        x: acc.x + point.x / points.length,
        y: acc.y + point.y / points.length
      }),
      { x: 0, y: 0 }
    );

    return points
      .slice()
      .sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));
  }

  function uniquePoints(points) {
    const seen = new Set();
    return points.filter((point) => {
      const key = `${point.x.toFixed(4)}:${point.y.toFixed(4)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function buildHull(a, b, subset, hull, steps) {
    if (!subset.length) {
      hull.push(a);
      steps.push({
        message: `No points remain outside edge (${Math.round(a.x)}, ${Math.round(a.y)}) to (${Math.round(b.x)}, ${Math.round(b.y)}), so keep this hull boundary.`,
        candidateEdge: [a, b],
        hull: uniquePoints(hull.slice())
      });
      return;
    }

    let farthest = subset[0];
    let maxDistance = distanceFromLine(a, b, farthest);

    for (let i = 1; i < subset.length; i += 1) {
      const point = subset[i];
      const distance = distanceFromLine(a, b, point);
      if (distance > maxDistance) {
        farthest = point;
        maxDistance = distance;
      }
    }

    steps.push({
      message: `Choose the farthest point (${Math.round(farthest.x)}, ${Math.round(farthest.y)}) from edge (${Math.round(a.x)}, ${Math.round(a.y)}) to (${Math.round(b.x)}, ${Math.round(b.y)}).`,
      candidateEdge: [a, b],
      checkingPoints: subset.slice(),
      candidatePoints: [farthest],
      hull: uniquePoints(hull.slice())
    });

    const leftOfAF = [];
    const leftOfFB = [];

    subset.forEach((point) => {
      if (point === farthest) {
        return;
      }
      if (orientation(a, farthest, point) > 0) {
        leftOfAF.push(point);
      } else if (orientation(farthest, b, point) > 0) {
        leftOfFB.push(point);
      }
    });

    steps.push({
      message: `Split the remaining points into two subproblems using (${Math.round(farthest.x)}, ${Math.round(farthest.y)}).`,
      candidateEdge: [a, b],
      checkingEdge: [a, farthest],
      candidatePoints: [farthest],
      hull: uniquePoints(hull.concat([a, farthest, b]))
    });

    buildHull(a, farthest, leftOfAF, hull, steps);
    buildHull(farthest, b, leftOfFB, hull, steps);
  }

  function quickHull(points) {
    const steps = [];

    if (points.length < 3) {
      return { hull: points.slice(), steps };
    }

    let leftmost = points[0];
    let rightmost = points[0];

    for (let i = 1; i < points.length; i += 1) {
      if (points[i].x < leftmost.x || (points[i].x === leftmost.x && points[i].y < leftmost.y)) {
        leftmost = points[i];
      }
      if (points[i].x > rightmost.x || (points[i].x === rightmost.x && points[i].y > rightmost.y)) {
        rightmost = points[i];
      }
    }

    steps.push({
      message: `Start with extreme points (${Math.round(leftmost.x)}, ${Math.round(leftmost.y)}) and (${Math.round(rightmost.x)}, ${Math.round(rightmost.y)}).`,
      candidateEdge: [leftmost, rightmost],
      candidatePoints: [leftmost, rightmost],
      hull: [leftmost, rightmost]
    });

    const upper = [];
    const lower = [];

    points.forEach((point) => {
      const side = orientation(leftmost, rightmost, point);
      if (side > 0) {
        upper.push(point);
      } else if (side < 0) {
        lower.push(point);
      }
    });

    steps.push({
      message: "Partition points into the upper and lower sets relative to the baseline.",
      candidateEdge: [leftmost, rightmost],
      checkingPoints: upper.concat(lower),
      hull: [leftmost, rightmost]
    });

    const hull = [];
    buildHull(leftmost, rightmost, upper, hull, steps);
    buildHull(rightmost, leftmost, lower, hull, steps);

    const finalHull = sortHull(uniquePoints(hull.concat([rightmost])));
    steps.push({
      message: "QuickHull combines the recursive boundary segments into the final convex hull.",
      hull: finalHull.slice(),
      final: true
    });

    return { hull: finalHull, steps };
  }

  window.quickHull = quickHull;
})();
