(function () {
  function orientation(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
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

  function sortClockwise(points) {
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

  function bruteForceHull(points) {
    const steps = [];

    if (points.length < 3) {
      return { hull: points.slice(), steps };
    }

    const hullCandidates = [];

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        let positive = 0;
        let negative = 0;
        const checked = [];

        steps.push({
          message: `Test whether the line through (${Math.round(a.x)}, ${Math.round(a.y)}) and (${Math.round(b.x)}, ${Math.round(b.y)}) can be a hull edge.`,
          candidateEdge: [a, b],
          hull: hullCandidates.slice()
        });

        for (let k = 0; k < points.length; k += 1) {
          if (k === i || k === j) {
            continue;
          }

          const point = points[k];
          checked.push(point);
          const side = orientation(a, b, point);

          steps.push({
            message: `Check which side point (${Math.round(point.x)}, ${Math.round(point.y)}) lies on.`,
            candidateEdge: [a, b],
            checkingPoints: [point],
            hull: hullCandidates.slice()
          });

          if (side > 0) {
            positive += 1;
          } else if (side < 0) {
            negative += 1;
          }

          if (positive > 0 && negative > 0) {
            steps.push({
              message: "Points exist on both sides of the line, so this pair is not a hull edge.",
              candidateEdge: [a, b],
              checkingPoints: checked.slice(),
              hull: hullCandidates.slice()
            });
            break;
          }
        }

        if (!(positive > 0 && negative > 0)) {
          hullCandidates.push(a, b);
          steps.push({
            message: "All points stay on one side, so this pair forms part of the convex hull boundary.",
            candidateEdge: [a, b],
            hull: uniquePoints(hullCandidates)
          });
        }
      }
    }

    const hull = sortClockwise(uniquePoints(hullCandidates));
    steps.push({
      message: "Arrange the boundary points around the center to draw the final convex hull.",
      hull: hull.slice(),
      final: true
    });

    return { hull, steps };
  }

  window.bruteForceHull = bruteForceHull;
})();
