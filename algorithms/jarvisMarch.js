(function () {
  function orientation(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  function jarvisMarch(points) {
    const steps = [];

    if (points.length < 3) {
      return { hull: points.slice(), steps };
    }

    let leftmost = points[0];
    for (let i = 1; i < points.length; i += 1) {
      if (points[i].x < leftmost.x || (points[i].x === leftmost.x && points[i].y < leftmost.y)) {
        leftmost = points[i];
      }
    }

    steps.push({
      message: `Start from the leftmost point (${Math.round(leftmost.x)}, ${Math.round(leftmost.y)}).`,
      candidatePoints: [leftmost],
      hull: [leftmost]
    });

    const hull = [];
    let current = leftmost;

    do {
      hull.push(current);
      let candidate = points[0] === current ? points[1] : points[0];

      steps.push({
        message: `Wrap from (${Math.round(current.x)}, ${Math.round(current.y)}) and search for the most counterclockwise point.`,
        hull: hull.slice(),
        candidatePoints: [current, candidate],
        candidateEdge: [current, candidate]
      });

      for (let i = 0; i < points.length; i += 1) {
        const test = points[i];
        if (test === current || test === candidate) {
          continue;
        }

        steps.push({
          message: `Compare candidate (${Math.round(candidate.x)}, ${Math.round(candidate.y)}) with point (${Math.round(test.x)}, ${Math.round(test.y)}).`,
          hull: hull.slice(),
          candidateEdge: [current, candidate],
          checkingEdge: [current, test],
          checkingPoints: [test]
        });

        const turn = orientation(current, candidate, test);
        if (turn > 0 || (turn === 0 && distanceSquared(current, test) > distanceSquared(current, candidate))) {
          candidate = test;
          steps.push({
            message: `Update the next hull point to (${Math.round(candidate.x)}, ${Math.round(candidate.y)}).`,
            hull: hull.slice(),
            candidatePoints: [candidate],
            candidateEdge: [current, candidate]
          });
        }
      }

      if (candidate !== leftmost) {
        steps.push({
          message: `Add (${Math.round(candidate.x)}, ${Math.round(candidate.y)}) to the hull.`,
          hull: hull.concat([candidate]),
          candidateEdge: [current, candidate]
        });
      } else {
        steps.push({
          message: "The next point returns to the start, so the hull is closed.",
          hull: hull.slice(),
          candidateEdge: [current, leftmost]
        });
      }

      current = candidate;
    } while (current !== leftmost);

    steps.push({
      message: "The hull returns to the start point, so the wrapping is complete.",
      hull: hull.slice(),
      final: true
    });

    return { hull, steps };
  }

  window.jarvisMarch = jarvisMarch;
})();
