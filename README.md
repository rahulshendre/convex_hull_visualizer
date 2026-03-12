## Convex Hull Algorithm Visualizer

This project is a small web app that helps you **see how different convex hull algorithms work**. You can click to add points or generate random points and then watch the hull being built step by step.

### How to Run
- **Open the app**: Just open `index.html` in any modern browser (no server or install needed).
- **Add points**: Click on the canvas to add points, or use the **Random Points** controls.
- **Choose an algorithm**: Pick one from the dropdown:
  - **Graham Scan**
  - **Jarvis March**
  - **QuickHull**
  - **Brute Force**
- **Run**: Click **Run Algorithm** to start the visualization. Use the pause, resume, fast‑forward, and reset buttons to control the animation.

### Files Overview
- **index.html**: Main page structure and controls for the visualizer.
- **style.css**: Styles for the layout, colors, and overall look.
- **script.js**: Handles user input, drawing on the canvas, running algorithms, and animating each step.
- **algorithms/**: Folder that contains the convex hull algorithms:
  - `grahamScan.js`
  - `jarvisMarch.js`
  - `quickHull.js`
  - `bruteForce.js`

### Algorithms (Simple Explanations)
- **Graham Scan (`grahamScan.js`)**  
  - Finds the lowest point, sorts other points by angle around it, and walks around them while removing any “right turns”.  
  - Complexity: **O(n log n)**.

- **Jarvis March / Gift Wrapping (`jarvisMarch.js`)**  
  - Starts from the leftmost point and repeatedly picks the “most counter‑clockwise” next point, like wrapping a string around the points.  
  - Complexity: **O(nh)**, where \(h\) is the number of hull points.

- **QuickHull (`quickHull.js`)**  
  - Picks the far left and far right points as a base line, then repeatedly chooses the farthest outside point and splits the remaining points into smaller sub‑problems.  
  - Complexity: **Average O(n log n)**, **worst O(n²)**.

- **Brute Force (`bruteForce.js`)**  
  - Tries every pair of points as a possible hull edge and keeps it only if all other points lie on one side of that line.  
  - Complexity: **O(n³)**.

### What the Visualization Shows
- **Normal points**: All the points you added or generated.
- **Current edge / checking points**: The edge and points the algorithm is currently testing.
- **Hull**: The final red polygon that forms the convex hull.

This project is intended as a **teaching and learning tool** for Design and Analysis of Algorithms, focusing on **convex hull** techniques.
