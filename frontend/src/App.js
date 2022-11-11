import { useState, useEffect } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Badge, Button, Col, Container, Dropdown, Form, Modal, Navbar, Row } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import axios from "axios";
import config from "./config.json";
import gateways from "./gateways.json";
import Main from "./components/main";
import Login from "./components/login";
import Signup from "./components/signup";
import Profile from "./components/profile";
import Share from "./components/share";

function App() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [gateway, setGateway] = useState("https://ipfs.io/ipfs/:hash");
  const [backendActive, setBackendActive] = useState(false);
  const [gatewayActive, setGatewayActive] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [showGatewayErrorModal, setShowGatewayErrorModal] = useState(false);
  const [user, setUser] = useState({verified: false, user_id: "", username: "", fname: "", lname: "", email: ""});
  const [windowURL, setWindowURL] = useState(window.location.pathname);
  const checkBackend = async () => {
    axios.get(config.backend_link).then(response => {if(response.data?.msg === "active") setBackendActive(old => true);});
  };
  const checkGateway = async (gate) => {
    axios.get(gate.replace(":hash", "bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m")).then(response => {if(response.status === 200) setGatewayActive(old => true);});
  };
  const verifyUser = async () => {
    if(localStorage.getItem("user_id") && localStorage.getItem("token")) {
      await axios.post(config.backend_link + "/verify", {"user_id": localStorage.getItem("user_id"), "token": localStorage.getItem("token")}).then(response => {
        setUser(response.data);
        localStorage.setItem("verified", response.data.verified ? "true" : "false");
      }).catch(err => console.error(err));
    }
  }
  useEffect(() => {
    verifyUser();
  }, []);
  useEffect(() => {
    checkBackend();
    checkGateway(gateway);
  }, [gateway]);
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode ? "true" : "false");
  }, [darkMode]);
  const handleLogout = async (e) => {
    axios.post(config.backend_link + "/logout", {user_id: user.user_id});
    localStorage.setItem("user_id", "");
    localStorage.setItem("token", "");
    localStorage.setItem("verified", "false");
    verifyUser();
    window.location.href="/";
  }
  return (
    <>
      <script>{darkMode ? document.body.setAttribute("data-theme", "dark") : document.body.removeAttribute("data-theme")}</script>
      <BrowserRouter>
        {darkMode
        ? <>
            <Navbar variant="dark">
              <Container fluid="md">
                <Navbar.Brand href="/" as="div">
                  <Row id="title" className="justify-content-md-center" style={{margin: "20px"}}>
                    <Col md="auto">
                      <img src="/favicon.ico" width="60" height="60" className="d-inline-block align-top" alt="" />
                    </Col>
                    <Col md="auto">
                      <Link to="/" style={{textDecoration: "none", color: "white"}}><h1>IPFS Storage</h1></Link>
                    </Col>
                  </Row>
                </Navbar.Brand>
                <Navbar.Collapse className="justify-content-end">
                  <Navbar.Text>
                    {user.verified
                    ? <>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-light">{user.fname} {user.lname}</Dropdown.Toggle>
                          <Dropdown.Menu className="bg-light">
                            <Dropdown.Item><Link to="/profile" style={{textDecoration: "none"}}>Profile</Link></Dropdown.Item>
                            <Dropdown.Item><Link to="/share" style={{textDecoration: "none"}}>Share</Link></Dropdown.Item>
                            <Dropdown.Divider color="grey" />
                            <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </>
                    : 
                      <>
                        {!windowURL.startsWith("/login") ? <Link to="/login"><Button variant="outline-light" style={{margin: "10px"}}>Login</Button></Link> : <></>}
                        {!windowURL.startsWith("/signup") ? <Link to="/signup"><Button variant="outline-light" style={{margin: "10px"}}>Sign up</Button></Link> : <></>}
                      </>
                    }
                  </Navbar.Text>
                </Navbar.Collapse>
              </Container>
            </Navbar>
            <Routes>
              <Route exact path="/" element={<Main darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
              <Route path="/login" element={<Login darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
              <Route path="/signup" element={<Signup darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
              <Route path="/profile" element={<Profile darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
              <Route path="/share" element={<Share darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
            </Routes>
            <Container fluid="md">
              <Row style={{margin: "20px"}}>
                <Col md="auto" align="begin">
                  <Button variant="outline-light" onClick={e => {if(darkMode) setDarkMode(false); else setDarkMode(true);}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-brightness-high" viewBox="0 0 16 16"><path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/></svg></Button>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="auto" align="begin">{backendActive ? <Badge pill bg="success">Backend</Badge> : <Badge pill bg="secondary">Backend</Badge>}</Col>
                <Col md="auto" align="begin">{gatewayActive ? <Badge pill bg="success">Gateway</Badge> : <Badge pill bg="secondary">Gateway</Badge>}</Col>
                <Col align="end">Gateway: <Button variant="outline-info" size="sm" onClick={e => {setShowGatewayModal(old => true)}}>{(new URL(gateway)).hostname}</Button></Col>
              </Row>
            </Container>
            <Modal show={showGatewayModal} onHide={(e) => setShowGatewayModal(old => false)}>
              <Modal.Header closeButton closeVariant="white">
                <Modal.Title>Choose IPFS Gateway</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Select className="bg-light" style={{margin: "5px"}} defaultValue={gateway} onChange={e => {setGateway(old => e.target.value); setShowGatewayModal(old => false); setGatewayActive(old => false);}}>
                  {gateways.map(element => <option value={element}>{(new URL(element)).hostname}</option>)}
                </Form.Select>
                <Button variant="link" size="sm" onClick={e => window.open("https://ipfs.github.io/public-gateway-checker/")}>Click here</Button> for more info.
              </Modal.Body>
            </Modal>
            <Modal show={showGatewayErrorModal} onHide={(e) => setShowGatewayErrorModal(old => false)}>
              <Modal.Header closeButton closeVariant="white">
                <h5>Error occurred! Try different gateway.</h5>
              </Modal.Header>
            </Modal>
          </>
        : <>
            <Navbar>
              <Container fluid="md">
                <Navbar.Brand href="/" as="div">
                  <Row id="title" className="justify-content-md-center" style={{margin: "20px"}}>
                    <Col md="auto">
                      <img src="/favicon.ico" width="60" height="60" className="d-inline-block align-top" alt="" />
                    </Col>
                    <Col md="auto">
                      <Link to="/" style={{textDecoration: "none", color: "black"}}><h1>IPFS Storage</h1></Link>
                    </Col>
                  </Row>
                </Navbar.Brand>
                <Navbar.Collapse className="justify-content-end">
                  <Navbar.Text>
                    {user.verified
                    ? <>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-dark">{user.fname} {user.lname}</Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item><Link to="/profile" style={{textDecoration: "none"}}>Profile</Link></Dropdown.Item>
                            <Dropdown.Item><Link to="/share" style={{textDecoration: "none"}}>Share</Link></Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </>
                    : 
                      <>
                        {!windowURL.startsWith("/login") ? <Link to="/login"><Button variant="outline-dark" style={{margin: "10px"}}>Login</Button></Link> : <></>}
                        {!windowURL.startsWith("/signup") ? <Link to="/signup"><Button variant="outline-dark" style={{margin: "10px"}}>Sign up</Button></Link> : <></>}
                      </>
                    }
                  </Navbar.Text>
                </Navbar.Collapse>
              </Container>
            </Navbar>
            <Routes>
              <Route exact path="/" element={<Main darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
              <Route path="/login" element={<Login darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
              <Route path="/signup" element={<Signup darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
              <Route path="/profile" element={<Profile darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
              <Route path="/share" element={<Share darkMode={darkMode} setDarkMode={setDarkMode} setWindowURL={setWindowURL} gateway={gateway} setGateway={setGateway} backendActive={backendActive} checkBackend={checkBackend} gatewayActive={gatewayActive} checkGateway={checkGateway} setShowGatewayModal={setShowGatewayModal} setShowGatewayErrorModal={setShowGatewayErrorModal} user={user} setUser={setUser} verifyUser={verifyUser} />} />
            </Routes>
            <Container fluid="md">
              <Row style={{margin: "20px"}}>
                <Col md="auto" align="begin">
                  <Button variant="outline-dark" onClick={e => {if(darkMode) setDarkMode(false); else setDarkMode(true);}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-moon-stars" viewBox="0 0 16 16"><path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z"/><path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L13.863.1z"/></svg></Button>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="auto" align="begin">{backendActive ? <Badge pill bg="success">Backend</Badge> : <Badge pill bg="secondary">Backend</Badge>}</Col>
                <Col md="auto" align="begin">{gatewayActive ? <Badge pill bg="success">Gateway</Badge> : <Badge pill bg="secondary">Gateway</Badge>}</Col>
                <Col align="end">Gateway: <Button variant="outline-info" size="sm" onClick={e => {setShowGatewayModal(old => true)}}>{(new URL(gateway)).hostname}</Button></Col>
              </Row>
            </Container>
            <Modal show={showGatewayModal} onHide={(e) => setShowGatewayModal(old => false)}>
              <Modal.Header closeButton>
                <Modal.Title>Choose IPFS Gateway</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Select style={{margin: "5px"}} defaultValue={gateway} onChange={e => {setGateway(old => e.target.value); setShowGatewayModal(old => false); setGatewayActive(old => false);}}>
                  {gateways.map(element => <option value={element}>{(new URL(element)).hostname}</option>)}
                </Form.Select>
                <Button variant="link" size="sm" onClick={e => window.open("https://ipfs.github.io/public-gateway-checker/")}>Click here</Button> for more info.
              </Modal.Body>
            </Modal>
            <Modal show={showGatewayErrorModal} onHide={(e) => setShowGatewayErrorModal(old => false)}>
              <Modal.Header closeButton>
                <h5>Error occurred! Try different gateway.</h5>
              </Modal.Header>
            </Modal>
          </>
        }
      </BrowserRouter>
    </>
  );
}

export default App;
