import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "STATES",
  password: "root",
  port: 5432,
});

db.connect();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const stateVisited = await getAllVisitedStates();
  res.render("index.ejs", { states: stateVisited, total: stateVisited.length });
});

app.post("/add", async (req, res) => {
  const stateName = req.body.state;
  try {
    const code = await db.query(
      "SELECT state_code FROM states WHERE LOWER(state_name) LIKE '%' || $1 || '%'",
      [String(stateName).toLowerCase()]
    );

    try {
      if (code.rows.length !== 0) {
        db.query("INSERT INTO visited(state_code) VALUES($1)", [
          code.rows[0].state_code,
        ]);
        res.redirect("/");
      }
    } catch (error) {
      console.log(error);
      const statesVisited = await getAllVisitedStates();
      res.render("index.ejs", {
        states: statesVisited,
        total: statesVisited.length,
        error: "State already selected: Enter new state:",
      });
    }
  } catch (error) {
    console.log(error);
    const statesVisited = await getAllVisitedStates();
    res.render("index.ejs", {
      states: statesVisited,
      total: statesVisited.length,
      error: "State does not exist please try again:",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.get("/clear", async (req, res) => {
  try {
    await db.query("DELETE FROM visited");
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

async function getAllVisitedStates() {
  let visitedStates = await db.query("SELECT * FROM visited");
  let visitedStatesCode = [];
  visitedStates.rows.forEach((row) => {
    visitedStatesCode.push(row.state_code);
  });
  return visitedStatesCode;
}
