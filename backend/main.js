const express = require("express");
const cors = require("cors");
const { NFTStorage, File } = require("nft.storage");
const multer = require("multer");
const axios = require("axios");
const config = require("./config.json");
const crypto = require("crypto");

const app = express();

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || config.cors_white_list.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}

app.use(cors(corsOptions));

app.use(express.json());

var checkPublicDB = async () => {
    axios.get(config.public_db_link + "/files", {
        headers: {
            "cache-control": "no-cache",
            "x-apikey": config.public_db_api_key,
            "Content-Type": "application/json"
        }
    }).then(response => {
        var respArr = response.data?.sort((a, b) => {return a.created < b.created ? 1 : -1;});
        var arr = [];
        respArr?.slice(0, config.max_public_visible_elements)?.forEach(element => {
          arr.push([element.name, element.url]);
        });
        if(response.data?.length > config.max_public_visible_elements) {
          var idArr = [];
          respArr?.slice(config.max_public_visible_elements)?.forEach((element, index) => {
            idArr.push(element._id);
          });
          axios.delete(config.public_db_link + "/files/*", {
            headers: {
                "cache-control": "no-cache",
                "x-apikey": config.public_db_api_key,
                "Content-Type": "application/json"
            },
            data: idArr
          }).catch(err => console.error(err));
        }
    }).catch(err => console.error(err));
}

var verifyUserToken = async (user_id, token) => {
    return axios.get(config.public_db_link + "/login", {
        headers: {
            "cache-control": "no-cache",
            "x-apikey": config.public_db_api_key,
            "Content-Type": "application/json"
        }
    }).then(response => {
        var element = response.data?.find(element => element.user_id === user_id && element.token === token);
        if(element && element.expiry > (new Date()).toJSON()) return true;
        return false;
    });
}

app.get("/", async (req, res) => {
    checkPublicDB();
    axios.get(config.db_link).catch(err => console.error(err));
    res.end(JSON.stringify({msg: "active"}));
});

app.post("/verify", async (req, res) => {
    if(await verifyUserToken(req.body.user_id, req.body.token)) {
        axios.get(config.db_link + "/user/", {
            params: req.body
        }).then(response => {
            var data = response.data;
            data["verified"] = true;
            res.end(JSON.stringify(data));
        }).catch(err => {console.error(err); res.end(JSON.stringify({verified: false, user_id: "", username: "", fname: "", lname: "", email: ""}));});
    }
    else res.end(JSON.stringify({verified: false, user_id: "", username: "", fname: "", lname: "", email: ""}));
});

app.post("/signup", async (req, res) => {
    axios.post(config.db_link + "/user/", req.body).then(response => {
        res.end(JSON.stringify(response.data));
    }).catch(err => {
        console.error(err);
        res.status(err.response.status);
        res.end(JSON.stringify(err.response.data));
    });
});

app.post("/login", async (req, res) => {
    axios.post(config.db_link + "/auth/", req.body).then(response => {
        var now = new Date();
        var hash = crypto.createHash("sha256");
        hash.update(response.data.user_id + now.toJSON());
        var data = {user_id: response.data.user_id, created: now.toJSON(), token: hash.digest("hex"), expiry: ""};
        now.setFullYear(now.getFullYear() + 1);
        data["expiry"] = now.toJSON();
        axios.get(config.public_db_link + "/login", {
            headers: {
                "cache-control": "no-cache",
                "x-apikey": config.public_db_api_key,
                "Content-Type": "application/json"
            }
        }).then(response => {
            var element = response.data?.find(element => element.user_id === data.user_id);
            if(element) {
                axios.put(config.public_db_link + "/login/" + element._id, data, {
                    headers: {
                        "cache-control": "no-cache",
                        "x-apikey": config.public_db_api_key,
                        "Content-Type": "application/json"
                    }
                }).then(response => {
                    res.end(JSON.stringify({user_id: data.user_id, token: data.token}));
                }).catch(err => {console.error(err); res.end(JSON.stringify({}))});
            }
            else {
                axios.post(config.public_db_link + "/login", data, {
                    headers: {
                        "cache-control": "no-cache",
                        "x-apikey": config.public_db_api_key,
                        "Content-Type": "application/json"
                    }
                }).then(response => {
                    res.end(JSON.stringify({user_id: data.user_id, token: data.token}));
                }).catch(err => {console.error(err); res.end(JSON.stringify({}))});
            }
        }).catch(err => {console.error(err); res.end(JSON.stringify({}))});
    }).catch(err => {
        console.error(err);
        try {
            res.status(err.response.status);
            res.end(JSON.stringify(err.response.data));
        }
        catch(err) {
            res.status(500);
            res.end(JSON.stringify(err));
        }
    });
});

