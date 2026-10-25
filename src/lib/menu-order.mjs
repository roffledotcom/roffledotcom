export function restoreMenuOrder(saved, defaults) {
  const valid = Array.isArray(saved) ? saved.filter((id) => defaults.includes(id)) : [];
  return [...new Set([...valid, ...defaults])];
}
export function moveMenuItem(order, source, target, after = true) {
  if (source === target || !order.includes(source) || !order.includes(target)) return [...order];
  const next = order.filter((id) => id !== source);
  next.splice(next.indexOf(target) + (after ? 1 : 0), 0, source);
  return next;
}
