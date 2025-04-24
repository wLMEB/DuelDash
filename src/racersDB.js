// {
//  id:RacerID
//   name,
//   race{
//     raceID,
//     raceID
//   }
// }
// totalRacers=n
// 1st = ceiling(n/2), create doc with id = 1, matches
// .. keep dividing by 2 until 1, each time create with id
//
// {
//   _id: raceID, TrackA, TrackB, TimeA, TimeB;
// }

const PouchDB = require("pouchdb");
//import PouchDB from "pouchdb";
const db = new PouchDB("Racers");

async function saveRacer(name, id) {
  await db.put({ _id: id, name, raceIDs: [] });
}

async function modifyRacer(doc) {
  await db.put(doc);
}

async function loadRacer(id) {
  const Racer = await db.get(id);
  // console.log(Racer)
  return Racer;
}

async function removeRacer(doc) {
  db.remove(doc);
}

async function loadAllRacers() {
  const result = await db.allDocs({ include_docs: true });
  return result.rows.map((row) => row.doc);
}

async function deleteAllRacers() {
  const result = await db.allDocs({ include_docs: true });
  result.rows.map((row) => removeRacer(row.doc));
}


module.exports = {
  saveRacer,
  modifyRacer,
  loadRacer,
  removeRacer,
  loadAllRacers,
  deleteAllRacers
};
