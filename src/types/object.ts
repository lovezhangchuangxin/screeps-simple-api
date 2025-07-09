export interface GameObject {
  _id: string;
  type: string;
  x: number;
  y: number;
  room: string;
}

export type RoomObject =
  | Source
  | Mineral
  | ConstructedWall
  | Road
  | Controller
  | Spawn
  | Extension
  | Storage
  | Tower
  | Observer
  | PowerSpawn
  | Extractor
  | Terminal
  | Nuker
  | Factory
  | Rampart
  | Creep
  | PowerCreep;

export interface Source extends GameObject {
  type: "source";
  energy: number;
  energyCapacity: number;
  ticksToRegeneration: number;
  invaderHarvested: number;
  nextRegenerationTime: number;
}

export interface Mineral extends GameObject {
  type: "mineral";
  mineralType: string;
  mineralAmount: number;
  nextRegenerationTime: number;
}

export interface ConstructedWall extends GameObject {
  type: "constructedWall";
  hits: number;
  hitsMax: number;
  notifyWhenAttacked: boolean;
}

export interface Road extends GameObject {
  type: "road";
  hits: number;
  hitsMax: number;
  notifyWhenAttacked: boolean;
  nextDecayTime: number;
}

export interface Controller extends GameObject {
  type: "controller";
  level: number;
  progress: number;
  progressTotal: number;
  user: string;
  downgradeTime: number;
  safeMode: number;
  safeModeAvailable: number;
  safeModeCooldown: number;
  upgradeBlocked: number;
  downgradeBlocked: number;
  reservation?: unknown;
  sign?: {
    user: string;
    time: number;
    text: string;
    datetime: number;
  };
  isPowerEnabled: boolean;
  effects: unknown;
}

export interface Spawn extends GameObject {
  type: "spawn";
  name: string;
  hits: number;
  hitsMax: number;
  notifyWhenAttacked: boolean;
  spawning?: unknown;
  off: boolean;
  store: {
    energy: number;
  };
  storeCapacityResource: {
    energy: number;
  };
}

export interface Extension extends GameObject {
  type: "extension";
  hits: number;
  hitsMax: number;
  user: string;
  notifyWhenAttacked: boolean;
  store: {
    energy: number;
  };
  storeCapacityResource: {
    energy: number;
  };
  off: boolean;
}

export interface Storage extends GameObject {
  type: "storage";
  hits: number;
  hitsMax: number;
  notifyWhenAttacked: boolean;
  user: string;
  store: {
    [type in ResourceConstant]: number;
  };
  storeCapacity: number;
  effects: {
    [type: string]: {
      effect: number;
      power: number;
      level: number;
      endTime: number;
    };
  };
}

export interface Tower extends GameObject {
  type: "tower";
  hits: number;
  hitsMax: number;
  notifyWhenAttacked: boolean;
  user: string;
  store: {
    energy: number;
  };
  storeCapacityResource: {
    energy: number;
  };
  actionLog: {
    attack?: unknown;
    heal?: unknown;
    repair?: unknown;
  };
}

export interface Rampart extends GameObject {
  type: "rampart";
  hits: number;
  hitsMax: number;
  user: string;
  notifyWhenAttacked: boolean;
  nextDecayTime: number;
}

export interface Extractor extends GameObject {
  type: "extractor";
  hits: number;
  hitsMax: number;
  user: string;
  notifyWhenAttacked: boolean;
  cooldown: number;
}

export interface Terminal extends GameObject {
  type: "terminal";
  hits: number;
  hitsMax: number;
  user: string;
  notifyWhenAttacked: boolean;
  store: {
    [type in ResourceConstant]: number;
  };
  storeCapacity: number;
  cooldownTime: number;
  send?: unknown;
}

export interface Observer extends GameObject {
  type: "observer";
  hits: number;
  hitsMax: number;
  user: string;
  notifyWhenAttacked: boolean;
  observeRoom?: unknown;
}

export interface PowerSpawn extends GameObject {
  type: "powerSpawn";
  hits: number;
  hitsMax: number;
  user: string;
  notifyWhenAttacked: boolean;
  store: {
    energy: number;
    power: number;
  };
  storeCapacityResource: {
    energy: number;
    power: number;
  };
}

export interface Nuker extends GameObject {
  type: "nuker";
  hits: number;
  hitsMax: number;
  user: string;
  notifyWhenAttacked: boolean;
  store: {
    energy: number;
    G: number;
  };
  storeCapacityResource: {
    energy: number;
    G: number;
  };
  cooldownTime: number;
}

export interface Factory extends GameObject {
  type: "factory";
  hits: number;
  hitsMax: number;
  user: string;
  notifyWhenAttacked: boolean;
  store: {
    [type in ResourceConstant]: number;
  };
  storeCapacity: number;
  cooldown: number;
  cooldownTime: number;
  effects: {
    [type: string]: {
      effect: number;
      power: number;
      level: number;
      endTime: number;
    };
  };
  level: number;
}

export interface Creep extends GameObject {
  type: "creep";
  name: string;
  hits: number;
  hitsMax: number;
  user: string;
  spawning: boolean;
  fatigue: number;
  body: {
    type: BodyPartConstant;
    hits: number;
    boost?: string;
  }[];
  store: {
    [type in ResourceConstant]: number;
  };
  storeCapacity: number;
  notifyWhenAttacked: boolean;
}

export interface PowerCreep extends Omit<Creep, "type"> {
  type: "powerCreep";
  className: "operator";
  power: {
    [type: number]: {
      level: number;
      cooldownTime?: number;
    };
  };
}
