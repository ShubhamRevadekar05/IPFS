import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Col, Container, Dropdown, Form, Modal, Row, Table } from "react-bootstrap";
import axios from "axios";
import config from "../config.json";

function Share(props) {
  props.setWindowURL(window.location.pathname);
  var navigate = useNavigate();
  if(localStorage.getItem("verified") !== "true") navigate("/login?next=share");
  const [groupList, setGroupList] = useState([]);
  const [group, setGroup] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [page, setPage] = useState(1);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showShareModal, setShowShareModel] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searcher, setSearcher] = useState(null);
  const [searchMember, setSearchMember] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [fileShare, setFileShare] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const updateFileList = async function(x) {
    if(group.length || x.length) {
      axios.get(config.backend_link + "/get_shared_files", {
        params: {
          user_id: localStorage.getItem("user_id"),
          token: localStorage.getItem("token"),
          group_id: x.length ? x[0] : group[0]
        }
      }).then(response => {
        var respArr = response.data;
        var arr = [];
        respArr?.forEach(element => {
          arr.push([element.shared_id, element.name, element.url, element.owner, element.file_id]);
        });
        setFileList(old => arr);
      }).catch(err => console.error(err));
    }
  };
  const updateGroupMemberList = async function(x) {
    if(group.length || x.length) {
      axios.get(config.backend_link + "/get_group_members", {
        params: {
          user_id: localStorage.getItem("user_id"),
          token: localStorage.getItem("token"),
          group_id: x.length ? x[0] : group[0]
        }
      }).then(response => {
        var respArr = response.data;
        var arr = [];
        respArr?.forEach(element => {
          arr.push([element.user_id, element.username, element.fname, element.lname]);
        });
        setGroupMembers(old => arr);
      }).catch(err => console.error(err));
    }
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
      setGroup(arr[0] ? arr[0] : []);
      updateFileList(arr[0]);
    }).catch(err => console.error(err));
  }
  useEffect(() => {
    async function effectFunction() {
      await updateGroupList();
      setPage(1);
    }
    effectFunction();
  }, []);
  useEffect(() => {
    async function effectFunction() {
      clearTimeout(searcher);
      setSearcher(setTimeout(async () => {
        if(searchMember) {
          await axios.get(config.backend_link + "/search_users", {
            params: {
              user_id: props.user.user_id,
              token: localStorage.getItem("token"),
              username: searchMember
            }
          }).then(response => {
            var respArr = response.data;
            var arr = [];
            respArr?.forEach(element => {
              arr.push([element.user_id, element.username, element.fname, element.lname]);
            });
            arr = arr.filter(x => x[0] !== props.user.user_id);
            if(showGroupSettings) arr = arr.filter(x => !(groupMembers.map(el => el[0] === x[0]).includes(true)));
            else arr = arr.filter(x => !(selectedMembers.map(el => el[0] === x[0]).includes(true)));
            setSearchResults(arr);
          }).catch(err => {console.error(err); setSearchResults([]);});
          setSearchMember("");
        }
      }, 1000));
    }
    effectFunction();
  }, [searchMember]);
  const handleSubmitCreateGroup = async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    setShowCreateGroup(false);
    await axios.post(config.backend_link + "/create_group", {
      user_id: props.user.user_id,
      token: localStorage.getItem("token"),
      name: formData.get("name"),
      members: selectedMembers.map(el => el[0])
    });
    window.location.reload();
  }
  const handleDeleteSharedFile = async function(el) {
    axios.post(config.backend_link + "/delete_shared_file", {
      user_id: localStorage.getItem("user_id"),
      token: localStorage.getItem("token"),
      id: el[0]
    }).then(response => {
      updateFileList();
    }).catch(err => console.error(err));
  }
  const handleShare = async function(el) {
    axios.post(config.backend_link + "/share", {
      user_id: localStorage.getItem("user_id"),
      token: localStorage.getItem("token"),
      group_id: el[0],
      file_id: fileShare[4]
    }).then(response => {
      window.location.reload();
    }).catch(err => console.error(err));
  }
  const handleUpdateGroupSettings = async function(e) {
    e.preventDefault();
    setShowGroupSettings(false);
    const formData = new FormData(e.target);
    var remove_members = [];
    groupMembers.filter(x => x[0] !== props.user.user_id).forEach(el => {
      var x = document.getElementById("" + el[0]);
      if(x.checked === true) remove_members.push(el[0]);
    });
    axios.put(config.backend_link + "/update_group", {
      user_id: localStorage.getItem("user_id"),
      token: localStorage.getItem("token"),
      group_id: group[0],
      name: formData.get("name"),
      add_members: selectedMembers.map(el => el[0]),
      remove_members: remove_members
    }).then(response => {
      window.location.reload();
    }).catch(err => console.error(err));
  }
  const handleDeleteGroup = async function(e) {
    axios.post(config.backend_link + "/delete_group", {
      user_id: localStorage.getItem("user_id"),
      token: localStorage.getItem("token"),
      group_id: group[0]
    }).then(response => {
      window.location.reload();
    }).catch(err => console.error(err));
  }
  return (
    <>
      {props.darkMode
      ? <>
          <Container fluid="md">
            <Row style={{margin: "20px"}}>
              <Col xs={3}>
                <Button variant="outline-warning" style={{margin: "10px"}} onClick={e => {setShowCreateGroup(true);}}>Create group</Button>
                {groupList.length !==0 ? groupList.map((el => {
                  return (
                    <Card className="bg-light" style={{width: "17rem", margin: "10px", cursor: "pointer"}} onClick={e => {setGroup(el); setFileList([]); updateFileList(el); updateGroupMemberList(el);}}>
                      <Card.Body>
                        <Card.Title>
                          <Row>
                            <Col align="begin">{el[1]}</Col>
                            {el[2] === props.user.username ? <Col align="end"><Button variant="dark" size="sm" onClick={e => {setShowGroupSettings(true);}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-gear-fill" viewBox="0 0 16 16"><path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/></svg></Button></Col> : <></>}
                          </Row>
                        </Card.Title>
                        Owner: {el[2]}
                      </Card.Body>
                    </Card>
                  )
                })) : <h4 style={{margin: "10px"}}>No groups!</h4>}
              </Col>
              <div className="vr" style={{padding: "1px"}} />
              <Col>
                <Row>
                  {fileList.length !==0 ? fileList.slice((page-1)*config.max_elements_per_page, (page)*config.max_elements_per_page).map((el, index)=>{
                    return (
                      <Card className="bg-light" style={{width: "18rem", margin: "10px"}}>
                        <Card.Body>
                          <Card.Img variant="top" style={{margin: "5px"}} src={props.gateway.replace(":hash", el[2])} id={el[0]+"_image_loaded"} onLoad={e => {document.getElementById(el[0]+"_image_default").hidden = true; e.target.hidden = false;}} onError={e => {document.getElementById(el[0]+"_image_default").hidden = false; e.target.hidden = true;}} hidden />
                          <Card.Img variant="top" style={{margin: "5px"}} src="/file_dark.png" id={el[0]+"_image_default"} />
                          <Card.Title style={{margin: "5px"}}>{el[1]}</Card.Title>
                          Owner: {el[3]}
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
                                  <Dropdown.Item onClick={e => {setFileShare(el); setShowShareModel(true);}}>Share</Dropdown.Item>
                                  <Dropdown.Item onClick={e => {if(window.confirm("Do you want to delete this file?")) handleDeleteSharedFile(el);}}>Delete</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </Col>
                          </Row>
                        </Card.Footer>
                      </Card>
                    );
                  }) : <h4 style={{margin: "10px"}}>Empty!</h4>}
                </Row>
              </Col>
            </Row>
            <Row className="justify-content-md-center" id="title" style={{margin: "20px"}}>
              <Col md="auto" className="col-4">{(page > 1) ? (<Button variant="warning" id="prevPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old-1); else setPage(old => old-1);}}>Previous</Button>) : (<Button variant="outline-warning" className="disabled" id="prevPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old-1); else setPage(old => old-1);}}>Previous</Button>)}</Col>
              <Col md="auto" className="col-4"><Form.Control type="text" id="pageNo" style={{margin: "20px", textAlign: "center", width: "80px"}} value={page} onChange={e => {if(e.target.value>=0) setPage(old => e.target.value);}} /></Col>
              <Col md="auto" className="col-4">{(page > 0 && page < fileList.length/config.max_elements_per_page) ? (<Button variant="warning" id="nextPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old+1); else setPage(old => old+1);}}>Next</Button>) : (<Button variant="outline-warning" className="disabled" id="nextPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old+1); else setPage(old => old+1);}}>Next</Button>)}</Col>
            </Row>
            <Modal show={showCopyModal} onHide={(e) => setShowCopyModal(old => false)}>
              <Modal.Header closeButton closeVariant="white">
                <h5>Copied to clipboard!</h5>
              </Modal.Header>
            </Modal>
            <Modal show={showCreateGroup} onHide={(e) => {setShowCreateGroup(old => false); setSelectedMembers([]); setSearchResults([]);}}>
              <Modal.Header closeButton closeVariant="white">
                <h5>Create Group</h5>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleSubmitCreateGroup}>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin">
                      <Form.Group>
                        <Form.Label>Group name</Form.Label>
                        <Form.Control type="text" placeholder="Enter group name" name="name" className="bg-light" />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin">
                      <Form.Group>
                        <Form.Label>Group members</Form.Label>
                        <Form.Control type="text" placeholder="Enter username" name="member" className="bg-light" onChange={e => {if(e.target.value) {setSearchMember(e.target.value); if(document.getElementById("user_search_toggle").hidden) document.getElementById("user_search_toggle").click(); document.getElementById("user_search").hidden = false; document.getElementById("user_search_toggle").hidden = false;} else {setSearchMember(e.target.value); if(document.getElementById("user_search_toggle").hidden === false) document.getElementById("user_search_toggle").click(); document.getElementById("user_search").hidden = true; document.getElementById("user_search_toggle").hidden = true; setSearchResults([]);}}} />
                        <Form.Label>{selectedMembers.length ? selectedMembers.map(el => {
                          return <Badge variant="primary" pill style={{margin: "3px"}} onClick={e => {setSelectedMembers(old => old.filter(x => x!==el));}}>{el[1]}</Badge>
                        }) : <></> }</Form.Label>
                        <Dropdown autoClose={"inside"} id="user_search" style={{margin: "5px"}}>
                          <Dropdown.Toggle size="sm" variant="outline-primary" id="user_search_toggle" hidden />
                          <Dropdown.Menu style={{margin: "5px"}} className="bg-white">
                            {searchResults.length ? searchResults.map(el => {
                              return <Dropdown.Item onClick={e => {setSelectedMembers(old => [...old, el]); setSearchResults(old => old.filter(x => x!==el));}}>{el[2]} {el[3]} <span style={{color: "#808080", fontSize: "85%"}}>#{el[1]}</span></Dropdown.Item>
                            }) : <Dropdown.Item disabled>No users found!</Dropdown.Item>}
                          </Dropdown.Menu>
                        </Dropdown>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin"><Form.Group><Button variant="outline-primary" id="submitCreateGrp" type="submit">Create</Button></Form.Group></Col>
                  </Row>
                </Form>
              </Modal.Body>
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
            <Modal show={showGroupSettings} onHide={(e) => {setShowGroupSettings(old => false); setSelectedMembers([]); setSearchResults([]);}}>
              <Modal.Header closeButton closeVariant="white">
                <h5>Group Settings</h5>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleUpdateGroupSettings}>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin">
                      <Form.Group>
                        <Form.Label>Group name</Form.Label>
                        <Form.Control type="text" defaultValue={group[1]} name="name" className="bg-light" />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin">
                      <Form.Group>
                        <Form.Label>Add group members</Form.Label>
                        <Form.Control type="text" placeholder="Enter username" name="member" className="bg-light" onChange={e => {if(e.target.value) {setSearchMember(e.target.value); if(document.getElementById("user_search_toggle").hidden) document.getElementById("user_search_toggle").click(); document.getElementById("user_search").hidden = false; document.getElementById("user_search_toggle").hidden = false;} else {setSearchMember(e.target.value); if(document.getElementById("user_search_toggle").hidden === false) document.getElementById("user_search_toggle").click(); document.getElementById("user_search").hidden = true; document.getElementById("user_search_toggle").hidden = true; setSearchResults([]);}}} />
                        <Form.Label>{selectedMembers.length ? selectedMembers.map(el => {
                          return <Badge variant="primary" pill style={{margin: "3px"}} onClick={e => {setSelectedMembers(old => old.filter(x => x!==el));}}>{el[1]}</Badge>
                        }) : <></> }</Form.Label>
                        <Dropdown autoClose={"inside"} id="user_search" style={{margin: "5px"}}>
                          <Dropdown.Toggle size="sm" variant="outline-primary" id="user_search_toggle" hidden />
                          <Dropdown.Menu style={{margin: "5px"}} className="bg-white">
                            {searchResults.length ? searchResults.map(el => {
                              return <Dropdown.Item onClick={e => {setSelectedMembers(old => [...old, el]); setSearchResults(old => old.filter(x => x!==el));}}>{el[2]} {el[3]} <span style={{color: "#808080", fontSize: "85%"}}>#{el[1]}</span></Dropdown.Item>
                            }) : <Dropdown.Item disabled>No users found!</Dropdown.Item>}
                          </Dropdown.Menu>
                        </Dropdown>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Table className="bg-light">
                      <thead>
                        <tr>
                          <th>Remove</th>
                          <th>Group member</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td></td><td>You</td></tr>
                        {groupMembers.length ? groupMembers.filter(x => x[0] !== props.user.user_id).map(el => {
                          return <tr>
                            <td><Form.Check type="checkbox" id={el[0]} value={el[0]} /></td>
                            <td>{el[2]} {el[3]} <span style={{color: "#808080", fontSize: "85%"}}>#{el[1]}</span></td>
                          </tr>
                        }) : <></> }
                      </tbody>
                    </Table>
                  </Row>
                  <Row style={{margin: "20px"}}>
                    <Col md="auto"><Form.Group><Button variant="outline-primary" type="submit">Update</Button></Form.Group></Col>
                    <Col><Form.Group><Button variant="outline-danger" onClick={e => {if(window.confirm("Do you want to delete this group?")) handleDeleteGroup();}}>Delete</Button></Form.Group></Col>
                  </Row>
                </Form>
              </Modal.Body>
            </Modal>
          </Container>
        </>
      : <>
          <Container fluid="md">
            <Row style={{margin: "20px"}}>
              <Col xs={3}>
                <Button variant="outline-warning" style={{margin: "10px"}} onClick={e => {setShowCreateGroup(true);}}>Create group</Button>
                {groupList.length !==0 ? groupList.map((el => {
                  return (
                    <Card style={{width: "17rem", margin: "10px", cursor: "pointer"}} onClick={e => {setGroup(el); setFileList([]); updateFileList(el); updateGroupMemberList(el);}}>
                      <Card.Body>
                        <Card.Title>
                          <Row>
                            <Col align="begin">{el[1]}</Col>
                            {el[2] === props.user.username ? <Col align="end"><Button variant="light" size="sm" onClick={e => {setShowGroupSettings(true);}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-gear-fill" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/></svg></Button></Col> : <></>}
                          </Row>
                        </Card.Title>
                        Owner: {el[2]}
                      </Card.Body>
                    </Card>
                  )
                })) : <h4 style={{margin: "10px"}}>No groups!</h4>}
              </Col>
              <div className="vr" style={{padding: "1px"}} />
              <Col>
                <Row>
                  {fileList.length !==0 ? fileList.slice((page-1)*config.max_elements_per_page, (page)*config.max_elements_per_page).map((el, index)=>{
                    return (
                      <Card style={{width: "18rem", margin: "10px"}}>
                        <Card.Body>
                          <Card.Img variant="top" style={{margin: "5px"}} src={props.gateway.replace(":hash", el[2])} id={el[0]+"_image_loaded"} onLoad={e => {document.getElementById(el[0]+"_image_default").hidden = true; e.target.hidden = false;}} onError={e => {document.getElementById(el[0]+"_image_default").hidden = false; e.target.hidden = true;}} hidden />
                          <Card.Img variant="top" style={{margin: "5px"}} src="/file_light.png" id={el[0]+"_image_default"} />
                          <Card.Title style={{margin: "5px"}}>{el[1]}</Card.Title>
                          Owner: {el[3]}
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
                                  <Dropdown.Item onClick={e => {setFileShare(el); setShowShareModel(true);}}>Share</Dropdown.Item>
                                  <Dropdown.Item onClick={e => {if(window.confirm("Do you want to delete this file?")) handleDeleteSharedFile(el);}}>Delete</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </Col>
                          </Row>
                        </Card.Footer>
                      </Card>
                    );
                  }) : <h4 style={{margin: "10px"}}>Empty!</h4>}
                </Row>
              </Col>
            </Row>
            <Row className="justify-content-md-center" id="title" style={{margin: "20px"}}>
              <Col md="auto" className="col-4">{(page > 1) ? (<Button variant="warning" id="prevPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old-1); else setPage(old => old-1);}}>Previous</Button>) : (<Button variant="outline-warning" className="disabled" id="prevPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old-1); else setPage(old => old-1);}}>Previous</Button>)}</Col>
              <Col md="auto" className="col-4"><Form.Control type="text" className="text-light bg-dark" id="pageNo" style={{margin: "20px", textAlign: "center", width: "80px"}} value={page} onChange={e => {if(e.target.value>=0) setPage(old => e.target.value);}} /></Col>
              <Col md="auto" className="col-4">{(page > 0 && page < fileList.length/config.max_elements_per_page) ? (<Button variant="warning" id="nextPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old+1); else setPage(old => old+1);}}>Next</Button>) : (<Button variant="outline-warning" className="disabled" id="nextPageBtn" style={{margin: "20px"}} onClick={(e) => {if(page === 1) setPage(old => old+1); else setPage(old => old+1);}}>Next</Button>)}</Col>
            </Row>
            <Modal show={showCopyModal} onHide={(e) => setShowCopyModal(old => false)}>
              <Modal.Header closeButton>
                <h5>Copied to clipboard!</h5>
              </Modal.Header>
            </Modal>
            <Modal show={showCreateGroup} onHide={(e) => {setShowCreateGroup(old => false); setSelectedMembers([]); setSearchResults([]);}}>
              <Modal.Header closeButton>
                <h5>Create Group</h5>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleSubmitCreateGroup}>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin">
                      <Form.Group>
                        <Form.Label>Group name</Form.Label>
                        <Form.Control type="text" placeholder="Enter group name" name="name" />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin">
                      <Form.Group>
                        <Form.Label>Group members</Form.Label>
                        <Form.Control type="text" placeholder="Enter username" name="member" onChange={e => {if(e.target.value) {setSearchMember(e.target.value); if(document.getElementById("user_search_toggle").hidden) document.getElementById("user_search_toggle").click(); document.getElementById("user_search").hidden = false; document.getElementById("user_search_toggle").hidden = false;} else {setSearchMember(e.target.value); if(document.getElementById("user_search_toggle").hidden === false) document.getElementById("user_search_toggle").click(); document.getElementById("user_search").hidden = true; document.getElementById("user_search_toggle").hidden = true; setSearchResults([]);}}} />
                        <Form.Label>{selectedMembers.length ? selectedMembers.map(el => {
                          return <Badge variant="primary" pill style={{margin: "3px"}} onClick={e => {setSelectedMembers(old => old.filter(x => x!==el));}}>{el[1]}</Badge>
                        }) : <></> }</Form.Label>
                        <Dropdown autoClose={"inside"} id="user_search" style={{margin: "5px"}}>
                          <Dropdown.Toggle size="sm" variant="outline-primary" id="user_search_toggle" hidden />
                          <Dropdown.Menu style={{margin: "5px"}}>
                            {searchResults.length ? searchResults.map(el => {
                              return <Dropdown.Item onClick={e => {setSelectedMembers(old => [...old, el]); setSearchResults(old => old.filter(x => x!==el));}}>{el[2]} {el[3]} <span style={{color: "#808080", fontSize: "85%"}}>#{el[1]}</span></Dropdown.Item>
                            }) : <Dropdown.Item disabled>No users found!</Dropdown.Item>}
                          </Dropdown.Menu>
                        </Dropdown>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin"><Form.Group><Button variant="outline-primary" id="submitCreateGrp" type="submit">Create</Button></Form.Group></Col>
                  </Row>
                </Form>
              </Modal.Body>
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
            <Modal show={showGroupSettings} onHide={(e) => {setShowGroupSettings(old => false); setSelectedMembers([]); setSearchResults([]);}}>
              <Modal.Header closeButton>
                <h5>Group Settings</h5>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleUpdateGroupSettings}>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin">
                      <Form.Group>
                        <Form.Label>Group name</Form.Label>
                        <Form.Control type="text" defaultValue={group[1]} name="name" />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row style={{margin: "20px"}}>
                    <Col md="5" align="begin">
                      <Form.Group>
                        <Form.Label>Add group members</Form.Label>
                        <Form.Control type="text" placeholder="Enter username" name="member" onChange={e => {if(e.target.value) {setSearchMember(e.target.value); if(document.getElementById("user_search_toggle_settings").hidden) document.getElementById("user_search_toggle_settings").click(); document.getElementById("user_search_settings").hidden = false; document.getElementById("user_search_toggle_settings").hidden = false;} else {setSearchMember(e.target.value); if(document.getElementById("user_search_toggle_settings").hidden === false) document.getElementById("user_search_toggle_settings").click(); document.getElementById("user_search_settings").hidden = true; document.getElementById("user_search_toggle_settings").hidden = true; setSearchResults([]);}}} />
                        <Form.Label>{selectedMembers.length ? selectedMembers.map(el => {
                          return <Badge variant="primary" pill style={{margin: "3px"}} onClick={e => {setSelectedMembers(old => old.filter(x => x!==el));}}>{el[1]}</Badge>
                        }) : <></> }</Form.Label>
                        <Dropdown autoClose={"inside"} id="user_search_settings" style={{margin: "5px"}}>
                          <Dropdown.Toggle size="sm" variant="outline-primary" id="user_search_toggle_settings" hidden />
                          <Dropdown.Menu style={{margin: "5px"}} className="bg-white">
                            {searchResults.length ? searchResults.map(el => {
                              return <Dropdown.Item onClick={e => {setSelectedMembers(old => [...old, el]); setSearchResults(old => old.filter(x => x!==el));}}>{el[2]} {el[3]} <span style={{color: "#808080", fontSize: "85%"}}>#{el[1]}</span></Dropdown.Item>
                            }) : <Dropdown.Item disabled>No users found!</Dropdown.Item>}
                          </Dropdown.Menu>
                        </Dropdown>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Table>
                      <thead>
                        <tr>
                          <th>Remove</th>
                          <th>Group member</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td></td><td>You</td></tr>
                        {groupMembers.length ? groupMembers.filter(x => x[0] !== props.user.user_id).map(el => {
                          return <tr>
                            <td><Form.Check type="checkbox" id={el[0]} value={el[0]} /></td>
                            <td>{el[2]} {el[3]} <span style={{color: "#808080", fontSize: "85%"}}>#{el[1]}</span></td>
                          </tr>
                        }) : <></> }
                      </tbody>
                    </Table>
                  </Row>
                  <Row style={{margin: "20px"}}>
                    <Col md="auto"><Form.Group><Button variant="outline-primary" type="submit">Update</Button></Form.Group></Col>
                    <Col><Form.Group><Button variant="outline-danger" onClick={e => {if(window.confirm("Do you want to delete this group?")) handleDeleteGroup();}}>Delete</Button></Form.Group></Col>
                  </Row>
                </Form>
              </Modal.Body>
            </Modal>
          </Container>
        </>
      }
    </>
  );
}

export default Share;
