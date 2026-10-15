// Audio disabled per user requirement - completely silent operation

class ArenaAudio {
  constructor() {
    this.ctx = null;
  }

  initContext() {}

  playGoalHorn() {
    // Sound disabled
  }

  playPeriodBuzzer() {
    // Sound disabled
  }
}

export const arenaAudio = new ArenaAudio();
