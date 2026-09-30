// What each spot's night says (Phase 22.2b), and what it's called. {who} is the friend whose
// driveway it is.
import type { SpotId } from '../dials';

export const SPOT_NAME: Record<SpotId, string> = {
  lot: 'The Lot',
  trailhead: 'The Upper Trailhead',
  truckstop: 'The truck stop',
  driveway: 'A friend’s driveway',
  ridge: 'The Ridge',
};

export const SPOT_LINE: Record<Exclude<SpotId, 'lot'>, string> = {
  trailhead: 'The Upper Trailhead: free, dark and cold. Frost on the inside of the windows by morning.',
  truckstop: 'The truck stop. A hot shower, and reefer units running all night twenty feet away.',
  driveway: '{who}’s driveway. A real bathroom, and coffee in a real mug in the morning.',
  ridge: 'The Ridge. The whole valley lit up below you, and the wind trying the doors all night.',
};
