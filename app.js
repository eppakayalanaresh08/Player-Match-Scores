const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const connectionDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

connectionDatabase();
const playerCamelCase = (eachObject) => {
  return {
    playerId: eachObject.player_id,
    playerName: eachObject.player_name,
  };
};
const convertCamelCase = (eachObject) => {
  return {
    matchId: eachObject.match_id,
    match: eachObject.match,
    year: eachObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const dataBase = `
       SELECT 
          * 
        FROM 
        player_details;`;
  const responseData = await db.all(dataBase);
  response.send(responseData.map((eachObject) => playerCamelCase(eachObject)));
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const dataBase = `
          SELECT 
            *
           FROM 
        player_details
        WHERE player_id=${playerId}`;
  const responseData = await db.get(dataBase);
  const objectData = {
    playerId: responseData.player_id,
    playerName: responseData.player_name,
  };

  response.send(objectData);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const bodyPut = request.body;
  const { playerName } = bodyPut;
  const dataValue = `
        UPDATE
      player_details
     SET
       player_name='${playerName}'
    WHERE player_id= ${playerId};`;
  const responseData = await db.run(dataValue);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const database = `
      SELECT 
        *
      FROM 
    match_details
    WHERE match_id=${matchId}`;
  const responseData = await db.get(database);
  const matchObject = {
    matchId: responseData.match_id,
    match: responseData.match,
    year: responseData.year,
  };
  response.send(matchObject);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const dataBase = `
       SELECT 
        match_id,
        match,
        year
      FROM  player_match_score 
      NATURAL JOIN 
       match_details
      WHERE player_id=${playerId};`;
  const responseData = await db.all(dataBase);
  response.send(
    responseData.map((eachDbObject) => convertCamelCase(eachDbObject))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const dataBase = `
       SELECT 
        player_id,
        player_name
       FROM  player_match_score 
        NATURAl JOIN
         player_details
       WHERE player_id=${matchId}
     `;
  const responseData = await db.all(dataBase);
  response.send(
    responseData.map((eachDbObject) => playerCamelCase(eachDbObject))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const dataBase = `
      SELECT 
       player_id,
       player_name,
       SUM(score),
       SUM(fours),
       SUM(sixes) 
       FROM player_match_score 
       NATURAL JOIN 
        player_details
      WHERE player_id=${playerId}

    `;
  const responseData = await db.get(dataBase);
  const responseObject = {
    playerId: responseData.player_id,
    playerName: responseData.player_name,
    totalScore: responseData["SUM(score)"],
    totalFours: responseData["SUM(fours)"],
    totalSixes: responseData["SUM(sixes)"],
  };
  response.send(responseObject);
});

module.exports = app;
