const MongoClient = require("mongodb").MongoClient;
const ObjectID = require('mongodb').ObjectID;

const url = "mongodb+srv://root:root@cluster0.s7j90.mongodb.net/crud_mongo";
const mongoOptions = {useNewUrlParser : true, useUnifiedTopology: true };

const state = {
    db : null
};

const connect = (cb) =>{
    if(state.db)
        cb();
    else{
        MongoClient.connect(url,mongoOptions,(err,client)=>{
            if(err)
                cb(err);
            else{
                state.db = client.db('crud_mongo');
                cb();
            }
        });
    }
}

const getPrimaryKey = (_id)=>{
    return ObjectID(_id);
}

const getDB = ()=>{
    return state.db;
}

module.exports = {getDB,connect,getPrimaryKey};