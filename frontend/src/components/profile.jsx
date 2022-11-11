import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Col, Container, Dropdown, Form, Modal, ProgressBar, Row } from "react-bootstrap";
import axios from "axios";
import config from "../config.json";

function Profile(props) {
  props.setWindowURL(window.location.pathname);
  var navigate = useNavigate();
  if(localStorage.getItem("verified") !== "true") navigate("/login?next=profile");
  const [file, setFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [page, setPage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [showUploadProgressModal, setShowUploadProgressModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showShareModal, setShowShareModel] = useState(false);
  const [incompleteUpload, setIncompleteUpload] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [fileShare, setFileShare] = useState(null);
  const updateList = async function() {
    axios.get(config.backend_link + "/files", {
      params: {
        user_id: localStorage.getItem("user_id"),
        token: localStorage.getItem("token")
      }
    }).then(response => {
      var respArr = response.data;
      var arr = [];
      respArr?.forEach(element => {
        arr.push([element.id, element.name, element.url, element.public_id, element.is_public]);
      });
      setFileList(old => arr);
    }).catch(err => console.error(err));
  };
  const updateGroupList = async function() {
    axios.get(config.backend_link + "/get_groups", {
      params: {
        user_id: localStorage.getItem("user_id"),
        token: localStorage.getItem("token")
      }
    }).then(response => {
      var respArr = response.data;
      var arr = [];
      respArr?.forEach(element => {
        arr.push([element.id, element.name, element.owner]);
      });
      setGroupList(old => arr);
    }).catch(err => console.error(err));
  }
  useEffect(() => {
    updateList();
    updateGroupList();
  }, []);
  const completeUpload = (token) => {
    axios.get(props.gateway.replace(":hash", token.ipnft + "/metadata.json")).then(response => {
      var url = response.data.image.replace("ipfs://", "");
      axios.post(config.backend_link + "/add_file", {user_id: props.user.verified ? props.user.user_id : "", token: props.user.verified ? localStorage.getItem("token") : "", username: props.user.verified ? props.user.username : "", name: response.data.name, url: url, is_public: false}).then(response => {
        if(response.data.msg === "Updated") {
          setUploadMessage("Upload complete.");
          setUploadProgress(100);
          setTimeout(() => setShowUploadProgressModal(old => false), 2000);
          setIncompleteUpload(old => []);
          updateList();
        }
      }).catch(err => {console.error(err); props.setShowUploadProgressModal(old => false); props.checkBackend();});
    }).catch(err => {console.error(err); setShowUploadProgressModal(old => false); props.setShowGatewayErrorModal(old => true); props.checkGateway(props.gateway);});
  };
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    document.getElementById("email_exists").hidden = false;
    document.getElementById("username_exists").hidden = false;
    await axios.put(config.backend_link + "/update_user", {
      user_id: props.user.user_id,
      token: localStorage.getItem("token"),
      username: formData.get("username"),
      fname: formData.get("fname"),
      lname: formData.get("lname"),
      email: formData.get("email"),
      password: formData.get("password")
    }).then(response => {
      window.location.reload();
    }).catch(err => {
      console.error(err);
      if(err.response.status === 409 && err.response.data["error"] === "emailExists") document.getElementById("email_exists").hidden = false;
      if(err.response.status === 409 && err.response.data["error"] === "usernameExists") document.getElementById("username_exists").hidden = false;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if(incompleteUpload.length === 0) {
        setUploadProgress(old => 0);
        setShowUploadProgressModal(old => true);
        if(file) {
          setUploadMessage("Uploading file...");
          let formData = new FormData();
          formData.append("file", file);
          axios.post(config.backend_link + "/upload_file", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            },
            onUploadProgress: data => {
              setUploadProgress(old => old !== 100 ? Math.round((100 * data.loaded) / data.total) - 1 : 99);
            }
          }).then(response => {
            if(response.data?.error === "uploadError") {
              console.error(response.data);
              setUploadMessage("Upload failed!");
            }
            else if(response.data?.error === "nodataError") {
              console.error(response.data);
              setUploadMessage("Please select a file.");
            }
            else {
              setUploadMessage("Fetching metadata...");
              setIncompleteUpload(old => [response.data.token]);
              completeUpload(response.data.token);
            };
          }).catch(err => {console.error(err); props.setShowUploadProgressModal(old => false); props.checkBackend();});
        }
      }
      else {
        setUploadMessage("Finishing previous incomplete upload...");
        setUploadProgress(99);
        setShowUploadProgressModal(old => true);
        completeUpload(incompleteUpload[0]);
      }
    }
    catch(err) {
      console.error(err);
    }
  };
  var updateFile = async (changed_element) => {
    changed_element["user_id"] = props.user.user_id;
    changed_element["token"] = localStorage.getItem("token");
    changed_element["username"] = props.user.verified ? props.user.username : "";
    await axios.post(config.backend_link + "/update", changed_element).catch(err => {console.error(err); props.checkBackend();});
    window.location.reload();
  }
  var handleDelete = async (element) => {
    await axios.post(config.backend_link + "/delete", {id: element[0], user_id: props.user.user_id, token: localStorage.getItem("token"), public_id: element[3], is_public: element[4]}).catch(err => {console.error(err); props.checkBackend();});
    window.location.reload();
  };
  const handleShare = async function(el) {
    axios.post(config.backend_link + "/share", {
      user_id: localStorage.getItem("user_id"),
      token: localStorage.getItem("token"),
      group_id: el[0],
      file_id: fileShare[0]
    }).then(response => {
      window.location.reload();
    }).catch(err => console.error(err));
  }
  return (
    <>
      {props.darkMode
      ? <>
          <Container fluid="md">
            <Form onSubmit={handleProfileUpdate}>
              <Row style={{margin: "20px"}}>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="text" defaultValue={props.user.username} name="username" className="bg-light" required />
                    <Form.Text style={{color: "red"}} id="username_exists" hidden>Username already exists.</Form.Text>
                  </Form.Group>
                </Col>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" defaultValue={props.user.email} name="email" className="bg-light" required />
                    <Form.Text style={{color: "red"}} id="email_exists" hidden>Email already exists.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>First name</Form.Label>
                    <Form.Control type="text" defaultValue={props.user.fname} name="fname" className="bg-light" required />
                  </Form.Group>
                </Col>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Last name</Form.Label>
                    <Form.Control type="text" defaultValue={props.user.lname} name="lname" className="bg-light" required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password" id="password" name="password" className="bg-light" onChange={e => {document.getElementById("signupBtn").disabled = e.target.value === "" || e.target.value !== document.getElementById("confirm_password").value;}} required />
                  </Form.Group>
                </Col>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" placeholder="Confirm Password" id="confirm_password" name="confirm_password" className="bg-light" onChange={e => {document.getElementById("signupBtn").disabled = e.target.value === "" || e.target.value !== document.getElementById("password").value;}} required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="6" align="begin"><Form.Group><Button variant="outline-primary" id="signupBtn" type="submit" disabled>Update</Button></Form.Group></Col>
              </Row>
            </Form>
            <Form onSubmit={handleSubmit}>
              <Row id="fileField" style={{margin: "20px"}}>
                <Col><Form.Control type="file" className="bg-light" name="data" onChange={e => setFile(e.target.files[0])} /></Col>
              </Row>
              <Row id="uploadBtn" style={{margin: "20px"}}>
                <Col><Button variant="outline-primary" type="submit">Upload file</Button></Col>
              </Row>
            </Form>
            <Row id="fileCards" style={{margin: "20px"}}>
              <h3>Public files</h3>
              {fileList.length !==0 ? fileList.slice((page-1)*config.max_elements_per_page, (page)*config.max_elements_per_page).map((el, index)=>{
                return (
                  <Card className="bg-light" style={{width: "18rem", margin: "10px"}} id={el[0]}>
                    <Card.Body>
                      <Button variant="outline-danger" className="btn-close btn-close-dark" style={{float: "right", borderRadius: "20px", width: "20px", height: "20px", filter: "invert(1)"}} onClick={e => {if(window.confirm("Do you want to delete this file?")) handleDelete(el);}} />
                      <Card.Img variant="top" style={{margin: "5px"}} src={props.gateway.replace(":hash", el[2])} id={el[0]+"_image_loaded"} onLoad={e => {document.getElementById(el[0]+"_image_default").hidden = true; e.target.hidden = false;}} onError={e => {document.getElementById(el[0]+"_image_default").hidden = false; e.target.hidden = true;}} hidden />
                      <Card.Img variant="top" style={{margin: "5px"}} src="/file_dark.png" id={el[0]+"_image_default"} />
                      <Row>
                        <Col><Card.Title style={{margin: "5px"}}>{el[1]}</Card.Title></Col>
                        <Col align="end">{el[4] ?<Badge align="end" bg="warning">Public</Badge> : <Badge align="end" bg="info">Private</Badge>}</Col>
                      </Row>
                    </Card.Body>
                    <Card.Footer style={{background: "transparent"}}>
                      <Row>
                        <Col md="auto" align="begin">
                          <Button variant="outline-light" title="Download" style={{margin: "3px"}} size="sm" onClick={e => window.open(props.gateway.replace(":hash", el[2]))}>Download</Button>
                          <Button variant="outline-light" title="Copy Link" style={{margin: "3px"}} size="sm" onClick={e => {navigator.clipboard.writeText(props.gateway.replace(":hash", el[2])); setShowCopyModal(old => true); setTimeout(() => setShowCopyModal(old => false), 5000);}}>Copy Link</Button>
                        </Col>
                        <Col md="auto">
                          <Dropdown style={{margin: "3px"}}>
                            <Dropdown.Toggle size="sm" variant="outline-light" />
                            <Dropdown.Menu className="bg-light">
                              {el[4] ? <Dropdown.Item onClick={e => {updateFile({id: el[0], name: el[1], url: el[2], public_id: el[3], is_public: false})}}>Make private</Dropdown.Item> : <Dropdown.Item onClick={e => {updateFile({id: el[0], name: el[1], url: el[2], public_id: el[3], is_public: true})}}>Make public</Dropdown.Item>}
                              <Dropdown.Item onClick={e => {setFileShare(el); setShowShareModel(true);}}>Share</Dropdown.Item>
                              <Dropdown.Item onClick={e => {if(window.confirm("Do you want to delete this file?")) handleDelete(el);}}>Delete</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </Col>
                      </Row>
                    </Card.Footer>
                  </Card>
                );
              }) : <h4>Empty!</h4>}
            </Row>
            <Row className="justify-content-md-center" id="title" style={{margin: "20px"}}>
              <Col md="auto" className="col-4">{(page > 1) ? (<Button variant="warning" id="prevPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old-1); else setPage(old => old-1);}}>Previous</Button>) : (<Button variant="outline-warning" className="disabled" id="prevPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old-1); else setPage(old => old-1);}}>Previous</Button>)}</Col>
              <Col md="auto" className="col-4"><Form.Control type="text" id="pageNo" style={{margin: "20px", textAlign: "center", width: "80px"}} value={page} onChange={e => {if(e.target.value>=0) setPage(old => e.target.value);}} /></Col>
              <Col md="auto" className="col-4">{(page > 0 && page < fileList.length/config.max_elements_per_page) ? (<Button variant="warning" id="nextPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old+1); else setPage(old => old+1);}}>Next</Button>) : (<Button variant="outline-warning" className="disabled" id="nextPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old+1); else setPage(old => old+1);}}>Next</Button>)}</Col>
            </Row>
          </Container>
          <Modal show={showUploadProgressModal} onHide={(e) => setShowUploadProgressModal(old => false)}>
            <Modal.Header closeButton closeVariant="white">
              <h5>Upload Status</h5>
            </Modal.Header>
            <Modal.Body>
              <h6>{uploadMessage}</h6>
              <ProgressBar animated now={uploadProgress} label={`${uploadProgress}%`} />
            </Modal.Body>
          </Modal>
          <Modal show={showCopyModal} onHide={(e) => setShowCopyModal(old => false)}>
            <Modal.Header closeButton closeVariant="white">
              <h5>Copied to clipboard!</h5>
            </Modal.Header>
          </Modal>
          <Modal show={showShareModal} onHide={(e) => {setShowShareModel(old => false);}}>
            <Modal.Header closeButton closeVariant="white">
              <h5>Share</h5>
            </Modal.Header>
            <Modal.Body>
              Groups
              {groupList.length !==0 ? groupList.map((el => {
                return (
                  <Card className="bg-white" style={{margin: "10px"}}>
                    <Card.Body>
                      <Card.Title>
                        <Row>
                          <Col align="begin">{el[1]}</Col>
                          <Col align="end"><Button variant="outline-success" size="sm" onClick={e => {handleShare(el);}}>Share</Button></Col>
                        </Row>
                      </Card.Title>
                    </Card.Body>
                  </Card>
                )
              })) : <h4 style={{margin: "10px"}}>No groups!</h4>}
            </Modal.Body>
          </Modal>
        </>
      : <>
          <Container fluid="md">
            <Form onSubmit={handleProfileUpdate}>
              <Row style={{margin: "20px"}}>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="text" defaultValue={props.user.username} name="username" required />
                    <Form.Text style={{color: "red"}} id="username_exists" hidden>Username already exists.</Form.Text>
                  </Form.Group>
                </Col>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" defaultValue={props.user.email} name="email" required />
                    <Form.Text style={{color: "red"}} id="email_exists" hidden>Email already exists.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>First name</Form.Label>
                    <Form.Control type="text" defaultValue={props.user.fname} name="fname" required />
                  </Form.Group>
                </Col>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Last name</Form.Label>
                    <Form.Control type="text" defaultValue={props.user.lname} name="lname" required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password" id="password" name="password" onChange={e => {document.getElementById("signupBtn").disabled = e.target.value === "" || e.target.value !== document.getElementById("confirm_password").value;}} required />
                  </Form.Group>
                </Col>
                <Col md="6" align="begin">
                  <Form.Group>
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" placeholder="Confirm Password" id="confirm_password" name="confirm_password" onChange={e => {document.getElementById("signupBtn").disabled = e.target.value === "" || e.target.value !== document.getElementById("password").value;}} required />
                  </Form.Group>
                </Col>
              </Row>
              <Row style={{margin: "20px"}}>
                <Col md="6" align="begin"><Form.Group><Button variant="outline-primary" id="signupBtn" type="submit" disabled>Update</Button></Form.Group></Col>
              </Row>
            </Form>
            <Form onSubmit={handleSubmit}>
              <Row id="fileField" style={{margin: "20px"}}>
                <Col><Form.Control type="file" name="data" onChange={e => setFile(e.target.files[0])} /></Col>
              </Row>
              <Row id="uploadBtn" style={{margin: "20px"}}>
                <Col><Button variant="outline-primary" type="submit">Upload file</Button></Col>
              </Row>
            </Form>
            <Row id="fileCards" style={{margin: "20px"}}>
              <h3>Public files</h3>
              {fileList.length !==0 ? fileList.slice((page-1)*config.max_elements_per_page, (page)*config.max_elements_per_page).map((el, index)=>{
                return (
                  <Card style={{width: "18rem", margin: "10px"}} id={el[0]}>
                    <Card.Body>
                      <Button variant="outline-danger" className="btn-close" style={{float: "right", borderRadius: "20px", width: "20px", height: "20px"}} onClick={e => {if(window.confirm("Do you want to delete this file?")) handleDelete(el);}} />
                      <Card.Img variant="top" style={{margin: "5px"}} src={props.gateway.replace(":hash", el[2])} id={el[0]+"_image_loaded"} onLoad={e => {document.getElementById(el[0]+"_image_default").hidden = true; e.target.hidden = false;}} onError={e => {document.getElementById(el[0]+"_image_default").hidden = false; e.target.hidden = true;}} hidden />
                      <Card.Img variant="top" style={{margin: "5px"}} src="/file_light.png" id={el[0]+"_image_default"} />
                      <Row>
                        <Col><Card.Title style={{margin: "5px"}}>{el[1]}</Card.Title></Col>
                        <Col align="end">{el[4] ?<Badge align="end" bg="warning">Public</Badge> : <Badge align="end" bg="info">Private</Badge>}</Col>
                      </Row>
                    </Card.Body>
                    <Card.Footer style={{background: "transparent"}}>
                      <Row>
                        <Col md="auto" align="begin">
                          <Button variant="outline-dark" title="Download" style={{margin: "3px"}} size="sm" onClick={e => window.open(props.gateway.replace(":hash", el[2]))}>Download</Button>
                          <Button variant="outline-dark" title="Copy Link" style={{margin: "3px"}} size="sm" onClick={e => {navigator.clipboard.writeText(props.gateway.replace(":hash", el[2])); setShowCopyModal(old => true); setTimeout(() => setShowCopyModal(old => false), 5000);}}>Copy Link</Button>
                        </Col>
                        <Col md="auto">
                          <Dropdown style={{margin: "3px"}}>
                            <Dropdown.Toggle size="sm" variant="outline-dark" />
                            <Dropdown.Menu>
                              {el[4] ? <Dropdown.Item onClick={e => {updateFile({id: el[0], name: el[1], url: el[2], public_id: el[3], is_public: false})}}>Make private</Dropdown.Item> : <Dropdown.Item onClick={e => {updateFile({id: el[0], name: el[1], url: el[2], public_id: el[3], is_public: true})}}>Make public</Dropdown.Item>}
                              <Dropdown.Item onClick={e => {setFileShare(el); setShowShareModel(true);}}>Share</Dropdown.Item>
                              <Dropdown.Item onClick={e => {if(window.confirm("Do you want to delete this file?")) handleDelete(el);}}>Delete</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </Col>
                      </Row>
                    </Card.Footer>
                  </Card>
                );
              }) : <h4>Empty!</h4>}
            </Row>
            <Row className="justify-content-md-center" id="title" style={{margin: "20px"}}>
              <Col md="auto" className="col-4">{(page > 1) ? (<Button variant="warning" id="prevPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old-1); else setPage(old => old-1);}}>Previous</Button>) : (<Button variant="outline-warning" className="disabled" id="prevPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old-1); else setPage(old => old-1);}}>Previous</Button>)}</Col>
              <Col md="auto" className="col-4"><Form.Control type="text" className="text-light bg-dark" id="pageNo" style={{margin: "20px", textAlign: "center", width: "80px"}} value={page} onChange={e => {if(e.target.value>=0) setPage(old => e.target.value);}} /></Col>
              <Col md="auto" className="col-4">{(page > 0 && page < fileList.length/config.max_elements_per_page) ? (<Button variant="warning" id="nextPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old+1); else setPage(old => old+1);}}>Next</Button>) : (<Button variant="outline-warning" className="disabled" id="nextPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old+1); else setPage(old => old+1);}}>Next</Button>)}</Col>
            </Row>
          </Container>
          <Modal show={showUploadProgressModal} onHide={(e) => setShowUploadProgressModal(old => false)}>
            <Modal.Header closeButton>
              <h5>Upload Status</h5>
            </Modal.Header>
            <Modal.Body>
              <h6>{uploadMessage}</h6>
              <ProgressBar animated now={uploadProgress} label={`${uploadProgress}%`} />
            </Modal.Body>
          </Modal>
          <Modal show={showCopyModal} onHide={(e) => setShowCopyModal(old => false)}>
            <Modal.Header closeButton>
              <h5>Copied to clipboard!</h5>
            </Modal.Header>
          </Modal>
          <Modal show={showShareModal} onHide={(e) => {setShowShareModel(old => false);}}>
            <Modal.Header closeButton>
              <h5>Share</h5>
            </Modal.Header>
            <Modal.Body>
              Groups
              {groupList.length !==0 ? groupList.map((el => {
                return (
                  <Card style={{margin: "10px"}}>
                    <Card.Body>
                      <Card.Title>
                        <Row>
                          <Col align="begin">{el[1]}</Col>
                          <Col align="end"><Button variant="outline-success" size="sm" onClick={e => {handleShare(el);}}>Share</Button></Col>
                        </Row>
                      </Card.Title>
                    </Card.Body>
                  </Card>
                )
              })) : <h4 style={{margin: "10px"}}>No groups!</h4>}
            </Modal.Body>
          </Modal>
        </>
      }
    </>
  );
}

export default Profile;