app.post("/logout", async (req, res) => {
    axios.get(config.public_db_link + "/login", {
        headers: {
            "cache-control": "no-cache",
            "x-apikey": config.public_db_api_key,
            "Content-Type": "application/json"
        }
    }).then(response => {
        var element = response.data?.find(element => element.user_id === req.body.user_id);
        if(element._id) {
            axios.delete(config.public_db_link + "/login/" + element._id, {
                headers: {
                    "cache-control": "no-cache",
                    "x-apikey": config.public_db_api_key,
                    "Content-Type": "application/json"
                }
            });
        }
    }).catch(err => console.error(err));
    res.end(JSON.stringify({}));
});

app.put("/update_user", async (req, res) => {
    axios.put(config.db_link + "/user/", req.body).then(response => {
        res.end(JSON.stringify(response.data));
    }).catch(err => {
        console.error(err);
        res.status(err.response.status);
        res.end(JSON.stringify(err.response.data));
    });
});

app.post("/upload_file", multer({storage: multer.memoryStorage()}).single("file"), async (req, res) => {
    if(req.file) {
        try {
            const nftstorage = new NFTStorage({token: config.ipfs_api_key});
            const token = await nftstorage.store({image: new File([Buffer.from(req.file.buffer)], req.file.originalname, {type: req.file.mimetype}), name: req.file.originalname, description: ""});
            res.end(JSON.stringify({msg: "Uploaded", token: token}));
        }
        catch(err) {
            console.error(err); res.end(JSON.stringify({error: "uploadError", fullerror: err}));
        }
    }
    else res.end(JSON.stringify({error: "nodataError"}));
});

app.get("/files", async (req, res) => {
    if(await verifyUserToken(req.query.user_id, req.query.token)) {
        axios.get(config.db_link + "/files/", {
            params: req.query
        }).then(response => {
            res.end(JSON.stringify(response.data));
        }).catch(err => {console.error(err); res.end(JSON.stringify());});
    }
    else res.end(JSON.stringify({}));
});

app.post("/add_file", async (req, res) => {
    if(req.body.name && req.body.url) {
        if(await verifyUserToken(req.body.user_id, req.body.token)) {
            var public_id = "";
            if(req.body.is_public) {
                await axios.post(config.public_db_link + "/files", {
                    "name": req.body.name,
                    "url": req.body.url,
                    "owner": req.body.username
                }, {
                    headers: {
                        "cache-control": "no-cache",
                        "x-apikey": config.public_db_api_key,
                        "Content-Type": "application/json"
                    }
                }).then(response => {checkPublicDB(); public_id = response.data._id;}).catch(err => {console.error(err); res.end();});
            }
            axios.post(config.db_link + "/files/", {user_id: req.body.user_id, name: req.body.name, url: req.body.url, is_public: req.body.is_public, public_id: public_id}).then(response => res.end(JSON.stringify({msg: "Updated"}))).catch(err => {console.error(err); res.end(JSON.stringify({error: "updateError"}));});
        }
        else {
            axios.post(config.public_db_link + "/files", {
                "name": req.body.name,
                "url": req.body.url,
                "owner": req.body.username ? req.body.username : ""
            }, {
                headers: {
                    "cache-control": "no-cache",
                    "x-apikey": config.public_db_api_key,
                    "Content-Type": "application/json"
                }
            }).then(response => {checkPublicDB(); res.end(JSON.stringify({msg: "Updated"}));}).catch(err => console.error(err));
        }
    }
    else res.end(JSON.stringify({error: "nodataError"}));
});

app.post("/update", async (req, res) => {
    if(await verifyUserToken(req.body.user_id, req.body.token)) {
        var public_id = "";
        if(req.body.is_public) {
            await axios.post(config.public_db_link + "/files", {
                "name": req.body.name,
                "url": req.body.url,
                "owner": req.body.username
            }, {
                headers: {
                    "cache-control": "no-cache",
                    "x-apikey": config.public_db_api_key,
                    "Content-Type": "application/json"
                }
            }).then(response => {checkPublicDB(); public_id = response.data._id}).catch(err => console.error(err));
        }
        else {
            axios.delete(config.public_db_link + "/files/" + req.body.public_id, {
                headers: {
                    "cache-control": "no-cache",
                    "x-apikey": config.public_db_api_key,
                    "Content-Type": "application/json"
                }
            }).then(response => checkPublicDB()).catch(err => console.error(err));
        }
        axios.put(config.db_link + "/files/", {id: req.body.id, is_public: req.body.is_public, public_id: public_id});
    }
    res.end();
});

