# Future explorations

Backlog of ideas worth trying, roughly in the order they came up.

## Big arena mode
Bump `COLS` from 12 to 16 (22.5° columns) as a selectable difficulty/mode.
- One-constant change mechanically; rings need 16 blocks to clear, so it's a
  real difficulty jump — probably wants slower gravity scaling to compensate.
- Camera pullback math already adapts (chord width shrinks with more columns).
- Could pair with a smaller "tight arena" (10 cols) as an easy mode.

## Visual themes
Swappable skins over the same gameplay. The wedge geometry and materials are
already shared/centralized, so a theme is mostly: palette + materials +
floor/environment + (optionally) replacing the wedge mesh with a model fitted
to the same wedge bounds.

- **Farm**: animals instead of cubes making up the pieces — hay bales, sheep,
  pigs stacked into tetrominoes; pasture floor, barn-red danger line, sunrise
  sky. Ring clear = the animals scatter/hop away.
- **Office**: the metaphor one. Pieces are desks, filing cabinets, cubicle
  walls closing in around you; fluorescent lighting that flickers as the stack
  rises; danger state = overtime red glow. Ring clear = a row of paperwork
  gets shredded. Game over = walled into your cubicle.
- Theme infrastructure first: a small `theme` object (materials, colors,
  lights, floor builder, optional block mesh factory) selected at startup —
  keep default "neon arena" as theme #1.

## Parking lot (smaller notes)
- Swipe gestures on mobile: swipe down = hard drop, hold = soft drop
  (replaced soft-drop button when pads went to thumb clusters).
- Lock delay for last-second slides (classic Tetris feel).
- Sound: spatial audio would be great here — you *hear* the piece falling
  behind you.
- Score popups / juice on ring clears (currently just a screen flash).
