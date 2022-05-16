import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';  
import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

const client = create('https://ipfs.infura.io:5001/api/v0');

function App() {
  const [file, setFile] = useState(null);
  const [urlArr, setUrlArr] = useState([]);
  const retrieveFile = (e) => {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    if(data) {
      reader.readAsArrayBuffer(data);
      reader.onloadend = function() {
        setFile([data.name, Buffer(reader.result)]);
      };
    }
    e.preventDefault();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if(file) {
        const created = await client.add(file[1]);
        const url = `https://ipfs.infura.io/ipfs/${created.path}`;
        setUrlArr(prev => [...prev, [file[0], url]]);
      }
    }
    catch(err) {
      console.log(err);
    }
  };
  return (
    <>
      <Container fluid="md">
        <Row id="title" className="justify-content-md-center"  style={{margin: "10px"}}>
          <Col md="auto"><h1>IPFS Storage</h1></Col>
        </Row>
        <Form onSubmit={handleSubmit}>
        <Row id="fileField" style={{margin: "20px"}}>
          <Col><Form.Control type="file" name="data" onChange={retrieveFile} /></Col>
        </Row>
        <Row id="uploadBtn" style={{margin: "20px"}}>
          <Col><Button variant="outline-primary" type="submit">Upload file</Button></Col>
        </Row>
        </Form>
        <Row id="fileCards" style={{margin: "20px"}}>
          {urlArr.length !==0 ? urlArr.map((el, index)=>{
            return (
              <Card style={{width: '18rem', margin: "10px"}} id={"fileCard-"+index}>
                <Card.Img variant="top" src={el[1]} onError={(e) => e.target.src="/alt.png"} />
                <Card.Title>{el[0]}</Card.Title>
                <Button variant='outline-dark' title="Copy Link" onClick={(e)=>navigator.clipboard.writeText(el[1])}>Copy Link</Button>
              </Card>
            );
          }) : <h4>Empty!</h4>}
        </Row>
      </Container>
    </>
  );
}

export default App;
