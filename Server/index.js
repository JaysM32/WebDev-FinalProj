const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

var db_config = {
  user: "ba4f140fc56ce3",
  host: "us-cdbr-east-05.cleardb.net",
  password: "852885ec",
  database: "heroku_3fb5d04bc1ec374",
};

//mysql://ba4f140fc56ce3:852885ec@us-cdbr-east-05.cleardb.net/heroku_3fb5d04bc1ec374?reconnect=true
const db = mysql.createConnection({
  user: "ba4f140fc56ce3",
  host: "us-cdbr-east-05.cleardb.net",
  password: "852885ec",
  database: "heroku_3fb5d04bc1ec374",
});

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();


app.post("/create", (req, res) => {
  const studName = req.body.name;
  const studClass = req.body.classid;
  const studDOB = req.body.dob;
  const studNotes = req.body.notes;
  db.query("INSERT INTO studenttable (studentName, studentClass, studentDOB, studentNotes) VALUES (?,?,?,?)",
    [studName, studClass, studDOB, studNotes],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Values Inserted");
      }
    }
  );
});

app.get("/class", (req, res) => {
  db.query(
    "SELECT * FROM studenttable",
    function(err, result) {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/user/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "SELECT * FROM studenttable WHERE studentID=?",[id],
    (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.put("/update", (req, res) => {
  const id = req.body.id;
  const studName = req.body.name;
  const studClass = req.body.classid;
  const studDOB = req.body.dob;
  const studNotes = req.body.notes;
  console.log(studName);
  console.log(studClass);
  console.log(studDOB);
  console.log(studNotes);
  console.log(id);
  db.query(
    "UPDATE studenttable SET studentName = ?, studentClass = ?, studentDOB=?, studentNotes=? WHERE studentID = ?",
    [studName, studClass, studDOB, studNotes, id],
    (err, result) => {
      
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM studenttable WHERE studentID = ?", id, (err, result) => {
    console.log(id);
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.listen(port, () => console.log(`listening on ${port}`));