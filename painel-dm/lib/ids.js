/**
 * Gerador de IDs e helpers de coleção.
 */
const crypto = require('crypto');

function nextId(items) {
  const max = items.reduce((m, x) => (Number(x.id) > m ? Number(x.id) : m), 0);
  return max + 1;
}

function uuid() {
  return crypto.randomUUID();
}

function findById(items, id) {
  const n = Number(id);
  return items.find(x => Number(x.id) === n);
}

function indexById(items, id) {
  const n = Number(id);
  return items.findIndex(x => Number(x.id) === n);
}

module.exports = { nextId, uuid, findById, indexById };
