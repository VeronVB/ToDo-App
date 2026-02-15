import type { ITimeEntry, ITask } from 'shared';
import * as api from '$lib/api/client';

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak' | 'idle';

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentPhase: PomodoroPhase;
  timeRemaining: number;
  totalTime: number;
  sessionsCompleted: number;
  activeTimeEntry: ITimeEntry | null;
  activeTask: ITask | null;
}

const DURATIONS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

const SESSIONS_BEFORE_LONG_BREAK = 4;

class TimerStore {
  isRunning = $state(false);
  isPaused = $state(false);
  currentPhase = $state<PomodoroPhase>('idle');
  timeRemaining = $state(0);
  totalTime = $state(0);
  sessionsCompleted = $state(0);
  activeTimeEntry = $state<ITimeEntry | null>(null);
  activeTask = $state<ITask | null>(null);
  
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private worker: Worker | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined') return;
    
    try {
      this.worker = new Worker(
        new URL('$lib/workers/timer.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      this.worker.onmessage = (e) => {
        if (e.data.type === 'tick') {
          this.tick();
        }
      };
    } catch (e) {
      console.warn('Web Worker not available, using setInterval fallback');
    }
  }

  get progress(): number {
    if (this.totalTime === 0) return 0;
    return ((this.totalTime - this.timeRemaining) / this.totalTime) * 100;
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  get phaseLabel(): string {
    switch (this.currentPhase) {
      case 'work': return 'Focus';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Ready';
    }
  }

  async init() {
    try {
      const activeTimer = await api.getActiveTimer();
      if (activeTimer && activeTimer.isRunning) {
        const taskId = activeTimer.taskId;
        const duration = activeTimer.duration || 0;
        
        this.activeTimeEntry = activeTimer;
        this.activeTask = { id: taskId, title: '', completed: false, priority: 'medium', position: 0, depth: 0 } as ITask;
        this.isRunning = true;
        this.currentPhase = 'work';
        this.timeRemaining = Math.max(0, DURATIONS.work - duration);
        this.totalTime = DURATIONS.work;
        
        this.startLocalTimer();
      }
    } catch (e) {
      console.error('Failed to init timer:', e);
    }
  }

  async startTimer(task: ITask) {
    try {
      const timeEntry = await api.startTimeEntry(task.id);
      
      this.activeTimeEntry = timeEntry;
      this.activeTask = task;
      this.isRunning = true;
      this.isPaused = false;
      this.currentPhase = 'work';
      this.timeRemaining = DURATIONS.work;
      this.totalTime = DURATIONS.work;
      
      this.startLocalTimer();
    } catch (e) {
      console.error('Failed to start timer:', e);
    }
  }

  private startLocalTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.worker) {
      this.worker.postMessage({ type: 'start', interval: 1000 });
    } else {
      this.intervalId = setInterval(() => this.tick(), 1000);
    }
  }

  private tick() {
    if (this.timeRemaining > 0) {
      this.timeRemaining--;
    } else {
      this.onPhaseComplete();
    }
  }

  pauseTimer() {
    this.isPaused = true;
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    } else if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resumeTimer() {
    this.isPaused = false;
    this.startLocalTimer();
  }

  async stopTimer() {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    } else if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.activeTimeEntry) {
      try {
        await api.stopTimeEntry(this.activeTimeEntry.id);
      } catch (e) {
        console.error('Failed to stop time entry:', e);
      }
    }

    this.reset();
  }

  private reset() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentPhase = 'idle';
    this.timeRemaining = 0;
    this.totalTime = 0;
    this.activeTimeEntry = null;
    this.activeTask = null;
  }

  private async onPhaseComplete() {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    } else if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.currentPhase === 'work') {
      this.sessionsCompleted++;
      
      if (this.activeTimeEntry) {
        try {
          await api.stopTimeEntry(this.activeTimeEntry.id);
          this.activeTimeEntry = null;
        } catch (e) {
          console.error('Failed to stop time entry:', e);
        }
      }

      if (this.sessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
        this.currentPhase = 'longBreak';
        this.timeRemaining = DURATIONS.longBreak;
        this.totalTime = DURATIONS.longBreak;
      } else {
        this.currentPhase = 'shortBreak';
        this.timeRemaining = DURATIONS.shortBreak;
        this.totalTime = DURATIONS.shortBreak;
      }
    } else {
      this.currentPhase = 'work';
      this.timeRemaining = DURATIONS.work;
      this.totalTime = DURATIONS.work;
    }

    if (document.visibilityState === 'visible') {
      this.playNotificationSound();
    }
  }

  skipToNext() {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    } else if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onPhaseComplete();
    this.startLocalTimer();
  }

  private playNotificationSound() {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.worker) {
      this.worker.terminate();
    }
  }
}

export const timerStore = new TimerStore();
