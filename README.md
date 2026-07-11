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
| Drag (mouse or touch) | look around |

On-screen buttons are provided for touch devices.

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
