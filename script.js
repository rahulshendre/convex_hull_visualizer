(function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const controls = {
    algorithmSelect: document.getElementById("algorithmSelect"),
    randomCount: document.getElementById("randomCount"),
    generateBtn: document.getElementById("generateBtn"),
    runBtn: document.getElementById("runBtn"),
    clearBtn: document.getElementById("clearBtn"),
    speedSlider: document.getElementById("speedSlider"),
    speedValue: document.getElementById("speedValue"),
    animateToggle: document.getElementById("animateToggle"),
    pauseBtn: document.getElementById("pauseBtn"),
    resumeBtn: document.getElementById("resumeBtn"),
    fastForwardBtn: document.getElementById("fastForwardBtn"),
    resetBtn: document.getElementById("resetBtn")
  };

  const ui = {
    pointCount: document.getElementById("pointCount"),
    executionTime: document.getElementById("executionTime"),
    algorithmDescription: document.getElementById("algorithmDescription"),
    timeComplexity: document.getElementById("timeComplexity"),
    stepDescription: document.getElementById("stepDescription"),
    hullPoints: document.getElementById("hullPoints"),
    statusBadge: document.getElementById("statusBadge")
  };

  const algorithmMeta = {
    graham: {
      name: "Graham Scan",
      complexity: "O(n log n)",
      description: "Sort points by polar angle from the lowest point, then maintain a stack and remove right turns until only the outer boundary remains."
    },
    jarvis: {
      name: "Jarvis March / Gift Wrapping",
      complexity: "O(nh)",
      description: "Start from the leftmost point and repeatedly choose the most counterclockwise point until the hull closes."
    },
    quickhull: {
      name: "QuickHull",
      complexity: "Average O(n log n), Worst O(n^2)",
      description: "Pick the extreme left and right points, recursively choose the farthest outside point, and split the remaining set into smaller hull subproblems."
    },
    bruteforce: {
      name: "Brute Force Convex Hull",
      complexity: "O(n^3)",
      description: "Test every pair of points as a candidate hull edge and keep the pairs for which all other points lie on one side."
    }
  };

  const state = {
    points: [],
    steps: [],
    hull: [],
    isAnimating: false,
    isPaused: false,
    fastForward: false,
    animationToken: 0,
    stepIndex: -1,
    executionTime: 0
  };

  function updateAlgorithmInfo() {
    const meta = algorithmMeta[controls.algorithmSelect.value];
    ui.algorithmDescription.textContent = meta.description;
    ui.timeComplexity.textContent = meta.complexity;
  }

  function updatePointCount() {
    ui.pointCount.textContent = String(state.points.length);
  }

  function setStatus(label, className) {
    ui.statusBadge.textContent = label;
    ui.statusBadge.className = `status-badge ${className}`;
  }

  function clampPoint(point) {
    return {
      x: Math.max(18, Math.min(canvas.width - 18, point.x)),
      y: Math.max(18, Math.min(canvas.height - 18, point.y))
    };
  }

  function resetComputedState(resetExecutionTime) {
    state.steps = [];
    state.hull = [];
    state.stepIndex = -1;
    state.animationToken += 1;
    state.isAnimating = false;
    state.isPaused = false;
    state.fastForward = false;
    if (resetExecutionTime) {
      state.executionTime = 0;
      ui.executionTime.textContent = "0 ms";
    }
    ui.stepDescription.textContent = state.points.length ? "Ready to run the selected algorithm." : "Add points to begin.";
    ui.hullPoints.textContent = "No hull computed yet.";
    setStatus("Ready", "idle");
    syncButtons();
    updatePointCount();
  }

  function syncButtons() {
    controls.runBtn.disabled = state.points.length < 3 || state.isAnimating;
    controls.generateBtn.disabled = state.isAnimating;
    controls.clearBtn.disabled = state.isAnimating && !state.isPaused;
    controls.pauseBtn.disabled = !state.isAnimating || state.isPaused;
    controls.resumeBtn.disabled = !state.isAnimating || !state.isPaused;
    controls.fastForwardBtn.disabled = !state.isAnimating || state.fastForward;
    controls.resetBtn.disabled = !state.steps.length && !state.isAnimating;
  }

  function addPoint(point) {
    if (state.isAnimating) {
      return;
    }

    state.points.push(clampPoint(point));
    resetComputedState(false);
    render();
  }

  function clearCanvasState() {
    state.points = [];
    resetComputedState(true);
    render();
  }

  function drawPoint(point, color, radius) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawLine(a, b, color, width, dashed) {
    ctx.save();
    ctx.beginPath();
    if (dashed) {
      ctx.setLineDash([8, 6]);
    }
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  }

  function drawPolygon(points, color) {
    if (points.length < 2) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();
  }

  function render(step) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeStep = step || null;
    const hullPoints = activeStep?.hull || state.hull;

    if (activeStep?.final && hullPoints.length >= 2) {
      drawPolygon(hullPoints, "#cf2f27");
    } else if (hullPoints && hullPoints.length >= 2) {
      for (let i = 0; i < hullPoints.length - 1; i += 1) {
        drawLine(hullPoints[i], hullPoints[i + 1], "#cf2f27", 3, false);
      }
    }

    if (activeStep?.candidateEdge) {
      drawLine(activeStep.candidateEdge[0], activeStep.candidateEdge[1], "#f39c12", 3.2, false);
    }

    if (activeStep?.checkingEdge) {
      drawLine(activeStep.checkingEdge[0], activeStep.checkingEdge[1], "#2980b9", 2.3, true);
    }

    if (activeStep?.checkingPoints) {
      activeStep.checkingPoints.forEach((point) => drawPoint(point, "#2980b9", 6));
    }

    if (activeStep?.candidatePoints) {
      activeStep.candidatePoints.forEach((point) => drawPoint(point, "#f39c12", 6.5));
    }

    state.points.forEach((point) => {
      drawPoint(point, "#111111", 4.5);
    });

    if (activeStep?.pivot) {
      drawPoint(activeStep.pivot, "#6c3483", 6.8);
    }
  }

  function formatPointList(points) {
    if (!points.length) {
      return "No hull computed yet.";
    }

    return points
      .map((point, index) => `${index + 1}. (${Math.round(point.x)}, ${Math.round(point.y)})`)
      .join("\n");
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async function waitWhilePaused(token) {
    while (state.isPaused && state.animationToken === token) {
      await wait(120);
    }
  }

  async function playSteps(steps, finalHull, token) {
    const animate = controls.animateToggle.checked;

    for (let i = 0; i < steps.length; i += 1) {
      if (state.animationToken !== token) {
        return;
      }

      await waitWhilePaused(token);
      if (state.animationToken !== token) {
        return;
      }

      state.stepIndex = i;
      const step = steps[i];
      ui.stepDescription.textContent = step.message;
      render(step);

      if (animate && !state.fastForward) {
        await wait(Number(controls.speedSlider.value));
      }
    }

    state.hull = finalHull;
    ui.hullPoints.textContent = formatPointList(finalHull);
    ui.stepDescription.textContent = finalHull.length
      ? "Convex hull completed successfully."
      : "No convex hull could be formed.";
    render({
      final: true,
      hull: finalHull
    });
  }

  function getAlgorithmResult() {
    const points = state.points.map((point) => ({ ...point }));
    const algorithm = controls.algorithmSelect.value;

    if (algorithm === "graham") {
      return window.grahamScan(points);
    }
    if (algorithm === "jarvis") {
      return window.jarvisMarch(points);
    }
    if (algorithm === "quickhull") {
      return window.quickHull(points);
    }
    return window.bruteForceHull(points);
  }

  async function runAlgorithm() {
    if (state.points.length < 3 || state.isAnimating) {
      return;
    }

    resetComputedState(true);
    state.isAnimating = true;
    state.isPaused = false;
    state.fastForward = false;
    const token = state.animationToken + 1;
    state.animationToken = token;
    setStatus("Running", "running");
    syncButtons();

    const start = performance.now();
    const result = getAlgorithmResult();
    const end = performance.now();
    state.executionTime = end - start;
    ui.executionTime.textContent = `${state.executionTime.toFixed(2)} ms`;
    state.steps = result.steps;

    try {
      await playSteps(result.steps, result.hull, token);
      if (state.animationToken === token) {
        setStatus("Complete", "done");
      }
    } finally {
      if (state.animationToken === token) {
        state.isAnimating = false;
        state.isPaused = false;
        state.fastForward = false;
        syncButtons();
      }
    }
  }

  function pauseAnimation() {
    if (!state.isAnimating) {
      return;
    }
    state.isPaused = true;
    setStatus("Paused", "paused");
    syncButtons();
  }

  function resumeAnimation() {
    if (!state.isAnimating) {
      return;
    }
    state.isPaused = false;
    setStatus(state.fastForward ? "Fast Forward" : "Running", state.fastForward ? "fast" : "running");
    syncButtons();
  }

  function fastForwardAnimation() {
    if (!state.isAnimating) {
      return;
    }
    state.fastForward = true;
    state.isPaused = false;
    setStatus("Fast Forward", "fast");
    syncButtons();
  }

  function resetAnimation() {
    state.animationToken += 1;
    state.isAnimating = false;
    state.isPaused = false;
    state.fastForward = false;
    state.stepIndex = -1;
    state.steps = [];
    state.hull = [];
    ui.executionTime.textContent = "0 ms";
    ui.stepDescription.textContent = state.points.length ? "Animation reset. Ready to run again." : "Add points to begin.";
    ui.hullPoints.textContent = "No hull computed yet.";
    setStatus("Ready", "idle");
    render();
    syncButtons();
  }

  function generateRandomPoints() {
    if (state.isAnimating) {
      return;
    }

    const count = Math.max(3, Math.min(150, Number(controls.randomCount.value) || 20));
    state.points = [];

    for (let i = 0; i < count; i += 1) {
      state.points.push({
        x: 25 + Math.random() * (canvas.width - 50),
        y: 25 + Math.random() * (canvas.height - 50)
      });
    }

    resetComputedState(true);
    render();
  }

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    addPoint({
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    });
  });

  controls.algorithmSelect.addEventListener("change", updateAlgorithmInfo);
  controls.generateBtn.addEventListener("click", generateRandomPoints);
  controls.runBtn.addEventListener("click", runAlgorithm);
  controls.clearBtn.addEventListener("click", clearCanvasState);
  controls.pauseBtn.addEventListener("click", pauseAnimation);
  controls.resumeBtn.addEventListener("click", resumeAnimation);
  controls.fastForwardBtn.addEventListener("click", fastForwardAnimation);
  controls.resetBtn.addEventListener("click", resetAnimation);
  controls.speedSlider.addEventListener("input", () => {
    controls.speedValue.textContent = `${controls.speedSlider.value} ms`;
  });

  updateAlgorithmInfo();
  syncButtons();
  render();
})();