app.post("/delete", async (req, res) => {
    if(await verifyUserToken(req.body.user_id, req.body.token)) {
        axios.delete(config.db_link + "/files/", {data: req.body});
        if(req.body.id) {
            if(req.body.is_public) {
                axios.delete(config.public_db_link + `/files/${req.body.public_id}`, {
                    headers: {
                        "cache-control": "no-cache",
                        "x-apikey": config.public_db_api_key,
                        "Content-Type": "application/json"
                    }
                }).then(response => res.end(JSON.stringify({msg: "Deleted"}))).catch(err => {console.error(err); res.end(JSON.stringify({error: "deleteError"}));});
            }
            else res.end();
        }
        else res.end();
    }
    else res.end();
});

app.get("/search_users", async (req, res) => {
    if(await verifyUserToken(req.query.user_id, req.query.token)) {
        axios.get(config.db_link + "/search_users", {
            params: {
                username: req.query.username
            }
        }).then(response => {
            res.end(JSON.stringify(response.data));
        }).catch(err => {console.error(err); res.end();})
    }
    else res.end();
});

app.post("/share", async (req, res) => {
    if(await verifyUserToken(req.body.user_id, req.body.token)) {
        await axios.post(config.db_link + "/shared/", {
            "user_id": req.body.user_id,
            "group_id": req.body.group_id,
            "file_id": req.body.file_id
        }).catch(err => console.error(err));
    }
    res.end();
});

app.post("/create_group", async (req, res) => {
    if(await verifyUserToken(req.body.user_id, req.body.token)) {
        await axios.post(config.db_link + "/group/", {
            "name": req.body.name,
            "user_id": req.body.user_id,
            "members": req.body.members
        }).catch(err => console.error(err));
    }
    res.end();
});

app.get("/get_groups", async (req, res) => {
    if(await verifyUserToken(req.query.user_id, req.query.token)) {
        axios.get(config.db_link + "/group", {
            params: {
                user_id: req.query.user_id
            }
        }).then(response => {
            res.end(JSON.stringify(response.data));
        }).catch(err => {console.error(err); res.end();})
    }
    else res.end();
});

app.put("/update_group", async (req, res) => {
    if(await verifyUserToken(req.body.user_id, req.body.token)) {
        axios.put(config.db_link + "/group/", {
            user_id: req.body.user_id,
            token: req.body.token,
            group_id: req.body.group_id,
            name: req.body.name,
            add_members: req.body.add_members,
            remove_members: req.body.remove_members
        }).catch(err => console.error(err));
    }
    res.end();
});

app.post("/delete_group", async (req, res) => {
    if(await verifyUserToken(req.body.user_id, req.body.token)) {
        await axios.delete(config.db_link + "/group/", {
            data: req.body
        }).catch(err => console.error(err));
    }
    res.end();
});

app.get("/get_shared_files", async (req, res) => {
    if(await verifyUserToken(req.query.user_id, req.query.token)) {
        axios.get(config.db_link + "/shared", {
            params: {
                group_id: req.query.group_id
            }
        }).then(response => {
            res.end(JSON.stringify(response.data));
        }).catch(err => {console.error(err); res.end(JSON.stringify());});
    }
    else res.end(JSON.stringify({}));
});

app.post("/delete_shared_file", async (req, res) => {
    if(await verifyUserToken(req.body.user_id, req.body.token)) {
        await axios.delete(config.db_link + "/shared/", {
            data: req.body
        }).catch(err => console.error(err));
    }
    res.end();
});

app.get("/get_group_members", async (req, res) => {
    if(await verifyUserToken(req.query.user_id, req.query.token)) {
        axios.get(config.db_link + "/group_member", {
            params: {
                group_id: req.query.group_id
            }
        }).then(response => {
            res.end(JSON.stringify(response.data));
        }).catch(err => {console.error(err); res.end();})
    }
    else res.end();
});

const server = app.listen(process.env.PORT | 8080, function() {
    console.log("Server started at port:", server.address().port);
});

process.on("uncaughtException", async (err)=>{
    console.log("Global Error!");
    console.error(err);
});