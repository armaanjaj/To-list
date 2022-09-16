//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const password = require(__dirname+"/clusterpassword");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://Armaan:${password.getClusterPassword()}@cluster0.5ftsjvc.mongodb.net/todolistDB`, {useNewUrlParser: true});

const itemSchema = mongoose.Schema({
  name: String
});

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({name: "Welcome to todo list"});
const item2 = new Item({name: "Hit + button to add item"});
const item3 = new Item({name: "Hit checkbox to delete item"});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("list", listSchema);

app.get("/", function(req, res) {

  Item.find({}, (err, foundItems)=>{

    if(foundItems.length === 0){
      Item.insertMany(defaultItems, (err)=>{
        if(err) console.log(err);
        else console.log("Successfully saved");
      })
      res.redirect("/");
    }
    if(err) console.log(err)
    else res.render("list", {listTitle: "Today", newListItems: foundItems});
  })

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({name: itemName});

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, (err, foundList)=>{
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});

app.post("/delete", (req, res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, (err)=>{ // a callback is required in for findByIdAndRemove to actually execute the delete
      if(err) throw err;
      else console.log("Deleted successfully.")
    })
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name:listName}, {$pull: {items:{_id:checkedItemId}}}, (err, foundList)=>{
      if(!err)
        res.redirect("/"+listName);
    })
  }
})

app.get("/:listName", function(req,res){
  const listName = _.capitalize(req.params.listName);
  List.findOne({name:listName}, (err, foundList)=>{
    if(!err){
      if(!foundList){
        const list = new List({name:listName, items: defaultItems})
        list.save();
        res.redirect("/"+listName);
      }
      else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started at 'http://localhost:3000'");
});
