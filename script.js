(function () {
  const canvasSingle = document.getElementById("canvasSingle");
  const canvasLeft = document.getElementById("canvasLeft");
  const canvasRight = document.getElementById("canvasRight");
  const ctxSingle = canvasSingle.getContext("2d");
  const ctxLeft = canvasLeft.getContext("2d");
  const ctxRight = canvasRight.getContext("2d");
  const chartCanvas = document.getElementById("complexityChart");
  const chartCtx = chartCanvas.getContext("2d");

  const DUAL_W = canvasLeft.width;
  const DUAL_H = canvasLeft.height;
  const SINGLE_W = canvasSingle.width;
  const SINGLE_H = canvasSingle.height;

  const controls = {
    algorithmSelectLeft: document.getElementById("algorithmSelectLeft"),
    algorithmSelectRight: document.getElementById("algorithmSelectRight"),
    dualViewToggle: document.getElementById("dualViewToggle"),
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
    resetBtn: document.getElementById("resetBtn"),
    theoryNMin: document.getElementById("theoryNMin"),
    theoryNMax: document.getElementById("theoryNMax"),
    theoryStep: document.getElementById("theoryStep"),
    theoryCurveNLogN: document.getElementById("theoryCurveNLogN"),
    theoryCurveNSq: document.getElementById("theoryCurveNSq"),
    theoryCurveNCubed: document.getElementById("theoryCurveNCubed")
  };

  const ui = {
    pointCount: document.getElementById("pointCount"),
    executionTimeSingle: document.getElementById("executionTimeSingle"),
    executionTimeLeft: document.getElementById("executionTimeLeft"),
    executionTimeRight: document.getElementById("executionTimeRight"),
    algorithmDescriptionLeft: document.getElementById("algorithmDescriptionLeft"),
    algorithmDescriptionRight: document.getElementById("algorithmDescriptionRight"),
    timeComplexityLeft: document.getElementById("timeComplexityLeft"),
    timeComplexityRight: document.getElementById("timeComplexityRight"),
    stepDescriptionLeft: document.getElementById("stepDescriptionLeft"),
    stepDescriptionRight: document.getElementById("stepDescriptionRight"),
    hullPointsLeft: document.getElementById("hullPointsLeft"),
    hullPointsRight: document.getElementById("hullPointsRight"),
    statusBadge: document.getElementById("statusBadge"),
    paneTitleLeft: document.getElementById("paneTitleLeft"),
    paneTitleRight: document.getElementById("paneTitleRight"),
    controlsHint: document.getElementById("controlsHint"),
    canvasPanelTitle: document.getElementById("canvasPanelTitle"),
    canvasPanelLead: document.getElementById("canvasPanelLead"),
    metaLabelLeft: document.getElementById("metaLabelLeft"),
    algoLeftLabel: document.getElementById("algoLeftLabel")
  };

  const algorithmMeta = {
    graham: {
      key: "graham",
      name: "Graham Scan",
      complexity: "O(n log n)",
      description:
        "Sort points by polar angle from the lowest point, then maintain a stack and remove right turns until only the outer boundary remains.",
      chartColor: "#2874a6"
    },
    jarvis: {
      key: "jarvis",
      name: "Jarvis March",
      complexity: "O(nh)",
      description:
        "Start from the leftmost point and repeatedly choose the most counterclockwise point until the hull closes.",
      chartColor: "#1e8448"
    },
    quickhull: {
      key: "quickhull",
      name: "QuickHull",
      complexity: "Average O(n log n), worst O(n^2)",
      description:
        "Pick the extreme left and right points, recursively choose the farthest outside point, and split the remaining set into smaller hull subproblems.",
      chartColor: "#d35400"
    },
    bruteforce: {
      key: "bruteforce",
      name: "Brute Force",
      complexity: "O(n^3)",
      description:
        "Test every pair of points as a candidate hull edge and keep the pairs for which all other points lie on one side.",
      chartColor: "#6c3483"
    }
  };

  const state = {
    points: [],
    hullLeft: [],
    hullRight: [],
    stepsLeft: [],
    stepsRight: [],
    isAnimating: false,
    isPaused: false,
    fastForward: false,
    animationToken: 0,
    stepIndex: -1,
    dualView: false
  };

  function getViewportSize() {
    return state.dualView ? { width: DUAL_W, height: DUAL_H } : { width: SINGLE_W, height: SINGLE_H };
  }

  function copyPoints(points) {
    return points.map((point) => ({ x: point.x, y: point.y }));
  }

  function clampPoint(point, width, height) {
    const w = width ?? getViewportSize().width;
    const h = height ?? getViewportSize().height;
    return {
      x: Math.max(18, Math.min(w - 18, point.x)),
      y: Math.max(18, Math.min(h - 18, point.y))
    };
  }

  function remapPointsToViewport(fromW, fromH, toW, toH) {
    const margin = 18;
    const spanXFrom = Math.max(1e-9, fromW - margin * 2);
    const spanYFrom = Math.max(1e-9, fromH - margin * 2);
    const spanXTo = Math.max(1e-9, toW - margin * 2);
    const spanYTo = Math.max(1e-9, toH - margin * 2);
    state.points = state.points.map((point) =>
      clampPoint(
        {
          x: margin + ((point.x - margin) / spanXFrom) * spanXTo,
          y: margin + ((point.y - margin) / spanYFrom) * spanYTo
        },
        toW,
        toH
      )
    );
  }

  function formatPointList(points) {
    if (!points.length) {
      return "No hull computed yet.";
    }

    return points
      .map((point, index) => `${index + 1}. (${Math.round(point.x)}, ${Math.round(point.y)})`)
      .join("\n");
  }

  function updateAlgorithmTitles() {
    const leftMeta = algorithmMeta[controls.algorithmSelectLeft.value];
    const rightMeta = algorithmMeta[controls.algorithmSelectRight.value];
    ui.algoLeftLabel.textContent = state.dualView ? "Left pane algorithm" : "Choose algorithm";
    ui.metaLabelLeft.textContent = state.dualView ? "Left complexity" : "Time complexity";
    ui.paneTitleLeft.textContent = leftMeta.name;
    ui.paneTitleRight.textContent = rightMeta.name;
    ui.algorithmDescriptionLeft.textContent = leftMeta.description;
    ui.timeComplexityLeft.textContent = leftMeta.complexity;
    ui.algorithmDescriptionRight.textContent = rightMeta.description;
    ui.timeComplexityRight.textContent = rightMeta.complexity;
  }

  function updateViewChrome() {
    document.body.classList.toggle("view-dual", state.dualView);
    document.body.classList.toggle("view-single", !state.dualView);
    controls.dualViewToggle.setAttribute("aria-pressed", state.dualView ? "true" : "false");
    controls.dualViewToggle.textContent = state.dualView ? "Dual view: on" : "Dual view: off";

    ui.controlsHint.textContent = state.dualView
      ? "Click either canvas below to add points (same coordinates on both)."
      : "Click the canvas below to add points.";

    ui.canvasPanelTitle.textContent = state.dualView ? "Dual view" : "Interactive canvas";
    ui.canvasPanelLead.textContent = state.dualView
      ? "Same points; left and right run different algorithms with independent timelines."
      : "Pick an algorithm and run - the canvas shows steps and the final hull.";

    updateAlgorithmTitles();
  }

  function updatePointCount() {
    ui.pointCount.textContent = String(state.points.length);
  }

  function setStatus(label, className) {
    ui.statusBadge.textContent = label;
    ui.statusBadge.className = `status-badge ${className}`;
  }

  function resetComputedState(resetExecutionTime) {
    state.stepsLeft = [];
    state.stepsRight = [];
    state.hullLeft = [];
    state.hullRight = [];
    state.stepIndex = -1;
    state.animationToken += 1;
    state.isAnimating = false;
    state.isPaused = false;
    state.fastForward = false;
    if (resetExecutionTime) {
      ui.executionTimeSingle.textContent = "0 ms";
      ui.executionTimeLeft.textContent = "0 ms";
      ui.executionTimeRight.textContent = "0 ms";
    }
    const readyPrimary = state.points.length
      ? state.dualView
        ? "Ready to run algorithms."
        : "Ready to run the selected algorithm."
      : "-";
    ui.stepDescriptionLeft.textContent = readyPrimary;
    ui.stepDescriptionRight.textContent = state.points.length
      ? state.dualView
        ? "Ready to run algorithms."
        : "-"
      : "-";
    ui.hullPointsLeft.textContent = "No hull computed yet.";
    ui.hullPointsRight.textContent = "No hull computed yet.";
    setStatus("Ready", "idle");
    syncButtons();
    updatePointCount();
    renderVisualization();
  }

  function syncButtons() {
    const busy = state.isAnimating;
    controls.dualViewToggle.disabled = busy;
    controls.algorithmSelectLeft.disabled = state.isAnimating;
    controls.algorithmSelectRight.disabled = state.isAnimating || !state.dualView;
    controls.runBtn.disabled = state.points.length < 3 || busy;
    controls.generateBtn.disabled = busy;
    controls.clearBtn.disabled = state.isAnimating && !state.isPaused;
    controls.pauseBtn.disabled = !state.isAnimating || state.isPaused;
    controls.resumeBtn.disabled = !state.isAnimating || !state.isPaused;
    controls.fastForwardBtn.disabled = !state.isAnimating || state.fastForward;
    const hasSteps =
      state.dualView
        ? !!(state.stepsLeft.length || state.stepsRight.length)
        : !!state.stepsLeft.length;
    controls.resetBtn.disabled = !hasSteps && !state.isAnimating;
  }

  function drawPoint(ctx, point, color, radius) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawLine(ctx, a, b, color, width, dashed) {
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

  function drawPolygon(ctx, points, color) {
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

  function renderPane(ctx, activeStep, completedHull, pointsSnapshot) {
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    let hullPoints;
    if (activeStep?.hull) {
      hullPoints = activeStep.hull;
    } else if (completedHull?.length) {
      hullPoints = completedHull;
    } else {
      hullPoints = [];
    }

    if (activeStep?.final && hullPoints.length >= 2) {
      drawPolygon(ctx, hullPoints, "#cf2f27");
    } else if (hullPoints.length >= 2) {
      for (let i = 0; i < hullPoints.length - 1; i += 1) {
        drawLine(ctx, hullPoints[i], hullPoints[i + 1], "#cf2f27", 3, false);
      }
    }

    if (activeStep?.candidateEdge) {
      drawLine(ctx, activeStep.candidateEdge[0], activeStep.candidateEdge[1], "#f39c12", 3.2, false);
    }

    if (activeStep?.checkingEdge) {
      drawLine(ctx, activeStep.checkingEdge[0], activeStep.checkingEdge[1], "#2980b9", 2.3, true);
    }

    if (activeStep?.checkingPoints) {
      activeStep.checkingPoints.forEach((point) => drawPoint(ctx, point, "#2980b9", 6));
    }

    if (activeStep?.candidatePoints) {
      activeStep.candidatePoints.forEach((point) => drawPoint(ctx, point, "#f39c12", 6.5));
    }

    pointsSnapshot.forEach((point) => {
      drawPoint(ctx, point, "#111111", 4.5);
    });

    if (activeStep?.pivot) {
      drawPoint(ctx, activeStep.pivot, "#6c3483", 6.8);
    }
  }

  function renderVisualization() {
    const pts = state.points.map((point) => ({ ...point }));
    if (state.dualView) {
      renderPane(ctxLeft, null, state.hullLeft, pts);
      renderPane(ctxRight, null, state.hullRight, pts);
    } else {
      renderPane(ctxSingle, null, state.hullLeft, pts);
    }
  }

  function canvasClickHandler(event, targetCanvas) {
    if (state.isAnimating) {
      return;
    }

    const rect = targetCanvas.getBoundingClientRect();
    const scaleX = targetCanvas.width / rect.width;
    const scaleY = targetCanvas.height / rect.height;
    addPoint({
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    });
  }

  function addPoint(point) {
    state.points.push(clampPoint(point));
    resetComputedState(false);
  }

  function clearCanvasState() {
    state.points = [];
    resetComputedState(true);
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

  function getAlgorithmResult(algorithmKey, points) {
    if (algorithmKey === "graham") {
      return window.grahamScan(points);
    }
    if (algorithmKey === "jarvis") {
      return window.jarvisMarch(points);
    }
    if (algorithmKey === "quickhull") {
      return window.quickHull(points);
    }
    return window.bruteForceHull(points);
  }

  async function playSteps(side, ctx, steps, finalHull, token) {
    const animate = controls.animateToggle.checked;
    const restingHull = () => {
      if (side === "right") {
        return state.hullRight;
      }
      return state.hullLeft;
    };

    for (let i = 0; i < steps.length; i += 1) {
      if (state.animationToken !== token) {
        return;
      }

      await waitWhilePaused(token);
      if (state.animationToken !== token) {
        return;
      }

      const step = steps[i];

      if (side === "right") {
        ui.stepDescriptionRight.textContent = step.message;
      } else {
        ui.stepDescriptionLeft.textContent = step.message;
      }

      const pts = copyPoints(state.points);
      renderPane(ctx, step, restingHull(), pts);

      if (animate && !state.fastForward) {
        await wait(Number(controls.speedSlider.value));
      }
    }

    const metaForLeftUi = algorithmMeta[controls.algorithmSelectLeft.value];

    if (side === "right") {
      state.hullRight = finalHull.slice();
      ui.hullPointsRight.textContent = formatPointList(finalHull);
      ui.stepDescriptionRight.textContent = finalHull.length
        ? `${algorithmMeta[controls.algorithmSelectRight.value].name} complete.`
        : "No convex hull.";
    } else {
      state.hullLeft = finalHull.slice();
      ui.hullPointsLeft.textContent = formatPointList(finalHull);
      ui.stepDescriptionLeft.textContent = finalHull.length ? `${metaForLeftUi.name} complete.` : "No convex hull.";
    }

    const ptsDone = copyPoints(state.points);
    renderPane(ctx, { final: true, hull: finalHull }, restingHull(), ptsDone);
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

    try {
      if (state.dualView) {
        const algoLeftKey = controls.algorithmSelectLeft.value;
        const algoRightKey = controls.algorithmSelectRight.value;
        const pointsLeftInput = copyPoints(state.points);
        const pointsRightInput = copyPoints(state.points);

        const startLeft = performance.now();
        const resultLeft = getAlgorithmResult(algoLeftKey, pointsLeftInput);
        const endLeft = performance.now();
        const startRight = performance.now();
        const resultRight = getAlgorithmResult(algoRightKey, pointsRightInput);
        const endRight = performance.now();

        ui.executionTimeLeft.textContent = `${(endLeft - startLeft).toFixed(2)} ms`;
        ui.executionTimeRight.textContent = `${(endRight - startRight).toFixed(2)} ms`;

        state.stepsLeft = resultLeft.steps;
        state.stepsRight = resultRight.steps;

        await Promise.all([
          playSteps("left", ctxLeft, resultLeft.steps, resultLeft.hull, token),
          playSteps("right", ctxRight, resultRight.steps, resultRight.hull, token)
        ]);
      } else {
        const algoKey = controls.algorithmSelectLeft.value;
        const pointsInput = copyPoints(state.points);
        const benchStart = performance.now();
        const result = getAlgorithmResult(algoKey, pointsInput);
        const benchEnd = performance.now();

        ui.executionTimeSingle.textContent = `${(benchEnd - benchStart).toFixed(2)} ms`;
        ui.executionTimeLeft.textContent = "0 ms";
        ui.executionTimeRight.textContent = "0 ms";

        state.stepsLeft = result.steps;
        state.stepsRight = [];

        await playSteps("left", ctxSingle, result.steps, result.hull, token);
      }

      if (state.animationToken === token) {
        setStatus("Complete", "done");
      }
    } finally {
      if (state.animationToken === token) {
        state.isAnimating = false;
        state.isPaused = false;
        state.fastForward = false;
        syncButtons();
        renderVisualization();
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
    state.stepsLeft = [];
    state.stepsRight = [];
    state.hullLeft = [];
    state.hullRight = [];
    ui.executionTimeSingle.textContent = "0 ms";
    ui.executionTimeLeft.textContent = "0 ms";
    ui.executionTimeRight.textContent = "0 ms";
    ui.stepDescriptionLeft.textContent = state.points.length ? "Animation reset. Ready to run again." : "-";
    ui.stepDescriptionRight.textContent = state.points.length ? "Animation reset. Ready to run again." : "-";
    ui.hullPointsLeft.textContent = "No hull computed yet.";
    ui.hullPointsRight.textContent = "No hull computed yet.";
    setStatus("Ready", "idle");
    renderVisualization();
    syncButtons();
  }

  function generateRandomPoints() {
    if (state.isAnimating) {
      return;
    }

    const count = Math.max(3, Math.min(150, Number(controls.randomCount.value) || 20));
    const { width, height } = getViewportSize();
    state.points = [];

    for (let i = 0; i < count; i += 1) {
      state.points.push({
        x: 25 + Math.random() * (width - 50),
        y: 25 + Math.random() * (height - 50)
      });
    }

    resetComputedState(true);
  }

  function buildSampledN(nMin, nMax, stepSize) {
    const start = Math.max(2, Math.floor(nMin));
    const end = Math.max(start, Math.floor(nMax));
    const step = Math.max(1, Math.floor(stepSize));
    const out = [];
    for (let n = start; n <= end; n += step) {
      out.push(n);
    }
    if (out.length === 0 || out[out.length - 1] !== end) {
      out.push(end);
    }
    return [...new Set(out)].sort((a, b) => a - b);
  }

  /**
   * Match backing-store resolution to display size × devicePixelRatio so lines stay sharp.
   * All drawing below uses CSS-pixel coordinates (post-scale).
   */
  function prepareChartCanvasForDraw() {
    const rect = chartCanvas.getBoundingClientRect();
    let cssW = Math.max(4, Math.round(rect.width || 0));
    let cssH = Math.max(4, Math.round(rect.height || 0));

    if (cssW < 50 || cssH < 30) {
      cssW = 840;
      cssH = 320;
    }

    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);

    chartCanvas.width = Math.max(1, Math.round(cssW * dpr));
    chartCanvas.height = Math.max(1, Math.round(cssH * dpr));

    chartCtx.setTransform(1, 0, 0, 1, 0, 0);
    chartCtx.scale(dpr, dpr);

    chartCtx.imageSmoothingEnabled = true;

    return { cw: cssW, ch: cssH };
  }

  const THEORETICAL_CURVES = [
    {
      ctrl: "theoryCurveNLogN",
      shortLabel: "n log2 n",
      legendNote: "Graham; QuickHull avg",
      color: "#2874a6",
      evaluate(n) {
        return n * Math.log2(n);
      }
    },
    {
      ctrl: "theoryCurveNSq",
      shortLabel: "n^2",
      legendNote: "Jarvis worst; QuickHull worst",
      color: "#1e8448",
      evaluate(n) {
        return n * n;
      }
    },
    {
      ctrl: "theoryCurveNCubed",
      shortLabel: "n^3",
      legendNote: "Brute force",
      color: "#6c3483",
      evaluate(n) {
        return n * n * n;
      }
    }
  ];

  function drawTheoreticalChart() {
    const { cw, ch } = prepareChartCanvasForDraw();
    const pad = { left: 58, top: 16, right: 18, bottom: 50 };
    const plotW = cw - pad.left - pad.right;
    const plotH = ch - pad.top - pad.bottom;

    chartCtx.fillStyle = "#fffdfa";
    chartCtx.fillRect(0, 0, cw, ch);

    let nMin = Math.max(2, Math.min(500, Number(controls.theoryNMin.value) || 2));
    let nMax = Math.max(2, Math.min(500, Number(controls.theoryNMax.value) || 60));
    const stepSize = Math.max(1, Math.min(50, Number(controls.theoryStep.value) || 2));
    if (nMin > nMax) {
      const tmp = nMin;
      nMin = nMax;
      nMax = tmp;
    }

    const uniqueN = buildSampledN(nMin, nMax, stepSize);
    const activeSeries = [];

    THEORETICAL_CURVES.forEach((curve) => {
      const checkbox = controls[curve.ctrl];
      if (!checkbox || !checkbox.checked) {
        return;
      }
      const raw = uniqueN.map((n) => curve.evaluate(n));
      const peak = Math.max(...raw, 1e-12);
      activeSeries.push({
        shortLabel: curve.shortLabel,
        legendNote: curve.legendNote,
        color: curve.color,
        points: uniqueN.map((n, i) => ({ n, yNorm: raw[i] / peak }))
      });
    });

    if (!activeSeries.length) {
      chartCtx.fillStyle = "#6a5d50";
      chartCtx.font = "700 14px Segoe UI, sans-serif";
      chartCtx.fillText("Tick at least one growth function to plot.", pad.left, pad.top + 36);
      return;
    }

    const globalNMin = uniqueN[0];
    const globalNMax = uniqueN[uniqueN.length - 1];

    chartCtx.strokeStyle = "rgba(60,44,30,0.15)";
    chartCtx.lineWidth = 1;
    chartCtx.strokeRect(pad.left, pad.top, plotW, plotH);

    chartCtx.strokeStyle = "rgba(60,44,30,0.08)";
    for (let grid = 0; grid <= 4; grid += 1) {
      const gx = pad.left + (plotW / 4) * grid;
      chartCtx.beginPath();
      chartCtx.moveTo(gx, pad.top);
      chartCtx.lineTo(gx, pad.top + plotH);
      chartCtx.stroke();
      const gy = pad.top + (plotH / 4) * grid;
      chartCtx.beginPath();
      chartCtx.moveTo(pad.left, gy);
      chartCtx.lineTo(pad.left + plotW, gy);
      chartCtx.stroke();
    }

    const xScale = (nVal) =>
      pad.left + ((nVal - globalNMin) / (globalNMax - globalNMin || 1)) * plotW;
    const yScale = (norm) => pad.top + plotH - norm * plotH;

    chartCtx.fillStyle = "#6a5d50";
    chartCtx.font = "700 13px Segoe UI, sans-serif";
    chartCtx.fillText("Input size n", pad.left + plotW / 2 - 34, ch - 16);

    chartCtx.save();
    chartCtx.translate(14, pad.top + plotH / 2);
    chartCtx.rotate(-Math.PI / 2);
    chartCtx.textAlign = "center";
    chartCtx.fillText("Normalized growth (each curve scaled to 1)", 0, 0);
    chartCtx.restore();

    chartCtx.font = "11px Segoe UI, sans-serif";
    chartCtx.fillText(String(globalNMin), xScale(globalNMin) - 12, pad.top + plotH + 24);
    chartCtx.fillText(String(globalNMax), xScale(globalNMax) - 14, pad.top + plotH + 24);

    chartCtx.fillText("0", pad.left - 8, pad.top + plotH + 4);
    chartCtx.fillText("1", pad.left - 8, pad.top + 12);

    activeSeries.forEach((series) => {
      chartCtx.strokeStyle = series.color;
      chartCtx.lineWidth = 2.6;
      chartCtx.beginPath();
      series.points.forEach((point, idx) => {
        const px = xScale(point.n);
        const py = yScale(point.yNorm);
        if (idx === 0) {
          chartCtx.moveTo(px, py);
        } else {
          chartCtx.lineTo(px, py);
        }
      });
      chartCtx.stroke();
      chartCtx.fillStyle = series.color;
      series.points.forEach((point) => {
        chartCtx.beginPath();
        chartCtx.arc(xScale(point.n), yScale(point.yNorm), 3.5, 0, Math.PI * 2);
        chartCtx.fill();
      });
    });

    const legendX = pad.left + 10;
    let legendY = pad.top + 10;
    activeSeries.forEach((series, index) => {
      chartCtx.fillStyle = series.color;
      chartCtx.fillRect(legendX, legendY + index * 20, 12, 10);
      chartCtx.fillStyle = "#1f1a16";
      chartCtx.font = "700 11px Segoe UI, sans-serif";
      const line = `${series.shortLabel} - ${series.legendNote}`;
      chartCtx.fillText(line, legendX + 16, legendY + 10 + index * 20);
    });
  }

  function wireTheoryInputs() {
    [
      controls.theoryNMin,
      controls.theoryNMax,
      controls.theoryStep,
      controls.theoryCurveNLogN,
      controls.theoryCurveNSq,
      controls.theoryCurveNCubed
    ].forEach((el) => {
      if (!el) {
        return;
      }
      el.addEventListener("input", drawTheoreticalChart);
      el.addEventListener("change", drawTheoreticalChart);
    });

    const chartFrame = chartCanvas.parentElement;
    if (chartFrame && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        window.requestAnimationFrame(drawTheoreticalChart);
      });
      ro.observe(chartFrame);
    }

    window.addEventListener(
      "resize",
      () => {
        window.requestAnimationFrame(drawTheoreticalChart);
      },
      { passive: true }
    );
  }

  canvasLeft.addEventListener("click", (event) => {
    canvasClickHandler(event, canvasLeft);
  });

  canvasRight.addEventListener("click", (event) => {
    canvasClickHandler(event, canvasRight);
  });

  canvasSingle.addEventListener("click", (event) => {
    canvasClickHandler(event, canvasSingle);
  });

  function toggleDualView() {
    if (state.isAnimating) {
      return;
    }

    const from = getViewportSize();
    state.dualView = !state.dualView;
    const to = getViewportSize();

    if (state.points.length) {
      remapPointsToViewport(from.width, from.height, to.width, to.height);
    }

    updateViewChrome();
    resetComputedState(true);
  }

  function onAlgorithmSelectorsChange() {
    updateAlgorithmTitles();
  }

  controls.algorithmSelectLeft.addEventListener("change", onAlgorithmSelectorsChange);
  controls.algorithmSelectRight.addEventListener("change", onAlgorithmSelectorsChange);
  controls.dualViewToggle.addEventListener("click", toggleDualView);
  controls.generateBtn.addEventListener("click", generateRandomPoints);
  controls.runBtn.addEventListener("click", () => {
    runAlgorithm().catch(() => {});
  });
  controls.clearBtn.addEventListener("click", clearCanvasState);
  controls.pauseBtn.addEventListener("click", pauseAnimation);
  controls.resumeBtn.addEventListener("click", resumeAnimation);
  controls.fastForwardBtn.addEventListener("click", fastForwardAnimation);
  controls.resetBtn.addEventListener("click", resetAnimation);
  controls.speedSlider.addEventListener("input", () => {
    controls.speedValue.textContent = `${controls.speedSlider.value} ms`;
  });

  wireTheoryInputs();

  updateViewChrome();
  resetComputedState(true);
  window.requestAnimationFrame(drawTheoreticalChart);
  syncButtons();
})();
