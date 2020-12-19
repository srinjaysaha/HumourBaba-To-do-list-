const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require("lodash");
const { urlencoded } = require('body-parser');
const date= require(__dirname+"/date.js");

const app=express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB" , {useNewUrlParser:true});
const itemsSchema= new mongoose.Schema({
    name: String
});
const Item= mongoose.model("Item", itemsSchema);
const listSchema = {
    name: String,
    items: [itemsSchema]
}
const List = mongoose.model("List",listSchema);

app.get("/", function( req, res){
    Item.find({}, function(err,foundItems){
        if(foundItems.length === 0)
        {
            Item.insertMany([ 
                { name: 'Welcome to my To-do list'},
                { name: 'click checkbox to delete an item'},
                { name: 'press + to add an item'}     
            ]).then(function(){ 
                console.log("Data inserted")  // Success 
            }).catch(function(error){ 
                console.log(error)      // Failure 
            });            
            res.redirect("/");
        }else{
            res.render("list", {listTitle:"Today", newListItems:foundItems});
        }
        
    });
    
});

app.get("/:customListName",function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name:customListName},function(err,foundList){
          if(!err){
              if(!foundList){
                 // create a new list
                 const list = new List({
                    name: customListName,
                    items: [ 
                        { name: 'Welcome to my To-do list'},
                        { name: 'click checkbox to delete an item'},
                        { name: 'press + to add an item'}     
                    ]
                });
                list.save();
                res.redirect("/" + customListName);
              } else{
                 // show an existing list
                 res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
              }
          }
    });
    
});

app.post("/",function(req,res){
    const itemName=req.body.newItem;
    const listName=req.body.list;

    const item=new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    } else{
        List.findOne({name: listName}, function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName==="Today"){
        Item.findByIdAndRemove(checkedItemId,function(err){
            if(!err){
                console.log("Successfully removed checked item.");
                res.redirect("/");
            } else{
                console.log(err);
            }
        });
    } else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
            if(!err){
                res.redirect("/" + listName);
            }        
        });
    }

    
});


app.get("/about",function(req,res){
    res.render("about");
});


app.listen(3000,function(){
    console.log("Server started at port 3000...");
});