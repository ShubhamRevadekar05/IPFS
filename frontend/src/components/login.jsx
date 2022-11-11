import { useNavigate } from "react-router-dom";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import config from "../config.json";

function Login(props) {
  props.setWindowURL(window.location.pathname);
  var navigate = useNavigate();
  var next = (new URLSearchParams(window.location.search)).get("next") || "";
  if(localStorage.getItem("verified") === "true") navigate("/" + next);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    document.getElementById("loginBtn").disabled = true;
    document.getElementById("loginBtnLoading").hidden = false;
    axios.post(config.backend_link + "/login", {"email": formData.get("email"), "password": formData.get("password")}).then(async response => {
      document.getElementById("loginBtn").disabled = false;
      document.getElementById("loginBtnLoading").hidden = true;
      if(response.status === 200) {
        localStorage.setItem("user_id", response.data.user_id);
        localStorage.setItem("token", response.data.token);
        await props.verifyUser();
        navigate("/" + next);
      }
    }).catch(err => {
      document.getElementById("loginBtn").disabled = false;
      document.getElementById("loginBtnLoading").hidden = true;
      console.error(err);
      if(err.response.status === 400) document.getElementById("incorrent_credentials").hidden = false;
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
                    <Form.Text style={{color: "red"}} id="incorrent_credentials" hidden>Incorrect credentials.</Form.Text>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter email" name="email" className="bg-light" />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                <Form.Group>
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" placeholder="Password" name="password" className="bg-light" />
                </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin"><Form.Group><Button variant="outline-primary" id="loginBtn" type="submit">Login<Spinner id="loginBtnLoading" animation="border" variant="primary" size="sm" hidden /></Button></Form.Group></Col>
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
                    <Form.Text style={{color: "red"}} id="incorrent_credentials" hidden>Incorrect credentials.</Form.Text>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter email" name="email" />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin">
                <Form.Group>
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" placeholder="Password" name="password" />
                </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="5" align="begin"><Form.Group><Button variant="outline-primary" id="loginBtn" type="submit">Login<Spinner id="loginBtnLoading" animation="border" variant="primary" size="sm" hidden /></Button></Form.Group></Col>
              </Row>
            </Form>
          </Container>
        </>
      }
    </>
  );
};

export default Login;