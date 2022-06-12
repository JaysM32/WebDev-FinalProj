import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Button, Alert, Navbar, Form } from "react-bootstrap";
import { useAuth } from "../backends/AuthCont";
import { Link, useHistory, useParams} from "react-router-dom";
import './styling.css';
import { Nav } from "react-bootstrap";
import { Container } from "react-bootstrap";

export default function Dashboard() {

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

  //database functions
  const {id} = useParams();
  const [students, setStudents] = useState([]);
  const [newName, setName] = useState('');
  const [newClassid, setClassID] = useState('');
  const [newDob, setDOB] = useState('');
  const [newNotes, setNotes] = useState('');


  const getSpecStudents = (id) => {
    axios.get(`https://webdev-deployed-updated.herokuapp.com/user/${id}`).then((response) => {
      setStudents(response.data);
    });
  };

  const updateStudent = (id) => {
    axios.put("https://webdev-deployed-updated.herokuapp.com/update", { 
      name: newName,
      classid: newClassid,
      dob: newDob,
      notes: newNotes,
      id: id 
    }).then( (response) => {
        console.log(response.data);
      }
    );
  };

  
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
          <Nav.Link href="/StudClass">Classes</Nav.Link>
          <Nav.Link href="/Account">Account</Nav.Link>
          <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
        </Nav>
        </Navbar.Collapse>
      </Navbar>


      <div className="loginbox">
      <Container>
        <Card>
          <Card.Body>
          <h1>Edit user</h1>
          <Form>
              <Form.Label for='studentName'>Write Student Name</Form.Label><br/>
              <input type="text" id="studentName" value={students.studentName} name="studentName" onChange={(event)=>{setName(event.target.value)}}></input><br/><br/>
              <Form.Label for='studentclass'>Write Student Class ID</Form.Label><br/>
              <input type="text" id="studentClass" name="studentClass" onChange={(event)=>{setClassID(event.target.value)}}></input><br/><br/>
              <Form.Label for='studentDOB'>Write Student Date of Birth</Form.Label><br/>
              <input type="text" id="studentName" name="studentDOB" onChange={(event)=>{setDOB(event.target.value)}}></input><br/><br/>
              <Form.Label for='studentNotes'>Write any notes Regarding the student</Form.Label><br/>
              <input type="text" id="studentClass" name="studentClass" onChange={(event)=>{setNotes(event.target.value)}}></input><br/><br/>
              <Button className="w-100" type="submit" onClick={()=> {updateStudent(id)}}> Submit </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
      </div>
   </div>
  )
}
