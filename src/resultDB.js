// let result = {
//   _id: raceID,
//   TrackA,
//   TrackB,
//   TimeA,
//   TimeB,
// };

const PouchDB = require("pouchdb");
//import PouchDB from "pouchdb";
const db = new PouchDB("Results");

async function saveResult(raceID, TrackA, TrackB, TimeA, TimeB) {
  await db.put({ _id: raceID, TrackA, TrackB, TimeA, TimeB });
}

async function updateID(doc){
  await db.put(doc)
}

async function removeResult(doc) {
  db.remove(doc);
}
async function modifyRace(doc) {
  await db.put(doc);
}
async function loadResult(raceID) {
  const result = await db.get(raceID);
  return result;
}

async function loadAllResults() {
  const Results = await db.allDocs({ include_docs: true });
  return Results.rows.map((row) => row.doc);
}
async function deleteAllResults() {
  const Results = await db.allDocs({ include_docs: true });
  Results.rows.map((row) => removeResult(row.doc));
}

module.exports = {
  saveResult,
  loadResult,
  loadAllResults,
  deleteAllResults,
  updateID,
  modifyRace
};
