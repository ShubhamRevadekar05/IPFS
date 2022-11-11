import { useNavigate } from "react-router-dom";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import config from "../config.json";

function Signup(props) {
  props.setWindowURL(window.location.pathname);
  var navigate = useNavigate();
  if(localStorage.getItem("verified") === "true") navigate("/");
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    document.getElementById("signupBtn").disabled = true;
    document.getElementById("signupBtnLoading").hidden = false;
    document.getElementById("email_exists").hidden = true;
    document.getElementById("username_exists").hidden = true;
    axios.post(config.backend_link + "/signup", {"username": formData.get("username"), "email": formData.get("email"), "fname": formData.get("fname"), "lname": formData.get("lname"), "password": formData.get("password")}).then(response => {
      document.getElementById("signupBtn").disabled = false;
      document.getElementById("signupBtnLoading").hidden = true;
      if(response.status === 200) {
        props.setUser({verified: false, user_id: "", username: "", fname: "", lname: "", email: ""});
        navigate("/login");
      }
    }).catch(err => {
      document.getElementById("signupBtn").disabled = false;
      document.getElementById("signupBtnLoading").hidden = true;
      console.error(err);
      if(err.response.status === 409 && err.response.data["error"] === "emailExists") document.getElementById("email_exists").hidden = false;
      if(err.response.status === 409 && err.response.data["error"] === "usernameExists") document.getElementById("username_exists").hidden = false;
    });
  };
  return (
    <>
      {props.darkMode
      ? <>
          <Container fluid="md">
            <Form onSubmit={handleSubmit}>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="text" placeholder="Enter username" name="username" className="bg-light" required />
                    <Form.Text style={{color: "red"}} id="username_exists" hidden>Username already exists.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter email" name="email" className="bg-light" required />
                    <Form.Text style={{color: "red"}} id="email_exists" hidden>Email already exists.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>First name</Form.Label>
                    <Form.Control type="text" placeholder="Enter first name" name="fname" className="bg-light" required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Last name</Form.Label>
                    <Form.Control type="text" placeholder="Enter last name" name="lname" className="bg-light" required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password" id="password" name="password" className="bg-light" onChange={e => {document.getElementById("signupBtn").disabled = e.target.value === "" || e.target.value !== document.getElementById("confirm_password").value;}} required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" placeholder="Confirm Password" id="confirm_password" name="confirm_password" className="bg-light" onChange={e => {document.getElementById("signupBtn").disabled = e.target.value === "" || e.target.value !== document.getElementById("password").value;}} required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin"><Form.Group><Button variant="outline-primary" id="signupBtn" type="submit" disabled>Sign up<Spinner id="signupBtnLoading" animation="border" variant="primary" size="sm" hidden /></Button></Form.Group></Col>
              </Row>
            </Form>
          </Container>
        </>
      : <>
          <Container fluid="md">
            <Form onSubmit={handleSubmit}>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="text" placeholder="Enter username" name="username" required />
                    <Form.Text style={{color: "red"}} id="username_exists" hidden>Username already exists.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter email" name="email" required />
                    <Form.Text style={{color: "red"}} id="email_exists" hidden>Email already exists.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>First name</Form.Label>
                    <Form.Control type="text" placeholder="Enter first name" name="fname" required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Last name</Form.Label>
                    <Form.Control type="text" placeholder="Enter last name" name="lname" required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password" id="password" name="password" onChange={e => {document.getElementById("signupBtn").disabled = e.target.value === "" || e.target.value !== document.getElementById("confirm_password").value;}} required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                  <Form.Group>
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" placeholder="Confirm Password" id="confirm_password" name="confirm_password" onChange={e => {document.getElementById("signupBtn").disabled = e.target.value === "" || e.target.value !== document.getElementById("password").value;}} required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin"><Form.Group><Button variant="outline-primary" id="signupBtn" type="submit" disabled>Sign up<Spinner id="signupBtnLoading" animation="border" variant="primary" size="sm" hidden /></Button></Form.Group></Col>
              </Row>
            </Form>
          </Container>
        </>
      }
    </>
  );
};

export default Signup;