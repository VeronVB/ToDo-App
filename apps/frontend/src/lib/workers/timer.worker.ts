let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, interval } = e.data;

  if (type === 'start') {
    if (intervalId) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, interval || 1000);
  }

  if (type === 'stop') {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
