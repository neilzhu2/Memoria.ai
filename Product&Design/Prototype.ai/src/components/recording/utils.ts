export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const centisecs = Math.floor((secs % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${centisecs.toString().padStart(2, '0')}`;
};