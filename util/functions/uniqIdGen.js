module.exports = () => {
  let id1 = Math.random();
  for (let i = 0; i < 100; i++) {
    id1 += Math.random();
  }
  return `${id1 * 10000000000000000}`;
};
