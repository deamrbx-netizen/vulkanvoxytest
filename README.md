# Voxy - Level of Detail (LOD) Voxel Rendering Engine

A high-performance Level of Detail (LOD) voxel rendering engine and world storage visualizer rewritten in modern React, TypeScript, Tailwind CSS, and WebGL (Three.js).

## Core Features
- **Hierarchical Octree LOD Sub-division**: Real-time octree node traversal with distance-based LOD tiers (LOD 0 through LOD 7), frustum culling, and screenspace error area threshold calculations.
- **ScanMesher 2D Greedy Meshing**: Converts 3D voxel density arrays into minimal non-overlapping directional quads, achieving up to 86% polygon reduction.
- **Interactive 3D WebGL Viewport**: Free-flight camera navigation across procedural and imported voxel worlds with real-time shading, LOD tier coloring, wireframe meshlets, surface normals, and density heatmaps.
- **Sodium & ModMenu Configuration GUI**: General, Rendering, and Storage tabs with logarithmic subdivision size controls, render distance sliders (up to 1024 chunks), SSAO modes, environmental fog, and multi-threading options.
- **Multi-Format World Importer**: Supports Minecraft Anvil Region files (`.mca`), Distant Horizons SQLite databases, Bobby caches, and Zip archives with real-time conversion telemetry.
- **F3 Diagnostics HUD**: Live tracking of Hierarchical Traversal Counts (HTC), Hierarchical Render Sections (HRS), Visible Sections (VS), Quad Counts (QC), VRAM buffer arenas, and rolling frame timings.
- **Voxel Section & Mipper Inspector**: Visualizes 16×16×16 chunk slices, palette textures, and box-averaging mip downsampling.
- **JMH Benchmark Suite**: Measures raw throughput for ScanMesher, LMDB / RocksDB / In-Memory storage backends, and octree traversal.
- **In-Engine Command Console**: Interactive terminal supporting `/voxy reload`, `/voxy import`, `/voxy debug verifyTLNChildMask`, and more.
