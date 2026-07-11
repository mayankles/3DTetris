# TETRA·RING — first-person 3D Tetris

Tetris, except you're standing in the middle of it. The playfield is a ring of
12 columns wrapped around you: tetrominoes fall against the inside of a faceted
cylinder, and you clear full **rings** instead of rows — before the stack walls
you in.

[Click here to play the current build](https://mayankles.github.io/3DTetris/)!

## How it plays

- Standard tetrominoes (I, O, T, S, Z, J, L) with a 7-bag randomizer,
  ghost piece, next-piece preview, soft/hard drops, and level speed-up.
- The grid wraps around — there are no side walls, only the floor and the sky.
- The camera auto-follows the falling piece; drag to look around freely.
- As the stack nears the top, the arena light turns red and pulses.

### Controls

| Input | Action |
| --- | --- |
| ← → / A D | move the piece around the ring |
| ↑ / W | rotate |
| ↓ / S | soft drop |
| Space | hard drop |
| Click | engage/release mouse-look (FPS-style free look) |
| Drag (mouse or touch) | look around |
| F / double-tap | snap the camera back to the falling piece |
| Scroll / pinch | zoom out to an overhead view of the whole ring |
| Move your phone | look around via device orientation (mobile) |

On-screen buttons are provided for touch devices. On iOS the game asks for
motion-sensor permission when you tap START; if denied, drag-look still works.
When you look away from the falling piece, an edge arrow points the shortest
way back to it.

## Tech

- [Three.js](https://threejs.org/) for rendering — one shared trapezoidal-prism
  geometry instanced for every block, so the ring is faceted (flat faces), not curved.
- Game logic is plain 2D Tetris on a `12 × 12` grid; the cylinder is purely a
  rendering transform of that grid.
- Webpack + Babel for bundling and the dev server.

## Getting started

```sh
npm install
npm start          # dev server at http://localhost:9000
npm run build      # writes dist/bundle.js (served by GitHub Pages)
```

## License

This project is licensed under the MIT License.
