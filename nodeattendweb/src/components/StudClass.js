import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Button, Alert, Navbar, Form } from "react-bootstrap";
import { useAuth } from "../backends/AuthCont";
import { Link, useHistory, useParams } from "react-router-dom";
import './styling.css';
import { Nav } from "react-bootstrap";
import { Container } from "react-bootstrap";

export default function Dashboard() {
  // To Do: connect to teacher table which is connected to the firebase, which will output different ammount of classes specific to the teacher. 
  // Logout functions
  
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();
  const history = useHistory();

  async function handleLogout() {
    setError("")

    try {
      await logout();
      history.push("/login");
    } catch {
      setError("Failed to log out");
    }
  }

  //databse functions
  const [students, setStudents] = useState([]);

  useEffect(() => {
    getStudents();
  }, []);

  const getStudents = () => {
    axios.get('https://webdev-deployed-updated.herokuapp.com/class').then((response) => {
      console.log('wadsadwasd')
      setStudents(response.data);
    });
  };

  const deleteStudent = (id) => {
    axios.delete(`https://webdev-deployed-updated.herokuapp.com/delete/${id}`).then((response) => {
      console.log("data deleted")
      window.location.reload()
    });
  };
  const [studID, setStudID] = useState([]);
  const handleEdit = (e) =>{
    e.preventDefault();
    history.push(`/studEdit/${studID}`);
  }
  return (

    <div className="page">
      <Navbar bg='basecolor' variant="dark" sticky='top' expand='sm' collapseOnSelect >
        <Navbar.Brand>
        <img src={require('../images/3msFaceRecog.png')} alt="logo"/>
        3msStudentReg
        </Navbar.Brand>

        <Navbar.Toggle />
        <Navbar.Collapse className="right-align">
        <Nav>
          <Nav.Link href="/">Registry</Nav.Link>
          <Nav.Link href="/StudClass">Database</Nav.Link>
          <Nav.Link href="/Account">Account</Nav.Link>
          <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
        </Nav>
        </Navbar.Collapse>
      </Navbar>


      <div className="content">
      <Container className="insertregistry">
        <Card className="databasebody">
          <Card.Body>
          <h1 className="registrytitle">Students</h1>
          <h5 style={{textAlign:'center'}}> This may take a while due to heroku server location and latency.</h5><br/>
          <table className="studentdatabase">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Class</th>
                        <th>DOB</th>
                        <th>Notes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((user, key) =>
                        <tr key={key}>
                            <td>{user.studentID}</td>
                            <td>{user.studentName}</td>
                            <td>{user.studentClass}</td>
                            <td>{user.studentDOB}</td>
                            <td>{user.studentNotes}</td>
                            <td>
                              <button onClick={() => deleteStudent(user.studentID)}>Delete</button>
                            </td>
                        </tr>
                    )}
                    
                </tbody>
            </table>
            <br/><br/>
            <div className="registrytitle">
              <h1>Input Student ID to Edit</h1><br/>
              <Form onSubmit={handleEdit}>
                <input type="text" id="classSelect" name="classSelect" onChange={(e)=>setStudID(e.target.value)}></input><br/><br/>
                <Button className="w-100" type="submit"> Edit </Button>
              </Form>
            </div>
          </Card.Body>
        </Card>
      </Container>
      </div>
   </div>
  )
}
