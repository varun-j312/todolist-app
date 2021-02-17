require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname+"/date.js");

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "My first todolist item!"
});
const item2 = new Item({
  name: "Click the + to add a new list item"
});
const item3 = new Item({
  name: "Get good at mongoose"
});
const defaultItems = [item1, item2, item3];

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listsSchema);

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.get("/", function(req, res) {
  today = date.getDate();
  Item.find({}, function(err, foundItems) {
    if(foundItems.length == 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {console.log(err);}
        else {console.log("Successfully added default items to todolistDB");}
      });
    }
    res.render("list.ejs", {listTitle: "Today", newListItems: foundItems});
  });
});

app.post("/", function(req, res) {
  let item = req.body.todo;
  let listName = req.body.list;
  let newItem = new Item({
    name: item
  });
  if(listName == "Today") {
    newItem.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList) {
      if(err) {console.log(err);}
      else {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/"+listName);
      }
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName == "Today") {
    Item.findByIdAndRemove(checkedItemId, {useFindAndModify: false}, function(err) {
      if(err) {console.log(err);}
      else {console.log("Deleted checked item successfully"); res.redirect("/");}
    });
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      if(err) {console.log(err);}
      else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, {useFindAndModify: false}, function(err, foundList) {
          if(err) {console.log(err);}
          else {
            res.redirect("/"+listName);
          }
        });
      }
    });
  }
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList) {
    if(err) {console.log(err);}
    else {
      if(!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else {
        //Show the existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about.ejs");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server running port successfully.");
});
