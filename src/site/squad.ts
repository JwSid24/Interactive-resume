/* The tech-stack in a 4-2-3-1, as fractions of the field: landscape attacks left to right (portrait attacks up).
   Order matches cv.squad.players: GK, LB, CB, CB, RB, CDM, CDM, LAM, CAM, RAM, ST. Kept apart from motion.ts so the
   page markup can draw the passing lines without loading the animation code. */
export const SQUAD_SPOTS = [[.1, .5], [.26, .13], [.24, .38], [.24, .62], [.26, .87], [.42, .34], [.42, .66], [.6, .16], [.59, .5], [.6, .84], [.8, .5]];
export const STAFF_SPOTS = { land: [[.3, 1.1], [.7, 1.1]], port: [[.2, 1.1], [.8, 1.1]] };
export const SQUAD_LINKS = [[0, 2], [0, 3], [1, 2], [2, 3], [3, 4], [1, 5], [2, 5], [3, 6], [4, 6], [5, 6], [5, 7], [5, 8], [6, 8], [6, 9], [7, 8], [8, 9], [7, 10], [8, 10], [9, 10]];
