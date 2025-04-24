// let racer = {
//   _id: RacerID,
//   name: "Racer A",
//   race: [
//     raceID,
//     raceID,
//     // More race IDs will be added
//   ],
// };

// let round = {
//   _id: String(round),
//   finished:false,
//   winners: [[]],
//   matches: [{
//     done: false,
//     pair: [
//       {
//         "RacerID": String(RacerID1), "Score": 0, 
//         "winner": false, "First": 0, "Second": 0
//       },
//       {
//         "RacerID": String(RacerID2), "Score": 0, 
//         "winner": false, "First": 0, "Second": 0
//       }
//     ],
//   }]
// };

const PouchDB = require("pouchdb");
//import PouchDB from "pouchdb";
const db = new PouchDB("Brackets");

async function MatchInit(doc) {
  await db.put(doc);
}

async function modifyRound(doc) {
  await db.put(doc);
}

async function loadRacer(id) {
  const Racer = await db.get(id);
  // console.log(Racer)
  return Racer;
}

async function removeMatch(doc) {
  db.remove(doc);
}

async function loadAllMatches() {
  const result = await db.allDocs({ include_docs: true });
  return result.rows.map((row) => row.doc);
}

async function deleteAllMatches() {
  const result = await db.allDocs({ include_docs: true });
  result.rows.map((row) => removeMatch(row.doc));
}

module.exports = {
  MatchInit,
  modifyRound,
  loadRacer,
  removeMatch,
  loadAllMatches,
  deleteAllMatches,
};
