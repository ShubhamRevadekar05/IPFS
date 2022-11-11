import { useState, useEffect } from "react";
import { Button, Card, Col, Container, Form, Modal, ProgressBar, Row } from "react-bootstrap";
import axios from "axios";
import config from "../config.json";

function Main(props) {
  props.setWindowURL(window.location.pathname);
  const [file, setFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [page, setPage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [showUploadProgressModal, setShowUploadProgressModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [incompleteUpload, setIncompleteUpload] = useState([]);
  const updateList = async function() {
    axios.get(config.public_db_link + "/files", {
      headers: {
        "cache-control": "no-cache",
        "x-apikey": config.public_db_api_key,
        "Content-Type": "application/json"
      }
    }).then(response => {
      var respArr = response.data?.sort((a, b) => {return a.created < b.created ? 1 : -1;});
      var arr = [];
      respArr?.forEach(element => {
        arr.push([element._id, element.name, element.url, element.owner]);
      });
      setFileList(old => arr);
    }).catch(err => console.error(err));
  };
  useEffect(() => {
    updateList();
  }, []);
  const completeUpload = (token) => {
    axios.get(props.gateway.replace(":hash", token.ipnft + "/metadata.json")).then(response => {
      var url = response.data.image.replace("ipfs://", "");
      axios.post(config.backend_link + "/add_file", {user_id: props.user.verified ? props.user.user_id : "", token: props.user.verified ? localStorage.getItem("token") : "", username: props.user.verified ? props.user.username : "", name: response.data.name, url: url, is_public: true}).then(response => {
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
  return (
    <>
      {props.darkMode
      ? <>
          <Container fluid="md">
            <Form onSubmit={handleSubmit}>
              <Row id="fileField" style={{margin: "20px"}}>
                <Col><Form.Control type="file" className="bg-light" name="data" onChange={e => setFile(e.target.files[0])} /></Col>
              </Row>
              <Row id="uploadBtn" style={{margin: "20px"}}>
                <Col><Button variant="outline-primary" type="submit">Publish file</Button></Col>
              </Row>
            </Form>
            <Row id="fileCards" style={{margin: "20px"}}>
              <h3>Public files</h3>
              {fileList.length !==0 ? fileList.slice((page-1)*config.max_elements_per_page, (page)*config.max_elements_per_page).map((el, index)=>{
                return (
                  <Card className="bg-light" style={{width: "18rem", margin: "10px"}}>
                    <Card.Body>
                      <Card.Img variant="top" style={{margin: "5px"}} src={props.gateway.replace(":hash", el[2])} id={el[0]+"_image_loaded"} onLoad={e => {document.getElementById(el[0]+"_image_default").hidden = true; e.target.hidden = false;}} onError={e => {document.getElementById(el[0]+"_image_default").hidden = false; e.target.hidden = true;}} hidden />
                      <Card.Img variant="top" style={{margin: "5px"}} src="/file_dark.png" id={el[0]+"_image_default"} />
                      <Card.Title style={{margin: "5px"}}>{el[1]}</Card.Title>
                      Owner: {el[3] ? el[3] : "Anonymous"}
                    </Card.Body>
                    <Card.Footer style={{background: "transparent"}}>
                      <Row>
                        <Col md="auto" align="begin">
                          <Button variant="outline-light" title="Download" style={{margin: "3px"}} size="sm" onClick={e => window.open(props.gateway.replace(":hash", el[2]))}>Download</Button>
                          <Button variant="outline-light" title="Copy Link" style={{margin: "3px"}} size="sm" onClick={e => {navigator.clipboard.writeText(props.gateway.replace(":hash", el[2])); setShowCopyModal(old => true); setTimeout(() => setShowCopyModal(old => false), 5000);}}>Copy Link</Button>
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
        </>
      : <>
          <Container fluid="md">
            <Form onSubmit={handleSubmit}>
              <Row id="fileField" style={{margin: "20px"}}>
                <Col><Form.Control type="file" name="data" onChange={e => setFile(e.target.files[0])} /></Col>
              </Row>
              <Row id="uploadBtn" style={{margin: "20px"}}>
                <Col><Button variant="outline-primary" type="submit">Publish file</Button></Col>
              </Row>
            </Form>
            <Row id="fileCards" style={{margin: "20px"}}>
              <h3>Public files</h3>
              {fileList.length !==0 ? fileList.slice((page-1)*config.max_elements_per_page, (page)*config.max_elements_per_page).map((el, index)=>{
                return (
                  <Card style={{width: "18rem", margin: "10px"}}>
                    <Card.Body>
                      <Card.Img variant="top" style={{margin: "5px"}} src={props.gateway.replace(":hash", el[2])} id={el[0]+"_image_loaded"} onLoad={e => {document.getElementById(el[0]+"_image_default").hidden = true; e.target.hidden = false;}} onError={e => {document.getElementById(el[0]+"_image_default").hidden = false; e.target.hidden = true;}} hidden />
                      <Card.Img variant="top" style={{margin: "5px"}} src="/file_light.png" id={el[0]+"_image_default"} />
                      <Card.Title style={{margin: "5px"}}>{el[1]}</Card.Title>
                      Owner: {el[3] ? el[3] : "Anonymous"}
                    </Card.Body>
                    <Card.Footer style={{background: "transparent"}}>
                      <Row>
                        <Col md="auto" align="begin">
                          <Button variant="outline-dark" title="Download" style={{margin: "3px"}} size="sm" onClick={e => window.open(props.gateway.replace(":hash", el[2]))}>Download</Button>
                          <Button variant="outline-dark" title="Copy Link" style={{margin: "3px"}} size="sm" onClick={e => {navigator.clipboard.writeText(props.gateway.replace(":hash", el[2])); setShowCopyModal(old => true); setTimeout(() => setShowCopyModal(old => false), 5000);}}>Copy Link</Button>
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
        </>
      }
    </>
  );
}

export default Main;
