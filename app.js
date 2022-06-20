const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

// Connect/Create the database
mongoose.connect("mongodb+srv://" + process.env.USER_NAME + ":" + process.env.PASSWORD + "@cluster0.fmvwt.mongodb.net/todoLlistDB");

// Create the Schema
const itemsSchema = new mongoose.Schema({
  name: {
    type : String
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDo List"
});

const item2 = new Item({
  name: "Hit + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {

  Item.find({},function(err,foundItems){
    if(foundItems.length === 0){

      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Inserted the documents successfully !!");
        }
      });
      res.redirect("/");

    }else{
      res.render("list", {
        listName: "Today",
        itemsList : foundItems
      });
    }
  });

});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      }else{
        //Show an existing list

        res.render("list", {
          listName: foundList.name ,
          itemsList : foundList.items
        });
      }
    }
  });

});

app.post("/",function(req,res){
  let itemName = req.body.nextItem;
  let listName = req.body.list;
  const item = new Item({
    name : itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,foundList){
      if(!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete",function(req,res){
  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted the document");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

let port = process.env.PORT;
if(port==null || port==""){
  port=3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
