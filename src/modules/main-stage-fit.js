// Landscape fit for the Home/Brewing stage. DOM-free.
// The skin is designed at 1340×800. Scale uniformly by whichever axis is
// tighter, then grow the stage on the other axis so the scaled stage fills
// the viewport. There is no letterbox and no width cap.

export const MAIN_STAGE_W = 1340;
export const MAIN_STAGE_H = 800;

/**
 * @param {number} viewportW CSS pixels
 * @param {number} viewportH CSS pixels
 * @returns {{scale:number, stageW:number, stageH:number}}
 */
export function mainStageFit(viewportW, viewportH) {
    const scale = Math.min(viewportW / MAIN_STAGE_W, viewportH / MAIN_STAGE_H);
    return {
        scale,
        stageW: viewportW / scale,
        stageH: viewportH / scale,
    };
}
