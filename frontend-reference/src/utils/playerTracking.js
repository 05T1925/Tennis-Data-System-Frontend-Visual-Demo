export function createPlayerTracker() {
  let tick = 0

  return {
    reset() {
      tick = 0
    },
    step() {
      tick += 1
      const sway = Math.sin(tick / 10) * 0.02
      return [
        { x: 0.18 + sway, y: 0.43, w: 0.1, h: 0.26 },
        { x: 0.72 - sway, y: 0.43, w: 0.1, h: 0.26 },
      ]
    },
  }
}
