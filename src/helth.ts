import {
  createComponent,
  createSystem,
  eq, PanelDocument, PanelUI, Types,
  Vector3,
} from "@iwsdk/core";
import { Health } from ".";

// export const Health = createComponent('Health', {
//   current: { type: Types.Float32, default: 100 },
//   max: { type: Types.Float32, default: 100 },
//   regenerating: { type: Types.Boolean, default: false },
// });

// export const Position = createComponent('Position', {
//   velocity: { type: Types.Vec3, default: [0, 0, 0] },
//   target: { type: Types.Vec3, default: [0, 0, 0] },
// });


export class HealthSystem extends createSystem({
     // Regular query - entities with specific components
    myQuery: { required: [Health] },

    // Query with exclusion - has ComponentA but NOT ComponentC
    specialQuery: { required: [], excluded: [] },

    // Query with value predicate - matches specific component values
    configQuery: {
      required: [PanelUI, PanelDocument],
      where: [eq(PanelUI, 'config', '/ui/welcome.json')],
    },
  },
  {
    // Optional config schema - system-level configuration
    speed: { type: Types.Float32, default: 1.0 },
    enabled: { type: Types.Boolean, default: true },
  },
) 
{
  tempVector: Vector3 = new Vector3;
  // System implementation

  init() {
    // Initialize reusable objects for performance
    this.tempVector = new Vector3();

    // Set up reactive subscriptions
    this.queries.myQuery.subscribe('qualify', (entity) => {
      // Called when an entity newly matches the query
    });

    this.queries.myQuery.subscribe('disqualify', (entity) => {
      // Called when an entity stops matching the query
    });
  }

 
update(delta: number, time: any) {
  // delta: Time since last frame (in seconds) - use for frame-rate independent movement
  // time: Total elapsed time since start (in seconds) - use for animations and timing

    this.queries.myQuery.entities.forEach((entity) => {
      // Run logic on each matching entity
      const position = entity.getComponents();
      position.entries.arguments.velocity[0] *= delta; // Frame-rate independent movement
    });
  }

  destroy() {
  // Clean up resources, remove event listeners, etc.
  this.tempVector = new Vector3;
}
}
